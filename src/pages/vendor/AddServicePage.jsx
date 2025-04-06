import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const AddServicePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    price_type: 'fixed',
    is_available: true,
    category: 'General' // Default category
  });

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        setLoading(true);

        if (!user) return;

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
      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setServiceForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vendorData) {
      toast.error('Vendor profile not found');
      return;
    }

    // Validate form
    if (!serviceForm.name) {
      toast.error('Service name is required');
      return;
    }

    try {
      setSaving(true);

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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Log the service data for debugging
      console.log('Adding service with data:', serviceData);

      // Create new service
      const { data, error } = await supabase
        .from('vendor_services')
        .insert([serviceData])
        .select();

      if (error) throw error;

      toast.success('Service added successfully!');
      navigate('/vendor/services');
    } catch (err) {
      console.error('Error adding service:', err);
      setError(err.message);
      toast.error('Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/vendor/services');
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
      <Typography variant="h4" component="h1" gutterBottom>
        Add New Service
      </Typography>

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

      <Paper sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Service Name"
                name="name"
                value={serviceForm.name}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="Enter a clear, descriptive name for your service"
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
                helperText="Leave blank if price varies or is to be discussed"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Price Type"
                name="price_type"
                select
                value={serviceForm.price_type}
                onChange={handleInputChange}
                fullWidth
                helperText="How is this service priced?"
              >
                <MenuItem value="fixed">Fixed Price</MenuItem>
                <MenuItem value="starting_at">Starting At</MenuItem>
                <MenuItem value="per_person">Per Person</MenuItem>
                <MenuItem value="hourly">Hourly Rate</MenuItem>
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
                helperText="Select a category for your service"
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
                helperText="Describe your service in detail, including what's included and any special features"
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

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Add Service'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AddServicePage;
