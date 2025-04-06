# AI-Personalized Event Planner: Supabase Setup Guide

This comprehensive guide will help you set up the Supabase backend for the AI-Personalized Event Planner application to ensure all features work properly in real-time.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Your OpenAI API key (for AI features)
- The AI-Personalized Event Planner codebase

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign in to your account
2. Click "New Project" and fill in the required information:
   - Organization: Choose your organization or create a new one
   - Name: Choose a name for your project (e.g., "ai-event-planner")
   - Database Password: Create a secure password
   - Region: Choose a region closest to your users
3. Click "Create new project" and wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is created, go to the project dashboard
2. Click on "Settings" in the left sidebar, then "API"
3. Under "Project API keys", you'll find:
   - Project URL: This is your `VITE_SUPABASE_URL`
   - anon/public key: This is your `VITE_SUPABASE_ANON_KEY`
4. Copy these values and create a `.env` file in the root of your project with the following content:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

## Step 3: Set Up the Database Schema

### 3.1 Create the Essential Tables

1. In your Supabase dashboard, click on "SQL Editor" in the left sidebar
2. Click "New query" to create a new SQL query
3. Copy and paste the following SQL code:

```sql
-- Essential tables for AI-Personalized Event Planner

-- Create update_updated_at function for triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles table (extends Supabase auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'vendor', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
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

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  company_name TEXT,
  vendor_type TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
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

CREATE POLICY "Vendors can insert their own profile" 
  ON vendors FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view vendor profiles" 
  ON vendors FOR SELECT 
  USING (TRUE);

-- Admin table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admins
CREATE POLICY "Only admins can view admin data" 
  ON admins FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

4. Click "Run" to execute the query

### 3.2 Create the Main Application Tables

1. Click "New query" to create another SQL query
2. Copy and paste the following SQL code:

```sql
-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  budget NUMERIC(10,2),
  estimated_guests INTEGER,
  status TEXT CHECK (status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planning',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Users can view their own events" 
  ON events FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
  ON events FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" 
  ON events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
  ON events FOR DELETE 
  USING (auth.uid() = user_id);

-- Event Tasks table
CREATE TABLE event_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for event tasks
CREATE POLICY "Users can view their own tasks" 
  ON event_tasks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
  ON event_tasks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" 
  ON event_tasks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
  ON event_tasks FOR DELETE 
  USING (auth.uid() = user_id);

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

-- Vendor Services table
CREATE TABLE vendor_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2),
  price_type TEXT CHECK (price_type IN ('fixed', 'hourly', 'per_person', 'custom')) DEFAULT 'fixed',
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

-- Event Vendor Bookings table
CREATE TABLE event_vendor_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  service_id UUID REFERENCES vendor_services(id),
  status TEXT CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed')) DEFAULT 'requested',
  price NUMERIC(10,2),
  notes TEXT,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')) DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE event_vendor_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for event vendor bookings
CREATE POLICY "Event owners can manage bookings" 
  ON event_vendor_bookings FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM events WHERE id = event_id));

CREATE POLICY "Vendors can view their bookings" 
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
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
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

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_tasks_updated_at
  BEFORE UPDATE ON event_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_guests_updated_at
  BEFORE UPDATE ON event_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendor_services_updated_at
  BEFORE UPDATE ON vendor_services
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
```

3. Click "Run" to execute the query

### 3.3 Create the Additional Tables for Real-Time Features

1. Click "New query" to create another SQL query
2. Copy and paste the following SQL code:

```sql
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

-- System Settings table
CREATE TABLE system_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert OpenAI API key
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('openai.api_key', 'your_openai_api_key_here');

-- Create triggers for new tables with updated_at column
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

3. Click "Run" to execute the query
4. After running the query, go to the "Table Editor" in the left sidebar to verify that all tables have been created successfully

## Step 4: Set Up Real-Time Functionality

To enable real-time functionality, you need to configure Supabase's real-time features:

1. In your Supabase dashboard, go to "Database" in the left sidebar
2. Click on "Replication" in the submenu
3. In the "Supabase Realtime" section, make sure the toggle is set to "On"
4. Click "Save" to apply the changes

Next, enable real-time for specific tables:

1. Scroll down to the "Tables" section
2. For each of the following tables, toggle the "Realtime" switch to "On":
   - profiles
   - events
   - event_tasks
   - event_guests
   - event_vendor_bookings
   - notifications
   - messages
   - conversations
   - payments
   - ai_recommendations
   - ai_vendor_leads
3. Click "Save" to apply the changes

## Step 5: Set Up OpenAI API Key

1. Get your OpenAI API key from [platform.openai.com](https://platform.openai.com/)
2. In your Supabase dashboard, go to "Table Editor" in the left sidebar
3. Select the "system_settings" table
4. Find the row with setting_key = 'openai.api_key'
5. Click "Edit" and update the setting_value with your actual OpenAI API key
6. Click "Save" to apply the changes

## Step 6: Create an Admin User

To access the admin features, you need to create an admin user:

1. Register a new user through the application's registration page
2. In your Supabase dashboard, go to "Table Editor" in the left sidebar
3. Select the "profiles" table
4. Find the user you just created
5. Click "Edit" and change the role to 'admin'
6. Click "Save" to apply the changes
7. Select the "admins" table
8. Click "Insert" to add a new row
9. Enter the user_id of the user you just made an admin
10. Click "Save" to apply the changes

## Step 7: Test the Application

1. Start the application with `npm run dev`
2. Open the application in your browser
3. Register a new user or log in with an existing user
4. Test the following features to ensure they work in real-time:
   - Creating and updating events
   - Adding tasks and guests
   - Booking vendors
   - Sending messages
   - Receiving notifications

## Troubleshooting

### Common Issues and Solutions

1. **"relation 'public.profiles' does not exist" error**
   - Make sure you've run all the SQL queries in the correct order
   - Check the "Table Editor" to verify that the profiles table exists
   - If the table doesn't exist, run the SQL queries again

2. **Authentication issues**
   - Make sure your Supabase URL and anon key are correct in the .env file
   - Check the "Authentication" section in the Supabase dashboard to see if users are being created

3. **Real-time updates not working**
   - Make sure you've enabled real-time for the specific tables
   - Check the browser console for any errors related to Supabase subscriptions
   - Verify that your Supabase client is configured correctly in the code

4. **AI features not working**
   - Make sure your OpenAI API key is correctly set in both the .env file and the system_settings table
   - Check the browser console for any errors related to OpenAI API calls
   - Verify that your OpenAI API key has sufficient credits

## Next Steps

Once you have the application fully set up and working in real-time, you can:

1. **Customize the application**
   - Update the UI to match your brand
   - Add additional features specific to your needs
   - Customize the AI prompts for better recommendations

2. **Deploy the application**
   - Build the application for production with `npm run build`
   - Deploy to a hosting service like Vercel, Netlify, or AWS
   - Set up a custom domain

3. **Scale the application**
   - Upgrade your Supabase plan for higher limits
   - Optimize database queries for better performance
   - Implement caching for frequently accessed data

By following this guide, you should have a fully functional AI-Personalized Event Planner application with real-time features powered by Supabase and AI capabilities powered by OpenAI.
