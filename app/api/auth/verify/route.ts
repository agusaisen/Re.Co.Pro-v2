import { type NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Check for Authorization header first
    const authHeader = request.headers.get("Authorization")
    let sessionData

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract token from header and parse it
      const token = authHeader.substring(7)
      try {
        sessionData = JSON.parse(token)
      } catch {
        return NextResponse.json({ valid: false, error: "Token inválido" }, { status: 401 })
      }
    } else {
      // Fallback to body data
      sessionData = await request.json()
    }

    if (!verifySession(sessionData)) {
      return NextResponse.json({ valid: false, error: "Sesión inválida" }, { status: 401 })
    }

    return NextResponse.json({
      valid: true,
      user: sessionData,
    })
  } catch (error) {
    console.error("Session verification error:", error)
    return NextResponse.json({ valid: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
