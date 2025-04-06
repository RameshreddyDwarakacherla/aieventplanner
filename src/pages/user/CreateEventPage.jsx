import { useState } from 'react';
import { Box, Typography, Button, Stepper, Step, StepLabel, Paper, Grid, TextField, MenuItem, InputAdornment, Alert, CircularProgress } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const eventTypes = [
  'Wedding',
  'Birthday',
  'Corporate',
  'Conference',
  'Graduation',
  'Anniversary',
  'Holiday',
  'Other'
];

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Event details
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    event_type: '',
    start_date: null,
    end_date: null,
    location: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    estimated_guests: '',
    budget: '',
    is_public: false
  });

  const steps = ['Basic Information', 'Date & Location', 'Guest & Budget Details'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (name, date) => {
    setEventData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateCurrentStep = () => {
    setError('');

    if (activeStep === 0) {
      if (!eventData.title || !eventData.event_type) {
        setError('Please fill in all required fields');
        return false;
      }
    } else if (activeStep === 1) {
      if (!eventData.start_date || !eventData.end_date || !eventData.location) {
        setError('Please fill in all required fields');
        return false;
      }
      if (eventData.start_date >= eventData.end_date) {
        setError('End date must be after start date');
        return false;
      }
    } else if (activeStep === 2) {
      if (!eventData.estimated_guests) {
        setError('Please enter estimated number of guests');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      setLoading(true);

      // Create event in Supabase
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            user_id: user.id,
            title: eventData.title,
            description: eventData.description,
            event_type: eventData.event_type,
            start_date: eventData.start_date,
            end_date: eventData.end_date,
            location: eventData.location,
            address: eventData.address,
            city: eventData.city,
            state: eventData.state,
            zip_code: eventData.zip_code,
            estimated_guests: parseInt(eventData.estimated_guests),
            budget: eventData.budget ? parseFloat(eventData.budget) : null,
            status: 'planning',
            is_public: eventData.is_public
          }
        ])
        .select();

      if (error) throw error;

      // Create initial tasks for the event
      const eventId = data[0].id;

      // Create default tasks for the event
      const defaultTasks = [
        {
          event_id: eventId,
          user_id: user.id, // Add the user_id field
          title: 'Set event budget',
          description: 'Determine overall budget and allocate funds for different categories',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          status: 'pending',
          priority: 'high',
          assigned_to: user.id
        },
        {
          event_id: eventId,
          user_id: user.id, // Add the user_id field
          title: 'Create guest list',
          description: 'Compile list of guests to invite',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          status: 'pending',
          priority: 'high',
          assigned_to: user.id
        },
        {
          event_id: eventId,
          user_id: user.id, // Add the user_id field
          title: 'Research vendors',
          description: 'Find and compare vendors for the event',
          due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
          status: 'pending',
          priority: 'medium',
          assigned_to: user.id
        }
      ];

      try {
        // Try to create default tasks
        const { error: tasksError } = await supabase
          .from('event_tasks')
          .insert(defaultTasks);

        if (tasksError) {
          // Log the error but don't throw it - we'll still consider the event creation successful
          console.warn('Could not create default tasks:', tasksError);
          toast.warning('Event created, but default tasks could not be added. You can add tasks manually.');
        } else {
          toast.success('Event created successfully with default tasks!');
        }
      } catch (taskErr) {
        // Log the error but don't throw it
        console.warn('Error creating tasks:', taskErr);
        toast.warning('Event created, but default tasks could not be added. You can add tasks manually.');
      }

      // Navigate to the event page regardless of task creation success
      navigate(`/events/${eventId}`);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Event Title"
                  name="title"
                  value={eventData.title}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  select
                  label="Event Type"
                  name="event_type"
                  value={eventData.event_type}
                  onChange={handleChange}
                >
                  {eventTypes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={eventData.description}
                  onChange={handleChange}
                  placeholder="Provide details about your event"
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Start Date & Time"
                    value={eventData.start_date}
                    onChange={(date) => handleDateChange('start_date', date)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="End Date & Time"
                    value={eventData.end_date}
                    onChange={(date) => handleDateChange('end_date', date)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Venue/Location Name"
                  name="location"
                  value={eventData.location}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={eventData.address}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={eventData.city}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State/Province"
                  name="state"
                  value={eventData.state}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Zip/Postal Code"
                  name="zip_code"
                  value={eventData.zip_code}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Estimated Number of Guests"
                  name="estimated_guests"
                  value={eventData.estimated_guests}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Budget"
                  name="budget"
                  value={eventData.budget}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Leave blank if budget is not yet determined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Event Visibility"
                  name="is_public"
                  value={eventData.is_public ? 'public' : 'private'}
                  onChange={(e) => handleChange({
                    target: {
                      name: 'is_public',
                      value: e.target.value === 'public',
                      type: 'checkbox',
                      checked: e.target.value === 'public'
                    }
                  })}
                  helperText="Public events may be featured in event listings"
                >
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Event
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        {renderStepContent(activeStep)}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
        >
          Back
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Event'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CreateEventPage;