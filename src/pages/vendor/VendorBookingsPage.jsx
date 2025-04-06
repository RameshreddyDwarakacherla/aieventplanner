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
  Chip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const VendorBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vendorData, setVendorData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');
  const [responseAction, setResponseAction] = useState('');

  useEffect(() => {
    const fetchVendorBookings = async () => {
      try {
        setLoading(true);

        if (!user) return;

        // Fetch vendor profile
        const { data: vendorProfile, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (vendorError) throw vendorError;

        setVendorData(vendorProfile);

        // Fetch vendor bookings with event details
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('event_vendor_bookings')
          .select(`
            *,
            events(id, title, start_date, end_date, location, user_id),
            vendor_services(id, service_name, price, price_type)
          `)
          .eq('vendor_id', vendorProfile.id)
          .order('booking_date', { ascending: false });

        if (bookingsError) throw bookingsError;

        // Fetch client names for each booking
        const bookingsWithClientNames = await Promise.all(bookingsData.map(async (booking) => {
          if (booking.events?.user_id) {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', booking.events.user_id)
              .single();

            if (!userError && userData) {
              return {
                ...booking,
                client_name: `${userData.first_name} ${userData.last_name}`
              };
            }
          }
          return booking;
        }));

        setBookings(bookingsWithClientNames || []);
        filterBookings(0, bookingsWithClientNames || []);
      } catch (err) {
        console.error('Error fetching vendor bookings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorBookings();
  }, [user]);

  const filterBookings = (tabIndex, bookingsList = bookings) => {
    switch (tabIndex) {
      case 0: // All
        setFilteredBookings(bookingsList);
        break;
      case 1: // Pending
        setFilteredBookings(bookingsList.filter(booking => booking.status === 'requested'));
        break;
      case 2: // Confirmed
        setFilteredBookings(bookingsList.filter(booking => booking.status === 'confirmed'));
        break;
      case 3: // Completed
        setFilteredBookings(bookingsList.filter(booking => booking.status === 'completed'));
        break;
      case 4: // Cancelled
        setFilteredBookings(bookingsList.filter(booking => booking.status === 'cancelled'));
        break;
      default:
        setFilteredBookings(bookingsList);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterBookings(newValue);
  };

  const handleViewDetails = (booking) => {
    setCurrentBooking(booking);
    setDetailsDialogOpen(true);
  };

  const handleResponseClick = (booking, action) => {
    setCurrentBooking(booking);
    setResponseAction(action);
    setResponseNotes('');
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    try {
      if (!currentBooking) return;

      const newStatus = responseAction === 'accept' ? 'confirmed' : 'cancelled';

      const { error } = await supabase
        .from('event_vendor_bookings')
        .update({
          status: newStatus,
          notes: responseNotes ? `${currentBooking.notes ? currentBooking.notes + '\n\n' : ''}${responseNotes}` : currentBooking.notes,
          updated_at: new Date()
        })
        .eq('id', currentBooking.id);

      if (error) throw error;

      // Update local state
      const updatedBookings = bookings.map(booking => {
        if (booking.id === currentBooking.id) {
          return {
            ...booking,
            status: newStatus,
            notes: responseNotes ? `${booking.notes ? booking.notes + '\n\n' : ''}${responseNotes}` : booking.notes
          };
        }
        return booking;
      });

      setBookings(updatedBookings);
      filterBookings(tabValue, updatedBookings);
      setResponseDialogOpen(false);
      toast.success(`Booking ${responseAction === 'accept' ? 'accepted' : 'declined'} successfully`);
    } catch (err) {
      console.error('Error updating booking:', err);
      setError(err.message);
      toast.error('Failed to update booking');
    }
  };

  const handleMarkComplete = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('event_vendor_bookings')
        .update({
          status: 'completed',
          updated_at: new Date()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      const updatedBookings = bookings.map(booking => {
        if (booking.id === bookingId) {
          return {
            ...booking,
            status: 'completed'
          };
        }
        return booking;
      });

      setBookings(updatedBookings);
      filterBookings(tabValue, updatedBookings);
      toast.success('Booking marked as completed');
    } catch (err) {
      console.error('Error updating booking:', err);
      setError(err.message);
      toast.error('Failed to update booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      case 'requested':
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      case 'requested':
      default:
        return 'Pending';
    }
  };

  const formatPrice = (price, priceType) => {
    if (!price) return 'Contact for pricing';

    switch (priceType) {
      case 'fixed':
        return `$${price.toFixed(2)}`;
      case 'starting_at':
        return `Starting at $${price.toFixed(2)}`;
      case 'per_person':
        return `$${price.toFixed(2)} per person`;
      case 'hourly':
        return `$${price.toFixed(2)}/hour`;
      default:
        return `$${price.toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!vendorData) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Vendor profile not found. Please complete your vendor registration.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Bookings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {!vendorData.is_verified && (
        <Alert severity="info" sx={{ mb: 4 }}>
          Your vendor account is pending verification. Some features may be limited until verification is complete.
        </Alert>
      )}

      {/* Booking Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="booking tabs">
          <Tab label={`All (${bookings.length})`} />
          <Tab label={`Pending (${bookings.filter(b => b.status === 'requested').length})`} />
          <Tab label={`Confirmed (${bookings.filter(b => b.status === 'confirmed').length})`} />
          <Tab label={`Completed (${bookings.filter(b => b.status === 'completed').length})`} />
          <Tab label={`Cancelled (${bookings.filter(b => b.status === 'cancelled').length})`} />
        </Tabs>
      </Box>

      {/* Bookings Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="bookings table">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.events?.title || 'Unknown Event'}</TableCell>
                    <TableCell>{booking.client_name || 'Unknown Client'}</TableCell>
                    <TableCell>{booking.vendor_services?.service_name || 'Custom Service'}</TableCell>
                    <TableCell>
                      {booking.events?.start_date ? (
                        format(new Date(booking.events.start_date), 'MMM d, yyyy')
                      ) : (
                        'Date not specified'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(booking.status)}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewDetails(booking)}
                        size="small"
                        title="View Details"
                      >
                        <VisibilityIcon />
                      </IconButton>

                      {booking.status === 'requested' && (
                        <>
                          <IconButton
                            color="success"
                            onClick={() => handleResponseClick(booking, 'accept')}
                            size="small"
                            title="Accept Booking"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleResponseClick(booking, 'decline')}
                            size="small"
                            title="Decline Booking"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleMarkComplete(booking.id)}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No bookings found in this category.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Booking Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Booking Details
        </DialogTitle>
        <DialogContent>
          {currentBooking && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Event Information
                </Typography>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Event Name
                        </Typography>
                        <Typography variant="body1">
                          {currentBooking.events?.title || 'Unknown Event'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Client
                        </Typography>
                        <Typography variant="body1">
                          {currentBooking.client_name || 'Unknown Client'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Date
                        </Typography>
                        <Typography variant="body1">
                          {currentBooking.events?.start_date ? (
                            format(new Date(currentBooking.events.start_date), 'EEEE, MMMM d, yyyy')
                          ) : (
                            'Date not specified'
                          )}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Time
                        </Typography>
                        <Typography variant="body1">
                          {currentBooking.events?.start_date ? (
                            `${format(new Date(currentBooking.events.start_date), 'h:mm a')} -
                             ${currentBooking.events.end_date ? format(new Date(currentBooking.events.end_date), 'h:mm a') : 'Not specified'}`
                          ) : (
                            'Time not specified'
                          )}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body1">
                          {currentBooking.events?.location || 'Location not specified'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Service Details
                </Typography>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Service
                        </Typography>
                        <Typography variant="body1">
                          {currentBooking.vendor_services?.service_name || 'Custom Service'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Price
                        </Typography>
                        <Typography variant="body1">
                          {currentBooking.price ? (
                            `$${currentBooking.price.toFixed(2)}`
                          ) : currentBooking.vendor_services?.price ? (
                            formatPrice(currentBooking.vendor_services.price, currentBooking.vendor_services.price_type)
                          ) : (
                            'Price not specified'
                          )}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Booking Date
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(currentBooking.booking_date), 'MMMM d, yyyy')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip
                          label={getStatusLabel(currentBooking.status)}
                          color={getStatusColor(currentBooking.status)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Notes
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {currentBooking.notes || 'No notes provided'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {currentBooking && currentBooking.status === 'requested' && (
            <>
              <Button
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleResponseClick(currentBooking, 'accept');
                }}
                color="success"
                variant="contained"
              >
                Accept
              </Button>
              <Button
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleResponseClick(currentBooking, 'decline');
                }}
                color="error"
                variant="contained"
              >
                Decline
              </Button>
            </>
          )}
          {currentBooking && currentBooking.status === 'confirmed' && (
            <Button
              onClick={() => {
                setDetailsDialogOpen(false);
                handleMarkComplete(currentBooking.id);
              }}
              color="primary"
              variant="contained"
            >
              Mark as Completed
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onClose={() => setResponseDialogOpen(false)}>
        <DialogTitle>
          {responseAction === 'accept' ? 'Accept Booking' : 'Decline Booking'}
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            {responseAction === 'accept'
              ? 'You are about to accept this booking. You can add a note to the client:'
              : 'You are about to decline this booking. Please provide a reason:'}
          </Typography>
          <TextField
            label="Notes"
            multiline
            rows={4}
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            fullWidth
            placeholder={responseAction === 'accept'
              ? 'Thank you for your booking! We look forward to working with you.'
              : 'Please provide a reason for declining this booking.'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitResponse}
            color={responseAction === 'accept' ? 'success' : 'error'}
            variant="contained"
          >
            {responseAction === 'accept' ? 'Accept Booking' : 'Decline Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorBookingsPage;