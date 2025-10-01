import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login endpoint called")
    const { email, password } = await request.json()
    console.log("[v0] Login attempt for email:", email)
    console.log("[v0] Password provided:", password ? "Yes" : "No")

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const user = await authenticateUser(email, password)
    console.log("[v0] Database authentication result:", user ? "Success" : "Failed")

    if (!user) {
      console.log("[v0] Authentication failed - invalid credentials")
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    console.log("[v0] Login successful for user:", user.email)
    return NextResponse.json({
      message: "Login exitoso",
      user: user,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
