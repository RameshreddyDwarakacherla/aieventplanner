import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Box, Button, Typography, Alert, CircularProgress, Paper, TextField, Divider, Link } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const CreateBudgetTable = () => {
  const [copied, setCopied] = useState(false);
  const [checkingTable, setCheckingTable] = useState(false);
  const [tableExists, setTableExists] = useState(false);
  const [error, setError] = useState(null);

  // SQL script to create the event_budget_items table
  const sqlScript = `-- Create a function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = $1
  ) INTO table_exists;

  RETURN table_exists;
END;
$$;

-- Create the event_budget_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  estimated_cost NUMERIC(10,2) NOT NULL,
  actual_cost NUMERIC(10,2),
  vendor_id UUID REFERENCES vendors(id),
  is_paid BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE event_budget_items ENABLE ROW LEVEL SECURITY;

-- Create policies for event budget items
CREATE POLICY "Event owners can manage budget items"
  ON event_budget_items FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM events WHERE id = event_id));

-- Create policy for admin access
CREATE POLICY "Admins can access all budget items"
  ON event_budget_items FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkTableExists = async () => {
    try {
      setCheckingTable(true);
      setError(null);

      // Try to query the table using a simple approach
      const { error } = await supabase
        .from('event_budget_items')
        .select('id')
        .limit(1);

      // If there's no error, the table exists
      if (!error) {
        setTableExists(true);
      } else {
        // If we get a 42P01 error, the table doesn't exist
        if (error.code === '42P01') {
          setTableExists(false);
        } else {
          // For any other error, we'll assume the table doesn't exist
          console.error('Error checking table:', error);
          setTableExists(false);
          setError('Unable to determine if the table exists. Please follow the instructions below to create it.');
        }
      }
    } catch (err) {
      console.error('Error checking table:', err);
      setTableExists(false);
      setError('An error occurred while checking if the table exists. Please follow the instructions below to create it.');
    } finally {
      setCheckingTable(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Budget Table Setup
      </Typography>

      <Typography variant="body1" paragraph>
        The event_budget_items table is required for the budget management feature to work properly.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={checkTableExists}
          disabled={checkingTable}
          startIcon={checkingTable && <CircularProgress size={20} color="inherit" />}
          sx={{ mb: 2 }}
        >
          {checkingTable ? 'Checking...' : 'Check if Table Exists'}
        </Button>

        {tableExists && (
          <Alert severity="success" sx={{ mt: 2 }}>
            The event_budget_items table exists! The budget management feature should work properly.
          </Alert>
        )}

        {tableExists === false && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            The event_budget_items table does not exist. Please follow the instructions below to create it.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error: {error}
          </Alert>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Instructions for Database Administrator
      </Typography>

      <Typography variant="body1" paragraph>
        To create the event_budget_items table, you need to run the following SQL script in the Supabase SQL Editor:
      </Typography>

      <Box sx={{ position: 'relative', mb: 3 }}>
        <TextField
          multiline
          fullWidth
          variant="outlined"
          value={sqlScript}
          InputProps={{
            readOnly: true,
            sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
          }}
          rows={15}
        />
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={copyToClipboard}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </Box>

      <Typography variant="body1" paragraph>
        Steps to create the table:
      </Typography>

      <ol>
        <li>
          <Typography variant="body1" paragraph>
            Go to the <Link href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">Supabase Dashboard</Link> and sign in.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            Select your project.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            Go to the SQL Editor in the left sidebar.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            Create a new query, paste the SQL script above, and run it.
          </Typography>
        </li>
        <li>
          <Typography variant="body1" paragraph>
            After running the script, come back here and click "Check if Table Exists" to verify that the table was created successfully.
          </Typography>
        </li>
      </ol>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        Note: Only database administrators can create tables in Supabase. If you don't have access to the Supabase Dashboard, please contact your administrator.
      </Typography>
    </Paper>
  );
};


export default CreateBudgetTable;
