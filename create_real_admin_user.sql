-- This script creates a real admin user in Supabase

-- Step 1: Create the user in auth.users (this requires admin privileges)
-- Note: In a real application, you would use the Supabase dashboard UI to create users
-- This is just for demonstration purposes

-- Step 2: Create or update the admin profile
DO $$
DECLARE
    admin_id UUID;
    admin_exists BOOLEAN;
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

        RAISE NOTICE 'Admin profile created or updated successfully with ID: %', admin_id;
    ELSE
        RAISE NOTICE 'Admin user does not exist in auth.users. Please create it first:';
        RAISE NOTICE '1. Go to Authentication > Users in the Supabase dashboard';
        RAISE NOTICE '2. Click "Add user"';
        RAISE NOTICE '3. Enter email: admin@example.com';
        RAISE NOTICE '4. Enter password: admin123';
        RAISE NOTICE '5. After creating the user, run this script again to set the admin role.';
    END IF;
END $$;

-- Output confirmation
SELECT 'Script completed. Check the notices for results.' AS message;
