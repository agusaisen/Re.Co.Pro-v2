import { NextResponse } from "next/server"

export async function GET() {
  try {
   
    return NextResponse.json({
      message: "API is working",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json({ error: "Test failed" }, { status: 500 })
  }
}
