import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const EVENT_STATUSES = ['planning', 'confirmed', 'completed', 'cancelled'];

const ManageEventsPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState({
    tasks: [],
    guests: [],
    budget: []
  });

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is admin using the userRole from context
        if (userRole !== 'admin') {
          throw new Error('You do not have admin privileges');
        }

        fetchEvents();
      } catch (err) {
        console.error('Error checking admin access:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (user) {
      checkAdminAccess();
    }
  }, [user, userRole]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Fetch all events with user profiles
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          profiles:user_id(id, email, first_name, last_name)
        `)
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;

      setEvents(eventsData || []);
      setFilteredEvents(eventsData || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterEvents(newValue, searchQuery);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    filterEvents(tabValue, query);
  };

  const filterEvents = (tabIndex, query) => {
    let filtered = events;

    // Filter by status based on tab
    if (tabIndex === 1) { // Planning
      filtered = events.filter(event => event.status === 'planning');
    } else if (tabIndex === 2) { // Confirmed
      filtered = events.filter(event => event.status === 'confirmed');
    } else if (tabIndex === 3) { // Completed
      filtered = events.filter(event => event.status === 'completed');
    } else if (tabIndex === 4) { // Cancelled
      filtered = events.filter(event => event.status === 'cancelled');
    }

    // Filter by search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(event =>
        (event.title && event.title.toLowerCase().includes(lowercaseQuery)) ||
        (event.event_type && event.event_type.toLowerCase().includes(lowercaseQuery)) ||
        (event.location && event.location.toLowerCase().includes(lowercaseQuery)) ||
        (event.profiles?.email && event.profiles.email.toLowerCase().includes(lowercaseQuery)) ||
        (event.profiles?.first_name && event.profiles.first_name.toLowerCase().includes(lowercaseQuery)) ||
        (event.profiles?.last_name && event.profiles.last_name.toLowerCase().includes(lowercaseQuery))
      );
    }

    setFilteredEvents(filtered);
  };

  const handleViewDetails = async (event) => {
    try {
      setCurrentEvent(event);
      setLoading(true);

      // Fetch event tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('event_tasks')
        .select('*')
        .eq('event_id', event.id)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch event guests
      const { data: guestsData, error: guestsError } = await supabase
        .from('event_guests')
        .select('*')
        .eq('event_id', event.id)
        .order('guest_name', { ascending: true });

      if (guestsError) throw guestsError;

      // Fetch event budget items
      const { data: budgetData, error: budgetError } = await supabase
        .from('event_budget_items')
        .select('*')
        .eq('event_id', event.id)
        .order('category', { ascending: true });

      if (budgetError) throw budgetError;

      setEventDetails({
        tasks: tasksData || [],
        guests: guestsData || [],
        budget: budgetData || []
      });

      setDetailsDialogOpen(true);
    } catch (err) {
      console.error('Error fetching event details:', err);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (event) => {
    setCurrentEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteEvent = async () => {
    try {
      if (!currentEvent) return;

      // In a real application, you might want to implement soft delete instead
      // For this demo, we'll just update the status to cancelled
      const { error } = await supabase
        .from('events')
        .update({
          status: 'cancelled',
          updated_at: new Date()
        })
        .eq('id', currentEvent.id);

      if (error) throw error;

      // Refresh event list
      await fetchEvents();
      setDeleteDialogOpen(false);
      toast.success('Event cancelled successfully');
    } catch (err) {
      console.error('Error cancelling event:', err);
      setError(err.message);
      toast.error('Failed to cancel event');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning':
        return 'primary';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && events.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Events
      </Typography>

      {/* Filters and Search */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="event filter tabs">
              <Tab label="All Events" />
              <Tab label="Planning" />
              <Tab label="Confirmed" />
              <Tab label="Completed" />
              <Tab label="Cancelled" />
            </Tabs>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search events..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Events Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="events table">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Organizer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body1">
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.event_type}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(event.start_date), 'MMM d, yyyy')}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {format(new Date(event.start_date), 'h:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <LocationOnIcon fontSize="small" sx={{ mr: 0.5, mt: 0.25, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {event.location || 'No location specified'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {event.profiles?.first_name} {event.profiles?.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.profiles?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.status.toUpperCase()}
                        color={getStatusColor(event.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewDetails(event)}
                        size="small"
                        title="View Details"
                      >
                        <VisibilityIcon />
                      </IconButton>

                      {event.status !== 'cancelled' && event.status !== 'completed' && (
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(event)}
                          size="small"
                          title="Cancel Event"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No events found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Event Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Event Details
        </DialogTitle>
        <DialogContent>
          {currentEvent && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Event Overview */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h5">
                          {currentEvent.title}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                          {currentEvent.event_type}
                        </Typography>
                      </Box>
                      <Chip
                        label={currentEvent.status.toUpperCase()}
                        color={getStatusColor(currentEvent.status)}
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Date & Time
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(currentEvent.start_date), 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        <Typography variant="body2">
                          {format(new Date(currentEvent.start_date), 'h:mm a')} -
                          {currentEvent.end_date ? format(new Date(currentEvent.end_date), 'h:mm a') : 'Not specified'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body1">
                          {currentEvent.location || 'No location specified'}
                        </Typography>
                        <Typography variant="body2">
                          {currentEvent.address ? (
                            <>
                              {currentEvent.address}<br />
                              {currentEvent.city}{currentEvent.state ? `, ${currentEvent.state}` : ''} {currentEvent.zip_code}
                            </>
                          ) : (
                            'No address specified'
                          )}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Organizer
                        </Typography>
                        <Typography variant="body1">
                          {currentEvent.profiles?.first_name} {currentEvent.profiles?.last_name}
                        </Typography>
                        <Typography variant="body2">
                          {currentEvent.profiles?.email}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Budget
                        </Typography>
                        <Typography variant="body1">
                          ${currentEvent.budget ? currentEvent.budget.toFixed(2) : '0.00'}
                        </Typography>
                        <Typography variant="body2">
                          {eventDetails.budget.length} budget items
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {currentEvent.description || 'No description provided'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Event Stats */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {/* Tasks */}
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">
                            Tasks
                          </Typography>
                          <Chip
                            label={`${eventDetails.tasks.filter(task => task.status === 'completed').length}/${eventDetails.tasks.length}`}
                            color="primary"
                            size="small"
                          />
                        </Box>

                        <Box>
                          <Typography variant="body2">
                            Completed: {eventDetails.tasks.filter(task => task.status === 'completed').length}
                          </Typography>
                          <Typography variant="body2">
                            In Progress: {eventDetails.tasks.filter(task => task.status === 'in_progress').length}
                          </Typography>
                          <Typography variant="body2">
                            Pending: {eventDetails.tasks.filter(task => task.status === 'pending').length}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Guests */}
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">
                            Guests
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PeopleIcon sx={{ mr: 0.5 }} />
                            <Typography>{eventDetails.guests.length}</Typography>
                          </Box>
                        </Box>

                        <Box>
                          <Typography variant="body2">
                            Confirmed: {eventDetails.guests.filter(guest => guest.rsvp_status.toLowerCase() === 'confirmed').length}
                          </Typography>
                          <Typography variant="body2">
                            Declined: {eventDetails.guests.filter(guest => guest.rsvp_status.toLowerCase() === 'declined').length}
                          </Typography>
                          <Typography variant="body2">
                            Pending: {eventDetails.guests.filter(guest =>
                              guest.rsvp_status.toLowerCase() === 'pending' ||
                              guest.rsvp_status.toLowerCase() === 'maybe'
                            ).length}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Budget */}
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">
                            Budget
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ${currentEvent.budget ? currentEvent.budget.toFixed(2) : '0.00'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2">
                            Estimated: ${eventDetails.budget.reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0).toFixed(2)}
                          </Typography>
                          <Typography variant="body2">
                            Actual: ${eventDetails.budget.reduce((sum, item) => sum + parseFloat(item.actual_cost || 0), 0).toFixed(2)}
                          </Typography>
                          <Typography variant="body2">
                            Paid: ${eventDetails.budget.filter(item => item.is_paid).reduce((sum, item) => sum + parseFloat(item.actual_cost || item.estimated_cost || 0), 0).toFixed(2)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {currentEvent && currentEvent.status !== 'cancelled' && currentEvent.status !== 'completed' && (
            <Button
              onClick={() => {
                setDetailsDialogOpen(false);
                handleDeleteClick(currentEvent);
              }}
              color="error"
            >
              Cancel Event
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to cancel the event "{currentEvent?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will mark the event as cancelled and notify all participants.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>No, Keep Event</Button>
          <Button onClick={handleDeleteEvent} color="error">
            Yes, Cancel Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageEventsPage;