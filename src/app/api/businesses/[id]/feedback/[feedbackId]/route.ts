import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const feedbackId = resolvedParams.feedbackId;

    // Validate business ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json(
        { error: "Invalid business ID format" },
        { status: 400 }
      );
    }

    // Validate feedback ID (should be a number)
    const feedbackIdNum = parseInt(feedbackId);
    if (isNaN(feedbackIdNum)) {
      return NextResponse.json(
        { error: "Invalid feedback ID format" },
        { status: 400 }
      );
    }

    // Check if feedback exists and belongs to the business
    const checkQuery = `
      SELECT id FROM business_feedbacks 
      WHERE id = $1 AND business_id = $2
    `;

    const checkResult = await pool.query(checkQuery, [feedbackIdNum, businessId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Delete the feedback
    const deleteQuery = `
      DELETE FROM business_feedbacks 
      WHERE id = $1 AND business_id = $2
    `;

    await pool.query(deleteQuery, [feedbackIdNum, businessId]);

    return NextResponse.json(
      { success: true, message: "Feedback deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}