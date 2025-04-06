import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Divider, Chip, CircularProgress, Alert, List, ListItem, ListItemText, ListItemIcon, Rating } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventIcon from '@mui/icons-material/Event';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';

const VendorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendorData, setVendorData] = useState(null);
  const [stats, setStats] = useState({
    totalServices: 0,
    totalBookings: 0,
    pendingBookings: 0,
    avgRating: 0
  });
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);

        if (!user) return;

        console.log('Fetching vendor profile for user:', user.id);

        // Fetch vendor profile
        const { data: vendorProfile, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (vendorError) {
          if (vendorError.code === 'PGRST116') { // No rows returned
            console.log('No vendor profile found, creating one...');

            // Create a vendor profile
            const { data: newVendor, error: createError } = await supabase
              .from('vendors')
              .insert([
                {
                  user_id: user.id,
                  company_name: 'New Vendor', // Default name
                  vendor_type: 'General', // Default type
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  is_verified: false
                }
              ])
              .select()
              .single();

            if (createError) {
              throw createError;
            }

            console.log('Vendor profile created:', newVendor);
            setVendorData(newVendor);
          } else {
            throw vendorError;
          }
        } else {
          console.log('Vendor profile found:', vendorProfile.id);
          setVendorData(vendorProfile);
        }

        // Fetch vendor services
        const { data: servicesData, error: servicesError } = await supabase
          .from('vendor_services')
          .select('*')
          .eq('vendor_id', vendorProfile.id);

        if (servicesError) throw servicesError;

        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('event_vendor_bookings')
          .select('*, events(title, start_date)')
          .eq('vendor_id', vendorProfile.id)
          .order('booking_date', { ascending: true });

        if (bookingsError) throw bookingsError;

        // Calculate booking statistics
        const pendingBookings = bookingsData.filter(booking => booking.status === 'requested');

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('vendor_reviews')
          .select('*, profiles(first_name, last_name)')
          .eq('vendor_id', vendorProfile.id)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        // Calculate average rating
        const avgRating = reviewsData.length > 0
          ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
          : 0;

        setStats({
          totalServices: servicesData.length,
          totalBookings: bookingsData.length,
          pendingBookings: pendingBookings.length,
          avgRating: avgRating
        });

        setBookings(pendingBookings.slice(0, 3)); // Show only 3 pending bookings
        setReviews(reviewsData.slice(0, 3)); // Show only 3 recent reviews
      } catch (err) {
        console.error('Error fetching vendor data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [user]);

  const handleAddService = () => {
    navigate('/vendor/services/add');
  };

  const handleViewBooking = (bookingId) => {
    navigate(`/vendor/bookings/${bookingId}`);
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('event_vendor_bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;

      // Update the bookings list
      setBookings(bookings.filter(booking => booking.id !== bookingId));

      // Update pending bookings count
      setStats(prev => ({
        ...prev,
        pendingBookings: prev.pendingBookings - 1
      }));
    } catch (err) {
      console.error('Error accepting booking:', err);
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

  if (!vendorData) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Vendor profile not found. Please complete your vendor registration.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Vendor Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddService}
        >
          Add New Service
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {!vendorData.is_verified && (
        <Alert severity="info" sx={{ mb: 4 }}>
          Your vendor account is pending verification. Some features may be limited until verification is complete.
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorefrontIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Services</Typography>
              </Box>
              <Typography variant="h3">{stats.totalServices}</Typography>
              <Button
                variant="text"
                onClick={() => navigate('/vendor/services')}
                sx={{ mt: 1 }}
              >
                Manage Services
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Bookings</Typography>
              </Box>
              <Typography variant="h3">{stats.totalBookings}</Typography>
              <Button
                variant="text"
                onClick={() => navigate('/vendor/bookings')}
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
                <PendingIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending</Typography>
              </Box>
              <Typography variant="h3">{stats.pendingBookings}</Typography>
              <Button
                variant="text"
                onClick={() => navigate('/vendor/bookings?filter=pending')}
                sx={{ mt: 1 }}
                disabled={stats.pendingBookings === 0}
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
                <StarIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Rating</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" sx={{ mr: 1 }}>
                  {stats.avgRating.toFixed(1)}
                </Typography>
                <Rating value={stats.avgRating} precision={0.5} readOnly />
              </Box>
              <Button
                variant="text"
                onClick={() => navigate('/vendor/reviews')}
                sx={{ mt: 1 }}
              >
                View Reviews
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Pending Bookings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Pending Bookings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {bookings.length > 0 ? (
                <List>
                  {bookings.map((booking) => (
                    <ListItem
                      key={booking.id}
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
                          onClick={() => handleAcceptBooking(booking.id)}
                        >
                          Accept
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <EventIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={booking.events?.title || 'Unknown event'}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {booking.events?.start_date ? format(new Date(booking.events.start_date), 'MMM d, yyyy') : 'No date'}
                            </Typography>
                            <Chip
                              label={`$${booking.price || 'Price TBD'}`}
                              size="small"
                              color="primary"
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
                    No pending bookings
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Reviews */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Recent Reviews
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {reviews.length > 0 ? (
                <List>
                  {reviews.map((review) => (
                    <ListItem
                      key={review.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" component="span">
                              {review.profiles?.first_name} {review.profiles?.last_name}
                            </Typography>
                            <Rating
                              value={review.rating}
                              size="small"
                              readOnly
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {review.review_text}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    No reviews yet
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

export default VendorDashboard;