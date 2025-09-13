import { NextRequest, NextResponse } from "next/server";
import { AutoFeedbackService } from "@/lib/auto-feedback-cron";

// This endpoint can be called by external cron services like Vercel Cron, GitHub Actions, or cron-job.org
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🤖 Auto-feedback cron job triggered");

    const autoFeedbackService = AutoFeedbackService.getInstance();
    
    // Check if already running
    if (autoFeedbackService.isCurrentlyRunning()) {
      return NextResponse.json({
        success: false,
        message: "Auto-feedback generation is already running"
      }, { status: 409 });
    }

    // Run the auto-feedback generation
    const result = await autoFeedbackService.runAutoFeedbackGeneration();

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error) {
    console.error("❌ Error in auto-feedback cron job:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error during auto-feedback generation",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing and status checking
export async function GET(request: NextRequest) {
  try {
    const autoFeedbackService = AutoFeedbackService.getInstance();
    
    return NextResponse.json({
      status: "Auto-feedback service is available",
      isRunning: autoFeedbackService.isCurrentlyRunning(),
      endpoint: "/api/cron/auto-feedback",
      method: "POST",
      description: "Automatically generates 20 feedbacks for businesses with less than 5 feedbacks per language"
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }
}