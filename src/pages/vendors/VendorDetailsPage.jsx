import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Paper,
  Rating,
  Avatar,
  CircularProgress
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import StarIcon from '@mui/icons-material/Star';
import BusinessIcon from '@mui/icons-material/Business';

const VendorDetailsPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchVendorDetails();
  }, [vendorId]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);

      // Fetch vendor details
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();
      
      if (vendorError) throw vendorError;
      if (!vendorData) throw new Error('Vendor not found');
      
      setVendor(vendorData);
      
      // Fetch vendor services
      const { data: servicesData, error: servicesError } = await supabase
        .from('vendor_services')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('price', { ascending: true });
      
      if (servicesError) throw servicesError;
      setServices(servicesData || []);
      
      // Fetch vendor reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('vendor_reviews')
        .select('*, profiles(first_name, last_name)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);
      
    } catch (err) {
      console.error('Error fetching vendor details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (service) => {
    setSelectedService(service);
    setBookingModalOpen(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login', { state: { from: `/vendors/${vendorId}` } });
      return;
    }
    
    try {
      setSubmitLoading(true);
      
      const bookingData = {
        user_id: user.id,
        vendor_id: vendorId,
        service_id: selectedService.id,
        requested_date: bookingDate,
        notes: bookingNotes,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      const { error: bookingError } = await supabase
        .from('vendor_bookings')
        .insert(bookingData);
      
      if (bookingError) throw bookingError;
      
      alert('Booking request sent successfully!');
      setBookingModalOpen(false);
      setBookingDate('');
      setBookingNotes('');
      
    } catch (err) {
      console.error('Error submitting booking:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading vendor details...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !vendor) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper 
          elevation={1} 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            borderRadius: 2,
            bgcolor: 'error.light'
          }}
        >
          <Typography variant="h5" color="error.main" gutterBottom>
            {error || 'Vendor not found'}
          </Typography>
          <Button
            component={Link}
            to="/vendors"
            variant="contained"
            color="primary"
          >
            Back to Vendors
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Typography 
          component={Link} 
          to="/" 
          variant="body2" 
          color="text.secondary"
          sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
        >
          Home
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>/</Typography>
        <Typography 
          component={Link} 
          to="/vendors" 
          variant="body2" 
          color="text.secondary"
          sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
        >
          Vendors
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>/</Typography>
        <Typography variant="body2" color="text.primary">
          {vendor.company_name || vendor.name}
        </Typography>
      </Box>

      {/* Vendor Header */}
      <Card sx={{ mb: 4, overflow: 'hidden', borderRadius: 2 }}>
        <Grid container>
          <Grid item xs={12} md={4}>
            <CardMedia
              component="img"
              sx={{ 
                height: 200,
                objectFit: 'cover'
              }}
              image={vendor.image_url || `https://source.unsplash.com/random/300x200/?${vendor.vendor_type?.toLowerCase() || 'business'}`}
              alt={vendor.company_name || vendor.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x200?text=Vendor';
              }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                  {vendor.company_name || vendor.name}
                </Typography>
                <Chip 
                  label={vendor.vendor_type || vendor.category || 'Vendor'} 
                  color="primary" 
                  variant="outlined"
                  size="medium"
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating 
                  value={vendor.rating || 4} 
                  precision={0.5} 
                  readOnly 
                  emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({vendor.rating || 4}) · {reviews.length || 0} reviews
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOnIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {vendor.location || 'Location not specified'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BusinessIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {vendor.years_in_business || 5} years in business
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => document.getElementById('services-section').scrollIntoView({ behavior: 'smooth' })}
                sx={{ mt: 1 }}
              >
                View Services
              </Button>
            </CardContent>
          </Grid>
        </Grid>
      </Card>

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Left Column - Vendor Info */}
        <Grid item xs={12} md={8}>
          {/* About Section */}
          <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
              About {vendor.company_name || vendor.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {vendor.description || 'No description available for this vendor.'}
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Contact Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 1.5, width: 32, height: 32 }}>
                      <EmailIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2">
                      {vendor.email || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 1.5, width: 32, height: 32 }}>
                      <PhoneIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2">
                      {vendor.phone || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 1.5, width: 32, height: 32 }}>
                      <LanguageIcon fontSize="small" />
                    </Avatar>
                    {vendor.website ? (
                      <Button 
                        variant="text" 
                        color="primary" 
                        href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{ p: 0, textTransform: 'none' }}
                      >
                        {vendor.website.replace(/^https?:\/\//, '')}
                      </Button>
                    ) : (
                      <Typography variant="body2">Not provided</Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Business Details
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 1.5, width: 32, height: 32 }}>
                      <BusinessIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2">
                      Established {vendor.established_year || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 1.5, width: 32, height: 32 }}>
                      <BusinessIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2">
                      Team Size: {vendor.team_size || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: vendor.insurance ? 'success.main' : 'error.main',
                        mr: 1.5
                      }}
                    >
                      {vendor.insurance ? '✓' : '✗'}
                    </Avatar>
                    <Typography variant="body2">
                      Insurance: {vendor.insurance ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Location Map */}
            <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <Paper 
                elevation={1} 
                sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  width: { xs: '100%', md: '50%' },
                  height: '200px'
                }}
              >
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(vendor.location || '')}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map of ${vendor.company_name || vendor.name} location`}
                ></iframe>
              </Paper>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    {vendor.location || 'Location not specified'}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  href={`https://maps.google.com/?q=${encodeURIComponent(vendor.location || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 1, alignSelf: 'flex-start' }}
                >
                  Get Directions
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Services Section */}
          <Paper id="services-section" elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2, scrollMarginTop: '1rem' }}>
            <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
              Services Offered
            </Typography>
            
            {services.length > 0 ? (
              <Grid container spacing={2}>
                {services.map((service) => (
                  <Grid item xs={12} sm={6} key={service.id}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          boxShadow: 3,
                          borderColor: 'primary.main' 
                        }
                      }}
                    >
                      <Typography variant="h6" component="h3" gutterBottom>
                        {service.title || service.service_name || service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                        {service.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          ${service.price}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            /{service.price_type || 'fixed'}
                          </Typography>
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="primary"
                          size="small"
                          onClick={() => handleBookService(service)}
                        >
                          Book Now
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No services listed for this vendor.
              </Typography>
            )}
          </Paper>
          
          {/* Reviews Section */}
          <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
              Customer Reviews
            </Typography>
            
            {reviews.length > 0 ? (
              <Box>
                {reviews.map((review) => (
                  <Box 
                    key={review.id} 
                    sx={{ 
                      mb: 3, 
                      pb: 3, 
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': {
                        mb: 0,
                        pb: 0,
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1.5, bgcolor: 'primary.main' }}>
                          {review.profiles?.first_name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {review.profiles?.first_name} {review.profiles?.last_name?.charAt(0) || ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(review.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {review.comment}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No reviews for this vendor yet.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Booking & AI Recommendations */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2, position: 'sticky', top: '1rem' }}>
            <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
              Book This Vendor
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ready to work with {vendor.company_name || vendor.name}? Select a service above or contact them directly.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => document.getElementById('services-section').scrollIntoView({ behavior: 'smooth' })}
              >
                View Services
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                component="a"
                href={`mailto:${vendor.email}`}
                disabled={!vendor.email}
              >
                Contact via Email
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                component="a"
                href={`tel:${vendor.phone}`}
                disabled={!vendor.phone}
              >
                Call Vendor
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Book Service</h2>
                <button
                  onClick={() => setBookingModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">{selectedService?.title || selectedService?.service_name || selectedService?.name}</h3>
                <p className="text-gray-600 mb-2">{selectedService?.description}</p>
                <p className="text-purple-700 font-bold">
                  ${selectedService?.price} <span className="text-sm text-gray-500 font-normal">{selectedService?.price_type || 'fixed'}</span>
                </p>
              </div>

              <form onSubmit={handleSubmitBooking}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Preferred Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Additional Notes</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg h-32"
                    placeholder="Tell the vendor about your event, specific requirements, or questions..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="mr-3 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center"
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : 'Send Booking Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default VendorDetailsPage;
