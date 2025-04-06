-- This script directly creates or updates an admin user in the profiles table

-- First, check if the profiles table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Create the profiles table if it doesn't exist
        CREATE TABLE profiles (
            id UUID PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Insert or update the admin profile
INSERT INTO profiles (
    id, 
    email, 
    role, 
    first_name, 
    last_name, 
    created_at, 
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- Use a fixed UUID for the admin
    'admin@example.com', 
    'admin', 
    'Admin', 
    'User', 
    NOW(), 
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    email = 'admin@example.com',
    first_name = 'Admin',
    last_name = 'User',
    updated_at = NOW();

-- Output confirmation
SELECT 'Admin user created or updated successfully.' AS message;
