-- This script sets up Row Level Security (RLS) policies for the event_tasks table

-- First, enable RLS on the event_tasks table if it's not already enabled
ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to insert tasks for their own events
CREATE POLICY "Users can insert tasks for their own events" ON event_tasks
FOR INSERT
WITH CHECK (
  event_id IN (
    SELECT id FROM events WHERE user_id = auth.uid()
  )
);

-- Create a policy that allows users to view tasks for their own events
CREATE POLICY "Users can view tasks for their own events" ON event_tasks
FOR SELECT
USING (
  event_id IN (
    SELECT id FROM events WHERE user_id = auth.uid()
  )
);

-- Create a policy that allows users to update tasks for their own events
CREATE POLICY "Users can update tasks for their own events" ON event_tasks
FOR UPDATE
USING (
  event_id IN (
    SELECT id FROM events WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  event_id IN (
    SELECT id FROM events WHERE user_id = auth.uid()
  )
);

-- Create a policy that allows users to delete tasks for their own events
CREATE POLICY "Users can delete tasks for their own events" ON event_tasks
FOR DELETE
USING (
  event_id IN (
    SELECT id FROM events WHERE user_id = auth.uid()
  )
);

-- Create a policy that allows admins to manage all tasks
CREATE POLICY "Admins can manage all tasks" ON event_tasks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Output confirmation
SELECT 'Event tasks RLS policies have been set up successfully.' AS message;
