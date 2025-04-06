import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

// Channels for different types of real-time subscriptions
let eventChannel = null;
let taskChannel = null;
let guestChannel = null;
let vendorChannel = null;
let messageChannel = null;
let notificationChannel = null;

// Initialize real-time subscriptions for a user
export const initializeRealTimeSubscriptions = (userId, callbacks = {}) => {
  // Unsubscribe from any existing subscriptions
  unsubscribeAll();
  
  if (!userId) return;
  
  // Set up event subscription
  if (callbacks.onEventUpdate) {
    eventChannel = supabase
      .channel('event-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events', filter: `user_id=eq.${userId}` },
        (payload) => {
          callbacks.onEventUpdate(payload);
        }
      )
      .subscribe();
  }
  
  // Set up task subscription
  if (callbacks.onTaskUpdate) {
    taskChannel = supabase
      .channel('task-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'event_tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          callbacks.onTaskUpdate(payload);
        }
      )
      .subscribe();
  }
  
  // Set up guest subscription
  if (callbacks.onGuestUpdate) {
    guestChannel = supabase
      .channel('guest-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'event_guests' },
        async (payload) => {
          // Check if this guest belongs to one of the user's events
          const { data } = await supabase
            .from('events')
            .select('id')
            .eq('id', payload.new.event_id)
            .eq('user_id', userId)
            .single();
          
          if (data) {
            callbacks.onGuestUpdate(payload);
          }
        }
      )
      .subscribe();
  }
  
  // Set up vendor subscription
  if (callbacks.onVendorUpdate) {
    vendorChannel = supabase
      .channel('vendor-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'event_vendors' },
        async (payload) => {
          // Check if this vendor belongs to one of the user's events
          const { data } = await supabase
            .from('events')
            .select('id')
            .eq('id', payload.new.event_id)
            .eq('user_id', userId)
            .single();
          
          if (data) {
            callbacks.onVendorUpdate(payload);
          }
        }
      )
      .subscribe();
  }
  
  // Set up message subscription
  if (callbacks.onMessageReceived) {
    messageChannel = supabase
      .channel('message-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          callbacks.onMessageReceived(payload.new);
        }
      )
      .subscribe();
  }
  
  // Set up notification subscription
  if (callbacks.onNotificationReceived) {
    notificationChannel = supabase
      .channel('notification-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          callbacks.onNotificationReceived(payload.new);
          
          // Show toast notification
          toast.info(payload.new.message, {
            position: "bottom-right",
            autoClose: 5000
          });
        }
      )
      .subscribe();
  }
  
  return {
    unsubscribe: unsubscribeAll
  };
};

// Unsubscribe from all real-time subscriptions
export const unsubscribeAll = () => {
  if (eventChannel) eventChannel.unsubscribe();
  if (taskChannel) taskChannel.unsubscribe();
  if (guestChannel) guestChannel.unsubscribe();
  if (vendorChannel) vendorChannel.unsubscribe();
  if (messageChannel) messageChannel.unsubscribe();
  if (notificationChannel) notificationChannel.unsubscribe();
  
  eventChannel = null;
  taskChannel = null;
  guestChannel = null;
  vendorChannel = null;
  messageChannel = null;
  notificationChannel = null;
};

// Send a notification to a user
export const sendNotification = async (userId, message, type, entityId = null, priority = 'medium') => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message,
        type,
        entity_id: entityId,
        priority,
        is_read: false,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Get all notifications for a user
export const getUserNotifications = async (userId, limit = 20, includeRead = false) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (!includeRead) {
      query = query.eq('is_read', false);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export default {
  initializeRealTimeSubscriptions,
  unsubscribeAll,
  sendNotification,
  markNotificationAsRead,
  getUserNotifications
};
