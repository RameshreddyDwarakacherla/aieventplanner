import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Divider
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const RSVP_STATUS_OPTIONS = [
  'Pending',
  'Confirmed',
  'Declined',
  'Maybe'
];

const GuestManagementPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    rsvp_status: 'Pending',
    plus_ones: 0,
    dietary_restrictions: '',
    notes: ''
  });

  useEffect(() => {
    const fetchGuestData = async () => {
      try {
        setLoading(true);

        if (!eventId || !user) return;

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .eq('user_id', user.id)
          .single();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Event not found');

        // Fetch guests
        const { data: guestsData, error: guestsError } = await supabase
          .from('event_guests')
          .select('*')
          .eq('event_id', eventId)
          .order('name', { ascending: true });

        if (guestsError) throw guestsError;

        setEvent(eventData);
        setGuests(guestsData || []);
      } catch (err) {
        console.error('Error fetching guest data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestData();
  }, [eventId, user]);

  const handleAddGuest = () => {
    setEditingGuest(null);
    setGuestForm({
      name: '',
      email: '',
      phone: '',
      rsvp_status: 'Pending',
      plus_ones: 0,
      dietary_restrictions: '',
      notes: ''
    });
    setDialogOpen(true);
  };

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setGuestForm({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      rsvp_status: guest.rsvp_status,
      plus_ones: guest.plus_ones || 0,
      dietary_restrictions: guest.dietary_restrictions || '',
      notes: guest.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteGuest = async (guestId) => {
    try {
      const { error } = await supabase
        .from('event_guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;

      setGuests(guests.filter(guest => guest.id !== guestId));
    } catch (err) {
      console.error('Error deleting guest:', err);
      setError(err.message);
    }
  };

  const handleSubmitGuest = async () => {
    try {
      const guestData = {
        event_id: eventId,
        ...guestForm
      };

      let result;
      if (editingGuest) {
        result = await supabase
          .from('event_guests')
          .update(guestData)
          .eq('id', editingGuest.id);
      } else {
        result = await supabase
          .from('event_guests')
          .insert([guestData]);
      }

      if (result.error) throw result.error;

      // Refresh guests
      const { data: updatedGuests, error: fetchError } = await supabase
        .from('event_guests')
        .select('*')
        .eq('event_id', eventId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setGuests(updatedGuests);
      setDialogOpen(false);
    } catch (err) {
      console.error('Error saving guest:', err);
      setError(err.message);
    }
  };

  const getGuestStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'declined':
        return 'error';
      case 'maybe':
        return 'warning';
      default:
        return 'default';
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
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 2 }}>
          Event not found. Please check the URL and try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Guest List - {event.title}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleAddGuest}
          >
            Add Guest
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Guest Statistics Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Guest Statistics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Guests"
                      secondary={guests.length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PeopleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Confirmed"
                      secondary={guests.filter(g => g.rsvp_status.toLowerCase() === 'confirmed').length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PeopleIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Declined"
                      secondary={guests.filter(g => g.rsvp_status.toLowerCase() === 'declined').length}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Guest List */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Guest List
                </Typography>
                <List>
                  {guests.map((guest) => (
                    <ListItem
                      key={guest.id}
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEditGuest(guest)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteGuest(guest.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {guest.name}
                            </Typography>
                            <Chip
                              label={guest.rsvp_status}
                              size="small"
                              color={getGuestStatusColor(guest.rsvp_status)}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            {guest.email && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
                                {guest.email}
                              </Box>
                            )}
                            {guest.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
                                {guest.phone}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {guests.length === 0 && (
                    <ListItem>
                      <ListItemText
                        secondary="No guests added yet. Click 'Add Guest' to get started."
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Add/Edit Guest Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingGuest ? 'Edit Guest' : 'Add New Guest'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Guest Name"
            value={guestForm.name}
            onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            type="email"
            value={guestForm.email}
            onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Phone"
            value={guestForm.phone}
            onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            label="RSVP Status"
            value={guestForm.rsvp_status}
            onChange={(e) => setGuestForm({ ...guestForm, rsvp_status: e.target.value })}
            fullWidth
            margin="normal"
          >
            {RSVP_STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Plus Ones"
            type="number"
            value={guestForm.plus_ones}
            onChange={(e) => setGuestForm({ ...guestForm, plus_ones: parseInt(e.target.value) || 0 })}
            fullWidth
            margin="normal"
            InputProps={{ inputProps: { min: 0 } }}
          />
          <TextField
            label="Dietary Restrictions"
            value={guestForm.dietary_restrictions}
            onChange={(e) => setGuestForm({ ...guestForm, dietary_restrictions: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            label="Notes"
            value={guestForm.notes}
            onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitGuest}
            variant="contained"
            color="primary"
            disabled={!guestForm.guest_name}
          >
            {editingGuest ? 'Save Changes' : 'Add Guest'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GuestManagementPage;