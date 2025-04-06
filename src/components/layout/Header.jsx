import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box, Avatar } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../contexts/AuthContext';
import NotificationsMenu from './NotificationsMenu';

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleUserMenuClose();
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
    handleUserMenuClose();
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            AI Event Planner
          </Link>
        </Typography>

        {/* Mobile menu */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {!user ? [
              // Public navigation
              <MenuItem key="home" onClick={() => handleNavigation('/')}>Home</MenuItem>,
              <MenuItem key="events" onClick={() => handleNavigation('/events')}>Events</MenuItem>,
              <MenuItem key="vendors" onClick={() => handleNavigation('/vendors/search')}>Vendors</MenuItem>,
              <MenuItem key="login" onClick={() => handleNavigation('/login')}>Login</MenuItem>,
              <MenuItem key="register" onClick={() => handleNavigation('/register')}>Register</MenuItem>
            ] : userRole === 'vendor' ? [
              // Vendor navigation
              <MenuItem key="dashboard" onClick={() => handleNavigation('/dashboard/vendor')}>Dashboard</MenuItem>,
              <MenuItem key="services" onClick={() => handleNavigation('/vendor/services')}>My Services</MenuItem>,
              <MenuItem key="bookings" onClick={() => handleNavigation('/vendor/bookings')}>Bookings</MenuItem>,
              <MenuItem key="reviews" onClick={() => handleNavigation('/vendor/reviews')}>Reviews</MenuItem>,
              <MenuItem key="profile" onClick={() => handleNavigation('/vendor/profile')}>Profile</MenuItem>
            ] : userRole === 'admin' ? [
              // Admin navigation
              <MenuItem key="dashboard" onClick={() => handleNavigation('/dashboard/admin')}>Dashboard</MenuItem>,
              <MenuItem key="vendors" onClick={() => handleNavigation('/admin/vendors')}>Manage Vendors</MenuItem>,
              <MenuItem key="users" onClick={() => handleNavigation('/admin/users')}>Manage Users</MenuItem>,
              <MenuItem key="events" onClick={() => handleNavigation('/admin/events')}>Manage Events</MenuItem>,
              <MenuItem key="settings" onClick={() => handleNavigation('/admin/settings')}>Settings</MenuItem>
            ] : [
              // User/Organizer navigation
              <MenuItem key="dashboard" onClick={() => handleNavigation('/dashboard/user')}>Dashboard</MenuItem>,
              <MenuItem key="create" onClick={() => handleNavigation('/events/create')}>Create Event</MenuItem>,
              <MenuItem key="vendors" onClick={() => handleNavigation('/vendors/search')}>Find Vendors</MenuItem>,
              <MenuItem key="profile" onClick={() => handleNavigation('/profile')}>Profile</MenuItem>
            ]}
          </Menu>
        </Box>

        {/* Desktop menu */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          {!user ? (
            // Public navigation
            <>
              <Button color="inherit" onClick={() => navigate('/')}>Home</Button>
              <Button color="inherit" onClick={() => navigate('/events')}>Events</Button>
              <Button color="inherit" onClick={() => navigate('/vendors/search')}>Vendors</Button>
            </>
          ) : userRole === 'vendor' ? (
            // Vendor navigation
            <>
              <Button color="inherit" onClick={() => navigate('/dashboard/vendor')}>Dashboard</Button>
              <Button color="inherit" onClick={() => navigate('/vendor/services')}>My Services</Button>
              <Button color="inherit" onClick={() => navigate('/vendor/bookings')}>Bookings</Button>
              <Button color="inherit" onClick={() => navigate('/vendor/reviews')}>Reviews</Button>
            </>
          ) : userRole === 'admin' ? (
            // Admin navigation
            <>
              <Button color="inherit" onClick={() => navigate('/dashboard/admin')}>Dashboard</Button>
              <Button color="inherit" onClick={() => navigate('/admin/vendors')}>Manage Vendors</Button>
              <Button color="inherit" onClick={() => navigate('/admin/users')}>Manage Users</Button>
              <Button color="inherit" onClick={() => navigate('/admin/events')}>Manage Events</Button>
            </>
          ) : (
            // User/Organizer navigation
            <>
              <Button color="inherit" onClick={() => navigate('/dashboard/user')}>Dashboard</Button>
              <Button color="inherit" onClick={() => navigate('/events/create')}>Create Event</Button>
              <Button color="inherit" onClick={() => navigate('/vendors/search')}>Find Vendors</Button>
            </>
          )}
        </Box>

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notifications Menu */}
            <NotificationsMenu />

            {/* User Menu */}
            <IconButton onClick={handleUserMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.email?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={() => {
                // Use the stored role from localStorage if available, otherwise use the context role
                const effectiveRole = localStorage.getItem('userRole') || userRole || 'user';
                console.log('Header - Navigating to dashboard for role:', effectiveRole);
                handleNavigation(`/dashboard/${effectiveRole}`);
              }}>
                Dashboard
              </MenuItem>
              <MenuItem onClick={() => handleNavigation('/profile')}>Profile</MenuItem>
              <MenuItem onClick={handleSignOut}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
            <Button variant="outlined" color="inherit" onClick={() => navigate('/register')}>Register</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;