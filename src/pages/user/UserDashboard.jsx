import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Divider, Chip, CircularProgress, Alert, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    pendingTasks: 0
  });
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        if (!user) return;

        // Fetch user's events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: true });

        if (eventsError) throw eventsError;

        // Calculate event statistics
        const now = new Date();
        const upcoming = eventsData.filter(event => new Date(event.start_date) > now && event.status !== 'cancelled');
        const completed = eventsData.filter(event => event.status === 'completed');

        // Fetch pending tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('event_tasks')
          .select('*, events(title)')
          .in('status', ['pending', 'in_progress'])
          .eq('assigned_to', user.id)
          .order('due_date', { ascending: true });

        if (tasksError) throw tasksError;

        setStats({
          totalEvents: eventsData.length,
          upcomingEvents: upcoming.length,
          completedEvents: completed.length,
          pendingTasks: tasksData.length
        });

        setEvents(upcoming.slice(0, 3)); // Show only 3 upcoming events
        setTasks(tasksData.slice(0, 5)); // Show only 5 pending tasks
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleCreateEvent = () => {
    navigate('/events/create');
  };

  const handleViewEvent = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('event_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;

      // Update the tasks list
      setTasks(tasks.filter(task => task.id !== taskId));

      // Update pending tasks count
      setStats(prev => ({
        ...prev,
        pendingTasks: prev.pendingTasks - 1
      }));
    } catch (err) {
      console.error('Error completing task:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateEvent}
        >
          Create New Event
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Events</Typography>
              </Box>
              <Typography variant="h3">{stats.totalEvents}</Typography>
              <Button
                variant="text"
                onClick={() => navigate('/events')}
                sx={{ mt: 1 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Upcoming</Typography>
              </Box>
              <Typography variant="h3">{stats.upcomingEvents}</Typography>
              <Button
                variant="text"
                onClick={() => navigate('/events?filter=upcoming')}
                sx={{ mt: 1 }}
                disabled={stats.upcomingEvents === 0}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Completed</Typography>
              </Box>
              <Typography variant="h3">{stats.completedEvents}</Typography>
              <Button
                variant="text"
                onClick={() => navigate('/events?filter=completed')}
                sx={{ mt: 1 }}
                disabled={stats.completedEvents === 0}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PendingIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Tasks</Typography>
              </Box>
              <Typography variant="h3">{stats.pendingTasks}</Typography>
              <Button
                variant="text"
                onClick={() => navigate('/tasks')}
                sx={{ mt: 1 }}
                disabled={stats.pendingTasks === 0}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Upcoming Events */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Upcoming Events
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {events.length > 0 ? (
                <List>
                  {events.map((event) => (
                    <ListItem
                      key={event.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
                      }}
                      onClick={() => handleViewEvent(event.id)}
                    >
                      <ListItemIcon>
                        <EventIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="body2" component="span">
                                {format(new Date(event.start_date), 'MMM d, yyyy')}
                              </Typography>
                              <Chip
                                label={event.event_type}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    No upcoming events
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={handleCreateEvent}
                  >
                    Create Event
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Pending Tasks
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {tasks.length > 0 ? (
                <List>
                  {tasks.map((task) => (
                    <ListItem
                      key={task.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                      secondaryAction={
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          Complete
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <PendingIcon color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'info'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {task.events?.title || 'Unknown event'}
                            </Typography>
                            {task.due_date && (
                              <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                Due: {format(new Date(task.due_date), 'MMM d')}
                              </Typography>
                            )}
                            <Chip
                              label={task.priority}
                              size="small"
                              color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'info'}
                              sx={{ ml: 1 }}
                            />
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    No pending tasks
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard;