# AI-Personalized Event Planner Setup Guide

This guide will help you set up the AI-Personalized Event Planner application with Supabase as the backend.

## Current Status

The application is currently running in a "demo mode" where it can register and log in users without requiring the database tables to be set up. This allows you to explore the UI and functionality without having to set up the database first.

However, to get the full functionality with real-time features, you'll need to set up the database tables in Supabase.

## Step 1: Set Up Supabase

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com/) and sign up for an account if you don't have one
   - Create a new project

2. **Get Your Supabase Credentials**
   - Go to your project settings
   - Find your project URL and anon key
   - Update the `.env` file with your credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

## Step 2: Set Up the Database Tables

1. **Access the Supabase SQL Editor**
   - Log in to your Supabase account
   - Go to your project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Create the Essential Tables**
   - In the SQL Editor, create a new query
   - Copy and paste the contents of the `src/lib/supabase-essential-schema.sql` file
   - Run the query

3. **Create the Main Application Tables**
   - In the SQL Editor, create a new query
   - Copy and paste the contents of the `src/lib/supabase-schema.sql` file
   - Run the query

4. **Create the Additional Tables for Real-Time Features**
   - In the SQL Editor, create a new query
   - Copy and paste the contents of the `src/lib/supabase-schema-additions.sql` file
   - Run the query

## Step 3: Set Up OpenAI API Key (for AI Features)

1. **Get an OpenAI API Key**
   - Go to [platform.openai.com](https://platform.openai.com/) and sign up for an account
   - Create an API key

2. **Add the API Key to Your Environment**
   - Update the `.env` file with your OpenAI API key:
     ```
     VITE_OPENAI_API_KEY=your_openai_api_key
     ```

## Step 4: Enable Full Functionality

Once you've set up the database tables and API keys, you'll need to update the code to use the full functionality:

1. **Update AuthContext.jsx**
   - Open `src/contexts/AuthContext.jsx`
   - Find the commented-out code for profile creation and uncomment it
   - Remove the "demo mode" code

2. **Update RegisterPage.jsx**
   - Open `src/pages/auth/RegisterPage.jsx`
   - Find the commented-out code for profile updates and uncomment it
   - Remove the "demo mode" code

3. **Update LoginPage.jsx**
   - Open `src/pages/auth/LoginPage.jsx`
   - Find the commented-out code for role-based routing and uncomment it
   - Remove the "demo mode" code

## Step 5: Test the Application

1. **Register a New User**
   - Go to the registration page
   - Fill in the form and submit
   - Check your email for the confirmation link

2. **Log In**
   - Go to the login page
   - Enter your credentials
   - You should be redirected to the appropriate dashboard based on your role

3. **Test Real-Time Features**
   - Create a new event
   - Add tasks, guests, and vendors
   - Open the application in another browser or tab
   - Make changes in one tab and observe the updates in the other

## Troubleshooting

If you encounter any issues:

1. **Check the Browser Console**
   - Open the browser developer tools (F12)
   - Look for any error messages in the console

2. **Check the Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Check the "Authentication" section to see if users are being created
   - Check the "Table Editor" to see if data is being stored correctly

3. **Check the Environment Variables**
   - Make sure your `.env` file has the correct Supabase URL and anon key
   - Make sure your OpenAI API key is valid

4. **Check the SQL Queries**
   - Make sure all the SQL queries ran successfully
   - Check for any error messages in the SQL Editor

## Next Steps

Once you have the application fully set up, you can:

1. **Customize the UI**
   - Update the styles in the Material UI theme
   - Add your own logo and branding

2. **Add More Features**
   - Implement additional AI features
   - Add more payment options
   - Enhance the vendor marketplace

3. **Deploy the Application**
   - Build the application for production
   - Deploy it to a hosting service like Vercel, Netlify, or AWS

## Support

If you need help or have questions, please reach out to the development team.
