-- This script fixes the vendor_services table to ensure all required columns exist
-- and data is properly migrated between columns

DO $$
BEGIN
    -- Check if vendor_services table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendor_services') THEN
        -- Add service_name column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns
                      WHERE table_name = 'vendor_services' AND column_name = 'service_name') THEN
            ALTER TABLE vendor_services ADD COLUMN service_name VARCHAR(255);

            -- If there's a 'name' column, copy data from 'name' to 'service_name'
            IF EXISTS (SELECT FROM information_schema.columns
                      WHERE table_name = 'vendor_services' AND column_name = 'name') THEN
                UPDATE vendor_services SET service_name = name;
            ELSE
                -- If there's no name column, set service_name to a default value if it's NULL
                UPDATE vendor_services SET service_name = 'Untitled Service' WHERE service_name IS NULL;
            END IF;
        END IF;

        -- Add title column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns
                      WHERE table_name = 'vendor_services' AND column_name = 'title') THEN
            ALTER TABLE vendor_services ADD COLUMN title VARCHAR(255);

            -- Copy data from service_name to title
            IF EXISTS (SELECT FROM information_schema.columns
                      WHERE table_name = 'vendor_services' AND column_name = 'service_name') THEN
                UPDATE vendor_services SET title = service_name WHERE title IS NULL;
            ELSE
                -- If there's no service_name column, set title to a default value
                UPDATE vendor_services SET title = 'Untitled Service' WHERE title IS NULL;
            END IF;

            -- If name column exists, also copy from name to title for any remaining NULL titles
            IF EXISTS (SELECT FROM information_schema.columns
                      WHERE table_name = 'vendor_services' AND column_name = 'name') THEN
                UPDATE vendor_services SET title = name WHERE title IS NULL;
            END IF;
        END IF;

        -- Add category column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns
                      WHERE table_name = 'vendor_services' AND column_name = 'category') THEN
            ALTER TABLE vendor_services ADD COLUMN category VARCHAR(255) DEFAULT 'General';
        END IF;

        -- Make sure all columns have NOT NULL constraints if needed
        BEGIN
            ALTER TABLE vendor_services ALTER COLUMN title SET NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            -- If there are NULL values, update them first
            UPDATE vendor_services SET title = 'Untitled Service' WHERE title IS NULL;
            ALTER TABLE vendor_services ALTER COLUMN title SET NOT NULL;
        END;

        -- Make sure service_name is not null
        BEGIN
            ALTER TABLE vendor_services ALTER COLUMN service_name SET NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            -- If there are NULL values, update them first
            UPDATE vendor_services SET service_name = title WHERE service_name IS NULL;
            ALTER TABLE vendor_services ALTER COLUMN service_name SET NOT NULL;
        END;

        -- Make sure category is not null
        BEGIN
            ALTER TABLE vendor_services ALTER COLUMN category SET NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            -- If there are NULL values, update them first
            UPDATE vendor_services SET category = 'General' WHERE category IS NULL;
            ALTER TABLE vendor_services ALTER COLUMN category SET NOT NULL;
        END;

        -- Ensure all services have consistent data across service_name and title
        -- First check if name column exists
        IF EXISTS (SELECT FROM information_schema.columns
                  WHERE table_name = 'vendor_services' AND column_name = 'name') THEN
            -- If name column exists, update all columns
            UPDATE vendor_services
            SET
                name = COALESCE(name, service_name, title),
                service_name = COALESCE(service_name, name, title),
                title = COALESCE(title, service_name, name)
            WHERE name IS NULL OR service_name IS NULL OR title IS NULL;
        ELSE
            -- If name column doesn't exist, only update service_name and title
            UPDATE vendor_services
            SET
                service_name = COALESCE(service_name, title),
                title = COALESCE(title, service_name)
            WHERE service_name IS NULL OR title IS NULL;
        END IF;

        RAISE NOTICE 'vendor_services table updated successfully with all required columns.';
    ELSE
        RAISE NOTICE 'vendor_services table does not exist. Please create it first.';
    END IF;
END
$$;
