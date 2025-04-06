# Admin User Setup Instructions

This document provides instructions for setting up an admin user in the AI-Personalized Event Planner application.

## Admin Credentials

The application is configured to use the following admin credentials:

- **Email:** admin@ai.com
- **Password:** Ramesh@143

## Setup Instructions

To set up the admin user in Supabase:

1. **Create the User in Supabase Authentication**:
   - Go to the Supabase dashboard: https://app.supabase.com/
   - Select your project (with URL: https://mnfjcniiktlaoardnftx.supabase.co)
   - Navigate to "Authentication" → "Users"
   - Click "Add user" or "Invite user"
   - Enter email: admin@ai.com
   - Enter password: Ramesh@143
   - Make sure "Auto-confirm email" is checked (if available)
   - Click "Create user" or "Invite"

2. **Set the Admin Role in the Profiles Table**:
   - After creating the user, note the UUID of the user from the Authentication → Users page
   - Go to the SQL Editor in Supabase
   - Run the following SQL (replace USER_ID with the actual UUID from step 1):

```sql
INSERT INTO profiles (id, email, role, first_name, last_name, created_at, updated_at)
VALUES (
    'USER_ID', -- Replace with the actual UUID from the auth.users table
    'admin@ai.com',
    'admin',
    'Admin',
    'User',
    NOW(),
    NOW()
)
ON CONFLICT (id)
DO UPDATE SET
    role = 'admin',
    updated_at = NOW();
```

3. **Verify the Admin User**:
   - Go to the Table Editor in Supabase
   - Select the "profiles" table
   - Verify that there is a record with email "admin@ai.com" and role "admin"

## Using the Admin Account

1. Go to the application's login page
2. Enter the admin credentials:
   - Email: admin@ai.com
   - Password: Ramesh@143
3. Click "Sign In" or use the "Use Admin Login" button
4. You should be redirected to the admin dashboard

## Troubleshooting

If you encounter issues with the admin login:

1. **Check the User in Supabase**:
   - Verify that the user exists in Authentication → Users
   - Verify that the user has a corresponding record in the profiles table with email = 'admin@ai.com' and role = 'admin'

2. **Clear Browser Data**:
   - Clear your browser's localStorage by clicking the "Reset App State" button on the login page
   - Or manually clear localStorage in your browser's developer tools

3. **Check Console Errors**:
   - Open your browser's developer tools (F12)
   - Check the Console tab for any error messages
   - Look for messages related to authentication or role determination
