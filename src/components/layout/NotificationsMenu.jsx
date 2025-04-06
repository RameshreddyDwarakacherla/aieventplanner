import { useState, useEffect } from 'react';
import { 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider, 
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Avatar,
  Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import TaskIcon from '@mui/icons-material/Task';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationsMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications, unreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const navigate = useNavigate();
  
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read
    markNotificationAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.entity_id) {
      switch (notification.type) {
        case 'event':
          navigate(`/events/${notification.entity_id}`);
          break;
        case 'task':
          navigate(`/tasks/${notification.entity_id}`);
          break;
        case 'booking':
          navigate(`/bookings/${notification.entity_id}`);
          break;
        case 'message':
          navigate(`/messages/${notification.entity_id}`);
          break;
        case 'user':
          navigate(`/users/${notification.entity_id}`);
          break;
        default:
          // No navigation
      }
    }
    
    handleClose();
  };
  
  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };
  
  const getNotificationIcon = (type, priority) => {
    switch (type) {
      case 'event':
        return <EventIcon color="primary" />;
      case 'task':
        return <TaskIcon color="secondary" />;
      case 'booking':
        return <EventIcon color="success" />;
      case 'message':
        return <MessageIcon color="info" />;
      case 'user':
        return <PersonIcon color="primary" />;
      case 'system':
        if (priority === 'high') {
          return <WarningIcon color="error" />;
        } else if (priority === 'medium') {
          return <InfoIcon color="warning" />;
        } else {
          return <InfoIcon color="info" />;
        }
      default:
        return <InfoIcon />;
    }
  };
  
  return (
    <>
      <Tooltip title="Notifications">
        <IconButton 
          color="inherit" 
          onClick={handleOpen}
          aria-label={`${unreadNotificationsCount} unread notifications`}
        >
          <Badge badgeContent={unreadNotificationsCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadNotificationsCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <ListItem 
                key={notification.id} 
                disablePadding
                secondaryAction={
                  notification.is_read ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : null
                }
                sx={{
                  bgcolor: notification.is_read ? 'transparent' : 'action.hover'
                }}
              >
                <ListItemButton onClick={() => handleNotificationClick(notification)}>
                  <ListItemIcon>
                    {getNotificationIcon(notification.type, notification.priority)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={notification.message}
                    secondary={formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: notification.is_read ? 'normal' : 'bold'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
        
        <Divider />
        
        <Box sx={{ p: 1 }}>
          <Button 
            fullWidth 
            size="small" 
            onClick={() => {
              navigate('/notifications');
              handleClose();
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationsMenu;
