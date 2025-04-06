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
  Divider,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { toast } from 'react-toastify';

const SystemSettingsPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    general: {
      siteName: 'AI Event Planner',
      contactEmail: 'support@eventplanner.com',
      maxEventsPerUser: 10,
      maxGuestsPerEvent: 500,
      enablePublicEvents: true
    },
    ai: {
      enableAIRecommendations: true,
      recommendationConfidence: 75,
      maxRecommendationsPerEvent: 10,
      enableAutoSuggestions: true,
      aiModelVersion: '1.0.0'
    },
    notifications: {
      enableEmailNotifications: true,
      enablePushNotifications: false,
      reminderDays: 7,
      sendWeeklySummary: true,
      adminAlerts: true
    },
    security: {
      requireEmailVerification: true,
      passwordMinLength: 8,
      sessionTimeout: 60,
      enableTwoFactor: false,
      allowSocialLogin: true
    }
  });

  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalEvents: 0,
    activeEvents: 0,
    aiRecommendationsGenerated: 0,
    aiRecommendationsApplied: 0
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is admin using the userRole from context
        if (userRole !== 'admin') {
          throw new Error('You do not have admin privileges');
        }

        fetchSettings();
        fetchSystemStats();
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

  const fetchSettings = async () => {
    try {
      setLoading(true);

      // Fetch system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('*');

      if (settingsError) throw settingsError;

      if (settingsData && settingsData.length > 0) {
        // Transform settings from database format to our state format
        const transformedSettings = {
          general: {},
          ai: {},
          notifications: {},
          security: {}
        };

        settingsData.forEach(setting => {
          const category = setting.setting_key.split('.')[0];
          const key = setting.setting_key.split('.')[1];

          if (transformedSettings[category]) {
            transformedSettings[category][key] = setting.setting_value;
          }
        });

        setSettings(transformedSettings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      // Fetch user count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch vendor count
      const { count: vendorsCount, error: vendorsError } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      if (vendorsError) throw vendorsError;

      // Fetch event count
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (eventsError) throw eventsError;

      // Fetch active events count
      const { count: activeEventsCount, error: activeEventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .not('status', 'eq', 'completed')
        .not('status', 'eq', 'cancelled');

      if (activeEventsError) throw activeEventsError;

      // Fetch AI recommendations stats
      const { count: aiRecsCount, error: aiRecsError } = await supabase
        .from('ai_recommendations')
        .select('*', { count: 'exact', head: true });

      if (aiRecsError) throw aiRecsError;

      const { count: aiRecsAppliedCount, error: aiRecsAppliedError } = await supabase
        .from('ai_recommendations')
        .select('*', { count: 'exact', head: true })
        .eq('is_applied', true);

      if (aiRecsAppliedError) throw aiRecsAppliedError;

      setSystemStats({
        totalUsers: usersCount || 0,
        totalVendors: vendorsCount || 0,
        totalEvents: eventsCount || 0,
        activeEvents: activeEventsCount || 0,
        aiRecommendationsGenerated: aiRecsCount || 0,
        aiRecommendationsApplied: aiRecsAppliedCount || 0
      });
    } catch (err) {
      console.error('Error fetching system stats:', err);
      // Don't set error state here to avoid blocking the settings display
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Transform settings to database format
      const settingsToSave = [];

      Object.keys(settings).forEach(category => {
        Object.keys(settings[category]).forEach(key => {
          settingsToSave.push({
            setting_key: `${category}.${key}`,
            setting_value: settings[category][key],
            description: `${category} setting: ${key}`
          });
        });
      });

      // First, delete existing settings
      const { error: deleteError } = await supabase
        .from('system_settings')
        .delete()
        .neq('setting_key', 'dummy'); // Delete all records

      if (deleteError) throw deleteError;

      // Then, insert new settings
      const { error: insertError } = await supabase
        .from('system_settings')
        .insert(settingsToSave);

      if (insertError) throw insertError;

      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSetting = (category, key, currentValue) => {
    setCurrentSetting({
      category,
      key,
      value: currentValue
    });
    setEditDialogOpen(true);
  };

  const handleUpdateSetting = () => {
    if (!currentSetting) return;

    const { category, key, value } = currentSetting;

    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));

    setEditDialogOpen(false);
  };

  const renderSettingValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? 'Enabled' : 'Disabled';
    } else if (typeof value === 'number') {
      return value.toString();
    } else {
      return value;
    }
  };

  const renderSettingEditor = () => {
    if (!currentSetting) return null;

    const { category, key, value } = currentSetting;

    if (typeof value === 'boolean') {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={value}
              onChange={(e) => setCurrentSetting({ ...currentSetting, value: e.target.checked })}
            />
          }
          label={value ? 'Enabled' : 'Disabled'}
        />
      );
    } else if (typeof value === 'number') {
      // Special case for slider values
      if (key === 'recommendationConfidence' || key === 'passwordMinLength' || key === 'sessionTimeout' || key === 'reminderDays') {
        let min = 0;
        let max = 100;
        let step = 1;

        if (key === 'recommendationConfidence') {
          min = 50;
          max = 100;
          step = 5;
        } else if (key === 'passwordMinLength') {
          min = 6;
          max = 16;
          step = 1;
        } else if (key === 'sessionTimeout') {
          min = 15;
          max = 240;
          step = 15;
        } else if (key === 'reminderDays') {
          min = 1;
          max = 30;
          step = 1;
        }

        return (
          <Box sx={{ width: '100%' }}>
            <Slider
              value={value}
              min={min}
              max={max}
              step={step}
              onChange={(e, newValue) => setCurrentSetting({ ...currentSetting, value: newValue })}
              valueLabelDisplay="auto"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">{min}</Typography>
              <Typography variant="body1">{value}</Typography>
              <Typography variant="caption">{max}</Typography>
            </Box>
          </Box>
        );
      } else {
        return (
          <TextField
            type="number"
            value={value}
            onChange={(e) => setCurrentSetting({ ...currentSetting, value: parseInt(e.target.value) })}
            fullWidth
          />
        );
      }
    } else {
      return (
        <TextField
          value={value}
          onChange={(e) => setCurrentSetting({ ...currentSetting, value: e.target.value })}
          fullWidth
        />
      );
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Settings
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>

      {/* System Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" align="center">{systemStats.totalUsers}</Typography>
              <Typography variant="body2" align="center" color="text.secondary">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" align="center">{systemStats.totalVendors}</Typography>
              <Typography variant="body2" align="center" color="text.secondary">Vendors</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" align="center">{systemStats.totalEvents}</Typography>
              <Typography variant="body2" align="center" color="text.secondary">Total Events</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" align="center">{systemStats.activeEvents}</Typography>
              <Typography variant="body2" align="center" color="text.secondary">Active Events</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" align="center">{systemStats.aiRecommendationsGenerated}</Typography>
              <Typography variant="body2" align="center" color="text.secondary">AI Recommendations</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" align="center">
                {systemStats.aiRecommendationsApplied > 0 && systemStats.aiRecommendationsGenerated > 0 ?
                  `${Math.round((systemStats.aiRecommendationsApplied / systemStats.aiRecommendationsGenerated) * 100)}%` :
                  '0%'}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">AI Adoption Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Settings Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab icon={<SettingsIcon />} label="General" />
            <Tab icon={<SmartToyIcon />} label="AI Settings" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<SecurityIcon />} label="Security" />
          </Tabs>
        </Box>

        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <List>
            {Object.keys(settings.general).map((key) => (
              <ListItem
                key={key}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleEditSetting('general', key, settings.general[key])}>
                    <EditIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={formatSettingName(key)}
                  secondary={renderSettingValue(settings.general[key])}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* AI Settings */}
        <TabPanel value={tabValue} index={1}>
          <List>
            {Object.keys(settings.ai).map((key) => (
              <ListItem
                key={key}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleEditSetting('ai', key, settings.ai[key])}>
                    <EditIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={formatSettingName(key)}
                  secondary={renderSettingValue(settings.ai[key])}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={tabValue} index={2}>
          <List>
            {Object.keys(settings.notifications).map((key) => (
              <ListItem
                key={key}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleEditSetting('notifications', key, settings.notifications[key])}>
                    <EditIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={formatSettingName(key)}
                  secondary={renderSettingValue(settings.notifications[key])}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={tabValue} index={3}>
          <List>
            {Object.keys(settings.security).map((key) => (
              <ListItem
                key={key}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleEditSetting('security', key, settings.security[key])}>
                    <EditIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={formatSettingName(key)}
                  secondary={renderSettingValue(settings.security[key])}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      </Paper>

      {/* Edit Setting Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>
          Edit {currentSetting ? formatSettingName(currentSetting.key) : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {renderSettingEditor()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSetting} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper function to format setting names
const formatSettingName = (key) => {
  // Convert camelCase to Title Case with spaces
  const formatted = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  return formatted;
};

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default SystemSettingsPage;