-- Test Subscription Functionality
-- Run these commands to test the subscription system

-- 1. First, make sure the subscription columns exist (run add-subscription-columns.sql first)

-- 2. Test Case 1: Active subscription (should work)
UPDATE businesses 
SET subscription_status = 'active', qr_codes_enabled = true 
WHERE id = '3b0a5374-cf9e-4c13-a34f-8ad5a61fe477';

-- Check the business
SELECT id, name, subscription_status, qr_codes_enabled, subscription_expires_at 
FROM businesses 
WHERE id = '3b0a5374-cf9e-4c13-a34f-8ad5a61fe477';

-- 3. Test Case 2: Cancelled subscription (should show error page)
UPDATE businesses 
SET subscription_status = 'cancelled', qr_codes_enabled = false 
WHERE id = '3b0a5374-cf9e-4c13-a34f-8ad5a61fe477';

-- 4. Test Case 3: Expired subscription
UPDATE businesses 
SET subscription_status = 'expired', 
    qr_codes_enabled = false,
    subscription_expires_at = '2024-01-01 00:00:00'
WHERE id = '3b0a5374-cf9e-4c13-a34f-8ad5a61fe477';

-- 5. Test Case 4: Active subscription but QR codes disabled
UPDATE businesses 
SET subscription_status = 'active', 
    qr_codes_enabled = false
WHERE id = '3b0a5374-cf9e-4c13-a34f-8ad5a61fe477';

-- 6. Test Case 5: Trial subscription (should work)
UPDATE businesses 
SET subscription_status = 'trial', 
    qr_codes_enabled = true,
    subscription_expires_at = '2025-12-31 23:59:59'
WHERE id = '3b0a5374-cf9e-4c13-a34f-8ad5a61fe477';

-- 7. Reset to active for normal use
UPDATE businesses 
SET subscription_status = 'active', 
    qr_codes_enabled = true,
    subscription_expires_at = NULL
WHERE id = '3b0a5374-cf9e-4c13-a34f-8ad5a61fe477';

-- Check all businesses subscription status
SELECT 
    id, 
    name, 
    subscription_status, 
    qr_codes_enabled, 
    subscription_expires_at,
    CASE 
        WHEN subscription_status IN ('active', 'trial') 
             AND qr_codes_enabled = true 
             AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
        THEN 'QR_ACTIVE'
        ELSE 'QR_INACTIVE'
    END as qr_status
FROM businesses 
ORDER BY name;