import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Test endpoint called")
    return NextResponse.json({
      message: "API is working",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Test endpoint error:", error)
    return NextResponse.json({ error: "Test failed" }, { status: 500 })
  }
}
