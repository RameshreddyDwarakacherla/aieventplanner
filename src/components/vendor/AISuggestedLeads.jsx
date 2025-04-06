import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MessageIcon from '@mui/icons-material/Message';
import RefreshIcon from '@mui/icons-material/Refresh';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { generateVendorLeads } from '../../services/aiService';

const AISuggestedLeads = ({ vendorId, vendorServices }) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [leads, setLeads] = useState([]);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [matchScore, setMatchScore] = useState({});

  useEffect(() => {
    if (vendorId) {
      fetchVendorProfile();
      fetchSuggestedLeads();
    }
  }, [vendorId]);

  const fetchVendorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;

      setVendorProfile(data);
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    }
  };

  const fetchSuggestedLeads = async () => {
    try {
      setLoading(true);

      // First, check if we have any saved AI leads
      const { data: savedLeads, error: savedLeadsError } = await supabase
        .from('ai_vendor_leads')
        .select('*, event:events(*)')
        .eq('vendor_id', vendorId);

      if (savedLeadsError) throw savedLeadsError;

      if (savedLeads && savedLeads.length > 0) {
        // We have saved leads, use them
        setLeads(savedLeads);

        // Calculate match scores
        const scores = {};
        savedLeads.forEach(lead => {
          scores[lead.event_id] = lead.match_score;
        });
        setMatchScore(scores);
      } else {
        // No saved leads, generate new ones
        await generateAILeads();
      }
    } catch (error) {
      console.error('Error fetching suggested leads:', error);
      toast.error('Failed to load suggested leads');
    } finally {
      setLoading(false);
    }
  };

  const generateAILeads = async () => {
    try {
      setGenerating(true);

      // Call the real AI service to generate vendor leads
      const generatedLeads = await generateVendorLeads(vendorId, vendorServices);

      // Update state with the generated leads
      if (generatedLeads && generatedLeads.length > 0) {
        setLeads(generatedLeads);

        // Calculate match scores
        const scores = {};
        generatedLeads.forEach(lead => {
          scores[lead.eventId] = lead.matchScore;
        });
        setMatchScore(scores);

        toast.success(`Generated ${generatedLeads.length} new leads`);
      } else {
        toast.info('No matching leads found at this time');
      }
    } catch (error) {
      console.error('Error generating AI leads:', error);
      toast.error('Failed to generate leads');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewEventDetails = (eventId) => {
    // Navigate to event details or open a modal with event information
    console.log('View event details:', eventId);
    // Implementation would depend on your app's navigation structure
  };

  const handleContactOrganizer = async (eventId) => {
    try {
      // Get event organizer info
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('user_id')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Create a new conversation or navigate to messaging interface
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          vendor_id: vendorId,
          user_id: event.user_id,
          event_id: eventId,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Conversation started with event organizer');

      // Update lead status
      await supabase
        .from('ai_vendor_leads')
        .update({ status: 'contacted' })
        .eq('vendor_id', vendorId)
        .eq('event_id', eventId);

      // Navigate to messages (implementation depends on your app structure)
      // navigate(`/vendor/messages/${data[0].id}`);

    } catch (error) {
      console.error('Error contacting organizer:', error);
      toast.error('Failed to contact organizer');
    }
  };

  const getMatchLabel = (score) => {
    if (score >= 80) return { label: 'Excellent Match', color: 'success' };
    if (score >= 60) return { label: 'Good Match', color: 'primary' };
    return { label: 'Potential Match', color: 'warning' };
  };

  if (loading || generating) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {generating ? 'Generating AI-suggested leads...' : 'Loading leads...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">AI-Suggested Leads</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={generateAILeads}
            disabled={generating}
          >
            Refresh Leads
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {leads.length === 0 ? (
          <Alert severity="info">
            No matching leads found at this time. Try updating your services or check back later.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {leads.map((lead) => {
              const event = lead.event;
              const match = getMatchLabel(lead.match_score);

              return (
                <Grid item xs={12} key={event.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>{event.title}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <EventIcon fontSize="small