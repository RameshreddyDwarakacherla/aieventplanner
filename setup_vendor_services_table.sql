-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if vendor_services table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendor_services') THEN
        -- Table exists, check if it has the service_name column
        IF NOT EXISTS (SELECT FROM information_schema.columns
                      WHERE table_name = 'vendor_services' AND column_name = 'service_name') THEN
            -- Add service_name column if it doesn't exist
            ALTER TABLE vendor_services ADD COLUMN service_name VARCHAR(255);

            -- If there's a 'name' column, copy data from 'name' to 'service_name'
            IF EXISTS (SELECT FROM information_schema.columns
                      WHERE table_name = 'vendor_services' AND column_name = 'name') THEN
                UPDATE vendor_services SET service_name = name;

                -- Make service_name NOT NULL after data migration
                ALTER TABLE vendor_services ALTER COLUMN service_name SET NOT NULL;
            END IF;
        END IF;
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE vendor_services (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
            service_name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2),
            price_type VARCHAR(50) DEFAULT 'fixed',
            is_available BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_id ON vendor_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_services_service_name ON vendor_services(service_name);

-- Add a comment to the table for documentation
COMMENT ON TABLE vendor_services IS 'Stores services offered by vendors';
COMMENT ON COLUMN vendor_services.service_name IS 'Name of the service offered by the vendor';
