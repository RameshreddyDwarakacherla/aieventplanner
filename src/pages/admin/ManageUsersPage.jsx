import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const USER_ROLES = ['user', 'vendor', 'admin'];

const ManageUsersPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'user',
    is_active: true
  });

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is admin using the userRole from context
        if (userRole !== 'admin') {
          throw new Error('You do not have admin privileges');
        }

        fetchUsers();
      } catch (err) {
        console.error('Error checking admin access:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (user) {
      checkAdminAccess();
    }
  }, [user, userRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers(usersData || []);
      setFilteredUsers(usersData || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterUsers(newValue, searchQuery);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    filterUsers(tabValue, query);
  };

  const filterUsers = (tabIndex, query) => {
    let filtered = users;

    // Filter by role based on tab
    if (tabIndex === 1) { // Users
      filtered = users.filter(user => user.role === 'user');
    } else if (tabIndex === 2) { // Vendors
      filtered = users.filter(user => user.role === 'vendor');
    } else if (tabIndex === 3) { // Admins
      filtered = users.filter(user => user.role === 'admin');
    }

    // Filter by search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(user =>
        (user.first_name && user.first_name.toLowerCase().includes(lowercaseQuery)) ||
        (user.last_name && user.last_name.toLowerCase().includes(lowercaseQuery)) ||
        (user.email && user.email.toLowerCase().includes(lowercaseQuery))
      );
    }

    setFilteredUsers(filtered);
  };

  const handleEditUser = (userData) => {
    setCurrentUser(userData);
    setUserForm({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      email: userData.email || '',
      role: userData.role || 'user',
      is_active: userData.is_active !== false // Default to true if not set
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (userData) => {
    setCurrentUser(userData);
    setDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setUserForm({
      ...userForm,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleSubmitUser = async () => {
    try {
      setLoading(true);

      if (!currentUser) return;

      // Update user profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: userForm.first_name,
          last_name: userForm.last_name,
          role: userForm.role,
          is_active: userForm.is_active,
          updated_at: new Date()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Role is now stored directly in the profiles table
      // No need to create a separate admin record

      // Refresh user list
      await fetchUsers();
      setEditDialogOpen(false);
      toast.success('User updated successfully');
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      if (!currentUser) return;

      // In a real application, you might want to implement soft delete instead
      // For this demo, we'll just deactivate the user
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          updated_at: new Date()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Refresh user list
      await fetchUsers();
      setDeleteDialogOpen(false);
      toast.success('User deactivated successfully');
    } catch (err) {
      console.error('Error deactivating user:', err);
      setError(err.message);
      toast.error('Failed to deactivate user');
    }
  };

  if (loading && users.length === 0) {
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
        Manage Users
      </Typography>

      {/* Filters and Search */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="user filter tabs">
              <Tab label="All Users" />
              <Tab label="Event Organizers" />
              <Tab label="Vendors" />
              <Tab label="Admins" />
            </Tabs>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Users Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={userData.avatar_url} sx={{ mr: 2 }}>
                          {userData.first_name ? userData.first_name[0] : <PersonIcon />}
                        </Avatar>
                        <Typography>
                          {userData.first_name} {userData.last_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={userData.role === 'admin' ? 'Admin' : userData.role === 'vendor' ? 'Vendor' : 'User'}
                        color={userData.role === 'admin' ? 'error' : userData.role === 'vendor' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={userData.is_active !== false ? <CheckCircleIcon /> : <BlockIcon />}
                        label={userData.is_active !== false ? 'Active' : 'Inactive'}
                        color={userData.is_active !== false ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {userData.created_at ? format(new Date(userData.created_at), 'MMM d, yyyy') : 'Unknown'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditUser(userData)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(userData)}
                        size="small"
                        disabled={userData.id === user.id} // Prevent deactivating self
                      >
                        <BlockIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No users found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit User
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                name="first_name"
                value={userForm.first_name}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                name="last_name"
                value={userForm.last_name}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                value={userForm.email}
                fullWidth
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Role"
                name="role"
                value={userForm.role}
                onChange={handleInputChange}
                fullWidth
              >
                {USER_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Status"
                name="is_active"
                value={userForm.is_active}
                onChange={(e) => setUserForm({ ...userForm, is_active: e.target.value === 'true' })}
                fullWidth
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitUser}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deactivation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate the user account for {currentUser?.email}? This will prevent them from logging in.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error">
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageUsersPage;