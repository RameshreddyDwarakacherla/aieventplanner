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
  MenuItem
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';

const EXPENSE_CATEGORIES = [
  'Venue',
  'Catering',
  'Decoration',
  'Entertainment',
  'Photography',
  'Transportation',
  'Attire',
  'Gifts',
  'Other'
];

const BudgetPlannerPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    description: '', // This will map to item_name
    amount: '', // This will map to estimated_cost and actual_cost
    vendor_id: null
  });

  useEffect(() => {
    const fetchBudgetData = async () => {
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

        // Try to fetch budget items
        let expensesData = [];
        try {
          const { data, error } = await supabase
            .from('event_budget_items')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

          if (error) {
            if (error.code === '42P01') {
              // Table doesn't exist
              setError('The budget management feature is not available yet. Please ask an administrator to set up the required database tables by going to Admin Dashboard > Database Setup.');
            } else {
              throw error;
            }
          } else {
            expensesData = data || [];

            // If there are budget items with vendor_id, fetch the vendor details separately
            if (expensesData.length > 0) {
              const vendorIds = expensesData
                .filter(item => item.vendor_id)
                .map(item => item.vendor_id);

              if (vendorIds.length > 0) {
                const { data: vendorsData } = await supabase
                  .from('vendors')
                  .select('id, company_name')
                  .in('id', vendorIds);

                if (vendorsData) {
                  const vendorsMap = vendorsData.reduce((acc, vendor) => {
                    acc[vendor.id] = vendor;
                    return acc;
                  }, {});

                  // Add vendor information to each expense item
                  expensesData.forEach(item => {
                    if (item.vendor_id && vendorsMap[item.vendor_id]) {
                      item.vendor = vendorsMap[item.vendor_id];
                    }
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error('Error fetching budget items:', err);
          setError(`Error fetching budget items: ${err.message}`);
        }

        setEvent(eventData);
        setExpenses(expensesData);
      } catch (err) {
        console.error('Error fetching budget data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetData();
  }, [eventId, user]);

  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: '',
      description: '',
      amount: '',
      vendor_id: null
    });
    setDialogOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      description: expense.item_name, // Map from item_name to description
      amount: expense.actual_cost || expense.estimated_cost, // Use actual_cost if available, otherwise estimated_cost
      vendor_id: expense.vendor_id
    });
    setDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const { error } = await supabase
        .from('event_budget_items')
        .delete()
        .eq('id', expenseId);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          throw new Error('The budget management feature is not available yet. Please ask an administrator to set up the required database tables by going to Admin Dashboard > Database Setup.');
        } else {
          throw error;
        }
      }

      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      alert('Expense deleted successfully!');
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError(err.message);
    }
  };

  const handleSubmitExpense = async () => {
    try {
      const expenseData = {
        event_id: eventId,
        category: expenseForm.category,
        item_name: expenseForm.description, // Using item_name instead of description
        estimated_cost: parseFloat(expenseForm.amount), // Using estimated_cost instead of amount
        actual_cost: parseFloat(expenseForm.amount), // Also setting actual_cost
        vendor_id: expenseForm.vendor_id,
        is_paid: false, // Default to not paid
        notes: '' // Empty notes
      };

      let result;
      try {
        if (editingExpense) {
          // Update existing expense
          result = await supabase
            .from('event_budget_items')
            .update(expenseData)
            .eq('id', editingExpense.id);
        } else {
          // Add new expense
          result = await supabase
            .from('event_budget_items')
            .insert([expenseData]);
        }

        if (result.error) {
          if (result.error.code === '42P01') {
            // Table doesn't exist
            throw new Error('The budget management feature is not available yet. Please ask an administrator to set up the required database tables by going to Admin Dashboard > Database Setup.');
          } else {
            throw result.error;
          }
        }

        // Refresh the expenses list
        const { data: updatedExpenses, error: fetchError } = await supabase
          .from('event_budget_items')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          if (fetchError.code === '42P01') {
            // Table doesn't exist
            throw new Error('The budget management feature is not available yet. Please ask an administrator to set up the required database tables by going to Admin Dashboard > Database Setup.');
          } else {
            throw fetchError;
          }
        }

        setExpenses(updatedExpenses || []);
        setDialogOpen(false);
        alert(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
      } catch (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, show a more user-friendly message
          setError('The budget management feature is not available yet. Please ask an administrator to set up the required database tables by going to Admin Dashboard > Database Setup.');
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(err.message);
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + (expense.actual_cost || expense.estimated_cost || 0), 0);
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

  const totalExpenses = calculateTotalExpenses();
  const remainingBudget = event.budget - totalExpenses;
  const budgetStatus = remainingBudget >= 0 ? 'under' : 'over';

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Budget Planner - {event.title}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddExpense}
          >
            Add Expense
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Budget Summary Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Budget Summary
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoneyIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Budget"
                      secondary={`$${event.budget?.toLocaleString() || '0'}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoneyIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Expenses"
                      secondary={`$${totalExpenses.toLocaleString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoneyIcon color={budgetStatus === 'under' ? 'success' : 'error'} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Remaining Budget"
                      secondary={`$${Math.abs(remainingBudget).toLocaleString()}`}
                    />
                  </ListItem>
                </List>
                <Chip
                  label={budgetStatus === 'under' ? 'Under Budget' : 'Over Budget'}
                  color={budgetStatus === 'under' ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Expenses List */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expenses
                </Typography>
                <List>
                  {expenses.map((expense) => (
                    <ListItem
                      key={expense.id}
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEditExpense(expense)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteExpense(expense.id)}
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
                              {expense.item_name}
                            </Typography>
                            <Chip
                              label={expense.category}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            ${(expense.actual_cost || expense.estimated_cost || 0).toLocaleString()}
                            {expense.vendor_id && expense.vendor && ` - ${expense.vendor.company_name || 'Unknown Vendor'}`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                  {expenses.length === 0 && (
                    <ListItem>
                      <ListItemText
                        secondary="No expenses recorded yet. Click 'Add Expense' to get started."
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Category"
            value={expenseForm.category}
            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            fullWidth
            margin="normal"
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Amount"
            type="number"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: <Typography>$</Typography>
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitExpense}
            variant="contained"
            color="primary"
            disabled={
              !expenseForm.category ||
              !expenseForm.description ||
              !expenseForm.amount
            }
          >
            {editingExpense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BudgetPlannerPage;