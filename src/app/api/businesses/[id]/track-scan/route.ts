import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// POST /api/businesses/[id]/track-scan - Track QR code scan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // Get client IP and user agent for basic tracking
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Verify business exists and is active
      const businessCheck = await client.query(
        "SELECT id FROM businesses WHERE id = $1 AND status = $2",
        [businessId, "active"]
      );

      if (businessCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "Business not found or inactive" },
          { status: 404 }
        );
      }

      // Check if business_metrics record exists, if not create it
      const metricsCheck = await client.query(
        "SELECT id FROM business_metrics WHERE business_id = $1",
        [businessId]
      );

      if (metricsCheck.rows.length === 0) {
        // Create initial metrics record
        await client.query(
          `INSERT INTO business_metrics (business_id, total_qr_scans, total_reviews, average_rating, conversion_rate) 
           VALUES ($1, 1, 0, 0.0, 0.0)`,
          [businessId]
        );
      } else {
        // Increment QR scan count
        await client.query(
          `UPDATE business_metrics 
           SET total_qr_scans = total_qr_scans + 1, 
               last_updated = NOW(),
               conversion_rate = CASE 
                 WHEN total_qr_scans + 1 > 0 THEN (total_reviews::DECIMAL / (total_qr_scans + 1)) * 100
                 ELSE 0.0
               END
           WHERE business_id = $1`,
          [businessId]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json(
        {
          message: "QR scan tracked successfully",
          businessId: businessId,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error tracking QR scan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
