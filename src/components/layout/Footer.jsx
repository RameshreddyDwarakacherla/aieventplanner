import { Box, Container, Typography, Link, Grid, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'white', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              AI Event Planner
            </Typography>
            <Typography variant="body2">
              Making event planning smarter, easier, and more personalized with AI-powered recommendations.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Link component={RouterLink} to="/" color="inherit" display="block" sx={{ mb: 1 }}>
              Home
            </Link>
            <Link component={RouterLink} to="/events" color="inherit" display="block" sx={{ mb: 1 }}>
              Events
            </Link>
            <Link component={RouterLink} to="/vendors" color="inherit" display="block" sx={{ mb: 1 }}>
              Vendors
            </Link>
            <Link component={RouterLink} to="/about" color="inherit" display="block" sx={{ mb: 1 }}>
              About Us
            </Link>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Support
            </Typography>
            <Link component={RouterLink} to="/contact" color="inherit" display="block" sx={{ mb: 1 }}>
              Contact Us
            </Link>
            <Link component={RouterLink} to="/faq" color="inherit" display="block" sx={{ mb: 1 }}>
              FAQ
            </Link>
            <Link component={RouterLink} to="/privacy" color="inherit" display="block" sx={{ mb: 1 }}>
              Privacy Policy
            </Link>
            <Link component={RouterLink} to="/terms" color="inherit" display="block" sx={{ mb: 1 }}>
              Terms of Service
            </Link>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.2)' }} />
        <Typography variant="body2" align="center">
          © {currentYear} AI Event Planner. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;