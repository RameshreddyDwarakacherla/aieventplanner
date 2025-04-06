import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EventIcon from '@mui/icons-material/Event';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { getAIChatResponse } from '../../services/aiService';

const AIEventChatbot = ({ event, tasks, guests, vendors }) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [eventStatus, setEventStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (event) {
      // Initialize with welcome message
      setMessages([
        {
          type: 'ai',
          content: `Hello! I'm your AI event assistant for "${event.title}". I can provide real-time updates, answer questions, and help you manage your event. How can I assist you today?`,
          timestamp: new Date().toISOString()
        }
      ]);

      // Get event status
      calculateEventStatus();

      // Get notifications
      fetchNotifications();

      // Set up real-time subscription for event updates
      const subscription = setupRealtimeSubscription();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [event]);

  const calculateEventStatus = () => {
    if (!event) return;

    const now = new Date();
    const eventDate = new Date(event.start_date);
    const eventEndDate = event.end_date ? new Date(event.end_date) : new Date(eventDate.getTime() + (24 * 60 * 60 * 1000)); // Default to 24 hours after start

    let status = '';
    let progress = 0;

    if (now < eventDate) {
      // Event hasn't started yet
      const totalPlanningTime = eventDate.getTime() - new Date(event.created_at).getTime();
      const elapsedPlanningTime = now.getTime() - new Date(event.created_at).getTime();
      progress = Math.min(Math.round((elapsedPlanningTime / totalPlanningTime) * 100), 99);
      status = 'planning';
    } else if (now >= eventDate && now <= eventEndDate) {
      // Event is in progress
      const totalEventTime = eventEndDate.getTime() - eventDate.getTime();
      const elapsedEventTime = now.getTime() - eventDate.getTime();
      progress = Math.min(Math.round((elapsedEventTime / totalEventTime) * 100), 99);
      status = 'in_progress';
    } else {
      // Event has ended
      progress = 100;
      status = 'completed';
    }

    setEventStatus({ status, progress });
  };

  const fetchNotifications = async () => {
    try {
      // In a real application, this would fetch actual notifications
      // For now, we'll generate some sample notifications based on the event data

      const sampleNotifications = [];
      const now = new Date();
      const eventDate = new Date(event.start_date);

      // Calculate days until event
      const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilEvent > 0 && daysUntilEvent <= 7) {
        sampleNotifications.push({
          id: 'notification-1',
          type: 'reminder',
          message: `Your event starts in ${daysUntilEvent} day${daysUntilEvent === 1 ? '' : 's'}!`,
          timestamp: new Date().toISOString(),
          priority: 'high'
        });
      }

      // Task-related notifications
      const overdueTasks = tasks.filter(task =>
        task.status !== 'completed' &&
        new Date(task.due_date) < now
      );

      if (overdueTasks.length > 0) {
        sampleNotifications.push({
          id: 'notification-2',
          type: 'task',
          message: `You have ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'} that need attention.`,
          timestamp: new Date().toISOString(),
          priority: 'high'
        });
      }

      // Guest-related notifications
      const pendingRSVPs = guests.filter(guest => !guest.rsvp_status || guest.rsvp_status === 'pending');

      if (pendingRSVPs.length > 0 && daysUntilEvent <= 14) {
        sampleNotifications.push({
          id: 'notification-3',
          type: 'guest',
          message: `${pendingRSVPs.length} guest${pendingRSVPs.length === 1 ? '' : 's'} haven't responded to your invitation yet.`,
          timestamp: new Date().toISOString(),
          priority: 'medium'
        });
      }

      // Vendor-related notifications
      const unconfirmedVendors = vendors ? vendors.filter(vendor => vendor.status !== 'confirmed') : [];

      if (unconfirmedVendors.length > 0 && daysUntilEvent <= 30) {
        sampleNotifications.push({
          id: 'notification-4',
          type: 'vendor',
          message: `${unconfirmedVendors.length} vendor${unconfirmedVendors.length === 1 ? '' : 's'} need confirmation.`,
          timestamp: new Date().toISOString(),
          priority: 'medium'
        });
      }

      setNotifications(sampleNotifications);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // In a real application, this would set up a real-time subscription to event updates
    // For now, we'll return a dummy subscription object
    return {
      unsubscribe: () => {}
    };
  };

  const generateAIResponse = async (userMessage) => {
    try {
      // Prepare event context for the AI
      const eventContext = {
        tasks: tasks || [],
        guests: guests || [],
        vendors: vendors || [],
        eventStatus: eventStatus || { status: 'planning', progress: 0 },
        notifications: notifications || []
      };

      // Call the real AI service
      const response = await getAIChatResponse(event, userMessage, messages);
      return response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again later.';
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setUserInput('');

    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    setLoading(true);
    try {
      const aiResponse = await generateAIResponse(userMessage);

      // Add AI response to chat
      setMessages(prev => [...prev, {
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Event Assistant</Typography>
          </Box>

          {eventStatus && (
            <Chip
              label={getStatusLabel(eventStatus.status)}
              color={getStatusColor(eventStatus.status)}
              size="small"
            />
          )}
        </Box>

        {/* Event Info */}
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              <strong>{event?.title}</strong> - {format(new Date(event?.start_date), 'MMM d, yyyy')}
            </Typography>
          </Box>

          {eventStatus && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={eventStatus.progress} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {eventStatus.progress}%
              </Typography>
            </Box>
          )}
        </Box>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <NotificationsIcon fontSize="small" sx={{ mr: 0.5 }} />
              Notifications
            </Typography>

            <Box sx={{ maxHeight: '100px', overflowY: 'auto', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
              {notifications.map((notification) => (
                <Box key={notification.id} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  <Chip
                    size="small"
                    label={notification.type}
                    color={getPriorityColor(notification.priority)}
                    sx={{ mr: 1, textTransform: 'capitalize' }}
                  />
                  <Typography variant="body2">{notification.message}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Messages Container */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, p: 1 }}>
          {messages.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ mt: 2 }}>
              No messages yet. Ask your AI assistant for help with your event.
            </Typography>
          ) : (
            <List>
              {messages.map((message, index) => (
                <ListItem
                  key={index}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                    p: 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      maxWidth: '80%',
                      bgcolor: message.type === 'user' ? 'primary.light' : 'background.default',
                      color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                      p: 1.5,
                      position: 'relative'
                    }}
                  >
                    {message.type === 'ai' && (
                      <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: 'primary.main' }}>
                        <SmartToyIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {message.content}
                      </Typography>
                      <Typography variant="caption" color={message.type === 'user' ? 'primary.contrastText' : 'text.secondary'} sx={{ mt: 0.5, opacity: 0.8 }}>
                        {format(new Date(message.timestamp), 'h:mm a')}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Ask about your event..."
            variant="outlined"
            size="small"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={loading}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={loading || !userInput.trim()}
            sx={{ ml: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default AIEventChatbot;