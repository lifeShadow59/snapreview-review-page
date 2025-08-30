-- Check if subscription columns exist in businesses table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'businesses' 
AND column_name IN ('subscription_status', 'qr_codes_enabled', 'subscription_expires_at', 'subscription_plan')
ORDER BY column_name;

-- If no results, the columns don't exist and you need to run the migration
-- If you see results, the columns exist

-- Check current businesses table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'businesses'
ORDER BY ordinal_position;