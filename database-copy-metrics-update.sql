-- Database Schema Update for Copy Metrics Tracking
-- Add copy tracking functionality to business_metrics system

-- Create business_copy_metrics table for language-specific copy tracking
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

-- Add total_copy_count column to existing business_metrics table
ALTER TABLE business_metrics 
ADD COLUMN IF NOT EXISTS total_copy_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_copy_metrics_business_id ON business_copy_metrics(business_id);
CREATE INDEX IF NOT EXISTS idx_business_copy_metrics_language ON business_copy_metrics(language_code);
CREATE INDEX IF NOT EXISTS idx_business_copy_metrics_timestamp ON business_copy_metrics(last_copy_timestamp);

-- Create trigger function to update total_copy_count in business_metrics
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

-- Create trigger to automatically update total_copy_count
DROP TRIGGER IF EXISTS trigger_update_total_copy_count ON business_copy_metrics;
CREATE TRIGGER trigger_update_total_copy_count
    AFTER INSERT OR UPDATE ON business_copy_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_total_copy_count();

-- Sample queries for testing
-- Check copy metrics: SELECT * FROM business_copy_metrics WHERE business_id = 'your-business-id';
-- Check total metrics: SELECT * FROM business_metrics WHERE business_id = 'your-business-id';