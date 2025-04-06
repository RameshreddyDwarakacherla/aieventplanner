-- This script creates an admin user for testing purposes

-- First, check if the admin user already exists
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    -- Check if the admin user exists in auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'admin@example.com'
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Create the admin user in auth.users (this requires admin privileges)
        -- Note: In a real application, you would use the Supabase dashboard UI to create users
        -- This is just for demonstration purposes
        
        -- Instead, output instructions for creating the user manually
        RAISE NOTICE 'Admin user does not exist. Please create it manually through the Supabase dashboard:';
        RAISE NOTICE '1. Go to Authentication > Users';
        RAISE NOTICE '2. Click "Invite user"';
        RAISE NOTICE '3. Enter email: admin@example.com';
        RAISE NOTICE '4. After creating the user, set their password to "admin123"';
    ELSE
        RAISE NOTICE 'Admin user already exists.';
    END IF;
    
    -- Check if the admin user exists in the profiles table
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE email = 'admin@example.com' AND role = 'admin'
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Get the user ID from auth.users
        DECLARE
            admin_id UUID;
        BEGIN
            SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com';
            
            IF admin_id IS NOT NULL THEN
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
                RAISE NOTICE 'Could not find admin user ID. Please create the user first.';
            END IF;
        END;
    ELSE
        RAISE NOTICE 'Admin profile already exists with admin role.';
    END IF;
END $$;
