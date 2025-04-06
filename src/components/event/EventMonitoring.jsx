import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, LinearProgress, Card, CardContent, Divider, List, ListItem, ListItemText, ListItemIcon, Chip, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { supabase } from '../../lib/supabase';
import { format, differenceInDays } from 'date-fns';

const EventMonitoring = ({ event, tasks, budgetItems, guests }) => {
  const [loading, setLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [eventProgress, setEventProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (event) {
      calculateEventProgress();
      calculateTimeRemaining();
      fetchRecentActivities();
      
      // Set up real-time subscription for event updates
      const subscription = setupRealtimeSubscription();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [event, tasks, budgetItems, guests]);

  const calculateEventProgress = () => {
    // Calculate overall event progress based on tasks completion
    if (tasks.length === 0) {
      setEventProgress(0);
      return;
    }
    
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const progressPercentage = Math.round((completedTasks / tasks.length) * 100);
    setEventProgress(progressPercentage);
  };

  const calculateTimeRemaining = () => {
    if (!event) return;
    
    const eventDate = new Date(event.start_date);
    const today = new Date();
    const daysRemaining = differenceInDays(eventDate, today);
    
    setTimeRemaining({
      days: daysRemaining,
      isUpcoming: daysRemaining > 0,
      isPast: daysRemaining < 0
    });
  };

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      
      // In a real application, this would fetch actual activity logs
      // For now, we'll generate some sample activities based on the event data
      const activities = [];
      
      // Add task-related activities
      const recentTasks = tasks
        .filter(task => task.updated_at)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3);
      
      recentTasks.forEach(task => {
        activities.push({
          type: 'task',
          title: `Task ${task.status === 'completed' ? 'completed' : 'updated'}: ${task.title}`,
          timestamp: task.updated_at,
          status: task.status
        });
      });
      
      // Add guest-related activities
      const recentGuests = guests
        .filter(guest => guest.updated_at)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 2);
      
      recentGuests.forEach(guest => {
        activities.push({
          type: 'guest',
          title: `Guest ${guest.rsvp_status === 'confirmed' ? 'confirmed' : 'updated'}: ${guest.name}`,
          timestamp: guest.updated_at,
          status: guest.rsvp_status
        });
      });
      
      // Add budget-related activities
      const recentBudgetItems = budgetItems
        .filter(item => item.updated_at)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 2);
      
      recentBudgetItems.forEach(item => {
        activities.push({
          type: 'budget',
          title: `Budget item ${item.is_paid ? 'paid' : 'updated'}: ${item.item_name}`,
          timestamp: item.updated_at,
          amount: item.actual_cost || item.estimated_cost
        });
      });
      
      // Sort all activities by timestamp
      const sortedActivities = activities.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 5); // Show only the 5 most recent activities
      
      setRecentActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to real-time updates for tasks
    const tasksSubscription = supabase
      .channel('event-monitoring')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_tasks',
        filter: `event_id=eq.${event.id}`
      }, (payload) => {
        // Refresh data when tasks are updated
        fetchRecentActivities();
        calculateEventProgress();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_guests',
        filter: `event_id=eq.${event.id}`
      }, (payload) => {
        // Refresh data when guests are updated
        fetchRecentActivities();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_budget_items',
        filter: `event_id=eq.${event.id}`
      }, (payload) => {
        // Refresh data when budget items are updated
        fetchRecentActivities();
      })
      .subscribe();
    
    return tasksSubscription;
  };

  // Calculate statistics
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'completed').length,
    pending: tasks.filter(task => task.status !== 'completed').length,
    highPriority: tasks.filter(task => task.priority === 'high' && task.status !== 'completed').length
  };
  
  const budgetStats = {
    estimated: budgetItems.reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0),
    actual: budgetItems.reduce((sum, item) => sum + parseFloat(item.actual_cost || 0), 0),
    paid: budgetItems.filter(item => item.is_paid).reduce((sum, item) => sum + parseFloat(item.actual_cost || 0), 0),
    unpaid: budgetItems.filter(item => !item.is_paid && item.actual_cost).reduce((sum, item) => sum + parseFloat(item.actual_cost || 0), 0)
  };
  
  const guestStats = {
    total: guests.length,
    confirmed: guests.filter(guest => guest.rsvp_status === 'confirmed').length,
    pending: guests.filter(guest => guest.rsvp_status === 'pending').length,
    declined: guests.filter(guest => guest.rsvp_status === 'declined').length,
    totalAttendees: guests.reduce((sum, guest) => {
      return sum + (guest.rsvp_status === 'confirmed' ? 1 + parseInt(guest.plus_ones || 0) : 0);
    }, 0)
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Event Monitoring
      </Typography>
      
      {/* Event Progress */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Overall Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={eventProgress} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {eventProgress}%
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Time Remaining
            </Typography>
            {timeRemaining && (
              timeRemaining.isPast ? (
                <Typography variant="body1" color="text.secondary">
                  Event has already occurred ({Math.abs(timeRemaining.days)} days ago)
                </Typography>
              ) : timeRemaining.days === 0 ? (
                <Typography variant="body1" color="error.main" fontWeight="bold">
                  Event is today!
                </Typography>
              ) : (
                <Typography variant="body1" color={timeRemaining.days <= 7 ? 'warning.main' : 'primary.main'} fontWeight="bold">
                  {timeRemaining.days} days remaining
                </Typography>
              )
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Tasks Stats */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Tasks</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Total Tasks" 
                    secondary={taskStats.total}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Completed" 
                    secondary={`${taskStats.completed} (${taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%)`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Pending" 
                    secondary={taskStats.pending}
                  />
                </ListItem>
                {taskStats.highPriority > 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="High Priority Pending" 
                      secondary={<Typography color="error.main">{taskStats.highPriority}</Typography>}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Budget Stats */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Budget</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Estimated Total" 
                    secondary={`$${budgetStats.estimated.toFixed(2)}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Actual Total" 
                    secondary={`$${budgetStats.actual.toFixed(2)}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Paid" 
                    secondary={`$${budgetStats.paid.toFixed(2)} (${budgetStats.actual > 0 ? Math.round((budgetStats.paid / budgetStats.actual) * 100) : 0}%)`}
                  />
                </ListItem>
                {budgetStats.unpaid > 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="Unpaid" 
                      secondary={<Typography color="warning.main">${budgetStats.unpaid.toFixed(2)}</Typography>}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Guest Stats */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Guests</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Total Invited" 
                    secondary={guestStats.total}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Confirmed" 
                    secondary={`${guestStats.confirmed} (${guestStats.total > 0 ? Math.round((guestStats.confirmed / guestStats.total) * 100) : 0}%)`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Pending Response" 
                    secondary={guestStats.pending}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Total Attendees" 
                    secondary={`${guestStats.totalAttendees} (including plus ones)`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Activity */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsIcon sx={{ mr: 1 }} />
            Recent Activity
          </Box>
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        {recentActivities.length > 0 ? (
          <List>
            {recentActivities.map((activity, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  {activity.type === 'task' && (
                    activity.status === 'completed' ? 
                      <CheckCircleIcon color="success" /> : 
                      <PendingIcon color="warning" />
                  )}
                  {activity.type === 'guest' && <PeopleIcon color="primary" />}
                  {activity.type === 'budget' && <AttachMoneyIcon color="info" />}
                </ListItemIcon>
                <ListItemText
                  primary={activity.title}
                  secondary={format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                />
                {activity.type === 'budget' && activity.amount && (
                  <Chip 
                    label={`$${parseFloat(activity.amount).toFixed(2)}`} 
                    color="primary" 
                    variant="outlined" 
                    size="small" 
                  />
                )}
                {activity.type === 'task' && (
                  <Chip 
                    label={activity.status} 
                    color={activity.status === 'completed' ? 'success' : 'default'} 
                    variant="outlined" 
                    size="small" 
                  />
                )}
                {activity.type === 'guest' && (
                  <Chip 
                    label={activity.status} 
                    color={activity.status === 'confirmed' ? 'success' : activity.status === 'declined' ? 'error' : 'default'} 
                    variant="outlined" 
                    size="small" 
                  />
                )}
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" align="center">
            No recent activity to display
          </Typography>
        )}
        
        {timeRemaining && timeRemaining.days <= 7 && timeRemaining.days > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Your event is coming up in {timeRemaining.days} days! Make sure to finalize all pending tasks and confirm with vendors.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default EventMonitoring;