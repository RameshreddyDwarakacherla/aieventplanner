import { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, List, ListItem, ListItemText, ListItemIcon, Divider, IconButton } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const AIEventAssistant = ({ event, tasks, budgetItems, guests }) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [eventContext, setEventContext] = useState(null);

  useEffect(() => {
    if (event) {
      // Prepare event context for AI
      setEventContext({
        eventType: event.event_type,
        startDate: event.start_date,
        budget: event.budget,
        guestCount: event.estimated_guests,
        completedTasks: tasks.filter(task => task.status === 'completed').length,
        pendingTasks: tasks.filter(task => task.status !== 'completed').length,
        confirmedGuests: guests.filter(guest => guest.rsvp_status === 'confirmed').length,
        totalBudget: budgetItems.reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0)
      });
    }
  }, [event, tasks, budgetItems, guests]);

  const generateAIResponse = async (userMessage) => {
    // In a real application, this would call an AI service
    // For now, we'll generate contextual responses based on event data
    const responses = {
      budget: `Based on your event budget of $${event.budget}, you've allocated $${eventContext.totalBudget} so far. ` +
        `Consider reviewing your budget allocations to ensure you're staying within your target.`,
      tasks: `You have ${eventContext.completedTasks} completed tasks and ${eventContext.pendingTasks} pending tasks. ` +
        `Focus on completing high-priority tasks first to stay on schedule.`,
      guests: `${eventContext.confirmedGuests} guests have confirmed out of ${event.estimated_guests} expected. ` +
        `Consider sending reminders to guests who haven't responded yet.`,
      schedule: `Your event is scheduled for ${new Date(event.start_date).toLocaleDateString()}. ` +
        `Make sure to confirm all vendor bookings and finalize the timeline.`,
      help: `I can help you with:\n- Budget planning and tracking\n- Task management\n- Guest list coordination\n- Vendor recommendations\n- Timeline planning\nJust ask me about any of these topics!`
    };

    // Simple keyword matching for demo purposes
    let response = '';
    const message = userMessage.toLowerCase();

    if (message.includes('budget')) {
      response = responses.budget;
    } else if (message.includes('task')) {
      response = responses.tasks;
    } else if (message.includes('guest')) {
      response = responses.guests;
    } else if (message.includes('schedule') || message.includes('timeline')) {
      response = responses.schedule;
    } else if (message.includes('help')) {
      response = responses.help;
    } else {
      response = "I understand you're asking about your event. Could you please be more specific about what you need help with? You can ask about budget, tasks, guests, or schedule.";
    }

    return response;
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setUserInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    setLoading(true);
    try {
      const aiResponse = await generateAIResponse(userMessage);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 2, height: '500px', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          Event Assistant
        </Typography>

        {/* Messages Container */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, p: 1 }}>
          {messages.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ mt: 2 }}>
              Ask me anything about your event planning!
            </Typography>
          ) : (
            <List>
              {messages.map((message, index) => (
                <ListItem
                  key={index}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1,
                      bgcolor: message.type === 'user' ? 'primary.main' : 'background.paper',
                      color: message.type === 'user' ? 'white' : 'text.primary',
                      maxWidth: '80%'
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
              {loading && (
                <ListItem>
                  <CircularProgress size={20} />
                </ListItem>
              )}
            </List>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask about your event..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={loading}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={loading || !userInput.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default AIEventAssistant;