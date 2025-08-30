import pool from "@/lib/db";

export interface SubscriptionStatus {
  isActive: boolean;
  qrCodesEnabled: boolean;
  subscriptionStatus: string;
  subscriptionPlan: string;
  expiresAt: Date | null;
  businessName: string;
  reason?: string;
}

export async function checkBusinessSubscription(businessId: string): Promise<SubscriptionStatus> {
  try {
    // First check if subscription columns exist
    const columnCheckQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'businesses' 
      AND column_name IN ('subscription_status', 'qr_codes_enabled', 'subscription_expires_at', 'subscription_plan')
    `;
    
    const columnCheck = await pool.query(columnCheckQuery);
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    
    // Build query based on existing columns
    let query = `
      SELECT 
        b.name,
        b.status as business_status
    `;
    
    if (existingColumns.includes('subscription_status')) {
      query += `, b.subscription_status`;
    }
    if (existingColumns.includes('qr_codes_enabled')) {
      query += `, b.qr_codes_enabled`;
    }
    if (existingColumns.includes('subscription_expires_at')) {
      query += `, b.subscription_expires_at`;
    }
    if (existingColumns.includes('subscription_plan')) {
      query += `, b.subscription_plan`;
    }
    
    query += ` FROM businesses b WHERE b.id = $1`;

    const result = await pool.query(query, [businessId]);
    
    if (result.rows.length === 0) {
      return {
        isActive: false,
        qrCodesEnabled: false,
        subscriptionStatus: 'not_found',
        subscriptionPlan: 'none',
        expiresAt: null,
        businessName: 'Unknown',
        reason: 'Business not found'
      };
    }

    const business = result.rows[0];
    
    // Check if business is active
    if (business.business_status !== 'active') {
      return {
        isActive: false,
        qrCodesEnabled: false,
        subscriptionStatus: business.subscription_status || 'inactive',
        subscriptionPlan: business.subscription_plan || 'none',
        expiresAt: business.subscription_expires_at || null,
        businessName: business.name,
        reason: 'Business account is inactive'
      };
    }

    // If subscription columns don't exist, assume active (backward compatibility)
    if (!existingColumns.includes('subscription_status')) {
      return {
        isActive: true,
        qrCodesEnabled: true,
        subscriptionStatus: 'active',
        subscriptionPlan: 'basic',
        expiresAt: null,
        businessName: business.name,
        reason: undefined
      };
    }

    // Check subscription status
    const activeStatuses = ['active', 'trial'];
    const subscriptionStatus = business.subscription_status || 'active';
    const isSubscriptionActive = activeStatuses.includes(subscriptionStatus);
    
    // Check if subscription has expired
    let isExpired = false;
    if (business.subscription_expires_at) {
      isExpired = new Date() > new Date(business.subscription_expires_at);
    }

    // Check QR codes specifically enabled (default to true if column doesn't exist)
    const qrCodesEnabled = existingColumns.includes('qr_codes_enabled') 
      ? business.qr_codes_enabled === true 
      : true;

    // Determine overall status
    const isActive = isSubscriptionActive && !isExpired && qrCodesEnabled;

    let reason = '';
    if (!isSubscriptionActive) {
      reason = `Subscription is ${subscriptionStatus}`;
    } else if (isExpired) {
      reason = 'Subscription has expired';
    } else if (!qrCodesEnabled) {
      reason = 'QR codes are disabled for this business';
    }

    return {
      isActive,
      qrCodesEnabled,
      subscriptionStatus: subscriptionStatus,
      subscriptionPlan: business.subscription_plan || 'basic',
      expiresAt: business.subscription_expires_at || null,
      businessName: business.name,
      reason: reason || undefined
    };

  } catch (error) {
    console.error('Error checking business subscription:', error);
    return {
      isActive: false,
      qrCodesEnabled: false,
      subscriptionStatus: 'error',
      subscriptionPlan: 'none',
      expiresAt: null,
      businessName: 'Unknown',
      reason: 'Database error occurred'
    };
  }
}

export function getSubscriptionErrorMessage(status: SubscriptionStatus): string {
  if (status.reason) {
    return status.reason;
  }

  switch (status.subscriptionStatus) {
    case 'cancelled':
      return 'This business subscription has been cancelled. Please contact support to reactivate.';
    case 'expired':
      return 'This business subscription has expired. Please renew to continue using QR codes.';
    case 'suspended':
      return 'This business account has been suspended. Please contact support.';
    case 'not_found':
      return 'Business not found or invalid QR code.';
    default:
      return 'QR code access is currently unavailable for this business.';
  }
}