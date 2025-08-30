# Subscription-Based QR Code System

## Overview
This system implements subscription-based access control for QR code review pages. When users scan a QR code, the system checks the business's subscription status before allowing access to the review page.

## Database Schema Changes

### New Columns in `businesses` table:
- `subscription_status` - VARCHAR(20) with values: 'active', 'cancelled', 'expired', 'trial', 'suspended'
- `qr_codes_enabled` - BOOLEAN to specifically control QR code access
- `subscription_expires_at` - TIMESTAMP for expiration tracking
- `subscription_plan` - VARCHAR(50) for different plan types

## How It Works

### 1. QR Code Access Flow
```
User scans QR → Review page loads → Subscription check → Show content or error
```

### 2. Subscription Validation Logic
The system checks multiple conditions:
- Business exists and is active
- Subscription status is 'active' or 'trial'
- Subscription hasn't expired (if expiration date is set)
- QR codes are specifically enabled for the business

### 3. Error Handling
If any condition fails, users see a branded error page with:
- Clear explanation of the issue
- Business name (if available)
- Appropriate contact information
- Professional SnapReview.ai branding

## Implementation Files

### Core Files:
1. **`src/lib/subscription.ts`** - Subscription validation logic
2. **`src/components/subscription/SubscriptionError.tsx`** - Error page component
3. **`src/app/review/[id]/page.tsx`** - Updated review page with validation
4. **`src/app/api/businesses/[id]/subscription/route.ts`** - API for subscription management

### Database Files:
1. **`add-subscription-columns.sql`** - Adds subscription columns to existing database
2. **`test-subscription.sql`** - Test cases for different subscription scenarios

## API Endpoints

### GET `/api/businesses/[id]/subscription`
Check subscription status for a business.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "isActive": true,
    "qrCodesEnabled": true,
    "subscriptionStatus": "active",
    "subscriptionPlan": "basic",
    "expiresAt": null,
    "businessName": "Business Name",
    "reason": null
  }
}
```

### POST `/api/businesses/[id]/subscription`
Update subscription status for a business.

**Request Body:**
```json
{
  "subscription_status": "cancelled",
  "qr_codes_enabled": false,
  "subscription_expires_at": "2024-12-31T23:59:59Z"
}
```

## Usage Examples

### 1. Disable QR codes for a business:
```sql
UPDATE businesses 
SET subscription_status = 'cancelled', qr_codes_enabled = false 
WHERE id = 'business-uuid';
```

### 2. Set trial subscription with expiration:
```sql
UPDATE businesses 
SET subscription_status = 'trial', 
    qr_codes_enabled = true,
    subscription_expires_at = '2025-01-31 23:59:59'
WHERE id = 'business-uuid';
```

### 3. Reactivate subscription:
```sql
UPDATE businesses 
SET subscription_status = 'active', 
    qr_codes_enabled = true,
    subscription_expires_at = NULL
WHERE id = 'business-uuid';
```

## Error Page Features

The subscription error page shows different messages based on the issue:

- **Cancelled**: "Subscription has been cancelled"
- **Expired**: "Subscription has expired" with expiration date
- **Suspended**: "Account has been suspended"
- **QR Disabled**: "QR codes are disabled for this business"
- **Not Found**: "Business not found or invalid QR code"

## Testing

1. **Run database setup:**
   ```sql
   -- Execute add-subscription-columns.sql
   ```

2. **Test different scenarios:**
   ```sql
   -- Execute test-subscription.sql
   ```

3. **Test QR code access:**
   - Visit: `https://review.snapreview.ai/review/[business-id]`
   - Should show error page when subscription is inactive
   - Should show normal review page when subscription is active

## Benefits

1. **Revenue Protection**: Only paying customers can use QR codes
2. **Flexible Control**: Can disable QR codes without affecting other features
3. **Professional Experience**: Users see branded error pages instead of generic errors
4. **Easy Management**: Simple API and SQL commands for subscription management
5. **Granular Control**: Can control QR access separately from other business features

## Future Enhancements

- Automatic expiration handling with cron jobs
- Email notifications for expiring subscriptions
- Usage analytics per subscription plan
- Bulk subscription management tools
- Integration with payment systems for automatic updates