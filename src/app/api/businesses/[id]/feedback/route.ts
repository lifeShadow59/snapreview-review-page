import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // Get language_code from query parameters
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('language_code');

    // Validate business ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json(
        { error: "Invalid business ID format" },
        { status: 400 }
      );
    }

    // Get 3 random feedbacks for the business, optionally filtered by language
    let query = `
      SELECT feedback 
      FROM business_feedbacks 
      WHERE business_id = $1
    `;
    
    const queryParams = [businessId];
    
    // Add language filter if provided
    if (languageCode) {
      query += ` AND language_code = $2`;
      queryParams.push(languageCode);
    }
    
    query += ` ORDER BY RANDOM() LIMIT 3`;

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { feedbacks: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { feedbacks: result.rows.map(row => row.feedback) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching business feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}