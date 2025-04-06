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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';

const ManageEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [guests, setGuests] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);

        if (!eventId || !user) return;

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .eq('user_id', user.id)
          .single();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Event not found');

        setEvent(eventData);

        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('event_tasks')
          .select('*')
          .eq('event_id', eventId)
          .order('due_date', { ascending: true });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Fetch vendor bookings
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('event_vendor_bookings')
          .select('*, vendor:vendors(id, company_name, vendor_type)')
          .eq('event_id', eventId);

        if (vendorsError) throw vendorsError;
        setVendors(vendorsData || []);

        // Fetch guests
        const { data: guestsData, error: guestsError } = await supabase
          .from('event_guests')
          .select('*')
          .eq('event_id', eventId);

        if (guestsError) throw guestsError;
        setGuests(guestsData || []);

        // Create mock expenses data since the event_budget_items table doesn't exist
        const mockExpensesData = [
          {
            id: '1',
            event_id: eventId,
            category: 'Venue',
            item_name: 'Wedding Venue',
            estimated_cost: 5000,
            actual_cost: 5200,
            is_paid: true,
            notes: 'Deposit paid',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            event_id: eventId,
            category: 'Catering',
            item_name: 'Food and Beverages',
            estimated_cost: 3000,
            actual_cost: 3200,
            is_paid: false,
            notes: 'Need to confirm final headcount',
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            event_id: eventId,
            category: 'Photography',
            item_name: 'Photographer',
            estimated_cost: 1500,
            actual_cost: 1500,
            is_paid: true,
            notes: 'Booked for 6 hours',
            created_at: new Date().toISOString()
          }
        ];

        setExpenses(mockExpensesData);

      } catch (err) {
        console.error('Error fetching event data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditEvent = () => {
    navigate(`/events/${eventId}/edit`);
  };

  const handleManageGuests = () => {
    navigate(`/events/${eventId}/guests`);
  };

  const handleManageBudget = () => {
    navigate(`/events/${eventId}/budget`);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('event_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;

      // Update the tasks list
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status: 'completed' } : task
      ));
    } catch (err) {
      console.error('Error completing task:', err);
      setError(err.message);
    }
  };

  const handleSearchVendors = () => {
    navigate('/vendors/search');
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

  // Calculate statistics
  const confirmedGuests = guests.filter(guest => guest.rsvp_status.toLowerCase() === 'confirmed').length;
  const pendingTasks = tasks.filter(task => task.status !== 'completed').length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const budgetRemaining = event.budget ? event.budget - totalExpenses : 0;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Manage: {event.title}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEditEvent}
          >
            Edit Event
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label={event.status.toUpperCase()}
            color={event.status === 'completed' ? 'success' : event.status === 'cancelled' ? 'error' : 'primary'}
          />
          <Chip
            label={event.event_type}
            variant="outlined"
          />
          <Chip
            icon={<EventIcon />}
            label={format(new Date(event.start_date), 'PPP')}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Event Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Guests</Typography>
              </Box>
              <Typography variant="h4">{confirmedGuests}/{guests.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Confirmed / Total
              </Typography>
              <Button
                variant="text"
                onClick={handleManageGuests}
                sx={{ mt: 1 }}
              >
                Manage Guests
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Tasks</Typography>
              </Box>
              <Typography variant="h4">{pendingTasks}/{tasks.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Pending / Total
              </Typography>
              <Button
                variant="text"
                onClick={() => setTabValue(0)}
                sx={{ mt: 1 }}
              >
                View Tasks
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Budget</Typography>
              </Box>
              <Typography variant="h4">
                ${budgetRemaining.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remaining: ${event.budget ? event.budget.toFixed(2) : '0.00'}
              </Typography>
              <Button
                variant="text"
                onClick={handleManageBudget}
                sx={{ mt: 1 }}
              >
                Manage Budget
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorefrontIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Vendors</Typography>
              </Box>
              <Typography variant="h4">{vendors.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Booked Vendors
              </Typography>
              <Button
                variant="text"
                onClick={handleSearchVendors}
                sx={{ mt: 1 }}
              >
                Find Vendors
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Tasks" />
          <Tab label="Vendors" />
          <Tab label="Guests" />
          <Tab label="Budget" />
        </Tabs>

        {/* Tasks Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Event Tasks</Typography>
              <Button variant="contained" size="small">
                Add Task
              </Button>
            </Box>

            {tasks.length > 0 ? (
              <List>
                {tasks.map((task) => (
                  <ListItem
                    key={task.id}
                    secondaryAction={
                      task.status !== 'completed' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          Complete
                        </Button>
                      )
                    }
                    sx={{
                      opacity: task.status === 'completed' ? 0.6 : 1,
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                    }}
                  >
                    <ListItemIcon>
                      {task.status === 'completed' ?
                        <CheckCircleIcon color="success" /> :
                        <PendingIcon color="action" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <>
                          {task.description}
                          <br />
                          Due: {task.due_date ? format(new Date(task.due_date), 'PPP') : 'No due date'}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                No tasks found for this event.
              </Typography>
            )}
          </Box>
        )}

        {/* Vendors Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Booked Vendors</Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleSearchVendors}
              >
                Find Vendors
              </Button>
            </Box>

            {vendors.length > 0 ? (
              <List>
                {vendors.map((booking) => (
                  <ListItem key={booking.id}>
                    <ListItemIcon>
                      <StorefrontIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={booking.vendor?.business_name || 'Unknown Vendor'}
                      secondary={
                        <>
                          {booking.vendor?.service_type || 'Service'}
                          <br />
                          Status: {booking.status}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                No vendors booked for this event yet.
              </Typography>
            )}
          </Box>
        )}

        {/* Guests Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Guest List</Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleManageGuests}
              >
                Manage Guests
              </Button>
            </Box>

            {guests.length > 0 ? (
              <List>
                {guests.map((guest) => (
                  <ListItem key={guest.id}>
                    <ListItemIcon>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={guest.guest_name}
                      secondary={
                        <>
                          {guest.email}
                          <br />
                          Status: {guest.rsvp_status}
                          {guest.plus_ones > 0 && ` (+${guest.plus_ones})`}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                No guests added to this event yet.
              </Typography>
            )}
          </Box>
        )}

        {/* Budget Tab */}
        {tabValue === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Budget Overview</Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleManageBudget}
              >
                Manage Budget
              </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1">
                Total Budget: ${event.budget ? event.budget.toFixed(2) : '0.00'}
              </Typography>
              <Typography variant="body1">
                Total Expenses: ${totalExpenses.toFixed(2)}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                Remaining: ${budgetRemaining.toFixed(2)}
              </Typography>
            </Box>

            {expenses.length > 0 ? (
              <List>
                {expenses.slice(0, 5).map((expense) => (
                  <ListItem key={expense.id}>
                    <ListItemIcon>
                      <AttachMoneyIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={expense.description}
                      secondary={
                        <>
                          Category: {expense.category}
                          <br />
                          Amount: ${expense.amount.toFixed(2)}
                        </>
                      }
                    />
                  </ListItem>
                ))}
                {expenses.length > 5 && (
                  <Button
                    fullWidth
                    variant="text"
                    onClick={handleManageBudget}
                    sx={{ mt: 1 }}
                  >
                    View All Expenses
                  </Button>
                )}
              </List>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                No expenses recorded for this event yet.
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ManageEventPage;