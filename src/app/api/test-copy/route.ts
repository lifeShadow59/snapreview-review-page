import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("Test endpoint called");
    
    // Log request details
    console.log("Request method:", request.method);
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Try to read the body
    const text = await request.text();
    console.log("Request body text:", text);
    
    let parsedBody = {};
    if (text) {
      try {
        parsedBody = JSON.parse(text);
        console.log("Parsed body:", parsedBody);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return NextResponse.json({
          success: false,
          error: "Invalid JSON",
          receivedText: text
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Test endpoint working",
      receivedBody: parsedBody,
      receivedText: text
    });
    
  } catch (error: unknown) {
    console.error("Test endpoint error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      error: errorMessage
    });
  }
}