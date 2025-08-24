-- Database Schema Update for Feedback Tracking and Analytics
-- This file contains the SQL commands needed to add tracking functionality

-- Create feedback_analytics table for tracking copy interactions
CREATE TABLE IF NOT EXISTS feedback_analytics (
  id SERIAL PRIMARY KEY,
  business_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  copy_count INTEGER DEFAULT 0,
  last_copy_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_business_language UNIQUE(business_id, language_code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_analytics_business_id ON feedback_analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analytics_timestamp ON feedback_analytics(last_copy_timestamp);
CREATE INDEX IF NOT EXISTS idx_feedback_analytics_language ON feedback_analytics(language_code);

-- Optional: Create feedback_storage table for temporary feedback storage
-- (This can be used if you want to store generated feedback temporarily)
CREATE TABLE IF NOT EXISTS feedback_storage (
  id SERIAL PRIMARY KEY,
  business_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Create index for feedback storage
CREATE INDEX IF NOT EXISTS idx_feedback_storage_business_lang ON feedback_storage(business_id, language_code);
CREATE INDEX IF NOT EXISTS idx_feedback_storage_expires ON feedback_storage(expires_at);

-- Add foreign key constraint if businesses table exists
-- ALTER TABLE feedback_analytics ADD CONSTRAINT fk_feedback_analytics_business 
-- FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- Sample data for testing (optional)
-- INSERT INTO business_language_preferences (business_id, language_code, language_name) VALUES
-- ('your-test-business-uuid', 'en', 'English'),
-- ('your-test-business-uuid', 'hi', 'हिंदी'),
-- ('your-test-business-uuid', 'gu', 'ગુજરાતી');

-- Query to check existing language preferences
-- SELECT * FROM business_language_preferences WHERE business_id = 'your-business-id';

-- Query to check analytics data
-- SELECT * FROM feedback_analytics WHERE business_id = 'your-business-id';