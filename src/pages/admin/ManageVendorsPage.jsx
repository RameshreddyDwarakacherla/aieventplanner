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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  Tabs,
  Tab,
  InputAdornment,
  Rating,
  Divider,
  List
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const VENDOR_TYPES = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Florist',
  'Music/DJ',
  'Decor',
  'Wedding Planner',
  'Bakery',
  'Transportation',
  'Rentals',
  'Lighting',
  'Entertainment',
  'Invitations',
  'Officiant',
  'Other'
];

const ManageVendorsPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [vendorServices, setVendorServices] = useState([]);
  const [vendorReviews, setVendorReviews] = useState([]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is admin using the userRole from context
        if (userRole !== 'admin') {
          throw new Error('You do not have admin privileges');
        }

        fetchVendors();
      } catch (err) {
        console.error('Error checking admin access:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (user) {
      checkAdminAccess();
    }
  }, [user, userRole]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      console.log('Fetching vendors from database...');

      // Fetch all vendors with user profiles
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select(`
          *,
          profiles:user_id(id, email, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (vendorsError) throw vendorsError;

      console.log('Vendors data received:', vendorsData);

      // Make sure boolean values are properly parsed
      const processedVendors = vendorsData?.map(vendor => {
        // Check the raw value for debugging
        console.log(`Vendor ${vendor.company_name} is_verified raw value:`, vendor.is_verified, 'type:', typeof vendor.is_verified);

        // Force boolean conversion
        const isVerified = vendor.is_verified === true ||
                          vendor.is_verified === 'true' ||
                          vendor.is_verified === 't' ||
                          vendor.is_verified === 1 ||
                          vendor.is_verified === '1';

        console.log(`Vendor ${vendor.company_name} is_verified parsed to:`, isVerified);

        return {
          ...vendor,
          is_verified: isVerified,
        };
      }) || [];

      console.log('Processed vendors data:', processedVendors);

      setVendors(processedVendors);
      setFilteredVendors(processedVendors);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterVendors(newValue, searchQuery);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    filterVendors(tabValue, query);
  };

  const filterVendors = (tabIndex, query) => {
    console.log('Filtering vendors. Tab:', tabIndex, 'Query:', query);
    console.log('Current vendors state:', vendors);

    let filtered = vendors;

    // Filter by verification status based on tab
    if (tabIndex === 1) { // Pending verification
      console.log('Filtering for pending vendors');
      filtered = vendors.filter(vendor => {
        console.log('Vendor:', vendor.company_name, 'is_verified:', vendor.is_verified, 'type:', typeof vendor.is_verified);
        return !vendor.is_verified;
      });
    } else if (tabIndex === 2) { // Verified
      console.log('Filtering for verified vendors');
      filtered = vendors.filter(vendor => {
        console.log('Vendor:', vendor.company_name, 'is_verified:', vendor.is_verified, 'type:', typeof vendor.is_verified);
        return vendor.is_verified;
      });
    }

    // Filter by search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(vendor =>
        (vendor.company_name && vendor.company_name.toLowerCase().includes(lowercaseQuery)) ||
        (vendor.vendor_type && vendor.vendor_type.toLowerCase().includes(lowercaseQuery)) ||
        (vendor.profiles?.email && vendor.profiles.email.toLowerCase().includes(lowercaseQuery)) ||
        (vendor.profiles?.first_name && vendor.profiles.first_name.toLowerCase().includes(lowercaseQuery)) ||
        (vendor.profiles?.last_name && vendor.profiles.last_name.toLowerCase().includes(lowercaseQuery))
      );
    }

    setFilteredVendors(filtered);
  };

  const handleViewDetails = async (vendor) => {
    try {
      setCurrentVendor(vendor);
      setLoading(true);

      // Fetch vendor services
      const { data: servicesData, error: servicesError } = await supabase
        .from('vendor_services')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('service_name', { ascending: true });

      if (servicesError) throw servicesError;

      // Fetch vendor reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('vendor_reviews')
        .select(`
          *,
          profiles:user_id(first_name, last_name)
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      setVendorServices(servicesData || []);
      setVendorReviews(reviewsData || []);
      setDetailsDialogOpen(true);
    } catch (err) {
      console.error('Error fetching vendor details:', err);
      toast.error('Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = (vendor) => {
    setCurrentVendor(vendor);
    setVerifyDialogOpen(true);
  };

  const handleBlockClick = (vendor) => {
    setCurrentVendor(vendor);
    setBlockDialogOpen(true);
  };

  const handleVerifyVendor = async () => {
    try {
      if (!currentVendor) return;

      console.log('Verifying vendor:', currentVendor.id, currentVendor.company_name);

      // Force a direct update to the database
      console.log('Current vendor before update:', currentVendor);

      // First, check the current status in the database
      const { data: checkData, error: checkError } = await supabase
        .from('vendors')
        .select('is_verified')
        .eq('id', currentVendor.id)
        .single();

      if (checkError) throw checkError;
      console.log('Current status in database:', checkData);

      // Use RPC call to ensure the update is properly executed
      // This bypasses any potential issues with the mock admin ID
      const { data, error } = await supabase.rpc('verify_vendor', {
        vendor_id: currentVendor.id
      });

      // If RPC doesn't exist or fails, fall back to direct update
      if (error) {
        console.log('RPC failed, falling back to direct update:', error);

        // Now update with explicit boolean true using direct SQL
        const { data: updateData, error: updateError } = await supabase
          .from('vendors')
          .update({
            is_verified: true,  // Explicitly set to boolean true
            updated_at: new Date().toISOString()
          })
          .eq('id', currentVendor.id);

        if (updateError) throw updateError;
        console.log('Direct update response:', updateData);

        // Verify the update was successful
        const { data: verifyData, error: verifyError } = await supabase
          .from('vendors')
          .select('is_verified')
          .eq('id', currentVendor.id)
          .single();

        if (verifyError) throw verifyError;
        console.log('Verification check after update:', verifyData);

        if (!verifyData.is_verified) {
          throw new Error('Update failed to persist in the database');
        }
      } else {
        console.log('RPC response:', data);
      }

      // Update local state immediately with a deep clone to force re-render
      const updatedVendor = { ...currentVendor, is_verified: true };
      console.log('Updated vendor object:', updatedVendor);

      setVendors(prevVendors => {
        const newVendors = prevVendors.map(vendor =>
          vendor.id === currentVendor.id ? updatedVendor : vendor
        );
        console.log('New vendors state:', newVendors);
        return newVendors;
      });

      setFilteredVendors(prevVendors => {
        const newFilteredVendors = prevVendors.map(vendor =>
          vendor.id === currentVendor.id ? updatedVendor : vendor
        );
        console.log('New filtered vendors state:', newFilteredVendors);
        return newFilteredVendors;
      });

      // Also update currentVendor
      setCurrentVendor(updatedVendor);

      // Close dialog first for better UX
      setVerifyDialogOpen(false);
      toast.success('Vendor verified successfully');

      // Refresh vendor list from the server after a short delay
      setTimeout(() => {
        fetchVendors();
      }, 1000);
    } catch (err) {
      console.error('Error verifying vendor:', err);
      setError(err.message);
      toast.error('Failed to verify vendor: ' + err.message);
    }
  };

  const handleBlockVendor = async () => {
    try {
      if (!currentVendor) return;

      // Update vendor status
      const { error: vendorError } = await supabase
        .from('vendors')
        .update({
          is_verified: false,
          updated_at: new Date()
        })
        .eq('id', currentVendor.id);

      if (vendorError) throw vendorError;

      // Update user status
      const { error: userError } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          updated_at: new Date()
        })
        .eq('id', currentVendor.profiles.id);

      if (userError) throw userError;

      // Update local state immediately
      setVendors(prevVendors =>
        prevVendors.map(vendor =>
          vendor.id === currentVendor.id
            ? {
                ...vendor,
                is_verified: false,
                profiles: {
                  ...vendor.profiles,
                  is_active: false
                }
              }
            : vendor
        )
      );

      setFilteredVendors(prevVendors =>
        prevVendors.map(vendor =>
          vendor.id === currentVendor.id
            ? {
                ...vendor,
                is_verified: false,
                profiles: {
                  ...vendor.profiles,
                  is_active: false
                }
              }
            : vendor
        )
      );

      // Also update currentVendor
      setCurrentVendor(prev => ({
        ...prev,
        is_verified: false,
        profiles: {
          ...prev.profiles,
          is_active: false
        }
      }));

      // Refresh vendor list from the server
      fetchVendors();
      setBlockDialogOpen(false);
      toast.success('Vendor blocked successfully');
    } catch (err) {
      console.error('Error blocking vendor:', err);
      setError(err.message);
      toast.error('Failed to block vendor');
    }
  };

  const formatPrice = (price, priceType) => {
    if (!price) return 'Contact for pricing';

    switch (priceType) {
      case 'fixed':
        return `$${price.toFixed(2)}`;
      case 'starting_at':
        return `Starting at $${price.toFixed(2)}`;
      case 'per_person':
        return `$${price.toFixed(2)} per person`;
      case 'hourly':
        return `$${price.toFixed(2)}/hour`;
      default:
        return `$${price.toFixed(2)}`;
    }
  };

  if (loading && vendors.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Vendors
      </Typography>

      {/* Filters and Search */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="vendor filter tabs">
              <Tab label="All Vendors" />
              <Tab label="Pending Verification" />
              <Tab label="Verified Vendors" />
            </Tabs>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="small"
              />
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  console.log('Force refreshing data...');
                  fetchVendors();
                  toast.info('Data refreshed');
                }}
                sx={{ minWidth: '100px' }}
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Vendors Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="vendors table">
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <StorefrontIcon />
                        </Avatar>
                        <Typography>
                          {vendor.company_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{vendor.vendor_type}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {vendor.profiles?.first_name} {vendor.profiles?.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vendor.profiles?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {/* Debug info */}
                      {console.log('Rendering vendor status:', vendor.id, vendor.company_name, 'is_verified:', vendor.is_verified)}
                      <Chip
                        icon={vendor.is_verified ? <VerifiedIcon /> : <PendingIcon />}
                        label={vendor.is_verified ? 'Verified' : 'Pending'}
                        color={vendor.is_verified ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {vendor.created_at ? format(new Date(vendor.created_at), 'MMM d, yyyy') : 'Unknown'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewDetails(vendor)}
                        size="small"
                        title="View Details"
                      >
                        <VisibilityIcon />
                      </IconButton>

                      {!vendor.is_verified && (
                        <IconButton
                          color="success"
                          onClick={() => handleVerifyClick(vendor)}
                          size="small"
                          title="Verify Vendor"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}

                      <IconButton
                        color="error"
                        onClick={() => handleBlockClick(vendor)}
                        size="small"
                        title="Block Vendor"
                      >
                        <BlockIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No vendors found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Vendor Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Vendor Details
        </DialogTitle>
        <DialogContent>
          {currentVendor && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Vendor Profile */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                          <StorefrontIcon fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {currentVendor.company_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {currentVendor.vendor_type}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Rating value={currentVendor.avg_rating || 0} precision={0.5} readOnly size="small" />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              {currentVendor.avg_rating ? `${currentVendor.avg_rating.toFixed(1)} stars` : 'No ratings yet'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Chip
                        icon={currentVendor.is_verified ? <VerifiedIcon /> : <PendingIcon />}
                        label={currentVendor.is_verified ? 'Verified' : 'Pending Verification'}
                        color={currentVendor.is_verified ? 'success' : 'warning'}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Contact Person
                        </Typography>
                        <Typography variant="body1">
                          {currentVendor.profiles?.first_name} {currentVendor.profiles?.last_name}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {currentVendor.profiles?.email}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {currentVendor.description || 'No description provided'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body1">
                          {currentVendor.address ? (
                            <>
                              {currentVendor.address}<br />
                              {currentVendor.city}{currentVendor.state ? `, ${currentVendor.state}` : ''} {currentVendor.zip_code}
                            </>
                          ) : (
                            'No address provided'
                          )}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Website
                        </Typography>
                        <Typography variant="body1">
                          {currentVendor.website ? (
                            <a href={currentVendor.website} target="_blank" rel="noopener noreferrer">
                              {currentVendor.website}
                            </a>
                          ) : (
                            'No website provided'
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Services */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Services ({vendorServices.length})
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {vendorServices.length > 0 ? (
                    <List dense>
                      {vendorServices.map((service) => (
                        <Box key={service.id} sx={{ mb: 2 }}>
                          <Typography variant="subtitle1">
                            {service.service_name || service.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {service.description || 'No description'}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">
                              {service.price ? formatPrice(service.price, service.price_type) : 'Contact for pricing'}
                            </Typography>
                            <Chip
                              label={service.is_available ? 'Available' : 'Unavailable'}
                              color={service.is_available ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                          {service !== vendorServices[vendorServices.length - 1] && <Divider sx={{ my: 2 }} />}
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No services listed
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Reviews */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Reviews ({vendorReviews.length})
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {vendorReviews.length > 0 ? (
                    <List dense>
                      {vendorReviews.map((review) => (
                        <Box key={review.id} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                {review.profiles?.first_name ? review.profiles.first_name[0] : 'U'}
                              </Avatar>
                              <Typography variant="subtitle2">
                                {review.profiles ? `${review.profiles.first_name} ${review.profiles.last_name}` : 'Anonymous'}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(review.created_at), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                          <Rating value={review.rating} readOnly size="small" sx={{ mt: 1 }} />
                          <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                            {review.review_text || 'No comment provided'}
                          </Typography>
                          {review !== vendorReviews[vendorReviews.length - 1] && <Divider sx={{ my: 2 }} />}
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No reviews yet
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {currentVendor && !currentVendor.is_verified && (
            <Button
              onClick={() => {
                setDetailsDialogOpen(false);
                handleVerifyClick(currentVendor);
              }}
              color="success"
              variant="contained"
            >
              Verify Vendor
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Verify Vendor Dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)}>
        <DialogTitle>Confirm Verification</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to verify {currentVendor?.company_name}?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will allow them to be visible to users and receive bookings.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleVerifyVendor} color="success" variant="contained">
            Verify Vendor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block Vendor Dialog */}
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
        <DialogTitle>Confirm Block</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to block {currentVendor?.company_name}?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will remove their verification status and prevent them from logging in.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBlockVendor} color="error">
            Block Vendor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageVendorsPage;