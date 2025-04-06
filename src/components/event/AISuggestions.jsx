import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Chip, Divider, List, ListItem, ListItemText, ListItemIcon, IconButton, Collapse } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const AISuggestions = ({ event, tasks, budgetItems, guests, onAddTask, onAddBudgetItem }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);

  useEffect(() => {
    if (event) {
      generateSuggestions();
    }
  }, [event]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      // In a real application, this would call an AI service
      // For now, we'll generate suggestions based on event type and current data
      const eventSuggestions = [];
      
      // Task suggestions based on event type and missing common tasks
      const taskTitles = tasks.map(task => task.title.toLowerCase());
      
      // Common tasks by event type
      const commonTasks = {
        'Wedding': [
          { title: 'Book venue', description: 'Research and secure a wedding venue that fits your budget and guest count' },
          { title: 'Hire photographer', description: 'Find a professional photographer to capture your special day' },
          { title: 'Order wedding cake', description: 'Select a bakery and design for your wedding cake' },
          { title: 'Send invitations', description: 'Design, print, and mail wedding invitations to guests' }
        ],
        'Birthday': [
          { title: 'Order cake', description: 'Order a birthday cake from a local bakery' },
          { title: 'Buy decorations', description: 'Purchase themed decorations for the party' },
          { title: 'Plan activities', description: 'Organize games or entertainment for guests' }
        ],
        'Corporate': [
          { title: 'Book speakers', description: 'Contact and confirm speakers or presenters' },
          { title: 'Arrange catering', description: 'Select menu and hire catering service' },
          { title: 'Prepare agenda', description: 'Create detailed schedule for the event' },
          { title: 'Set up registration', description: 'Create registration system for attendees' }
        ],
        'Conference': [
          { title: 'Book venue', description: 'Secure conference venue with appropriate facilities' },
          { title: 'Invite speakers', description: 'Contact industry experts to speak at your conference' },
          { title: 'Create schedule', description: 'Develop conference agenda with sessions and breaks' },
          { title: 'Set up registration', description: 'Implement registration system for attendees' }
        ]
      };
      
      // Add task suggestions based on event type
      const eventTypeSpecificTasks = commonTasks[event.event_type] || [];
      
      eventTypeSpecificTasks.forEach(task => {
        if (!taskTitles.includes(task.title.toLowerCase())) {
          eventSuggestions.push({
            type: 'task',
            title: task.title,
            description: task.description,
            priority: 'medium',
            due_date: new Date(new Date().setDate(new Date().getDate() + 14)) // 2 weeks from now
          });
        }
      });
      
      // Budget suggestions based on event type
      const budgetCategories = budgetItems.map(item => item.category.toLowerCase());
      
      // Common budget categories by event type
      const commonBudgetCategories = {
        'Wedding': [
          { category: 'Venue', item: 'Venue rental', estimated: event.budget ? event.budget * 0.4 : 5000 },
          { category: 'Catering', item: 'Food and beverages', estimated: event.budget ? event.budget * 0.3 : 3000 },
          { category: 'Photography', item: 'Wedding photographer', estimated: event.budget ? event.budget * 0.1 : 1500 },
          { category: 'Decor', item: 'Flowers and decorations', estimated: event.budget ? event.budget * 0.1 : 1000 }
        ],
        'Birthday': [
          { category: 'Venue', item: 'Party space rental', estimated: event.budget ? event.budget * 0.3 : 300 },
          { category: 'Food', item: 'Catering/Food', estimated: event.budget ? event.budget * 0.4 : 400 },
          { category: 'Entertainment', item: 'Music/DJ/Activities', estimated: event.budget ? event.budget * 0.2 : 200 }
        ],
        'Corporate': [
          { category: 'Venue', item: 'Conference space', estimated: event.budget ? event.budget * 0.3 : 3000 },
          { category: 'Catering', item: 'Meals and refreshments', estimated: event.budget ? event.budget * 0.25 : 2500 },
          { category: 'Technology', item: 'AV equipment', estimated: event.budget ? event.budget * 0.15 : 1500 },
          { category: 'Speakers', item: 'Speaker fees', estimated: event.budget ? event.budget * 0.2 : 2000 }
        ],
        'Conference': [
          { category: 'Venue', item: 'Conference center', estimated: event.budget ? event.budget * 0.35 : 7000 },
          { category: 'Catering', item: 'Meals and breaks', estimated: event.budget ? event.budget * 0.25 : 5000 },
          { category: 'Technology', item: 'AV and streaming', estimated: event.budget ? event.budget * 0.15 : 3000 },
          { category: 'Marketing', item: 'Promotion materials', estimated: event.budget ? event.budget * 0.1 : 2000 }
        ]
      };
      
      // Add budget suggestions based on event type
      const eventTypeSpecificBudget = commonBudgetCategories[event.event_type] || [];
      
      eventTypeSpecificBudget.forEach(budgetItem => {
        if (!budgetCategories.includes(budgetItem.category.toLowerCase())) {
          eventSuggestions.push({
            type: 'budget',
            category: budgetItem.category,
            item_name: budgetItem.item,
            estimated_cost: budgetItem.estimated.toFixed(2)
          });
        }
      });
      
      // Guest suggestions if guest list is small
      if (guests.length < 5 && event.estimated_guests > guests.length) {
        eventSuggestions.push({
          type: 'general',
          title: 'Complete your guest list',
          description: `You've added ${guests.length} guests but estimated ${event.estimated_guests}. Don't forget to add all your guests to keep track of RSVPs.`
        });
      }
      
      // Timeline suggestion based on event date
      const eventDate = new Date(event.start_date);
      const today = new Date();
      const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEvent < 30 && daysUntilEvent > 0) {
        eventSuggestions.push({
          type: 'general',
          title: 'Event is approaching',
          description: `Your event is only ${daysUntilEvent} days away. Make sure to finalize all details and confirm with vendors.`
        });
      }
      
      setSuggestions(eventSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (index) => {
    setExpandedSuggestion(expandedSuggestion === index ? null : index);
  };

  const handleApplySuggestion = (suggestion) => {
    try {
      if (suggestion.type === 'task') {
        onAddTask({
          title: suggestion.title,
          description: suggestion.description,
          due_date: suggestion.due_date,
          status: 'pending',
          priority: suggestion.priority
        });
        toast.success('Task added from suggestion');
      } else if (suggestion.type === 'budget') {
        onAddBudgetItem({
          category: suggestion.category,
          item_name: suggestion.item_name,
          estimated_cost: suggestion.estimated_cost,
          actual_cost: '',
          vendor_id: null,
          is_paid: false,
          notes: 'Added from AI suggestion'
        });
        toast.success('Budget item added from suggestion');
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast.error('Failed to apply suggestion');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          AI Suggestions
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={generateSuggestions}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <LightbulbIcon />}
        >
          Refresh Suggestions
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : suggestions.length > 0 ? (
        <List>
          {suggestions.map((suggestion, index) => (
            <Paper key={index} elevation={1} sx={{ mb: 2 }}>
              <ListItem
                button
                onClick={() => handleToggleExpand(index)}
                sx={{ borderLeft: '4px solid', borderColor: 
                  suggestion.type === 'task' ? 'primary.main' : 
                  suggestion.type === 'budget' ? 'success.main' : 'warning.main' 
                }}
              >
                <ListItemIcon>
                  <LightbulbIcon color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary={suggestion.title || suggestion.item_name} 
                  secondary={
                    suggestion.type === 'task' ? 'Task Suggestion' : 
                    suggestion.type === 'budget' ? `Budget: ${suggestion.category}` : 
                    'General Suggestion'
                  }
                />
                {expandedSuggestion === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItem>
              
              <Collapse in={expandedSuggestion === index}>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Divider sx={{ my: 1 }} />
                  
                  {suggestion.type === 'task' && (
                    <>
                      <Typography variant="body2" paragraph>
                        {suggestion.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip size="small" label={`Priority: ${suggestion.priority}`} color="primary" />
                      </Box>
                    </>
                  )}
                  
                  {suggestion.type === 'budget' && (
                    <>
                      <Typography variant="body2" paragraph>
                        Suggested budget item for your {event.event_type} event.
                      </Typography>
                      <Typography variant="body2">
                        Estimated cost: <b>${parseFloat(suggestion.estimated_cost).toFixed(2)}</b>
                      </Typography>
                    </>
                  )}
                  
                  {suggestion.type === 'general' && (
                    <Typography variant="body2" paragraph>
                      {suggestion.description}
                    </Typography>
                  )}
                  
                  {(suggestion.type === 'task' || suggestion.type === 'budget') && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleApplySuggestion(suggestion)}
                      sx={{ mt: 1 }}
                    >
                      Apply Suggestion
                    </Button>
                  )}
                </Box>
              </Collapse>
            </Paper>
          ))}
        </List>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No suggestions available for this event.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AISuggestions;