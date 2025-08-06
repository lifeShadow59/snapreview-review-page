import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface ReviewSubmissionData {
  businessId: string;
  customerName?: string;
  customerPhone?: string;
  rating: number;
  reviewText?: string;
}

// POST /api/reviews/submit - Submit a new review
export async function POST(request: NextRequest) {
  try {
    const body: ReviewSubmissionData = await request.json();

    // Validate required fields
    if (!body.businessId || !body.rating) {
      return NextResponse.json(
        { error: "Business ID and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating range and format (must be 1-5 in 0.5 increments)
    if (body.rating < 1 || body.rating > 5 || (body.rating * 2) % 1 !== 0) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5 in half-star increments" },
        { status: 400 }
      );
    }

    // Get client IP and user agent for spam prevention
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
        [body.businessId, "active"]
      );

      if (businessCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "Business not found or inactive" },
          { status: 404 }
        );
      }

      // Insert the review
      const reviewInsertQuery = `
        INSERT INTO reviews (
          business_id, customer_name, customer_phone, rating, 
          review_text, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
      `;

      const reviewResult = await client.query(reviewInsertQuery, [
        body.businessId,
        body.customerName?.trim() || null,
        body.customerPhone?.trim() || null,
        body.rating,
        body.reviewText?.trim() || null,
        clientIP,
        userAgent,
      ]);

      const review = reviewResult.rows[0];

      // Update business metrics
      const metricsUpdateQuery = `
        UPDATE business_metrics 
        SET 
          total_reviews = (
            SELECT COUNT(*) FROM reviews 
            WHERE business_id = $1 AND is_approved = true
          ),
          average_rating = (
            SELECT COALESCE(AVG(rating), 0) FROM reviews 
            WHERE business_id = $1 AND is_approved = true
          ),
          last_updated = NOW()
        WHERE business_id = $1
      `;

      await client.query(metricsUpdateQuery, [body.businessId]);

      await client.query("COMMIT");

      return NextResponse.json(
        {
          message: "Review submitted successfully",
          reviewId: review.id,
          submittedAt: review.created_at,
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
