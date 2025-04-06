-- Supabase SQL Schema for AI-Personalized Event Planner

-- Profiles table (extends Supabase auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'vendor', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  company_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  website TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create policies for vendors
CREATE POLICY "Vendors can view their own profile" 
  ON vendors FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own profile" 
  ON vendors FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view vendor profiles" 
  ON vendors FOR SELECT 
  USING (TRUE);

-- Vendor Services table
CREATE TABLE vendor_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  price_type TEXT CHECK (price_type IN ('fixed', 'starting_at', 'per_person', 'hourly')),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vendor_services ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor services
CREATE POLICY "Vendors can manage their own services" 
  ON vendor_services FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Public can view vendor services" 
  ON vendor_services FOR SELECT 
  USING (TRUE);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  estimated_guests INTEGER,
  budget NUMERIC(10,2),
  status TEXT CHECK (status IN ('planning', 'confirmed', 'completed', 'cancelled')) DEFAULT 'planning',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Users can manage their own events" 
  ON events FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view public events" 
  ON events FOR SELECT 
  USING (is_public = TRUE);

-- Event Tasks table
CREATE TABLE event_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for event tasks
CREATE POLICY "Event owners can manage tasks" 
  ON event_tasks FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM events WHERE id = event_id));

CREATE POLICY "Assigned users can view and update tasks" 
  ON event_tasks FOR SELECT 
  USING (auth.uid() = assigned_to);

CREATE POLICY "Assigned users can update tasks" 
  ON event_tasks FOR UPDATE 
  USING (auth.uid() = assigned_to);

-- Event Budget Items table
CREATE TABLE event_budget_items (
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

-- Event Guests table
CREATE TABLE event_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')) DEFAULT 'pending',
  plus_ones INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;

-- Create policies for event guests
CREATE POLICY "Event owners can manage guests" 
  ON event_guests FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM events WHERE id = event_id));

-- Event Vendor Bookings table
CREATE TABLE event_vendor_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  service_id UUID REFERENCES vendor_services(id),
  status TEXT CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed')) DEFAULT 'requested',
  price NUMERIC(10,2),
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE event_vendor_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for event vendor bookings
CREATE POLICY "Event owners can manage bookings" 
  ON event_vendor_bookings FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM events WHERE id = event_id));

CREATE POLICY "Vendors can view and update their bookings" 
  ON event_vendor_bookings FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

CREATE POLICY "Vendors can update their bookings" 
  ON event_vendor_bookings FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Vendor Reviews table
CREATE TABLE vendor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  event_id UUID REFERENCES events(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor reviews
CREATE POLICY "Users can manage their own reviews" 
  ON vendor_reviews FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view public reviews" 
  ON vendor_reviews FOR SELECT 
  USING (is_public = TRUE);

CREATE POLICY "Vendors can view all their reviews" 
  ON vendor_reviews FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- AI Recommendations table
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  event_id UUID REFERENCES events(id),
  recommendation_type TEXT NOT NULL,
  content JSONB NOT NULL,
  is_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for AI recommendations
CREATE POLICY "Users can view their own recommendations" 
  ON ai_recommendations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" 
  ON ai_recommendations FOR UPDATE 
  USING (auth.uid() = user_id);

-- Admin table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admins
CREATE POLICY "Only admins can view admin data" 
  ON admins FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- System Settings table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system settings
CREATE POLICY "Only admins can manage system settings" 
  ON system_settings FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY "Public can view certain system settings" 
  ON system_settings FOR SELECT 
  USING (setting_key NOT LIKE 'private.%');

-- Create functions and triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendor_services_updated_at
  BEFORE UPDATE ON vendor_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_tasks_updated_at
  BEFORE UPDATE ON event_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_budget_items_updated_at
  BEFORE UPDATE ON event_budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_guests_updated_at
  BEFORE UPDATE ON event_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_vendor_bookings_updated_at
  BEFORE UPDATE ON event_vendor_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendor_reviews_updated_at
  BEFORE UPDATE ON vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();