import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, TextField, CircularProgress, Divider, Card, CardContent, CardActions, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, IconButton, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const PaymentProcessing = ({ eventId, budgetItems, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [processing, setProcessing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [eventId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('event_payments')
        .select('*, budget_item:event_budget_items(item_name, category), vendor:vendors(company_name)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setPaymentHistory(data || []);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = (item) => {
    setCurrentItem(item);
    setPaymentDialog(true);
  };

  const handleCardDetailsChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateCardDetails = () => {
    // Basic validation
    if (!cardDetails.cardNumber || cardDetails.cardNumber.length < 15) {
      toast.error('Please enter a valid card number');
      return false;
    }
    
    if (!cardDetails.cardName) {
      toast.error('Please enter the cardholder name');
      return false;
    }
    
    if (!cardDetails.expiryDate || !cardDetails.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      toast.error('Please enter a valid CVV');
      return false;
    }
    
    return true;
  };

  const handleProcessPayment = async () => {
    if (!validateCardDetails()) return;
    
    setProcessing(true);
    try {
      // In a real application, this would integrate with a payment processor like Stripe
      // For demo purposes, we'll simulate a payment process
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create payment record in database
      const { data, error } = await supabase
        .from('event_payments')
        .insert([
          {
            event_id: eventId,
            budget_item_id: currentItem.id,
            vendor_id: currentItem.vendor_id,
            amount: parseFloat(currentItem.actual_cost || currentItem.estimated_cost),
            payment_method: paymentMethod,
            status: 'completed',
            transaction_id: `txn_${Date.now()}`,
            payment_date: new Date()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update budget item to mark as paid
      const { error: updateError } = await supabase
        .from('event_budget_items')
        .update({
          is_paid: true,
          payment_date: new Date(),
          updated_at: new Date()
        })
        .eq('id', currentItem.id);
      
      if (updateError) throw updateError;
      
      // If this is a vendor booking, update the booking status
      if (currentItem.vendor_id) {
        const { error: bookingError } = await supabase
          .from('event_vendor_bookings')
          .update({
            payment_status: 'paid',
            updated_at: new Date()
          })
          .eq('event_id', eventId)
          .eq('vendor_id', currentItem.vendor_id);
        
        if (bookingError) {
          console.error('Error updating vendor booking:', bookingError);
        }
      }
      
      toast.success('Payment processed successfully');
      setPaymentDialog(false);
      
      // Refresh payment history
      fetchPaymentHistory();
      
      // Notify parent component
      if (onPaymentComplete) {
        onPaymentComplete(currentItem.id);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const getUnpaidItems = () => {
    return budgetItems.filter(item => !item.is_paid && (item.actual_cost || item.estimated_cost));
  };

  const formatCardNumber = (value) => {
    // Format card number with spaces every 4 digits
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Payment Processing
        </Typography>
      </Box>
      
      {/* Unpaid Items */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Items to Pay
        </Typography>
        
        {getUnpaidItems().length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getUnpaidItems().map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.vendors?.company_name || 'N/A'}</TableCell>
                    <TableCell align="right">
                      ${parseFloat(item.actual_cost || item.estimated_cost).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PaymentIcon />}
                        onClick={() => handlePaymentClick(item)}
                      >
                        Pay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            No unpaid items to display. All items have been paid or no items have costs assigned.
          </Alert>
        )}
      </Paper>
      
      {/* Payment History */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Payment History
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : paymentHistory.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{payment.budget_item?.item_name || 'N/A'}</TableCell>
                    <TableCell>{payment.vendor?.company_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={<CreditCardIcon />}
                        label={payment.payment_method.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${parseFloat(payment.amount).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={payment.status}
                        size="small"
                        color="success"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            No payment history to display. Process a payment to see it here.
          </Alert>
        )}
      </Paper>
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => !processing && setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          {currentItem && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Payment Details
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Item
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentItem.item_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentItem.category}
                  </Typography>
                </Grid>
                {currentItem.vendors && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Vendor
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {currentItem.vendors.company_name}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    ${parseFloat(currentItem.actual_cost || currentItem.estimated_cost).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
                Payment Method
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                  <MenuItem value="debit_card">Debit Card</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
              
              {paymentMethod.includes('card') && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Card Number"
                        name="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={handleCardDetailsChange}
                        placeholder="1234 5678 9012 3456"
                        InputProps={{
                          startAdornment: (
                            <CreditCardIcon color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Cardholder Name"
                        name="cardName"
                        value={cardDetails.cardName}
                        onChange={handleCardDetailsChange}
                        placeholder="John Doe"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        name="expiryDate"
                        value={cardDetails.expiryDate}
                        onChange={handleCardDetailsChange}
                        placeholder="MM/YY"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="CVV"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleCardDetailsChange}
                        type="password"
                        placeholder="123"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {paymentMethod === 'bank_transfer' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  For bank transfers, you will receive instructions after clicking "Process Payment".
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPaymentDialog(false)} 
            disabled={processing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProcessPayment} 
            variant="contained" 
            color="primary"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {processing ? 'Processing...' : 'Process Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentProcessing;