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
  Avatar,
  Paper,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BusinessIcon from '@mui/icons-material/Business';
import { toast } from 'react-toastify';

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

const VendorProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [formData, setFormData] = useState({
    company_name: '',
    vendor_type: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: ''
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
        
        if (vendorError) throw vendorError;
        
        setVendorData(vendorProfile);
        setFormData({
          company_name: vendorProfile.company_name || '',
          vendor_type: vendorProfile.vendor_type || '',
          description: vendorProfile.description || '',
          address: vendorProfile.address || '',
          city: vendorProfile.city || '',
          state: vendorProfile.state || '',
          zip_code: vendorProfile.zip_code || '',
          website: vendorProfile.website || ''
        });

        // Fetch user profile for avatar
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        if (!profileError && userProfile) {
          setAvatarUrl(userProfile.avatar_url || '');
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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      if (!vendorData) return;

      const { error } = await supabase
        .from('vendors')
        .update({
          company_name: formData.company_name,
          vendor_type: formData.vendor_type,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          website: formData.website,
          updated_at: new Date()
        })
        .eq('id', vendorData.id);
      
      if (error) throw error;
      
      setVendorData({
        ...vendorData,
        ...formData
      });
      
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating vendor profile:', err);
      setError(err.message);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(avatarUrl);
      setAvatarDialogOpen(false);
      toast.success('Avatar updated successfully');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error('Failed to upload avatar');
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
      <Typography variant="h4" component="h1" gutterBottom>
        Vendor Profile
      </Typography>

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

      <Grid container spacing={4}>
        {/* Profile Summary Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={avatarUrl}
                  alt={formData.company_name}
                  sx={{ width: 120, height: 120, mb: 2, mx: 'auto' }}
                >
                  {!avatarUrl && <BusinessIcon sx={{ fontSize: 60 }} />}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper'
                  }}
                  onClick={() => setAvatarDialogOpen(true)}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </Box>
              
              <Typography variant="h5" gutterBottom>
                {formData.company_name}
              </Typography>
              
              <Chip
                label={formData.vendor_type}
                color="primary"
                sx={{ mb: 2 }}
              />
              
              {vendorData.is_verified ? (
                <Chip
                  label="Verified Vendor"
                  color="success"
                  sx={{ ml: 1 }}
                />
              ) : (
                <Chip
                  label="Pending Verification"
                  color="warning"
                  sx={{ ml: 1 }}
                />
              )}
              
              <Typography variant="body1" color="text.secondary" paragraph>
                {formData.description || 'No description provided'}
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
                fullWidth
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {editing ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Edit Profile
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Company Name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Vendor Type"
                      name="vendor_type"
                      value={formData.vendor_type}
                      onChange={handleInputChange}
                      fullWidth
                      required
                    >
                      {VENDOR_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      fullWidth
                      multiline
                      rows={4}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="State"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="ZIP Code"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleInputChange}
                      fullWidth
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : null}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Business Information
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Company Name
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formData.company_name}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Vendor Type
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formData.vendor_type}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formData.description || 'No description provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Website
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formData.website ? (
                        <a href={formData.website} target="_blank" rel="noopener noreferrer">
                          {formData.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Location
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formData.address || 'Not provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      City
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formData.city || 'Not provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      State
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formData.state || 'Not provided'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ZIP Code
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formData.zip_code || 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)}>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleAvatarUpload}
            />
            <label htmlFor="avatar-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<PhotoCameraIcon />}
              >
                Choose Image
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorProfilePage;