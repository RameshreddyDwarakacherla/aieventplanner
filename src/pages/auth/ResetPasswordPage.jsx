import { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Alert, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const { success, error } = await resetPassword(email);

      if (success) {
        setSubmitted(true);
        toast.success('Password reset email sent!');
      } else {
        setError(error || 'Failed to send reset email. Please try again.');
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
        {!submitted ? (
          <>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              Reset Password
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
              Enter your email address and we'll send you a link to reset your password
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <RouterLink to="/login" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Back to Login
                  </Typography>
                </RouterLink>
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              Email Sent
            </Typography>
            <Typography variant="body1" align="center" paragraph>
              We've sent a password reset link to <strong>{email}</strong>
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" paragraph>
              Please check your email and follow the instructions to reset your password.
              If you don't see the email, please check your spam folder.
            </Typography>
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <RouterLink to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="outlined">
                  Return to Login
                </Button>
              </RouterLink>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default ResetPasswordPage;