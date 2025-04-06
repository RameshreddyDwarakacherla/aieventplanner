import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Divider, Chip, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import StorageIcon from '@mui/icons-material/Storage';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalEvents: 0,
    pendingVendors: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let statsSubscription = null;
    let usersSubscription = null;
    let eventsSubscription = null;

    const fetchAdminData = async () => {
      try {
        setLoading(true);

        // Check if user is admin using the userRole from context
        if (userRole !== 'admin') {
          throw new Error('You do not have admin privileges');
        }

        // Fetch total users count
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // Fetch total vendors count
        const { count: vendorsCount, error: vendorsError } = await supabase
          .from('vendors')
          .select('*', { count: 'exact', head: true });

        if (vendorsError) throw vendorsError;

        // Fetch pending vendors count
        const { count: pendingVendorsCount, error: pendingVendorsError } = await supabase
          .from('vendors')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', false);

        if (pendingVendorsError) throw pendingVendorsError;

        // Fetch total events count
        const { count: eventsCount, error: eventsError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });

        if (eventsError) throw eventsError;

        // Fetch recent users
        const { data: recentUsersData, error: recentUsersError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentUsersError) throw recentUsersError;

        // Fetch recent events
        const { data: recentEventsData, error: recentEventsError } = await supabase
          .from('events')
          .select('id, title, event_type, start_date, status, user_id')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentEventsError) throw recentEventsError;

        setStats({
          totalUsers: usersCount,
          totalVendors: vendorsCount,
          totalEvents: eventsCount,
          pendingVendors: pendingVendorsCount
        });

        setRecentUsers(recentUsersData);
        setRecentEvents(recentEventsData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const setupSubscriptions = () => {
      // Subscribe to changes in profiles table
      statsSubscription = supabase
        .channel('admin-stats')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => fetchAdminData()
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'vendors' },
          () => fetchAdminData()
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'events' },
          () => fetchAdminData()
        )
        .subscribe();

      // Subscribe to recent users changes
      usersSubscription = supabase
        .channel('recent-users')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              setRecentUsers(prev => [payload.new, ...prev].slice(0, 5));
            }
          }
        )
        .subscribe();

      // Subscribe to recent events changes
      eventsSubscription = supabase
        .channel('recent-events')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'events' },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              setRecentEvents(prev => [payload.new, ...prev].slice(0, 5));
            }
          }
        )
        .subscribe();
    };

    if (user) {
      fetchAdminData();
      setupSubscriptions();
    }

    return () => {
      if (statsSubscription) statsSubscription.unsubscribe();
      if (usersSubscription) usersSubscription.unsubscribe();
      if (eventsSubscription) eventsSubscription.unsubscribe();
    };
  }, [user, userRole]);

  const handleVerifyVendor = async (vendorId) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_verified: true })
        .eq('id', vendorId);

      if (error) throw error;

      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error verifying vendor:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h3">{stats.totalUsers}</Typography>
              <Button
                variant="text"
                onClick={() => navigate('/admin/users')}
                sx={{ mt: 1 }}
              >
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorefrontIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Vendors</Typography>
              </Box>
              <Typography variant="h3">{stats.totalVendors}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip
                  label={`${stats.pendingVendors} pending verification`}
                  color="warning"
                  size="small"
                  sx={{ mr: 1 }}
                />
              </Box>
              <Button
                variant="text"
                onClick={() => navigate('/admin/vendors')}
                sx={{ mt: 1 }}
              >
                Manage Vendors
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Events</Typography>
              </Box>
              <Typography variant="h3">{stats.totalEvents}</Typography>
              <Button
                variant="text"
                onClick={() => navigate('/admin/events')}
                sx={{ mt: 1 }}
              >
                Manage Events
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Settings</Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate('/admin/settings')}
                sx={{ mt: 3 }}
                fullWidth
              >
                System Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Database</Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate('/admin/database-setup')}
                sx={{ mt: 3 }}
                fullWidth
              >
                Database Setup
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Users */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Recent Users
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === 'admin' ? 'error' : user.role === 'vendor' ? 'warning' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Recent Events */}
      <Typography variant="h5" gutterBottom>
        Recent Events
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.title}</TableCell>
                <TableCell>{event.event_type}</TableCell>
                <TableCell>{format(new Date(event.start_date), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Chip
                    label={event.status}
                    color={
                      event.status === 'completed' ? 'success' :
                      event.status === 'cancelled' ? 'error' :
                      event.status === 'confirmed' ? 'primary' :
                      'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => navigate(`/admin/events/${event.id}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminDashboard;