import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, CircularProgress, Alert, TextField, MenuItem } from '@mui/material';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    eventType: 'all',
    status: 'all'
  });

  const eventTypes = ['all', 'wedding', 'corporate', 'birthday', 'other'];
  const statusTypes = ['all', 'upcoming', 'ongoing', 'completed'];

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Use a simpler query that's less likely to fail if tables don't exist
      let query = supabase.from('events').select('*');

      if (filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.status !== 'all') {
        const today = new Date();
        switch (filters.status) {
          case 'upcoming':
            query = query.gt('start_date', today.toISOString());
            break;
          case 'ongoing':
            query = query
              .lte('start_date', today.toISOString())
              .gt('end_date', today.toISOString());
            break;
          case 'completed':
            query = query.lt('end_date', today.toISOString());
            break;
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // If the table doesn't exist, use mock data instead
        if (fetchError.code === '42P01') { // relation does not exist
          console.log('Events table does not exist yet. Using mock data.');
          // Mock data for events
          const mockEvents = [
            {
              id: '1',
              title: 'Summer Wedding',
              description: 'A beautiful summer wedding in the countryside',
              event_type: 'wedding',
              start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              end_date: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
              location: 'Countryside Manor',
              status: 'planning'
            },
            {
              id: '2',
              title: 'Corporate Conference',
              description: 'Annual tech conference with industry leaders',
              event_type: 'corporate',
              start_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              end_date: new Date(Date.now() + 62 * 24 * 60 * 60 * 1000).toISOString(),
              location: 'Downtown Convention Center',
              status: 'planning'
            },
            {
              id: '3',
              title: 'Birthday Party',
              description: 'A fun birthday celebration with friends and family',
              event_type: 'birthday',
              start_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              location: 'Backyard Garden',
              status: 'planning'
            }
          ];
          setEvents(mockEvents);
          return;
        } else {
          throw fetchError;
        }
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType) => (event) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: event.target.value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Events
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          select
          label="Event Type"
          value={filters.eventType}
          onChange={handleFilterChange('eventType')}
          sx={{ minWidth: 200 }}
        >
          {eventTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Status"
          value={filters.status}
          onChange={handleFilterChange('status')}
          sx={{ minWidth: 200 }}
        >
          {statusTypes.map((status) => (
            <MenuItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Events Grid */}
      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {event.title}
                </Typography>

                <Typography color="textSecondary" gutterBottom>
                  Organized by: {event.profiles?.name || 'Event Organizer'}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={event.event_type}
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={format(new Date(event.start_date), 'MMM dd, yyyy')}
                    color="secondary"
                    size="small"
                  />
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {event.description || 'No description available'}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Location: {event.location || 'To be determined'}
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  href={`/events/${event.id}`}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {events.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No events found matching the selected filters.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EventsPage;