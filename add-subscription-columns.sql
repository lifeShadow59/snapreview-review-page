-- Add subscription management columns to businesses table

-- Add subscription_status column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active' 
CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial', 'suspended'));

-- Add qr_codes_enabled column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS qr_codes_enabled BOOLEAN DEFAULT true;

-- Add subscription_expires_at column for tracking expiration
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Add subscription_plan column for different plan types
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'basic';

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_businesses_qr_enabled ON businesses(qr_codes_enabled);

-- Update existing businesses to have active subscription by default
UPDATE businesses 
SET subscription_status = 'active', qr_codes_enabled = true 
WHERE subscription_status IS NULL OR qr_codes_enabled IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name IN ('subscription_status', 'qr_codes_enabled', 'subscription_expires_at', 'subscription_plan')
ORDER BY column_name;