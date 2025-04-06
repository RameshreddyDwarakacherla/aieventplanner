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
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import ReplyIcon from '@mui/icons-material/Reply';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const VendorReviewsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [vendorData, setVendorData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const fetchVendorReviews = async () => {
      try {
        setLoading(true);
        
        if (!user) return;

        // Fetch vendor profile
        const { data: vendorProfile, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (vendorError) throw vendorError;
        
        setVendorData(vendorProfile);
        
        // Fetch vendor reviews with user and event details
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('vendor_reviews')
          .select(`
            *,
            profiles(id, first_name, last_name, avatar_url),
            events(title, event_type, start_date)
          `)
          .eq('vendor_id', vendorProfile.id)
          .order('created_at', { ascending: false });
        
        if (reviewsError) throw reviewsError;
        
        // Fetch vendor responses for each review
        const reviewsWithResponses = await Promise.all(reviewsData.map(async (review) => {
          const { data: responsesData, error: responsesError } = await supabase
            .from('vendor_review_responses')
            .select('*')
            .eq('review_id', review.id)
            .order('created_at', { ascending: true });
          
          if (!responsesError && responsesData) {
            return {
              ...review,
              responses: responsesData
            };
          }
          return {
            ...review,
            responses: []
          };
        }));
        
        setReviews(reviewsWithResponses || []);
      } catch (err) {
        console.error('Error fetching vendor reviews:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendorReviews();
  }, [user]);

  const handleReplyClick = (review) => {
    setCurrentReview(review);
    setReplyText('');
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    try {
      if (!currentReview || !replyText.trim()) return;
      
      // Check if there's already a response
      const existingResponse = currentReview.responses && currentReview.responses.length > 0;
      
      if (existingResponse) {
        // Update existing response
        const { error } = await supabase
          .from('vendor_review_responses')
          .update({
            response_text: replyText,
            updated_at: new Date()
          })
          .eq('review_id', currentReview.id)
          .eq('vendor_id', vendorData.id);
        
        if (error) throw error;
      } else {
        // Create new response
        const { error } = await supabase
          .from('vendor_review_responses')
          .insert([
            {
              review_id: currentReview.id,
              vendor_id: vendorData.id,
              response_text: replyText,
              created_at: new Date()
            }
          ]);
        
        if (error) throw error;
      }
      
      // Update local state
      const updatedReviews = reviews.map(review => {
        if (review.id === currentReview.id) {
          const updatedResponses = existingResponse
            ? review.responses.map(resp => ({
                ...resp,
                response_text: replyText,
                updated_at: new Date()
              }))
            : [
                ...review.responses,
                {
                  review_id: review.id,
                  vendor_id: vendorData.id,
                  response_text: replyText,
                  created_at: new Date()
                }
              ];
          
          return {
            ...review,
            responses: updatedResponses
          };
        }
        return review;
      });
      
      setReviews(updatedReviews);
      setReplyDialogOpen(false);
      toast.success(existingResponse ? 'Response updated successfully' : 'Response added successfully');
    } catch (err) {
      console.error('Error saving response:', err);
      setError(err.message);
      toast.error('Failed to save response');
    }
  };

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // 5 stars, 4 stars, 3 stars, 2 stars, 1 star
    
    if (!reviews || reviews.length === 0) return distribution;
    
    reviews.forEach(review => {
      const ratingIndex = Math.min(Math.max(Math.floor(review.rating) - 1, 0), 4);
      distribution[4 - ratingIndex]++; // Reverse the index for display (5 stars first)
    });
    
    return distribution;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!vendorData) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Vendor profile not found. Please complete your vendor registration.
      </Alert>
    );
  }

  const averageRating = calculateAverageRating();
  const ratingDistribution = getRatingDistribution();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Reviews & Ratings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Rating Summary Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rating Summary
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" component="div" sx={{ mr: 1 }}>
                  {averageRating}
                </Typography>
                <Rating 
                  value={parseFloat(averageRating)} 
                  precision={0.1} 
                  readOnly 
                  size="large"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Rating Distribution */}
              <Box>
                {[5, 4, 3, 2, 1].map((star, index) => (
                  <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ minWidth: '60px', display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">{star}</Typography>
                      <StarIcon sx={{ fontSize: 16, ml: 0.5, color: 'primary.main' }} />
                    </Box>
                    <Box sx={{ flexGrow: 1, mx: 1 }}>
                      <Box 
                        sx={{
                          height: 8,
                          bgcolor: 'grey.300',
                          borderRadius: 1,
                          position: 'relative'
                        }}
                      >
                        <Box 
                          sx={{
                            height: '100%',
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                            width: reviews.length > 0 ? `${(ratingDistribution[index] / reviews.length) * 100}%` : '0%'
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2">{ratingDistribution[index]}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reviews List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Reviews
            </Typography>
            
            {reviews.length > 0 ? (
              <List>
                {reviews.map((review) => (
                  <Box key={review.id} sx={{ mb: 3 }}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar src={review.profiles?.avatar_url}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {review.profiles ? `${review.profiles.first_name} ${review.profiles.last_name}` : 'Anonymous'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(review.created_at), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Rating value={review.rating} readOnly size="small" />
                            
                            {review.events && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                                <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {review.events.title} ({review.events.event_type})
                                </Typography>
                              </Box>
                            )}
                            
                            <Typography variant="body1" sx={{ mt: 1 }}>
                              {review.review_text}
                            </Typography>
                            
                            {/* Vendor Response */}
                            {review.responses && review.responses.length > 0 && (
                              <Box sx={{ mt: 2, ml: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Response from {vendorData.company_name}
                                </Typography>
                                <Typography variant="body2">
                                  {review.responses[0].response_text}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {format(new Date(review.responses[0].created_at), 'MMM d, yyyy')}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        startIcon={<ReplyIcon />}
                        onClick={() => handleReplyClick(review)}
                        size="small"
                      >
                        {review.responses && review.responses.length > 0 ? 'Edit Response' : 'Respond'}
                      </Button>
                    </Box>
                    
                    {review !== reviews[reviews.length - 1] && (
                      <Divider sx={{ my: 2 }} />
                    )}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No reviews yet. As you complete bookings, clients will be able to leave reviews here.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentReview?.responses && currentReview.responses.length > 0 ? 'Edit Your Response' : 'Respond to Review'}
        </DialogTitle>
        <DialogContent>
          {currentReview && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>
                  {currentReview.profiles ? `${currentReview.profiles.first_name} ${currentReview.profiles.last_name}` : 'Anonymous'}
                </Typography>
                <Rating value={currentReview.rating} readOnly size="small" />
              </Box>
              
              <Typography variant="body1" paragraph>
                {currentReview.review_text}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Your Response
              </Typography>
              
              <TextField
                multiline
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                fullWidth
                placeholder="Thank you for your feedback..."
                defaultValue={currentReview.responses && currentReview.responses.length > 0 ? currentReview.responses[0].response_text : ''}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitReply}
            variant="contained"
            color="primary"
            disabled={!replyText.trim()}
          >
            {currentReview?.responses && currentReview.responses.length > 0 ? 'Update Response' : 'Post Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorReviewsPage;