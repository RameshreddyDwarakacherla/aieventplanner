-- This script creates an admin user in the profiles table

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

-- Create the admin user in auth.users (this requires admin privileges)
-- Note: In a real application, you would use the Supabase dashboard UI to create users
-- This is just for demonstration purposes
DO $$
DECLARE
    admin_exists BOOLEAN;
    admin_id UUID;
BEGIN
    -- Check if the admin user exists in auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'admin@example.com'
    ) INTO admin_exists;
    
    IF admin_exists THEN
        -- Get the admin user ID
        SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com';
        
        -- Insert or update the admin profile
        INSERT INTO profiles (id, email, role, first_name, last_name, created_at, updated_at)
        VALUES (
            admin_id, 
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
            updated_at = NOW();
            
        RAISE NOTICE 'Admin profile created or updated successfully.';
    ELSE
        RAISE NOTICE 'Admin user does not exist in auth.users. Please create it first:';
        RAISE NOTICE '1. Go to Authentication > Users';
        RAISE NOTICE '2. Click "Invite user"';
        RAISE NOTICE '3. Enter email: admin@example.com';
        RAISE NOTICE '4. After creating the user, run this script again to set the admin role.';
    END IF;
END $$;

-- Output confirmation
SELECT 'Script completed. Check the notices for results.' AS message;
