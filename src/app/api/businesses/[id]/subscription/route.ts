import { NextRequest, NextResponse } from "next/server";
import { checkBusinessSubscription } from "@/lib/subscription";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // Validate business ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json(
        { error: "Invalid business ID format" },
        { status: 400 }
      );
    }

    const subscriptionStatus = await checkBusinessSubscription(businessId);

    return NextResponse.json({
      success: true,
      subscription: subscriptionStatus
    });

  } catch (error: unknown) {
    console.error("Error checking subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      subscription: {
        isActive: false,
        qrCodesEnabled: false,
        subscriptionStatus: 'error',
        subscriptionPlan: 'none',
        expiresAt: null,
        businessName: 'Unknown',
        reason: 'Server error occurred'
      }
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const { subscription_status, qr_codes_enabled, subscription_expires_at } = await request.json();

    // Validate business ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json(
        { error: "Invalid business ID format" },
        { status: 400 }
      );
    }

    // Validate subscription status
    const validStatuses = ['active', 'cancelled', 'expired', 'trial', 'suspended'];
    if (subscription_status && !validStatuses.includes(subscription_status)) {
      return NextResponse.json(
        { error: "Invalid subscription status" },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (subscription_status !== undefined) {
      updates.push(`subscription_status = $${paramCount}`);
      values.push(subscription_status);
      paramCount++;
    }

    if (qr_codes_enabled !== undefined) {
      updates.push(`qr_codes_enabled = $${paramCount}`);
      values.push(qr_codes_enabled);
      paramCount++;
    }

    if (subscription_expires_at !== undefined) {
      updates.push(`subscription_expires_at = $${paramCount}`);
      values.push(subscription_expires_at);
      paramCount++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Add updated_at and business_id
    updates.push(`updated_at = NOW()`);
    values.push(businessId);

    const updateQuery = `
      UPDATE businesses 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, subscription_status, qr_codes_enabled, subscription_expires_at
    `;

    const pool = (await import("@/lib/db")).default;
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Get updated subscription status
    const updatedStatus = await checkBusinessSubscription(businessId);

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      subscription: updatedStatus
    });

  } catch (error: unknown) {
    console.error("Error updating subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update subscription";
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}