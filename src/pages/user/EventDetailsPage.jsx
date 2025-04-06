import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { format } from 'date-fns';

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);

        if (!eventId || !user) return;

        // Fetch event details with related data
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            event_tasks (id, title, status, due_date),
            event_vendor_bookings (id, status, vendor:vendors(id, company_name, vendor_type)),
            event_guests (id, name, rsvp_status)
          `)
          .eq('id', eventId)
          .eq('user_id', user.id)
          .single();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Event not found');

        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, user]);

  const handleEditEvent = () => {
    navigate(`/events/${eventId}/edit`);
  };

  const handleManageGuests = () => {
    navigate(`/events/${eventId}/guests`);
  };

  const handleManageBudget = () => {
    navigate(`/events/${eventId}/budget`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 2 }}>
          Event not found. Please check the URL and try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {event.title}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditEvent}
          >
            Edit Event
          </Button>
        </Box>

        <Chip
          label={event.status.toUpperCase()}
          color={event.status === 'completed' ? 'success' : event.status === 'cancelled' ? 'error' : 'primary'}
          sx={{ mr: 1 }}
        />
        <Chip
          label={event.event_type}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Event Details Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Details
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EventIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Date & Time"
                    secondary={`${format(new Date(event.start_date), 'PPP')} at ${format(new Date(event.start_date), 'p')}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={event.location}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Expected Guests"
                    secondary={event.expected_guests}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Guest Summary Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Guest Summary
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleManageGuests}
                >
                  Manage Guests
                </Button>
              </Box>
              <Typography variant="body1">
                Total Guests: {event.event_guests?.length || 0}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`${event.event_guests?.filter(g => g.rsvp_status === 'confirmed').length || 0} Confirmed`}
                  color="success"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`${event.event_guests?.filter(g => g.rsvp_status === 'pending').length || 0} Pending`}
                  color="warning"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`${event.event_guests?.filter(g => g.rsvp_status === 'declined').length || 0} Declined`}
                  color="error"
                  sx={{ mb: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Vendors Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vendors
              </Typography>
              <List>
                {event.event_vendor_bookings?.map((booking) => (
                  <ListItem key={booking.id}>
                    <ListItemIcon>
                      <StorefrontIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={booking.vendor.company_name}
                      secondary={`${booking.vendor.vendor_type} - ${booking.status}`}
                    />
                  </ListItem>
                )) || (
                  <ListItem>
                    <ListItemText
                      secondary="No vendors assigned yet"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Summary Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Budget Summary
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleManageBudget}
                  startIcon={<AttachMoneyIcon />}
                >
                  Manage Budget
                </Button>
              </Box>
              <Typography variant="body1" paragraph>
                Budget: ${event.budget?.toLocaleString() || '0'}
              </Typography>
              {event.budget_status && (
                <Chip
                  label={event.budget_status.toUpperCase()}
                  color={event.budget_status === 'under' ? 'success' : event.budget_status === 'over' ? 'error' : 'warning'}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EventDetailsPage;