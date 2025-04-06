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
  Grid,
  Alert
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const AIEventSuggestions = ({ event, tasks, budgetItems, guests, onAddTask, onAddBudgetItem, onSaveRecommendation }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [savedRecommendations, setSavedRecommendations] = useState([]);

  useEffect(() => {
    if (event) {
      fetchSavedRecommendations();
      generateSuggestions();
    }
  }, [event]);

  const fetchSavedRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('event_id', event.id);
      
      if (error) throw error;
      
      setSavedRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching saved recommendations:', error);
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      // In a real application, this would call an AI service
      // For now, we'll generate intelligent suggestions based on event type and data
      const eventSuggestions = [];
      
      // Venue suggestions based on event type
      const venuesByEventType = {
        'Wedding': [
          { name: 'Grand Ballroom', description: 'Elegant ballroom with crystal chandeliers and marble floors', price: event.budget * 0.3 },
          { name: 'Garden Estate', description: 'Beautiful outdoor venue with lush gardens and water features', price: event.budget * 0.25 },
          { name: 'Vineyard Resort', description: 'Rustic charm with stunning vineyard views', price: event.budget * 0.28 }
        ],
        'Birthday': [
          { name: 'Urban Loft', description: 'Modern space with industrial chic design', price: event.budget * 0.2 },
          { name: 'Rooftop Lounge', description: 'Stylish rooftop venue with city views', price: event.budget * 0.25 },
          { name: 'Private Dining Room', description: 'Intimate setting in a top-rated restaurant', price: event.budget * 0.15 }
        ],
        'Corporate': [
          { name: 'Conference Center', description: 'Professional venue with state-of-the-art AV equipment', price: event.budget * 0.2 },
          { name: 'Hotel Ballroom', description: 'Versatile space with catering and accommodation options', price: event.budget * 0.25 },
          { name: 'Executive Retreat', description: 'Secluded venue with team-building facilities', price: event.budget * 0.3 }
        ],
        'Conference': [
          { name: 'Convention Center', description: 'Large-scale venue with multiple breakout rooms', price: event.budget * 0.35 },
          { name: 'Tech Campus', description: 'Modern venue with cutting-edge technology', price: event.budget * 0.3 },
          { name: 'University Hall', description: 'Academic setting with lecture halls and networking spaces', price: event.budget * 0.2 }
        ]
      };
      
      // Add venue suggestions if we don't have a location yet
      if (!event.location) {
        const eventTypeVenues = venuesByEventType[event.event_type] || [];
        eventTypeVenues.forEach(venue => {
          eventSuggestions.push({
            type: 'venue',
            title: venue.name,
            description: venue.description,
            price: venue.price,
            icon: <LocationOnIcon />
          });
        });
      }
      
      // Catering suggestions based on event type and guest count
      const cateringOptions = {
        'Wedding': [
          { name: 'Elegant Plated Dinner', description: 'Formal multi-course dinner service', price: event.estimated_guests * 75 },
          { name: 'Gourmet Buffet', description: 'Upscale buffet with carving stations', price: event.estimated_guests * 60 },
          { name: 'Family Style Service', description: 'Shared platters at each table', price: event.estimated_guests * 65 }
        ],
        'Birthday': [
          { name: 'Cocktail & Appetizers', description: 'Selection of passed hors d'oeuvres', price: event.estimated_guests * 35 },
          { name: 'Themed Food Stations', description: 'Interactive food stations with various cuisines', price: event.estimated_guests * 45 },
          { name: 'Casual Buffet', description: 'Relaxed dining with favorite foods', price: event.estimated_guests * 30 }
        ],
        'Corporate': [
          { name: 'Executive Catering', description: 'Professional service with business-appropriate menu', price: event.estimated_guests * 50 },
          { name: 'Working Lunch', description: 'Convenient boxed lunches or sandwich platters', price: event.estimated_guests * 25 },
          { name: 'Networking Reception', description: 'Light appetizers and beverages', price: event.estimated_guests * 35 }
        ],
        'Conference': [
          { name: 'All-Day Package', description: 'Breakfast, lunch, and snack breaks', price: event.estimated_guests * 60 },
          { name: 'International Buffet', description: 'Diverse menu options for varied preferences', price: event.estimated_guests * 45 },
          { name: 'Health-Conscious Menu', description: 'Nutritious options to keep attendees energized', price: event.estimated_guests * 40 }
        ]
      };
      
      // Check if we already have catering in the budget
      const hasCatering = budgetItems.some(item => 
        item.category.toLowerCase().includes('catering') || 
        item.category.toLowerCase().includes('food')
      );
      
      if (!hasCatering) {
        const eventTypeCatering = cateringOptions[event.event_type] || [];
        eventTypeCatering.forEach(option => {
          eventSuggestions.push({
            type: 'catering',
            title: option.name,
            description: option.description,
            price: option.price,
            icon: <RestaurantIcon />
          });
        });
      }
      
      // Entertainment suggestions
      const entertainmentOptions = {
        'Wedding': [
          { name: 'Live Band', description: 'Professional band playing your favorite songs', price: 2500 },
          { name: 'DJ & Lighting', description: 'Experienced DJ with custom lighting package', price: 1500 },
          { name: 'String Quartet', description: 'Elegant classical music for ceremony and cocktail hour', price: 1200 }
        ],
        'Birthday': [
          { name: 'DJ Services', description: 'DJ playing age-appropriate music', price: 800 },
          { name: 'Photo Booth', description: 'Fun photo booth with props and unlimited prints', price: 600 },
          { name: 'Interactive Entertainment', description: 'Magician, caricature artist, or game host', price: 750 }
        ],
        'Corporate': [
          { name: 'Keynote Speaker', description: 'Industry expert to inspire your team', price: 3000 },
          { name: 'Team Building Activity', description: 'Engaging activity to boost morale and collaboration', price: 1500 },
          { name: 'Ambient Music', description: 'Background music to set the right atmosphere', price: 600 }
        ],
        'Conference': [
          { name: 'Panel Discussion', description: 'Moderated discussion with industry leaders', price: 2000 },
          { name: 'Networking Activities', description: 'Structured networking events to connect attendees', price: 1200 },
          { name: 'Evening Entertainment', description: 'Special entertainment for conference dinner or reception', price: 2500 }
        ]
      };
      
      // Check if we already have entertainment in the budget
      const hasEntertainment = budgetItems.some(item => 
        item.category.toLowerCase().includes('entertainment') || 
        item.category.toLowerCase().includes('music')
      );
      
      if (!hasEntertainment) {
        const eventTypeEntertainment = entertainmentOptions[event.event_type] || [];
        eventTypeEntertainment.forEach(option => {
          eventSuggestions.push({
            type: 'entertainment',
            title: option.name,
            description: option.description,
            price: option.price,
            icon: <MusicNoteIcon />
          });
        });
      }
      
      // Photography suggestions
      const photographyOptions = {
        'Wedding': [
          { name: 'Full Day Coverage', description: 'Comprehensive photography from preparation to reception', price: 3000 },
          { name: 'Photo & Video Package', description: 'Combined photography and videography services', price: 4500 },
          { name: 'Engagement Session + Wedding Day', description: 'Engagement photoshoot plus wedding day coverage', price: 3500 }
        ],
        'Birthday': [
          { name: 'Event Photographer', description: '3-4 hours of party coverage', price: 800 },
          { name: 'Portrait Session + Event', description: 'Formal portraits plus candid event coverage', price: 1200 },
          { name: 'Photo & Video Highlights', description: 'Photography and short highlight video', price: 1500 }
        ],
        'Corporate': [
          { name: 'Corporate Event Coverage', description: 'Professional photography for your business event', price: 1200 },
          { name: 'Headshots + Event Coverage', description: 'Professional headshots for team members plus event coverage', price: 1800 },
          { name: 'Marketing Package', description: 'Photos optimized for website, social media, and marketing materials', price: 2000 }
        ],
        'Conference': [
          { name: 'Conference Documentation', description: 'Comprehensive coverage of all conference activities', price: 2500 },
          { name: 'Speaker & Attendee Photography', description: 'Focus on speakers, presentations, and networking', price: 2000 },
          { name: 'Multi-Day Package', description: 'Complete coverage for multi-day events', price: 3500 }
        ]
      };
      
      // Check if we already have photography in the budget
      const hasPhotography = budgetItems.some(item => 
        item.category.toLowerCase().includes('photo') || 
        item.category.toLowerCase().includes('video')
      );
      
      if (!hasPhotography) {
        const eventTypePhotography = photographyOptions[event.event_type] || [];
        eventTypePhotography.forEach(option => {
          eventSuggestions.push({
            type: 'photography',
            title: option.name,
            description: option.description,
            price: option.price,
            icon: <CameraAltIcon />
          });
        });
      }
      
      // Special offers and vendor recommendations
      const specialOffers = [
        { name: 'All-Inclusive Package', description: `Complete ${event.event_type.toLowerCase()} package with venue, catering, and decor`, discount: '15% off', price: event.budget * 0.85 },
        { name: 'Last-Minute Booking Special', description: 'Special rates for events within the next 30 days', discount: '10% off', price: event.budget * 0.9 },
        { name: 'Weekday Event Discount', description: 'Special pricing for Monday-Thursday events', discount: '20% off', price: event.budget * 0.8 }
      ];
      
      specialOffers.forEach(offer => {
        eventSuggestions.push({
          type: 'special_offer',
          title: offer.name,
          description: offer.description,
          discount: offer.discount,
          price: offer.price,
          icon: <LocalOfferIcon />
        });
      });
      
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

  const handleSaveRecommendation = async (suggestion) => {
    try {
      // Save recommendation to database
      const { data, error } = await supabase
        .from('ai_recommendations')
        .insert([
          {
            user_id: event.user_id,
            event_id: event.id,
            recommendation_type: suggestion.type,
            content: suggestion,
            is_applied: false,
            created_at: new Date()
          }
        ]);
      
      if (error) throw error;
      
      // Update local state
      fetchSavedRecommendations();
      
      // Notify parent component if callback provided
      if (onSaveRecommendation) {
        onSaveRecommendation(suggestion);
      }
      
      toast.success('Recommendation saved');
    } catch (error) {
      console.error('Error saving recommendation:', error);
      toast.error('Failed to save recommendation');
    }
  };

  const handleApplySuggestion = (suggestion) => {
    try {
      if (suggestion.type === 'venue') {
        // Add venue task
        onAddTask({
          title: `Book venue: ${suggestion.title}`,
          description: `Contact and book ${suggestion.title}. ${suggestion.description}`,
          due_date: new Date(new Date().setDate(new Date().getDate() + 14)),
          status: 'pending',
          priority: 'high'
        });
        
        // Add venue budget item
        onAddBudgetItem({
          category: 'Venue',
          item_name: suggestion.title,
          estimated_cost: suggestion.price.toString(),
          actual_cost: '',
          vendor_id: null,
          is_paid: false,
          notes: suggestion.description
        });
        
        toast.success('Venue suggestion applied to tasks and budget');
      } else if (suggestion.type === 'catering') {
        // Add catering task
        onAddTask({
          title: `Arrange catering: ${suggestion.title}`,
          description: `Book catering service: ${suggestion.title}. ${suggestion.description}`,
          due_date: new Date(new Date().setDate(new Date().getDate() + 21)),
          status: 'pending',
          priority: 'medium'
        });
        
        // Add catering budget item
        onAddBudgetItem({
          category: 'Catering',
          item_name: suggestion.title,
          estimated_cost: suggestion.price.toString(),
          actual_cost: '',
          vendor_id: null,
          is_paid: false,
          notes: suggestion.description
        });
        
        toast.success('Catering suggestion applied to tasks and budget');
      } else if (suggestion.type === 'entertainment') {
        // Add entertainment task
        onAddTask({
          title: `Book entertainment: ${suggestion.title}`,
          description: `Arrange for ${suggestion.title}. ${suggestion.description}`,
          due_date: new Date(new Date().setDate(new Date().getDate() + 30)),
          status: 'pending',
          priority: 'medium'
        });
        
        // Add entertainment budget item
        onAddBudgetItem({
          category: 'Entertainment',
          item_name: suggestion.title,
          estimated_cost: suggestion.price.toString(),
          actual_cost: '',
          vendor_id: null,
          is_paid: false,
          notes: suggestion.description
        });
        
        toast.success('Entertainment suggestion applied to tasks and budget');
      } else if (suggestion.type === 'photography') {
        // Add photography task
        onAddTask({
          title: `Book photographer: ${suggestion.title}`,
          description: `Hire photographer for ${suggestion.title}. ${suggestion.description}`,
          due_date: new Date(new Date().setDate(new Date().getDate() + 45)),
          status: 'pending',
          priority: 'medium'
        });
        
        // Add photography budget item
        onAddBudgetItem({
          category: 'Photography',
          item_name: suggestion.title,
          estimated_cost: suggestion.price.toString(),
          actual_cost: '',
          vendor_id: null,
          is_paid: false,
          notes: suggestion.description
        });
        
        toast.success('Photography suggestion applied to tasks and budget');
      } else if (suggestion.type === 'special_offer') {
        // Add special offer task
        onAddTask({
          title: `Explore special offer: ${suggestion.title}`,
          description: `Look into ${suggestion.title}. ${suggestion.description} ${suggestion.discount}`,
          due_date: new Date(new Date().setDate(new Date().getDate() + 7)),
          status: 'pending',
          priority: 'high'
        });
        
        toast.success('Special offer added to tasks');
      }
      
      // Mark recommendation as applied if it was saved
      const savedRec = savedRecommendations.find(rec => 
        rec.recommendation_type === suggestion.type && 
        rec.content.title === suggestion.title
      );
      
      if (savedRec) {
        supabase
          .from('ai_recommendations')
          .update({ is_applied: true })
          .eq('id', savedRec.id)
          .then(() => {
            fetchSavedRecommendations();
          });
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast.error('Failed to apply suggestion');
    }
  };

  const isRecommendationSaved = (suggestion) => {
    return savedRecommendations.some(rec => 
      rec.recommendation_type === suggestion.type && 
      rec.content.title === suggestion.title
    );
  };

  const isRecommendationApplied = (suggestion) => {
    const savedRec = savedRecommendations.find(rec => 
      rec.recommendation_type === suggestion.type && 
      rec.content.title === suggestion.title
    );
    
    return savedRec && savedRec.is_applied;
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'venue':
        return <LocationOnIcon />;
      case 'catering':
        return <RestaurantIcon />;
      case 'entertainment':
        return <MusicNoteIcon />;
      case 'photography':
        return <CameraAltIcon />;
      case 'special_offer':
        return <LocalOfferIcon />;
      default:
        return <LightbulbIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          AI-Powered Recommendations
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={generateSuggestions}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <LightbulbIcon />}
        >
          Refresh Recommendations
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <Grid item xs={12} md={6} key={`${suggestion.type}-${index}`}>
                <Card 
                  variant="outlined"
                  sx={{
                    position: 'relative',
                    borderColor: isRecommendationApplied(suggestion) ? 'success.main' : 
                               isRecommendationSaved(suggestion) ? 'primary.main' : 'divider'
                  }}
                >
                  {isRecommendationApplied(suggestion) && (
                    <Chip 
                      icon={<CheckCircleIcon />}
                      label="Applied"
                      color="success"
                      size="small"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}
                  
                  {!isRecommendationApplied(suggestion) && isRecommendationSaved(suggestion) && (
                    <Chip 
                      label="Saved"
                      color="primary"
                      size="small"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}
                  
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ mr: 1, color: 'primary.main' }}>
                        {getIconForType(suggestion.type)}
                      </Box>
                      <Typography variant="h6" component="div">
                        {suggestion.title}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {suggestion.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="subtitle1" color="primary.main">
                        {suggestion.discount ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: 'text.secondary', marginRight: 8 }}>
                              ${Math.round(suggestion.price / (1 - parseInt(suggestion.discount) / 100))}
                            </span>
                            ${Math.round(suggestion.price)} ({suggestion.discount})
                          </>
                        ) : (
                          `$${Math.round(suggestion.price)}`
                        )}
                      </Typography>
                      
                      <Box>
                        {!isRecommendationSaved(suggestion) && (
                          <Button 
                            size="small" 
                            onClick={() => handleSaveRecommendation(suggestion)}
                            sx={{ mr: 1 }}
                          >
                            Save
                          </Button>
                        )}
                        
                        {!isRecommendationApplied(suggestion) && (
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => handleApplySuggestion(suggestion)}
                            startIcon={<AddIcon />}
                          >
                            Apply
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">
                No AI recommendations available. Try refreshing or add more details to your event to get personalized suggestions.
              </Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default AIEventSuggestions;