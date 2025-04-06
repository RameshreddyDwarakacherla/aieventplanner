import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, TextField, InputAdornment, CircularProgress, Divider, Card, CardContent, CardActions, CardMedia, Rating, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const VendorBooking = ({ eventId, eventDate }) => {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    booking_date: eventDate || new Date(),
    notes: '',
    status: 'requested'
  });

  // Vendor categories
  const vendorCategories = [
    'all',
    'venue',
    'catering',
    'photography',
    'videography',
    'music',
    'decor',
    'transportation',
    'other'
  ];

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [searchTerm, selectedCategory, vendors]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      
      // Fetch verified vendors with their services and reviews
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_services(*),
          vendor_reviews(rating)
        `)
        .eq('is_verified', true);
      
      if (error) throw error;
      
      // Calculate average rating for each vendor
      const vendorsWithRating = data.map(vendor => {
        const reviews = vendor.vendor_reviews || [];
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;
        
        return {
          ...vendor,
          avgRating
        };
      });
      
      setVendors(vendorsWithRating);
      setFilteredVendors(vendorsWithRating);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    let filtered = [...vendors];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.company_name.toLowerCase().includes(term) ||
        vendor.description?.toLowerCase().includes(term) ||
        vendor.vendor_services.some(service => 
          service.service_name.toLowerCase().includes(term) ||
          service.description?.toLowerCase().includes(term)
        )
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(vendor => 
        vendor.vendor_services.some(service => 
          service.category.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }
    
    setFilteredVendors(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleBookVendor = (vendor) => {
    setSelectedVendor(vendor);
    setSelectedService(vendor.vendor_services[0] || null);
    setBookingDialog(true);
  };

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const service = selectedVendor.vendor_services.find(s => s.id === serviceId);
    setSelectedService(service);
  };

  const handleBookingDetailsChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitBooking = async () => {
    if (!selectedVendor || !selectedService) {
      toast.error('Please select a vendor and service');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create booking in Supabase
      const { data, error } = await supabase
        .from('event_vendor_bookings')
        .insert([
          {
            event_id: eventId,
            vendor_id: selectedVendor.id,
            service_id: selectedService.id,
            booking_date: bookingDetails.booking_date,
            notes: bookingDetails.notes,
            status: 'requested',
            price: selectedService.price
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast.success('Booking request sent to vendor');
      setBookingDialog(false);
      
      // Create a budget item for this booking
      const { error: budgetError } = await supabase
        .from('event_budget_items')
        .insert([
          {
            event_id: eventId,
            category: selectedService.category,
            item_name: `${selectedVendor.company_name} - ${selectedService.service_name}`,
            estimated_cost: selectedService.price,
            vendor_id: selectedVendor.id,
            is_paid: false,
            notes: 'Created from vendor booking'
          }
        ]);
      
      if (budgetError) {
        console.error('Error creating budget item:', budgetError);
      }
      
    } catch (err) {
      console.error('Error booking vendor:', err);
      toast.error('Failed to book vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Find and Book Vendors
        </Typography>
      </Box>
      
      {/* Search and Filter */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search vendors or services..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="category-select-label">
                <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filter by Category
              </InputLabel>
              <Select
                labelId="category-select-label"
                value={selectedCategory}
                onChange={handleCategoryChange}
                label="Filter by Category"
              >
                {vendorCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Vendor List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredVendors.length > 0 ? (
        <Grid container spacing={3}>
          {filteredVendors.map((vendor) => (
            <Grid item xs={12} sm={6} md={4} key={vendor.id}>
              <Card elevation={2}>
                {vendor.cover_image ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={vendor.cover_image}
                    alt={vendor.company_name}
                  />
                ) : (
                  <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.light' }}>
                    <StorefrontIcon sx={{ fontSize: 60, color: 'white' }} />
                  </Box>
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {vendor.company_name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={vendor.avgRating} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({vendor.vendor_reviews?.length || 0} reviews)
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {vendor.description || 'No description available'}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Services:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {vendor.vendor_services.slice(0, 3).map((service) => (
                      <Chip 
                        key={service.id} 
                        label={service.service_name} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                    {vendor.vendor_services.length > 3 && (
                      <Chip 
                        label={`+${vendor.vendor_services.length - 3} more`} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    fullWidth
                    startIcon={<EventAvailableIcon />}
                    onClick={() => handleBookVendor(vendor)}
                    disabled={vendor.vendor_services.length === 0}
                  >
                    Book Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No vendors found matching your criteria.
          </Typography>
        </Paper>
      )}
      
      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book Vendor: {selectedVendor?.company_name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="service-select-label">Select Service</InputLabel>
                <Select
                  labelId="service-select-label"
                  value={selectedService?.id || ''}
                  onChange={handleServiceChange}
                  label="Select Service"
                >
                  {selectedVendor?.vendor_services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.service_name} - ${service.price}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {selectedService && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2">
                    Service Details:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedService.description || 'No description available'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      Category: {selectedService.category}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Price: ${selectedService.price}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes for Vendor"
                name="notes"
                value={bookingDetails.notes}
                onChange={handleBookingDetailsChange}
                placeholder="Describe any specific requirements or questions for the vendor"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitBooking} 
            variant="contained" 
            color="primary"
            disabled={loading || !selectedService}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Booking Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorBooking;