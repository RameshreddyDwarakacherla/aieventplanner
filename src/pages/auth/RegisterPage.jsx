import { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Grid, Link, Alert, CircularProgress, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as mockDataService from '../../services/mockDataService';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'user' // Default to 'user' (event organizer)
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.email || !formData.password || !formData.confirmPassword ||
        !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Prevent multiple rapid submissions
    if (isSubmitting || loading) {
      return;
    }

    setError('');
    setLoading(true);
    setIsSubmitting(true);

    try {
      // First, check if the email already exists in mock data
      const existingProfile = mockDataService.getProfileByEmail(formData.email);
      if (existingProfile) {
        setError('An account with this email already exists. Please use a different email or try logging in.');
        return;
      }

      const { success, error: signUpError, message, data } = await signUp(
        formData.email,
        formData.password,
        formData.role,
        formData.firstName,
        formData.lastName
      );

      if (!success || signUpError) {
        setError(signUpError || 'Failed to create account');
        return;
      }

      toast.success(message || 'Account created successfully! Please check your email to verify your account.');

      // Store the role in localStorage for use after email verification
      localStorage.setItem('pendingUserRole', formData.role);

      // Redirect to login page
      navigate('/login', { state: { registeredAs: formData.role } });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsSubmitting(false), 1500);

      // If there was an error about existing email, we should reset the form
      if (error && error.includes('already exists')) {
        setFormData(prev => ({ ...prev, email: '' }));
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Create an Account
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Join AI Event Planner to start {formData.role === 'user' ? 'planning your events' : 'offering your services'}
          </Typography>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </Grid>
            </Grid>

            <FormControl component="fieldset" sx={{ mt: 2, mb: 1 }}>
              <FormLabel component="legend">I want to register as:</FormLabel>
              <RadioGroup
                row
                name="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              >
                <FormControlLabel
                  value="user"
                  control={<Radio />}
                  label="Event Organizer"
                />
                <FormControlLabel
                  value="vendor"
                  control={<Radio />}
                  label="Vendor"
                />
              </RadioGroup>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>

            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;