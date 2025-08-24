import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

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

    // Get comprehensive analytics data
    const analyticsQuery = `
      SELECT 
        fa.language_code,
        fa.copy_count,
        fa.last_copy_timestamp,
        blp.language_name
      FROM feedback_analytics fa
      LEFT JOIN business_language_preferences blp 
        ON fa.business_id = blp.business_id 
        AND fa.language_code = blp.language_code
      WHERE fa.business_id = $1
      ORDER BY fa.copy_count DESC
    `;

    const analyticsResult = await pool.query(analyticsQuery, [businessId]);

    // Calculate totals and breakdown
    let totalCopies = 0;
    const languageBreakdown: Record<string, { count: number; language_name: string }> = {};

    analyticsResult.rows.forEach(row => {
      totalCopies += row.copy_count;
      languageBreakdown[row.language_code] = {
        count: row.copy_count,
        language_name: row.language_name || row.language_code.toUpperCase()
      };
    });

    // Get recent activity (last 30 days)
    const recentActivityQuery = `
      SELECT 
        DATE(last_copy_timestamp) as date,
        SUM(copy_count) as copies
      FROM feedback_analytics 
      WHERE business_id = $1 
        AND last_copy_timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(last_copy_timestamp)
      ORDER BY date DESC
      LIMIT 30
    `;

    const recentActivityResult = await pool.query(recentActivityQuery, [businessId]);

    const recentActivity = recentActivityResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      copies: parseInt(row.copies)
    }));

    return NextResponse.json({
      totalCopies,
      languageBreakdown,
      recentActivity,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    
    return NextResponse.json({
      totalCopies: 0,
      languageBreakdown: {},
      recentActivity: [],
      lastUpdated: new Date().toISOString(),
      error: "Failed to fetch analytics data"
    }, { status: 500 });
  }
}