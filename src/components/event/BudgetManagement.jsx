import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaidIcon from '@mui/icons-material/Paid';
import WarningIcon from '@mui/icons-material/Warning';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const EXPENSE_CATEGORIES = [
  'Venue',
  'Catering',
  'Decor',
  'Entertainment',
  'Photography',
  'Videography',
  'Attire',
  'Transportation',
  'Accommodations',
  'Rentals',
  'Printing',
  'Gifts',
  'Miscellaneous'
];

const BudgetManagement = ({ event, budgetItems, onAddBudgetItem, onUpdateBudgetItem, onDeleteBudgetItem }) => {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetAnalysis, setBudgetAnalysis] = useState({
    totalBudget: 0,
    totalEstimated: 0,
    totalActual: 0,
    totalPaid: 0,
    categorySummary: []
  });
  
  const [itemForm, setItemForm] = useState({
    category: '',
    item_name: '',
    estimated_cost: '',
    actual_cost: '',
    vendor_id: null,
    is_paid: false,
    notes: ''
  });

  useEffect(() => {
    if (event && budgetItems) {
      analyzeBudget();
    }
  }, [event, budgetItems]);

  const analyzeBudget = () => {
    // Calculate totals
    const totalEstimated = budgetItems.reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0);
    const totalActual = budgetItems.reduce((sum, item) => sum + parseFloat(item.actual_cost || item.estimated_cost || 0), 0);
    const totalPaid = budgetItems.filter(item => item.is_paid).reduce((sum, item) => sum + parseFloat(item.actual_cost || item.estimated_cost || 0), 0);
    
    // Calculate category breakdown
    const categories = {};
    budgetItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = {
          category: item.category,
          estimated: 0,
          actual: 0,
          count: 0
        };
      }
      
      categories[item.category].estimated += parseFloat(item.estimated_cost || 0);
      categories[item.category].actual += parseFloat(item.actual_cost || item.estimated_cost || 0);
      categories[item.category].count += 1;
    });
    
    const categorySummary = Object.values(categories).sort((a, b) => b.actual - a.actual);
    
    setBudgetAnalysis({
      totalBudget: event.budget || 0,
      totalEstimated,
      totalActual,
      totalPaid,
      categorySummary
    });
  };

  const handleAddItem = () => {
    setCurrentItem(null);
    setItemForm({
      category: '',
      item_name: '',
      estimated_cost: '',
      actual_cost: '',
      vendor_id: null,
      is_paid: false,
      notes: ''
    });
    setDialogOpen(true);
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
    setItemForm({
      category: item.category,
      item_name: item.item_name,
      estimated_cost: item.estimated_cost ? item.estimated_cost.toString() : '',
      actual_cost: item.actual_cost ? item.actual_cost.toString() : '',
      vendor_id: item.vendor_id || null,
      is_paid: item.is_paid || false,
      notes: item.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (item) => {
    setCurrentItem(item);
    setDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setItemForm({
      ...itemForm,
      [name]: name === 'is_paid' ? checked : value
    });
  };

  const handleSubmitItem = async () => {
    try {
      setLoading(true);
      
      // Validate form
      if (!itemForm.category || !itemForm.item_name || !itemForm.estimated_cost) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      const budgetItemData = {
        event_id: event.id,
        category: itemForm.category,
        item_name: itemForm.item_name,
        estimated_cost: parseFloat(itemForm.estimated_cost),
        actual_cost: itemForm.actual_cost ? parseFloat(itemForm.actual_cost) : null,
        vendor_id: itemForm.vendor_id,
        is_paid: itemForm.is_paid,
        notes: itemForm.notes
      };

      if (currentItem) {
        // Update existing item
        await onUpdateBudgetItem(currentItem.id, budgetItemData);
      } else {
        // Create new item
        await onAddBudgetItem(budgetItemData);
      }
      
      setDialogOpen(false);
      analyzeBudget();
    } catch (err) {
      console.error('Error saving budget item:', err);
      toast.error('Failed to save budget item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    try {
      if (!currentItem) return;
      
      await onDeleteBudgetItem(currentItem.id);
      setDeleteDialogOpen(false);
      analyzeBudget();
    } catch (err) {
      console.error('Error deleting budget item:', err);
      toast.error('Failed to delete budget item');
    }
  };

  const getBudgetStatus = () => {
    const { totalBudget, totalActual } = budgetAnalysis;
    
    if (totalActual > totalBudget) {
      return {
        status: 'over',
        message: `Over budget by $${(totalActual - totalBudget).toFixed(2)}`,
        color: 'error'
      };
    } else if (totalActual >= totalBudget * 0.9) {
      return {
        status: 'warning',
        message: `Near budget limit ($${(totalBudget - totalActual).toFixed(2)} remaining)`,
        color: 'warning'
      };
    } else {
      return {
        status: 'good',
        message: `Under budget by $${(totalBudget - totalActual).toFixed(2)}`,
        color: 'success'
      };
    }
  };

  const budgetStatus = getBudgetStatus();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Budget Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddItem}
        >
          Add Expense
        </Button>
      </Box>
      
      {/* Budget Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h4" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                ${budgetAnalysis.totalBudget.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Estimated Expenses
              </Typography>
              <Typography variant="h4" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon color="primary" sx={{ mr: 1 }} />
                ${budgetAnalysis.totalEstimated.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {((budgetAnalysis.totalEstimated / budgetAnalysis.totalBudget) * 100).toFixed(0)}% of budget
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Actual Expenses
              </Typography>
              <Typography variant="h4" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon color={budgetStatus.color} sx={{ mr: 1 }} />
                ${budgetAnalysis.totalActual.toFixed(2)}
              </Typography>
              <Typography variant="body2" color={budgetStatus.color}>
                {budgetStatus.message}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Paid Expenses
              </Typography>
              <Typography variant="h4" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                <PaidIcon color="success" sx={{ mr: 1 }} />
                ${budgetAnalysis.totalPaid.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {((budgetAnalysis.totalPaid / budgetAnalysis.totalActual) * 100 || 0).toFixed(0)}% of actual expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Budget Progress */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Budget Progress
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">
              ${budgetAnalysis.totalActual.toFixed(2)} spent
            </Typography>
            <Typography variant="body2">
              ${budgetAnalysis.totalBudget.toFixed(2)} budget
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min((budgetAnalysis.totalActual / budgetAnalysis.totalBudget) * 100, 100)}
            color={budgetStatus.color}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        {budgetStatus.status === 'over' && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', mt: 1 }}>
            <WarningIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" color="error">
              You are over budget. Consider adjusting your expenses or increasing your budget.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Category Breakdown */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Expense Categories
        </Typography>
        <Grid container spacing={2}>
          {budgetAnalysis.categorySummary.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.category}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    {category.category} ({category.count} items)
                  </Typography>
                  <Typography variant="body2">
                    ${category.actual.toFixed(2)}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((category.actual / budgetAnalysis.totalBudget) * 100, 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {((category.actual / budgetAnalysis.totalActual) * 100).toFixed(0)}% of total expenses
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
      
      {/* Expenses Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="budget items table">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Item</TableCell>
                <TableCell align="right">Estimated</TableCell>
                <TableCell align="right">Actual</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgetItems.length > 0 ? (
                budgetItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {item.item_name}
                      {item.notes && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {item.notes.length > 50 ? `${item.notes.substring(0, 50)}...` : item.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">${parseFloat(item.estimated_cost).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {item.actual_cost ? `$${parseFloat(item.actual_cost).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.is_paid ? 'Paid' : 'Unpaid'}
                        color={item.is_paid ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditItem(item)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(item)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No budget items found. Click "Add Expense" to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentItem ? 'Edit Budget Item' : 'Add Budget Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Category"
                name="category"
                value={itemForm.category}
                onChange={handleInputChange}
                fullWidth
                required
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Item Name"
                name="item_name"
                value={itemForm.item_name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Estimated Cost"
                name="estimated_cost"
                type="number"
                value={itemForm.estimated_cost}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Actual Cost"
                name="actual_cost"
                type="number"
                value={itemForm.actual_cost}
                onChange={handleInputChange}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={itemForm.is_paid}
                    onChange={handleInputChange}
                    name="is_paid"
                    color="success"
                  />
                }
                label="Mark as paid"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Notes"
                name="notes"
                value={itemForm.notes}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitItem}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (currentItem ? 'Save Changes' : 'Add Item')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the budget item "{currentItem?.item_name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteItem} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetManagement;