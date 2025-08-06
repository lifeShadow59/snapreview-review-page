import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    // Query the database to get the current time
    const result = await client.query("SELECT NOW()");
    client.release();
    // Return the current time from the database
    return NextResponse.json({ success: true, timestamp: result.rows[0].now });
  } catch (error) {
    console.error("Database connection error", error);
    return NextResponse.json(
      { success: false, error: "Database connection failed" },
      { status: 500 }
    );
  }
}
