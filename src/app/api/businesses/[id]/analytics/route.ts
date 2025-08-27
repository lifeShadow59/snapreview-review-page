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

    // Get comprehensive analytics data from business_copy_metrics
    const analyticsQuery = `
      SELECT 
        bcm.language_code,
        bcm.copy_count,
        bcm.last_copy_timestamp,
        blp.language_name
      FROM business_copy_metrics bcm
      LEFT JOIN business_language_preferences blp 
        ON bcm.business_id = blp.business_id 
        AND bcm.language_code = blp.language_code
      WHERE bcm.business_id = $1
      ORDER BY bcm.copy_count DESC
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

    // Get business metrics data
    const businessMetricsQuery = `
      SELECT 
        total_copy_count,
        total_qr_scans,
        total_reviews,
        average_rating,
        conversion_rate,
        last_updated
      FROM business_metrics 
      WHERE business_id = $1
    `;

    const businessMetricsResult = await pool.query(businessMetricsQuery, [businessId]);
    const businessMetrics = businessMetricsResult.rows[0] || {};

    // Get recent activity (last 30 days)
    const recentActivityQuery = `
      SELECT 
        DATE(last_copy_timestamp) as date,
        SUM(copy_count) as copies
      FROM business_copy_metrics 
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
      businessMetrics: {
        totalCopyCount: businessMetrics.total_copy_count || 0,
        totalQrScans: businessMetrics.total_qr_scans || 0,
        totalReviews: businessMetrics.total_reviews || 0,
        averageRating: parseFloat(businessMetrics.average_rating) || 0,
        conversionRate: parseFloat(businessMetrics.conversion_rate) || 0,
        lastUpdated: businessMetrics.last_updated || null
      },
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