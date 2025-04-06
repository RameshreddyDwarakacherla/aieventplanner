-- This script helps set up the admin user with email admin@ai.com

-- Step 1: Check if the admin user exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@ai.com';

-- If the above query returns a user ID, use it in the following query
-- If not, you need to create the user in the Supabase Authentication UI first

-- Step 2: Insert or update the admin profile
-- Replace USER_ID with the actual UUID from the auth.users table if the user exists
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
    email = 'admin@ai.com',
    updated_at = NOW();

-- Step 3: Verify the admin profile was created
SELECT * FROM profiles WHERE email = 'admin@ai.com';

-- Note: If the admin user doesn't exist in auth.users, follow these steps:
-- 1. Go to Authentication → Users in the Supabase dashboard
-- 2. Click "Add user" or "Invite user"
-- 3. Enter email: admin@ai.com
-- 4. Enter password: Ramesh@143
-- 5. Make sure "Auto-confirm email" is checked (if available)
-- 6. Click "Create user" or "Invite"
-- 7. Get the UUID of the created user
-- 8. Run the INSERT statement above with the correct UUID
