-- Additional tables needed for real-time functionality and payment processing

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  entity_id UUID,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
  ON notifications FOR DELETE 
  USING (auth.uid() = user_id);

-- Messages table for vendor-user communication
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  recipient_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages they sent or received" 
  ON messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create messages they send" 
  ON messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read" 
  ON messages FOR UPDATE 
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id AND (OLD.is_read IS DISTINCT FROM NEW.is_read));

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  event_id UUID REFERENCES events(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" 
  ON conversations FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Users can create conversations" 
  ON conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES event_vendor_bookings(id) NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_method_details JSONB,
  transaction_id TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')) DEFAULT 'pending',
  refunded_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can view their own payments" 
  ON payments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can view payments for their bookings" 
  ON payments FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Admins can view all payments" 
  ON payments FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- Refunds table
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) NOT NULL,
  booking_id UUID REFERENCES event_vendor_bookings(id) NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  reason TEXT,
  refund_id TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Create policies for refunds
CREATE POLICY "Users can view their own refunds" 
  ON refunds FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can view refunds for their bookings" 
  ON refunds FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Admins can view and manage all refunds" 
  ON refunds FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- User Payment Methods table
CREATE TABLE user_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL,
  details JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for user payment methods
CREATE POLICY "Users can manage their own payment methods" 
  ON user_payment_methods FOR ALL 
  USING (auth.uid() = user_id);

-- AI Vendor Leads table
CREATE TABLE ai_vendor_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  match_score INTEGER NOT NULL,
  match_reason TEXT,
  suggested_approach TEXT,
  status TEXT CHECK (status IN ('new', 'contacted', 'converted', 'rejected')) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ai_vendor_leads ENABLE ROW LEVEL SECURITY;

-- Create policies for AI vendor leads
CREATE POLICY "Vendors can view their own leads" 
  ON ai_vendor_leads FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can update their own leads" 
  ON ai_vendor_leads FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Event Feedback Analysis table
CREATE TABLE event_feedback_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  average_rating NUMERIC(3,2),
  sentiment_scores JSONB,
  key_topics JSONB,
  recommendations JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE event_feedback_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for event feedback analysis
CREATE POLICY "Event owners can view feedback analysis" 
  ON event_feedback_analysis FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM events WHERE id = event_id));

-- Create triggers for new tables with updated_at column
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
