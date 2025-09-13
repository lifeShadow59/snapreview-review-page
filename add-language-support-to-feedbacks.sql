-- Add language support to business_feedbacks table
-- This script adds the language_code column to support multi-language feedback

-- Add language_code column to business_feedbacks table
ALTER TABLE business_feedbacks 
ADD COLUMN IF NOT EXISTS language_code VARCHAR(10) DEFAULT 'en';

-- Create index for better performance on language-based queries
CREATE INDEX IF NOT EXISTS idx_business_feedbacks_language ON business_feedbacks(business_id, language_code);

-- Update existing feedbacks to have default language code 'en' if they don't have one
UPDATE business_feedbacks 
SET language_code = 'en' 
WHERE language_code IS NULL;

-- Make language_code NOT NULL after setting defaults
ALTER TABLE business_feedbacks 
ALTER COLUMN language_code SET NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'business_feedbacks' 
AND table_schema = 'public'
ORDER BY ordinal_position;