import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Collapse,
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert,
  Snackbar,
  Rating,
  LinearProgress
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { generateEventRecommendations } from '../../services/aiService';

const AIPersonalizedRecommendations = ({ event, tasks, budgetItems, guests, onAddTask, onAddBudgetItem }) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [expandedRecommendation, setExpandedRecommendation] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [feedbackSnackbar, setFeedbackSnackbar] = useState({ open: false, message: '' });
  const [learningProgress, setLearningProgress] = useState(0);

  useEffect(() => {
    if (event) {
      fetchUserPreferences();
      fetchRecommendations();
    }
  }, [event]);

  const fetchUserPreferences = async () => {
    try {
      // Fetch user preferences from database
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', event.user_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

      if (data) {
        setUserPreferences(data.preferences);
      } else {
        // Create default preferences if none exist
        const defaultPreferences = {
          budget_sensitivity: 'medium',
          style_preferences: [],
          vendor_preferences: [],
          color_scheme: [],
          cuisine_preferences: [],
          music_preferences: [],
          priority_factors: ['budget', 'quality', 'convenience']
        };

        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: event.user_id,
            preferences: defaultPreferences
          });

        if (insertError) throw insertError;

        setUserPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Fetch existing recommendations from database
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setRecommendations(data.map(rec => ({
          id: rec.id,
          type: rec.recommendation_type,
          title: rec.content.title,
          description: rec.content.description,
          details: rec.content.details,
          confidence: rec.content.confidence,
          is_applied: rec.is_applied,
          created_at: rec.created_at,
          user_feedback: rec.user_feedback
        })));
      } else {
        // Generate initial recommendations if none exist
        generateRecommendations();
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setGenerating(true);

      // Start learning progress animation
      startLearningAnimation();

      // Call the real AI service to generate recommendations
      await generateEventRecommendations({
        ...event,
        tasks: tasks || [],
        budgetItems: budgetItems || [],
        guests: guests || [],
        userPreferences: userPreferences || {}
      });

      // Fetch the saved recommendations with their IDs
      await fetchRecommendations();

      toast.success('Generated new personalized recommendations');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setGenerating(false);
      setLearningProgress(0);
    }
  };

  const startLearningAnimation = () => {
    setLearningProgress(0);
    const interval = setInterval(() => {
      setLearningProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 300);
  };

  const analyzeEventData = () => {
    // Analyze event data to generate insights
    const eventDate = new Date(event.start_date);
    const today = new Date();
    const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

    const completedTasksCount = tasks.filter(task => task.status === 'completed').length;
    const totalTasksCount = tasks.length;
    const taskCompletionRate = totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0;

    const confirmedGuestsCount = guests.filter(guest => guest.rsvp_status === 'confirmed').length;
    const totalBudget = event.budget || 0;
    const allocatedBudget = budgetItems.reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0);
    const budgetUtilizationRate = totalBudget > 0 ? allocatedBudget / totalBudget : 0;

    return {
      eventType: event.event_type,
      daysUntilEvent,
      taskCompletionRate,
      confirmedGuestsCount,
      estimatedGuestsCount: event.estimated_guests || 0,
      totalBudget,
      allocatedBudget,
      budgetUtilizationRate,
      userPreferences: userPreferences || {}
    };
  };

  const generateBudgetRecommendation = (analysis) => {
    // Generate budget allocation recommendation based on event type and preferences
    const { eventType, totalBudget, allocatedBudget, budgetUtilizationRate, userPreferences } = analysis;

    if (budgetUtilizationRate > 0.9) return null; // Skip if budget is already well-allocated

    const budgetSensitivity = userPreferences.budget_sensitivity || 'medium';

    // Default budget allocations by event type
    const budgetAllocations = {
      'Wedding': {
        'Venue': 0.4,
        'Catering': 0.3,
        'Photography': 0.1,
        'Decor': 0.1,
        'Entertainment': 0.05,
        'Attire': 0.05
      },
      'Corporate': {
        'Venue': 0.3,
        'Catering': 0.25,
        'Technology': 0.2,
        'Speakers': 0.15,
        'Marketing': 0.1
      },
      'Birthday': {
        'Venue': 0.3,
        'Food': 0.4,
        'Entertainment': 0.2,
        'Decor': 0.1
      },
      'Conference': {
        'Venue': 0.35,
        'Catering': 0.25,
        'Technology': 0.2,
        'Speakers': 0.1,
        'Marketing': 0.1
      }
    };

    const allocations = budgetAllocations[eventType] || budgetAllocations['Wedding'];

    // Adjust allocations based on budget sensitivity
    const adjustedAllocations = {};
    if (budgetSensitivity === 'high') {
      // For budget-conscious users, reduce venue and increase DIY categories
      Object.keys(allocations).forEach(category => {
        if (category === 'Venue' || category === 'Catering') {
          adjustedAllocations[category] = allocations[category] * 0.8;
        } else if (category === 'Decor' || category === 'Entertainment') {
          adjustedAllocations[category] = allocations[category] * 1.3;
        } else {
          adjustedAllocations[category] = allocations[category];
        }
      });
    } else if (budgetSensitivity === 'low') {
      // For luxury-focused users, increase premium categories
      Object.keys(allocations).forEach(category => {
        if (category === 'Venue' || category === 'Catering') {
          adjustedAllocations[category] = allocations[category] * 1.2;
        } else {
          adjustedAllocations[category] = allocations[category] * 0.9;
        }
      });
    } else {
      // Medium sensitivity uses default allocations
      Object.assign(adjustedAllocations, allocations);
    }

    // Normalize allocations to sum to 1
    const sum = Object.values(adjustedAllocations).reduce((a, b) => a + b, 0);
    Object.keys(adjustedAllocations).forEach(key => {
      adjustedAllocations[key] = adjustedAllocations[key] / sum;
    });

    // Create recommendation details
    const details = Object.keys(adjustedAllocations).map(category => ({
      category,
      percentage: adjustedAllocations[category] * 100,
      amount: totalBudget * adjustedAllocations[category],
      allocated: budgetItems.filter(item => item.category === category)
        .reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0)
    }));

    return {
      type: 'budget',
      title: 'Optimized Budget Allocation',
      description: `Based on your event type and preferences, we've created a personalized budget allocation plan to help you maximize your ${eventType.toLowerCase()} budget of $${totalBudget.toLocaleString()}.`,
      details,
      confidence: 85,
      icon: <AttachMoneyIcon />
    };
  };

  const generateVendorRecommendation = (analysis) => {
    // Generate vendor recommendations based on event type and preferences
    const { eventType, estimatedGuestsCount, totalBudget, userPreferences } = analysis;

    // Skip if we don't have enough information
    if (!eventType || !estimatedGuestsCount) return null;

    // Sample vendor data (in a real app, this would come from the database)
    const vendorsByType = {
      'Wedding': [
        { name: 'Elegant Venues', category: 'Venue', rating: 4.8, price: '$$$$', description: 'Luxury wedding venues with exceptional service' },
        { name: 'Divine Catering', category: 'Catering', rating: 4.7, price: '$$$', description: 'Gourmet catering specializing in wedding receptions' },
        { name: 'Moments Photography', category: 'Photography', rating: 4.9, price: '$$$', description: 'Award-winning wedding photography' }
      ],
      'Corporate': [
        { name: 'Business Centers Inc', category: 'Venue', rating: 4.6, price: '$$$', description: 'Professional venues for corporate events' },
        { name: 'Executive Catering', category: 'Catering', rating: 4.5, price: '$$', description: 'Business-focused catering services' },
        { name: 'Tech Solutions', category: 'Technology', rating: 4.8, price: '$$$', description: 'Full AV and technology services for corporate events' }
      ],
      'Birthday': [
        { name: 'Fun Spaces', category: 'Venue', rating: 4.4, price: '$$', description: 'Vibrant venues for birthday celebrations' },
        { name: 'Party Catering', category: 'Food', rating: 4.3, price: '$$', description: 'Delicious food for birthday parties' },
        { name: 'Entertainment Plus', category: 'Entertainment', rating: 4.7, price: '$$', description: 'DJs, games, and entertainment for birthdays' }
      ],
      'Conference': [
        { name: 'Convention Centers', category: 'Venue', rating: 4.5, price: '$$$', description: 'Spacious venues for conferences and conventions' },
        { name: 'Conference Catering', category: 'Catering', rating: 4.4, price: '$$', description: 'Specialized catering for conference attendees' },
        { name: 'AV Professionals', category: 'Technology', rating: 4.9, price: '$$$', description: 'Complete technology solutions for conferences' }
      ]
    };

    // Get vendors for this event type
    const vendors = vendorsByType[eventType] || [];

    // Filter based on user preferences
    let filteredVendors = [...vendors];

    // Apply preference filters if available
    if (userPreferences.vendor_preferences && userPreferences.vendor_preferences.length > 0) {
      const preferredCategories = userPreferences.vendor_preferences;
      filteredVendors = filteredVendors.filter(vendor =>
        preferredCategories.includes(vendor.category)
      );
    }

    // If no vendors match preferences, use all vendors
    if (filteredVendors.length === 0) {
      filteredVendors = vendors;
    }

    // Sort by rating
    filteredVendors.sort((a, b) => b.rating - a.rating);

    // Take top 3
    const topVendors = filteredVendors.slice(0, 3);

    if (topVendors.length === 0) return null;

    return {
      type: 'vendor',
      title: 'Recommended Vendors',
      description: `Based on your ${eventType.toLowerCase()} needs and preferences, we've identified these top-rated vendors that would be perfect for your event.`,
      details: topVendors,
      confidence: 80,
      icon: <StorefrontIcon />
    };
  };

  const generateTimelineRecommendation = (analysis) => {
    // Generate timeline recommendations based on days until event
    const { eventType, daysUntilEvent } = analysis;

    if (daysUntilEvent < 0) return null; // Event already happened

    // Define timeline templates by event type and time frame
    const timelineTemplates = {
      'Wedding': {
        long: [ // More than 90 days
          { title: 'Book venue', deadline: 'Immediately', priority: 'high' },
          { title: 'Hire photographer', deadline: '6 months before', priority: 'medium' },
          { title: 'Choose wedding attire', deadline: '5 months before', priority: 'medium' },
          { title: 'Send save-the-dates', deadline: '4 months before', priority: 'medium' },
          { title: 'Book catering', deadline: '4 months before', priority: 'high' }
        ],
        medium: [ // 30-90 days
          { title: 'Send invitations', deadline: 'Immediately', priority: 'high' },
          { title: 'Finalize menu', deadline: '3 weeks before', priority: 'medium' },
          { title: 'Create seating chart', deadline: '2 weeks before', priority: 'medium' },
          { title: 'Confirm all vendors', deadline: '2 weeks before', priority: 'high' }
        ],
        short: [ // Less than 30 days
          { title: 'Follow up with guests who haven\'t RSVP\'d', deadline: 'Immediately', priority: 'high' },
          { title: 'Final venue walkthrough', deadline: '1 week before', priority: 'high' },
          { title: 'Confirm final headcount with caterer', deadline: '3 days before', priority: 'high' }
        ]
      },
      'Corporate': {
        long: [
          { title: 'Book venue', deadline: 'Immediately', priority: 'high' },
          { title: 'Secure speakers/presenters', deadline: '2 months before', priority: 'high' },
          { title: 'Plan agenda', deadline: '6 weeks before', priority: 'medium' },
          { title: 'Send invitations', deadline: '1 month before', priority: 'high' }
        ],
        medium: [
          { title: 'Confirm all presenters', deadline: 'Immediately', priority: 'high' },
          { title: 'Finalize catering order', deadline: '2 weeks before', priority: 'medium' },
          { title: 'Prepare presentation materials', deadline: '1 week before', priority: 'high' }
        ],
        short: [
          { title: 'Send event reminder', deadline: 'Immediately', priority: 'high' },
          { title: 'Test all AV equipment', deadline: '1 day before', priority: 'high' },
          { title: 'Print name badges', deadline: '1 day before', priority: 'medium' }
        ]
      },
      'Birthday': {
        long: [
          { title: 'Choose theme', deadline: 'Immediately', priority: 'medium' },
          { title: 'Book venue', deadline: '1 month before', priority: 'high' },
          { title: 'Send invitations', deadline: '3 weeks before', priority: 'high' }
        ],
        medium: [
          { title: 'Order cake', deadline: 'Immediately', priority: 'high' },
          { title: 'Buy decorations', deadline: '1 week before', priority: 'medium' },
          { title: 'Plan activities/games', deadline: '1 week before', priority: 'medium' }
        ],
        short: [
          { title: 'Confirm attendance', deadline: 'Immediately', priority: 'high' },
          { title: 'Pick up cake', deadline: '1 day before', priority: 'high' },
          { title: 'Set up decorations', deadline: 'Day of event', priority: 'medium' }
        ]
      },
      'Conference': {
        long: [
          { title: 'Book venue', deadline: 'Immediately', priority: 'high' },
          { title: 'Secure keynote speakers', deadline: '3 months before', priority: 'high' },
          { title: 'Create conference schedule', deadline: '2 months before', priority: 'high' },
          { title: 'Open registration', deadline: '2 months before', priority: 'high' }
        ],
        medium: [
          { title: 'Confirm all speakers', deadline: 'Immediately', priority: 'high' },
          { title: 'Arrange accommodations', deadline: '3 weeks before', priority: 'medium' },
          { title: 'Finalize catering', deadline: '2 weeks before', priority: 'medium' }
        ],
        short: [
          { title: 'Send final instructions to attendees', deadline: 'Immediately', priority: 'high' },
          { title: 'Prepare registration materials', deadline: '2 days before', priority: 'high' },
          { title: 'Test all technology', deadline: '1 day before', priority: 'high' }
        ]
      }
    };

    // Determine time frame
    let timeFrame;
    if (daysUntilEvent > 90) {
      timeFrame = 'long';
    } else if (daysUntilEvent > 30) {
      timeFrame = 'medium';
    } else {
      timeFrame = 'short';
    }

    // Get timeline for this event type and time frame
    const template = timelineTemplates[eventType]?.[timeFrame] || timelineTemplates['Wedding'][timeFrame];

    // Filter out tasks that are already created
    const existingTaskTitles = tasks.map(task => task.title.toLowerCase());
    const filteredTasks = template.filter(task =>
      !existingTaskTitles.includes(task.title.toLowerCase())
    );

    if (filteredTasks.length === 0) return null;

    return {
      type: 'timeline',
      title: 'Recommended Timeline',
      description: `With ${daysUntilEvent} days until your event, here are the key tasks you should focus on now.`,
      details: filteredTasks,
      confidence: 90,
      icon: <EventIcon />
    };
  };

  const generateGuestRecommendation = (analysis) => {
    // Generate guest experience recommendations
    const { eventType, estimatedGuestsCount, confirmedGuestsCount, userPreferences } = analysis;

    if (estimatedGuestsCount === 0) return null;

    // Guest experience ideas by event type
    const guestExperienceIdeas = {
      'Wedding': [
        { title: 'Photo booth with props', description: 'Create lasting memories with a fun photo booth' },
        { title: 'Signature cocktail', description: 'Offer a unique signature drink that represents the couple' },
        { title: 'Welcome bags for out-of-town guests', description: 'Make travelers feel special with welcome gifts' }
      ],
      'Corporate': [
        { title: 'Networking activity', description: 'Structured networking to help attendees connect' },
        { title: 'Digital event app', description: 'Custom app for schedules, maps, and networking' },
        { title: 'Professional headshot station', description: 'Offer complimentary professional headshots' }
      ],
      'Birthday': [
        { title: 'Personalized party favors', description: 'Thank guests with customized mementos' },
        { title: 'Interactive food station', description: 'Let guests customize their own treats' },
        { title: 'Memory sharing activity', description: 'Create an opportunity for guests to share memories' }
      ],
      'Conference': [
        { title: 'Comfortable break areas', description: 'Create spaces for attendees to relax between sessions' },
        { title: 'Charging stations', description: 'Provide convenient places to charge devices' },
        { title: 'Interactive Q&A technology', description: 'Use technology to make sessions more engaging' }
      ]
    };

    // Get ideas for this event type
    const ideas = guestExperienceIdeas[eventType] || guestExperienceIdeas['Wedding'];

    return {
      type: 'guest',
      title: 'Guest Experience Enhancements',
      description: `Elevate your ${eventType.toLowerCase()} with these personalized guest experience ideas that will make your event memorable.`,
      details: ideas,
      confidence: 75,
      icon: <PeopleIcon />
    };
  };

  const handleToggleExpand = (index) => {
    setExpandedRecommendation(expandedRecommendation === index ? null : index);
  };

  const handleApplyRecommendation = async (recommendation, index) => {
    try {
      if (recommendation.type === 'timeline') {
        // Add tasks from timeline recommendation
        for (const task of recommendation.details) {
          await onAddTask({
            title: task.title,
            description: task.title,
            priority: task.priority,
            status: 'pending'
          });
        }
        toast.success('Added recommended tasks to your timeline');
      } else if (recommendation.type === 'budget') {
        // Add budget items from recommendation
        for (const item of recommendation.details) {
          if (item.allocated < item.amount) {
            await onAddBudgetItem({
              category: item.category,
              item_name: `${item.category} Budget`,
              estimated_cost: (item.amount - item.allocated).toFixed(2),
              is_paid: false,
              notes: 'Added from AI recommendation'
            });
          }
        }
        toast.success('Updated budget allocations based on recommendation');
      }

      // Mark recommendation as applied
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ is_applied: true })
        .eq('id', recommendation.id);

      if (error) throw error;

      // Update local state
      setRecommendations(prev =>
        prev.map((rec, i) =>
          i === index ? { ...rec, is_applied: true } : rec
        )
      );

      setFeedbackSnackbar({
        open: true,
        message: 'Recommendation applied successfully!'
      });
    } catch (error) {
      console.error('Error applying recommendation:', error);
      toast.error('Failed to apply recommendation');
    }
  };

  const handleFeedback = async (recommendation, index, isPositive) => {
    try {
      // Update recommendation with user feedback
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ user_feedback: isPositive ? 'positive' : 'negative' })
        .eq('id', recommendation.id);

      if (error) throw error;

      // Update local state
      setRecommendations(prev =>
        prev.map((rec, i) =>
          i === index ? { ...rec, user_feedback: isPositive ? 'positive' : 'negative' } : rec
        )
      );

      setFeedbackSnackbar({
        open: true,
        message: `Thank you for your feedback! We'll use it to improve future recommendations.`
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'budget':
        return <AttachMoneyIcon />;
      case 'vendor':
        return <StorefrontIcon />;
      case 'timeline':
        return <EventIcon />;
      case 'guest':
        return <PeopleIcon />;
      default:
        return <LightbulbIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Personalized AI Recommendations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={generateRecommendations}
          disabled={generating}
          startIcon={generating ? <CircularProgress size={20} /> : <LightbulbIcon />}
        >
          {generating ? 'Analyzing Event...' : 'Generate New Recommendations'}
        </Button>
      </Box>

      {generating && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            AI is analyzing your event data and learning your preferences...
          </Typography>
          <LinearProgress variant="determinate" value={learningProgress} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : recommendations.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No personalized recommendations available yet. Click "Generate New Recommendations" to get started.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {recommendations.map((recommendation, index) => (
            <Grid item xs={12} key={index}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ mr: 1, color: 'primary.main' }}>
                        {getRecommendationIcon(recommendation.type)}
                      </Box>
                      <Typography variant="h6">{recommendation.title}</Typography>
                    </Box>
                    <Box>
                      <Chip
                        size="small"
                        label={`${recommendation.confidence}% Match`}
                        color={recommendation.confidence > 80 ? 'success' : 'primary'}
                        sx={{ mr: 1 }}
                      />
                      {recommendation.is_applied && (
                        <Chip
                          size="small"
                          icon={<CheckCircleIcon />}
                          label="Applied"
                          color="success"
                        />
                      )}
                    </Box>
                  </Box>

                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {recommendation.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      size="small"
                      onClick={() => handleToggleExpand(index)}
                      endIcon={expandedRecommendation === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {expandedRecommendation === index ? 'Hide Details' : 'View Details'}
                    </Button>

                    <Box>
                      {!recommendation.user_feedback && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleFeedback(recommendation, index, true)}
                            title="This is helpful"
                          >
                            <ThumbUpIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => handleFeedback(recommendation, index, false)}
                            title="This is not helpful"
                          >
                            <ThumbDownIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}

                      {recommendation.user_feedback === 'positive' && (
                        <Chip
                          size="small"
                          icon={<ThumbUpIcon />}
                          label="Helpful"
                          color="primary"
                          variant="outlined"
                        />
                      )}

                      {recommendation.user_feedback === 'negative' && (
                        <Chip
                          size="small"
                          icon={<ThumbDownIcon />}
                          label="Not Helpful"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  <Collapse in={expandedRecommendation === index} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />

                      {recommendation.type === 'budget' && (
                        <List dense>
                          {recommendation.details.map((item, i) => (
                            <ListItem key={i}>
                              <ListItemText
                                primary={item.category}
                                secondary={
                                  <>
                                    <Typography variant="body2" component="span">
                                      Recommended: ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      {' '}({item.percentage.toFixed(1)}% of budget)
                                    </Typography>
                                    <br />
                                    <Typography variant="body2" component="span">
                                      Currently allocated: ${item.allocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}

                      {recommendation.type === 'vendor' && (
                        <List dense>
                          {recommendation.details.map((vendor, i) => (
                            <ListItem key={i}>
                              <ListItemIcon>
                                {vendor.category === 'Venue' ? <LocationOnIcon /> :
                                 vendor.category === 'Catering' || vendor.category === 'Food' ? <RestaurantIcon /> :
                                 vendor.category === 'Photography' ? <CameraAltIcon /> :
                                 vendor.category === 'Entertainment' ? <MusicNoteIcon /> :
                                 <LocalOfferIcon />}
                              </ListItemIcon>
                              <ListItemText
                                primary={vendor.name}
                                secondary={
                                  <>
                                    <Typography variant="body2" component="span">
                                      {vendor.category} • {vendor.price} •
                                    </Typography>
                                    <Rating value={vendor.rating} precision={0.1} size="small" readOnly />
                                    <Typography variant="body2">
                                      {vendor.description}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}

                      {recommendation.type === 'timeline' && (
                        <List dense>
                          {recommendation.details.map((task, i) => (
                            <ListItem key={i}>
                              <ListItemText
                                primary={task.title}
                                secondary={
                                  <>
                                    <Chip
                                      size="small"
                                      label={task.priority}
                                      color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                                      sx={{ mr: 1, mt: 0.5 }}
                                    />
                                    <Typography variant="body2" component="span">
                                      Deadline: {task.deadline}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}

                      {recommendation.type === 'guest' && (
                        <List dense>
                          {recommendation.details.map((idea, i) => (
                            <ListItem key={i}>
                              <ListItemText
                                primary={idea.title}
                                secondary={idea.description}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  </Collapse>
                </CardContent>

                {!recommendation.is_applied && (
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => handleApplyRecommendation(recommendation, index)}
                    >
                      Apply Recommendation
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={feedbackSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setFeedbackSnackbar({ ...feedbackSnackbar, open: false })}
        message={feedbackSnackbar.message}
      />
    </Box>
  );
};

export default AIPersonalizedRecommendations;