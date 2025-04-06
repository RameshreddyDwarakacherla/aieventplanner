import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import CreateBudgetTable from '../../components/admin/CreateBudgetTable';

const DatabaseSetupPage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/admin/dashboard" color="inherit">
            Dashboard
          </MuiLink>
          <Typography color="text.primary">Database Setup</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Database Setup
        </Typography>
        
        <Typography variant="body1" paragraph>
          Use the tools below to set up and manage database tables.
        </Typography>
        
        <CreateBudgetTable />
      </Box>
    </Container>
  );
};

export default DatabaseSetupPage;
