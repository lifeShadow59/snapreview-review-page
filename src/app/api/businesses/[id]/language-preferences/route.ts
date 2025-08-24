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

    // Fetch language preferences for the business
    const languageQuery = `
      SELECT language_code, language_name
      FROM business_language_preferences
      WHERE business_id = $1
      ORDER BY created_at ASC
      LIMIT 3
    `;

    const languageResult = await pool.query(languageQuery, [businessId]);

    // If no language preferences found, default to English, Hindi, and Gujarati
    if (languageResult.rows.length === 0) {
      return NextResponse.json({
        languages: [
          {
            language_code: "en",
            language_name: "English"
          },
          {
            language_code: "hi",
            language_name: "हिंदी"
          },
          {
            language_code: "gu",
            language_name: "ગુજરાતી"
          }
        ]
      });
    }

    return NextResponse.json({
      languages: languageResult.rows
    });

  } catch (error) {
    console.error("Error fetching language preferences:", error);
    
    // Fallback to all three languages on error
    return NextResponse.json({
      languages: [
        {
          language_code: "en", 
          language_name: "English"
        },
        {
          language_code: "hi",
          language_name: "हिंदी"
        },
        {
          language_code: "gu",
          language_name: "ગુજરાતી"
        }
      ]
    });
  }
}