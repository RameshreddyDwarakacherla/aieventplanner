import { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Grid, Link, Alert, CircularProgress } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there's a redirect path in the location state
  const from = location.state?.from?.pathname || '/';

  // Check if there's a registered role in the location state or localStorage
  const registeredAs = location.state?.registeredAs || localStorage.getItem('pendingUserRole');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Login attempt for email:', email);

    try {
      console.log('Calling signIn function...');
      const { success, error, data } = await signIn(email, password);
      console.log('SignIn result:', { success, error, data });

      if (success) {
        console.log('Login successful!');
        toast.success('Login successful!');

        // Try to determine the user role
        let role = 'user'; // Default role

        // Check if we have a registered role from registration
        if (registeredAs) {
          console.log('Using role from registration:', registeredAs);
          role = registeredAs;
          // Clear the stored role
          localStorage.removeItem('pendingUserRole');
        }
        // Check if we have a mock profile
        else if (data?.user?.role) {
          role = data.user.role;
          console.log('Role from user data:', role);
        } else {
          // Try to get the role from Supabase metadata
          const metadata = data?.user?.user_metadata;
          if (metadata && metadata.role) {
            role = metadata.role;
            console.log('Role from metadata:', role);
          }
        }

        console.log('User role determined:', role);

        // Use the current user role from the auth context if available
        if (userRole) {
          console.log('Using role from auth context:', userRole);
          role = userRole;
        }

        console.log('Login successful, redirecting to dashboard for role:', role);

        // Store the determined role in localStorage for future use
        localStorage.setItem('userRole', role);

        // Directly navigate to the appropriate dashboard based on role
        const dashboardPath =
          role === 'vendor' ? '/dashboard/vendor' :
          role === 'admin' ? '/dashboard/admin' :
          '/dashboard/user';

        console.log('Navigating directly to:', dashboardPath);

        // For vendors, check if they have a vendor profile
        if (role === 'vendor') {
          try {
            // Check if the vendor profile exists
            const { data: vendorData, error: vendorError } = await supabase
              .from('vendors')
              .select('id')
              .eq('user_id', data.user.id)
              .single();

            if (vendorError && vendorError.code !== 'PGRST116') {
              console.error('Error checking vendor profile:', vendorError);
            }

            if (!vendorData) {
              console.log('No vendor profile found, creating one...');
              // Create a vendor profile if it doesn't exist
              const { error: insertError } = await supabase
                .from('vendors')
                .insert([
                  {
                    user_id: data.user.id,
                    company_name: data.user.user_metadata?.firstName ?
                      `${data.user.user_metadata.firstName}'s Company` : 'New Vendor',
                    vendor_type: 'General',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_verified: false
                  },
                ]);

              if (insertError) {
                console.error('Error creating vendor profile:', insertError);
              } else {
                console.log('Vendor profile created successfully');
              }
            } else {
              console.log('Vendor profile found:', vendorData.id);
            }
          } catch (error) {
            console.error('Error handling vendor profile:', error);
          }
        }

        // Navigate immediately
        navigate(dashboardPath, { replace: true });
      } else {
        setError(error || 'Failed to sign in. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to continue to your AI Event Planner account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/reset-password" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>

          {/* Admin Demo Credentials */}
          <Box sx={{ mt: 4, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '2px solid #3f51b5' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" color="primary" align="center">
              👑 ADMIN DASHBOARD ACCESS 👑
            </Typography>

            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="body1" component="div" gutterBottom>
                    <Box component="span" fontWeight="bold">Email:</Box> admin@ai.com
                  </Typography>
                  <Typography variant="body1" component="div">
                    <Box component="span" fontWeight="bold">Password:</Box> Ramesh@143
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setEmail('admin@ai.com');
                      setPassword('Ramesh@143');
                    }}
                  >
                    Use Admin Login
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
              Use these credentials to access the admin dashboard and manage the entire platform.
            </Typography>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={() => {
                  // Clear localStorage
                  localStorage.clear();
                  // Reload the page
                  window.location.reload();
                }}
              >
                Reset App State
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;