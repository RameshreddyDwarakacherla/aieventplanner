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
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
