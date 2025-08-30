import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let businessId = '';
  let language_code = '';
  
  try {
    const resolvedParams = await params;
    businessId = resolvedParams.id;
    
    // Handle empty request body
    let requestBody;
    try {
      const text = await request.text();
      requestBody = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const { language_code: langCode, feedback_id } = requestBody;
    language_code = langCode;

    // Validate business ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json(
        { error: "Invalid business ID format" },
        { status: 400 }
      );
    }

    if (!language_code) {
      return NextResponse.json(
        { error: "Language code is required" },
        { status: 400 }
      );
    }

    // Start transaction for atomic operations
    console.log("Attempting to connect to database...");
    const client = await pool.connect();
    console.log("Database connection successful");

    try {
      await client.query('BEGIN');
      console.log("Transaction started for business:", businessId, "language:", language_code);

      // Check if business_copy_metrics table exists
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'business_copy_metrics'
        );
      `;
      const tableExists = await client.query(tableCheckQuery);
      console.log("business_copy_metrics table exists:", tableExists.rows[0].exists);

      if (!tableExists.rows[0].exists) {
        throw new Error("business_copy_metrics table does not exist. Please run the database migration.");
      }

      // Update or insert copy metrics tracking in business_copy_metrics table
      const upsertCopyMetricsQuery = `
        INSERT INTO business_copy_metrics (business_id, language_code, copy_count, last_copy_timestamp, updated_at)
        VALUES ($1, $2, 1, NOW(), NOW())
        ON CONFLICT (business_id, language_code)
        DO UPDATE SET 
          copy_count = business_copy_metrics.copy_count + 1,
          last_copy_timestamp = NOW(),
          updated_at = NOW()
        RETURNING copy_count
      `;

      console.log("Executing upsert query with params:", [businessId, language_code]);
      const copyMetricsResult = await client.query(upsertCopyMetricsQuery, [businessId, language_code]);
      const newCopyCount = copyMetricsResult.rows[0]?.copy_count || 1;
      console.log("Copy metrics updated, new count:", newCopyCount);

      // The trigger will automatically update the total_copy_count in business_metrics table
      console.log("Trigger should have updated business_metrics table");

      // Optional: Delete feedback from storage if feedback_id provided
      if (feedback_id) {
        console.log("Deleting feedback from storage:", feedback_id);
        const deleteFeedbackQuery = `
          DELETE FROM feedback_storage 
          WHERE id = $1 AND business_id = $2
        `;
        await client.query(deleteFeedbackQuery, [feedback_id, businessId]);
      }

      // Get total analytics for response
      console.log("Fetching total analytics...");
      const totalAnalyticsQuery = `
        SELECT 
          COALESCE(SUM(copy_count), 0) as total_copies,
          json_object_agg(language_code, copy_count) as language_breakdown
        FROM business_copy_metrics 
        WHERE business_id = $1
      `;

      const totalResult = await client.query(totalAnalyticsQuery, [businessId]);
      const analytics = totalResult.rows[0] || { total_copies: 0, language_breakdown: {} };
      console.log("Analytics result:", analytics);

      // Also get the updated business_metrics data
      console.log("Fetching business metrics...");
      const businessMetricsQuery = `
        SELECT total_copy_count, total_qr_scans, total_reviews, average_rating, conversion_rate
        FROM business_metrics 
        WHERE business_id = $1
      `;

      const businessMetricsResult = await client.query(businessMetricsQuery, [businessId]);
      const businessMetrics = businessMetricsResult.rows[0] || {};
      console.log("Business metrics result:", businessMetrics);

      await client.query('COMMIT');
      console.log("Transaction committed successfully");

      const responseData = {
        success: true,
        analytics: {
          totalCopies: parseInt(analytics.total_copies) || 0,
          languageBreakdown: analytics.language_breakdown || {},
          currentLanguageCopies: newCopyCount
        },
        businessMetrics: {
          totalCopyCount: businessMetrics.total_copy_count || 0,
          totalQrScans: businessMetrics.total_qr_scans || 0,
          totalReviews: businessMetrics.total_reviews || 0,
          averageRating: parseFloat(businessMetrics.average_rating) || 0,
          conversionRate: parseFloat(businessMetrics.conversion_rate) || 0
        }
      };
      
      console.log("Sending response:", responseData);

      return NextResponse.json(responseData);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: unknown) {
    console.error("Error tracking copy:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      businessId: businessId || 'undefined',
      language_code: language_code || 'undefined'
    });

    // Return error details for debugging
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        businessId: businessId || 'undefined',
        language_code: language_code || 'undefined',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      analytics: {
        totalCopies: 0,
        languageBreakdown: {},
        currentLanguageCopies: 1
      },
      businessMetrics: {
        totalCopyCount: 0,
        totalQrScans: 0,
        totalReviews: 0,
        averageRating: 0,
        conversionRate: 0
      },
      warning: "Tracking failed but copy operation completed"
    }, { status: 500 });
  }
}