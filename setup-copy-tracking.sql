-- Setup Copy Tracking Tables
-- Run this script to create the required tables for copy tracking

-- Step 1: Add total_copy_count column to business_metrics if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_metrics' 
        AND column_name = 'total_copy_count'
    ) THEN
        ALTER TABLE business_metrics ADD COLUMN total_copy_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_copy_count column to business_metrics table';
    ELSE
        RAISE NOTICE 'total_copy_count column already exists in business_metrics table';
    END IF;
END $$;

-- Step 2: Create business_copy_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS business_copy_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    copy_count INTEGER DEFAULT 0,
    last_copy_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_business_language_copy UNIQUE(business_id, language_code)
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_copy_metrics_business_id ON business_copy_metrics(business_id);
CREATE INDEX IF NOT EXISTS idx_business_copy_metrics_language ON business_copy_metrics(language_code);
CREATE INDEX IF NOT EXISTS idx_business_copy_metrics_timestamp ON business_copy_metrics(last_copy_timestamp);

-- Step 4: Create trigger function to update total_copy_count
CREATE OR REPLACE FUNCTION update_total_copy_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_copy_count in business_metrics table
    UPDATE business_metrics 
    SET total_copy_count = (
        SELECT COALESCE(SUM(copy_count), 0) 
        FROM business_copy_metrics 
        WHERE business_id = NEW.business_id
    ),
    last_updated = NOW()
    WHERE business_id = NEW.business_id;
    
    -- Create business_metrics record if it doesn't exist
    INSERT INTO business_metrics (business_id, total_copy_count, last_updated)
    VALUES (NEW.business_id, NEW.copy_count, NOW())
    ON CONFLICT (business_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically update total_copy_count
DROP TRIGGER IF EXISTS trigger_update_total_copy_count ON business_copy_metrics;
CREATE TRIGGER trigger_update_total_copy_count
    AFTER INSERT OR UPDATE ON business_copy_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_total_copy_count();

-- Step 6: Verify setup
SELECT 'Setup completed successfully!' as status;

-- Check tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_metrics') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as business_metrics_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_copy_metrics') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as business_copy_metrics_table;

-- Check if total_copy_count column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'business_metrics' 
            AND column_name = 'total_copy_count'
        ) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as total_copy_count_column;

-- Check trigger function exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'update_total_copy_count'
        ) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as trigger_function;

-- Check trigger exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_update_total_copy_count'
        ) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as trigger;