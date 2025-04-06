import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { initializeRealTimeSubscriptions, getUserNotifications } from '../services/notificationService';
import { toast } from 'react-toastify';

// Create the context
const AppContext = createContext();

// Create the hook as a named function declaration instead of an arrow function
// This helps with HMR (Hot Module Replacement)
export function useApp() {
  return useContext(AppContext);
}

export const AppProvider = ({ children }) => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);
  const [appStats, setAppStats] = useState({
    events: 0,
    tasks: 0,
    guests: 0,
    vendors: 0
  });

  // Initialize real-time subscriptions when user logs in
  useEffect(() => {
    if (user) {
      // Set up real-time subscriptions
      const subscription = initializeRealTimeSubscriptions(user.id, {
        onEventUpdate: handleEventUpdate,
        onTaskUpdate: handleTaskUpdate,
        onGuestUpdate: handleGuestUpdate,
        onVendorUpdate: handleVendorUpdate,
        onMessageReceived: handleMessageReceived,
        onNotificationReceived: handleNotificationReceived
      });

      setRealtimeSubscription(subscription);

      // Fetch initial notifications
      fetchNotifications();

      // Fetch app stats
      fetchAppStats();
    } else {
      // Clean up subscriptions when user logs out
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
        setRealtimeSubscription(null);
      }

      // Reset state
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setAppStats({
        events: 0,
        tasks: 0,
        guests: 0,
        vendors: 0
      });
    }

    setLoading(false);

    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  }, [user]);

  // Fetch user notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const notificationsData = await getUserNotifications(user.id, 20, true);
      setNotifications(notificationsData);

      // Count unread notifications
      const unreadCount = notificationsData.filter(notification => !notification.is_read).length;
      setUnreadNotificationsCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch app stats
  const fetchAppStats = async () => {
    if (!user) return;

    try {
      // Fetch event count
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (eventsError) throw eventsError;

      // Fetch task count
      const { count: tasksCount, error: tasksError } = await supabase
        .from('event_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      // Fetch guest count (across all user's events)
      const { data: events, error: userEventsError } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', user.id);

      if (userEventsError) throw userEventsError;

      let guestsCount = 0;
      if (events && events.length > 0) {
        const eventIds = events.map(event => event.id);

        const { count, error: guestsError } = await supabase
          .from('event_guests')
          .select('id', { count: 'exact', head: true })
          .in('event_id', eventIds);

        if (guestsError) throw guestsError;

        guestsCount = count || 0;
      }

      // Fetch vendor count (for vendors, this is their service count)
      let vendorsCount = 0;
      if (userRole === 'vendor') {
        const { count, error: servicesError } = await supabase
          .from('vendor_services')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', user.id);

        if (servicesError) throw servicesError;

        vendorsCount = count || 0;
      } else {
        // For users, this is the count of vendors they've booked
        if (events && events.length > 0) {
          const eventIds = events.map(event => event.id);

          const { count, error: vendorsError } = await supabase
            .from('event_vendor_bookings')
            .select('id', { count: 'exact', head: true })
            .in('event_id', eventIds);

          if (vendorsError) throw vendorsError;

          vendorsCount = count || 0;
        }
      }

      setAppStats({
        events: eventsCount || 0,
        tasks: tasksCount || 0,
        guests: guestsCount,
        vendors: vendorsCount
      });
    } catch (error) {
      console.error('Error fetching app stats:', error);
    }
  };

  // Handle real-time event updates
  const handleEventUpdate = (payload) => {
    if (payload.eventType === 'INSERT') {
      // New event created
      fetchAppStats();
      toast.success('New event created!');
    } else if (payload.eventType === 'UPDATE') {
      // Event updated
      // You could update specific event data in your state if needed
    } else if (payload.eventType === 'DELETE') {
      // Event deleted
      fetchAppStats();
    }
  };

  // Handle real-time task updates
  const handleTaskUpdate = (payload) => {
    if (payload.eventType === 'INSERT') {
      // New task created
      fetchAppStats();
    } else if (payload.eventType === 'UPDATE') {
      // Task updated
      if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
        toast.success('Task completed!');
      }
    } else if (payload.eventType === 'DELETE') {
      // Task deleted
      fetchAppStats();
    }
  };

  // Handle real-time guest updates
  const handleGuestUpdate = (payload) => {
    if (payload.eventType === 'INSERT') {
      // New guest added
      fetchAppStats();
    } else if (payload.eventType === 'UPDATE') {
      // Guest updated
      if (payload.new.rsvp_status === 'confirmed' && payload.old.rsvp_status !== 'confirmed') {
        toast.info(`${payload.new.name} has confirmed attendance!`);
      }
    } else if (payload.eventType === 'DELETE') {
      // Guest removed
      fetchAppStats();
    }
  };

  // Handle real-time vendor updates
  const handleVendorUpdate = (payload) => {
    if (payload.eventType === 'INSERT') {
      // New vendor booking
      fetchAppStats();
      toast.success('New vendor booking created!');
    } else if (payload.eventType === 'UPDATE') {
      // Vendor booking updated
      if (payload.new.status === 'confirmed' && payload.old.status !== 'confirmed') {
        toast.success('Vendor booking confirmed!');
      }
    } else if (payload.eventType === 'DELETE') {
      // Vendor booking deleted
      fetchAppStats();
    }
  };

  // Handle real-time message updates
  const handleMessageReceived = (message) => {
    toast.info(`New message from ${message.sender_name || 'Someone'}`);
  };

  // Handle real-time notification updates
  const handleNotificationReceived = (notification) => {
    // Update notifications list
    setNotifications(prev => [notification, ...prev]);

    // Increment unread count
    setUnreadNotificationsCount(prev => prev + 1);
  };

  // Mark a notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // Decrement unread count
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const unreadNotificationIds = notifications
        .filter(notification => !notification.is_read)
        .map(notification => notification.id);

      if (unreadNotificationIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadNotificationIds);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      // Reset unread count
      setUnreadNotificationsCount(0);

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Update unread count if needed
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  // Refresh app stats
  const refreshAppStats = () => {
    fetchAppStats();
  };

  const value = {
    loading,
    notifications,
    unreadNotificationsCount,
    appStats,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    refreshAppStats
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// We don't export the context directly to avoid Fast Refresh issues
// Instead, we export the hook and provider
