import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const { language_code, feedback_id } = await request.json();

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
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update or insert analytics tracking
      const upsertAnalyticsQuery = `
        INSERT INTO feedback_analytics (business_id, language_code, copy_count, last_copy_timestamp)
        VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (business_id, language_code)
        DO UPDATE SET 
          copy_count = feedback_analytics.copy_count + 1,
          last_copy_timestamp = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        RETURNING copy_count
      `;

      const analyticsResult = await client.query(upsertAnalyticsQuery, [businessId, language_code]);
      const newCopyCount = analyticsResult.rows[0]?.copy_count || 1;

      // Optional: Delete feedback from storage if feedback_id provided
      if (feedback_id) {
        const deleteFeedbackQuery = `
          DELETE FROM feedback_storage 
          WHERE id = $1 AND business_id = $2
        `;
        await client.query(deleteFeedbackQuery, [feedback_id, businessId]);
      }

      // Get total analytics for response
      const totalAnalyticsQuery = `
        SELECT 
          SUM(copy_count) as total_copies,
          json_object_agg(language_code, copy_count) as language_breakdown
        FROM feedback_analytics 
        WHERE business_id = $1
      `;

      const totalResult = await client.query(totalAnalyticsQuery, [businessId]);
      const analytics = totalResult.rows[0] || { total_copies: 0, language_breakdown: {} };

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        analytics: {
          totalCopies: parseInt(analytics.total_copies) || 0,
          languageBreakdown: analytics.language_breakdown || {},
          currentLanguageCopies: newCopyCount
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error tracking copy:", error);
    
    // Return success even if tracking fails to not interrupt user experience
    return NextResponse.json({
      success: true,
      analytics: {
        totalCopies: 0,
        languageBreakdown: {},
        currentLanguageCopies: 1
      },
      warning: "Tracking failed but copy operation completed"
    });
  }
}