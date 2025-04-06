import { supabase } from '../lib/supabase';

// This service handles all payment-related functionality
// In a real application, this would connect to a payment processor like Stripe

// Process a payment for an event booking
export const processPayment = async (bookingData, paymentMethod) => {
  try {
    // In a real application, this would call a payment processor API
    // For now, we'll simulate a payment process
    
    // 1. Validate payment data
    if (!bookingData.amount || bookingData.amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    
    if (!paymentMethod || !paymentMethod.id) {
      throw new Error('Invalid payment method');
    }
    
    // 2. Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 3. Generate a transaction ID
    const transactionId = `txn_${Math.random().toString(36).substring(2, 15)}`;
    
    // 4. Save payment record to database
    const { data, error } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingData.booking_id,
        event_id: bookingData.event_id,
        vendor_id: bookingData.vendor_id,
        user_id: bookingData.user_id,
        amount: bookingData.amount,
        currency: bookingData.currency || 'USD',
        payment_method: paymentMethod.type,
        payment_method_details: {
          id: paymentMethod.id,
          last4: paymentMethod.last4 || '****',
          brand: paymentMethod.brand || 'Unknown'
        },
        transaction_id: transactionId,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 5. Update booking status
    const { error: bookingError } = await supabase
      .from('event_vendor_bookings')
      .update({ 
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingData.booking_id);
    
    if (bookingError) throw bookingError;
    
    return {
      success: true,
      payment: data,
      transactionId
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

// Get payment methods for a user
export const getUserPaymentMethods = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
};

// Add a new payment method for a user
export const addPaymentMethod = async (userId, paymentMethodData) => {
  try {
    // In a real application, this would tokenize the card with a payment processor
    // For now, we'll simulate adding a payment method
    
    // Validate payment method data
    if (!paymentMethodData.type || !paymentMethodData.details) {
      throw new Error('Invalid payment method data');
    }
    
    // Save payment method to database
    const { data, error } = await supabase
      .from('user_payment_methods')
      .insert({
        user_id: userId,
        type: paymentMethodData.type,
        details: {
          last4: paymentMethodData.details.last4 || '****',
          brand: paymentMethodData.details.brand || 'Unknown',
          expMonth: paymentMethodData.details.expMonth,
          expYear: paymentMethodData.details.expYear
        },
        is_default: paymentMethodData.isDefault || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

// Get payment history for a user
export const getUserPaymentHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        booking:event_vendor_bookings(
          *,
          event:events(id, title),
          vendor:vendors(id, name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
};

// Get payment history for a vendor
export const getVendorPaymentHistory = async (vendorId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        booking:event_vendor_bookings(
          *,
          event:events(id, title, user_id),
          user:profiles(id, first_name, last_name)
        )
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching vendor payment history:', error);
    return [];
  }
};

// Issue a refund
export const issueRefund = async (paymentId, amount, reason) => {
  try {
    // In a real application, this would call a payment processor API to issue a refund
    // For now, we'll simulate a refund process
    
    // Get the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (paymentError) throw paymentError;
    
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    if (payment.status !== 'completed') {
      throw new Error('Cannot refund a payment that is not completed');
    }
    
    // Validate refund amount
    if (!amount || amount <= 0 || amount > payment.amount) {
      throw new Error('Invalid refund amount');
    }
    
    // Simulate refund processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a refund ID
    const refundId = `ref_${Math.random().toString(36).substring(2, 15)}`;
    
    // Save refund record to database
    const { data, error } = await supabase
      .from('refunds')
      .insert({
        payment_id: paymentId,
        booking_id: payment.booking_id,
        event_id: payment.event_id,
        vendor_id: payment.vendor_id,
        user_id: payment.user_id,
        amount,
        currency: payment.currency,
        reason,
        refund_id: refundId,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update payment status if full refund
    if (amount === payment.amount) {
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (updateError) throw updateError;
    } else {
      // Partial refund
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          status: 'partially_refunded',
          refunded_amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (updateError) throw updateError;
    }
    
    return {
      success: true,
      refund: data,
      refundId
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    throw error;
  }
};

export default {
  processPayment,
  getUserPaymentMethods,
  addPaymentMethod,
  getUserPaymentHistory,
  getVendorPaymentHistory,
  issueRefund
};
