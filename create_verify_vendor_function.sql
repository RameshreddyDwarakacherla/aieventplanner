-- Create a stored procedure to verify a vendor
CREATE OR REPLACE FUNCTION verify_vendor(vendor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the vendor's verification status
  UPDATE vendors
  SET 
    is_verified = TRUE,
    updated_at = NOW()
  WHERE id = vendor_id;
  
  -- Return success
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error verifying vendor: %', SQLERRM;
    RETURN FALSE;
END;
$$;
