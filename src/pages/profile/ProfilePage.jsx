import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Avatar, CircularProgress, Alert, Divider, Tabs, Tab } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: ''
  });
  
  // Vendor data (if applicable)
  const [vendorData, setVendorData] = useState({
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
    let profileSubscription = null;
    let vendorSubscription = null;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        if (!user) return;

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        setProfileData({
          email: profile.email,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || ''
        });
        
        // If user is a vendor, fetch vendor data
        if (userRole === 'vendor') {
          const { data: vendor, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (vendorError && vendorError.code !== 'PGRST116') {
            // PGRST116 is the error code for no rows returned
            throw vendorError;
          }
          
          if (vendor) {
            setVendorData({
              company_name: vendor.company_name || '',
              vendor_type: vendor.vendor_type || '',
              description: vendor.description || '',
              address: vendor.address || '',
              city: vendor.city || '',
              state: vendor.state || '',
              zip_code: vendor.zip_code || '',
              website: vendor.website || ''
            });
          }
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();

    // Set up real-time subscriptions
    if (user) {
      // Subscribe to profile changes
      profileSubscription = supabase
        .channel('profile-updates')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          async (payload) => {
            if (payload.new) {
              setProfileData(prev => ({
                ...prev,
                first_name: payload.new.first_name || '',
                last_name: payload.new.last_name || '',
                phone: payload.new.phone || '',
                avatar_url: payload.new.avatar_url || ''
              }));
            }
          }
        )
        .subscribe();

      // Subscribe to vendor data changes if user is a vendor
      if (userRole === 'vendor') {
        vendorSubscription = supabase
          .channel('vendor-updates')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'vendors', filter: `user_id=eq.${user.id}` },
            async (payload) => {
              if (payload.new) {
                setVendorData(prev => ({
                  ...prev,
                  company_name: payload.new.company_name || '',
                  vendor_type: payload.new.vendor_type || '',
                  description: payload.new.description || '',
                  address: payload.new.address || '',
                  city: payload.new.city || '',
                  state: payload.new.state || '',
                  zip_code: payload.new.zip_code || '',
                  website: payload.new.website || ''
                }));
              }
            }
          )
          .subscribe();
      }
    }

    return () => {
      if (profileSubscription) profileSubscription.unsubscribe();
      if (vendorSubscription) vendorSubscription.unsubscribe();
    };
  }, [user, userRole]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVendorChange = (e) => {
    const { name, value } = e.target;
    setVendorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          updated_at: new Date()
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // If user is a vendor and on vendor tab, update vendor data
      if (userRole === 'vendor' && tabValue === 1) {
        // Check if vendor record exists
        const { data: existingVendor, error: checkError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        if (existingVendor) {
          // Update existing vendor
          const { error: vendorError } = await supabase
            .from('vendors')
            .update({
              company_name: vendorData.company_name,
              vendor_type: vendorData.vendor_type,
              description: vendorData.description,
              address: vendorData.address,
              city: vendorData.city,
              state: vendorData.state,
              zip_code: vendorData.zip_code,
              website: vendorData.website,
              updated_at: new Date()
            })
            .eq('id', existingVendor.id);
          
          if (vendorError) throw vendorError;
        } else {
          // Create new vendor record
          const { error: vendorError } = await supabase
            .from('vendors')
            .insert([
              {
                user_id: user.id,
                company_name: vendorData.company_name,
                vendor_type: vendorData.vendor_type,
                description: vendorData.description,
                address: vendorData.address,
                city: vendorData.city,
                state: vendorData.state,
                zip_code: vendorData.zip_code,
                website: vendorData.website,
                is_verified: false
              }
            ]);
          
          if (vendorError) throw vendorError;
        }
      }
      
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar 
            src={profileData.avatar_url} 
            alt={`${profileData.first_name} ${profileData.last_name}`}
            sx={{ width: 80, height: 80, mr: 3 }}
          >
            {profileData.first_name?.charAt(0) || user?.email?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5">
              {profileData.first_name} {profileData.last_name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {profileData.email}
            </Typography>
            <Typography variant="body2" color="primary" sx={{ textTransform: 'capitalize' }}>
              {userRole} Account
            </Typography>
          </Box>
        </Box>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Personal Information" />
          {userRole === 'vendor' && <Tab label="Vendor Information" />}
          <Tab label="Account Settings" />
        </Tabs>
        
        {/* Personal Information Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={profileData.first_name}
                onChange={handleProfileChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={profileData.last_name}
                onChange={handleProfileChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={profileData.email}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        )}
        
        {/* Vendor Information Tab */}
        {tabValue === 1 && userRole === 'vendor' && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Company Name"
                name="company_name"
                value={vendorData.company_name}
                onChange={handleVendorChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Vendor Type"
                name="vendor_type"
                value={vendorData.vendor_type}
                onChange={handleVendorChange}
                placeholder="e.g. Catering, Photography, Venue"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={vendorData.description}
                onChange={handleVendorChange}
                placeholder="Describe your services"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={vendorData.website}
                onChange={handleVendorChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Business Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="address"
                value={vendorData.address}
                onChange={handleVendorChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={vendorData.city}
                onChange={handleVendorChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State/Province"
                name="state"
                value={vendorData.state}
                onChange={handleVendorChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Zip/Postal Code"
                name="zip_code"
                value={vendorData.zip_code}
                onChange={handleVendorChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        )}
        
        {/* Account Settings Tab */}
        {tabValue === (userRole === 'vendor' ? 2 : 1) && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Password
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => window.location.href = '/reset-password'}
              >
                Change Password
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Account Deletion
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Deleting your account will remove all your personal information from our system. This action cannot be undone.
              </Typography>
              <Button
                variant="outlined"
                color="error"
              >
                Delete Account
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default ProfilePage;