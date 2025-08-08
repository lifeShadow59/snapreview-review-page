import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const { feedback } = await request.json();

    // Validate business ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json(
        { error: "Invalid business ID format" },
        { status: 400 }
      );
    }

    // Validate feedback
    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return NextResponse.json(
        { error: "Feedback is required" },
        { status: 400 }
      );
    }

    if (feedback.trim().length > 1000) {
      return NextResponse.json(
        { error: "Feedback must be 1000 characters or less" },
        { status: 400 }
      );
    }

    // Check if business exists
    const businessCheck = await pool.query(
      'SELECT id FROM businesses WHERE id = $1 AND status = $2',
      [businessId, 'active']
    );

    if (businessCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Insert feedback
    const insertQuery = `
      INSERT INTO business_feedbacks (business_id, feedback)
      VALUES ($1, $2)
      RETURNING id, feedback, created_at
    `;

    const result = await pool.query(insertQuery, [businessId, feedback.trim()]);
    const newFeedback = result.rows[0];

    return NextResponse.json(
      { 
        success: true,
        feedback: {
          id: newFeedback.id,
          feedback: newFeedback.feedback,
          created_at: newFeedback.created_at
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error adding feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}