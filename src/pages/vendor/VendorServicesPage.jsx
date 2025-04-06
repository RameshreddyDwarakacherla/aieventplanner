import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Paper,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'starting_at', label: 'Starting At' },
  { value: 'per_person', label: 'Per Person' },
  { value: 'hourly', label: 'Hourly Rate' }
];

const VendorServicesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vendorData, setVendorData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    price_type: 'fixed',
    is_available: true,
    category: 'General' // Default category
  });

  useEffect(() => {
    const fetchVendorServices = async () => {
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

        // Fetch vendor services
        const { data: servicesData, error: servicesError } = await supabase
          .from('vendor_services')
          .select('*')
          .eq('vendor_id', vendorProfile.id)
          .order('service_name', { ascending: true }); // Using service_name instead of name

        if (servicesError) throw servicesError;

        setServices(servicesData || []);
      } catch (err) {
        console.error('Error fetching vendor services:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorServices();
  }, [user]);

  const handleAddService = () => {
    setCurrentService(null);
    setServiceForm({
      name: '',
      description: '',
      price: '',
      price_type: 'fixed',
      is_available: true,
      category: 'General'
    });
    setDialogOpen(true);
  };

  const handleEditService = (service) => {
    setCurrentService(service);
    setServiceForm({
      name: service.name || service.service_name || service.title,
      description: service.description || '',
      price: service.price ? service.price.toString() : '',
      price_type: service.price_type || 'fixed',
      is_available: service.is_available,
      category: service.category || 'General'
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (service) => {
    setCurrentService(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteService = async () => {
    try {
      if (!currentService) return;

      const { error } = await supabase
        .from('vendor_services')
        .delete()
        .eq('id', currentService.id);

      if (error) throw error;

      setServices(services.filter(service => service.id !== currentService.id));
      setDeleteDialogOpen(false);
      toast.success('Service deleted successfully');
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err.message);
      toast.error('Failed to delete service');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setServiceForm({
      ...serviceForm,
      [name]: name === 'is_available' ? checked : value
    });
  };

  const handleSubmitService = async () => {
    try {
      if (!vendorData) return;

      // Validate form
      if (!serviceForm.name) {
        toast.error('Service name is required');
        return;
      }

      // Create service data object with required fields
      const serviceData = {
        vendor_id: vendorData.id,
        service_name: serviceForm.name, // Required field
        title: serviceForm.name, // Required field
        category: serviceForm.category || 'General', // Required field
        description: serviceForm.description,
        price: serviceForm.price ? parseFloat(serviceForm.price) : null,
        price_type: serviceForm.price_type,
        is_available: serviceForm.is_available,
        updated_at: new Date()
      };

      // Log the service data for debugging
      console.log('Service data:', serviceData);

      let result;
      if (currentService) {
        // Update existing service
        result = await supabase
          .from('vendor_services')
          .update(serviceData)
          .eq('id', currentService.id);
      } else {
        // Create new service
        serviceData.created_at = new Date();
        result = await supabase
          .from('vendor_services')
          .insert([serviceData]);
      }

      if (result.error) throw result.error;

      // Refresh services list
      const { data: updatedServices, error: fetchError } = await supabase
        .from('vendor_services')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('service_name', { ascending: true }); // Using service_name instead of name

      if (fetchError) throw fetchError;

      setServices(updatedServices);
      setDialogOpen(false);
      toast.success(`Service ${currentService ? 'updated' : 'added'} successfully`);
    } catch (err) {
      console.error('Error saving service:', err);
      setError(err.message);
      toast.error('Failed to save service');
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
          Manage Services
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
          Your vendor account is pending verification. Your services will be visible to users once your account is verified by an admin.
        </Alert>
      )}

      {/* Services List */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="services table">
            <TableHead>
              <TableRow>
                <TableCell>Service Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.service_name}</TableCell>
                    <TableCell>
                      {service.description ? (
                        service.description.length > 100
                          ? `${service.description.substring(0, 100)}...`
                          : service.description
                      ) : (
                        <Typography variant="body2" color="text.secondary">No description</Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatPrice(service.price, service.price_type)}</TableCell>
                    <TableCell>
                      <Chip
                        label={service.is_available ? 'Available' : 'Unavailable'}
                        color={service.is_available ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditService(service)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(service)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No services found. Click "Add New Service" to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Service Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentService ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Service Name"
                name="name"
                value={serviceForm.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Price"
                name="price"
                type="number"
                value={serviceForm.price}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Price Type"
                name="price_type"
                value={serviceForm.price_type}
                onChange={handleInputChange}
                fullWidth
              >
                {PRICE_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Category"
                name="category"
                select
                value={serviceForm.category}
                onChange={handleInputChange}
                fullWidth
                required
              >
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Catering">Catering</MenuItem>
                <MenuItem value="Venue">Venue</MenuItem>
                <MenuItem value="Photography">Photography</MenuItem>
                <MenuItem value="Decoration">Decoration</MenuItem>
                <MenuItem value="Entertainment">Entertainment</MenuItem>
                <MenuItem value="Transportation">Transportation</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={serviceForm.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={serviceForm.is_available}
                    onChange={handleInputChange}
                    name="is_available"
                    color="primary"
                  />
                }
                label="Service is currently available"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitService}
            variant="contained"
            color="primary"
          >
            {currentService ? 'Save Changes' : 'Add Service'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the service "{currentService?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteService} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorServicesPage;