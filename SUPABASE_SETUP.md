# Supabase Setup Guide

To fix the error "relation 'public.profiles' does not exist", you need to create the necessary database tables in your Supabase project. Follow these steps:

## Step 1: Access the Supabase SQL Editor

1. Log in to your Supabase account
2. Go to your project dashboard
3. Click on "SQL Editor" in the left sidebar

## Step 2: Create the Essential Tables

1. In the SQL Editor, create a new query
2. Copy and paste the contents of the `src/lib/supabase-essential-schema.sql` file
3. Run the query

This will create the essential tables needed for authentication and basic functionality:
- `profiles` table (for user profiles)
- `vendors` table (for vendor profiles)
- `admins` table (for admin profiles)

## Step 3: Create Additional Tables (Optional)

If you want to set up all the tables for the full application:

1. In the SQL Editor, create a new query
2. Copy and paste the contents of the `src/lib/supabase-schema.sql` file
3. Run the query
4. Create a new query
5. Copy and paste the contents of the `src/lib/supabase-schema-additions.sql` file
6. Run the query

This will create all the tables needed for the full application, including:
- Event management tables
- Vendor management tables
- Notification tables
- Payment tables
- AI recommendation tables

## Step 4: Restart the Application

After creating the tables, restart the application and try registering again. The error should be resolved.

## Troubleshooting

If you encounter any issues:

1. Check the Supabase SQL Editor for error messages
2. Make sure all the tables were created successfully
3. Check the browser console for any error messages
4. If you still have issues, try clearing your browser cache and reloading the page
