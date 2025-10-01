import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Localidades GET endpoint called")
    const sessionData = getSessionFromRequest(request)
    console.log("[v0] Session data from request:", sessionData)

    const authError = requireRole(sessionData, "administrador")
    console.log("[v0] Auth error:", authError)

    if (authError) {
      console.log("[v0] Returning auth error:", authError)
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    console.log("[v0] Fetching localidades from database")
    const localidades = await query("SELECT * FROM localidades WHERE activa = 1 ORDER BY nombre")

    console.log("[v0] Found localidades:", localidades.length)
    return NextResponse.json(localidades)
  } catch (error) {
    console.error("[v0] Error fetching localidades:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Adding POST method for creating new localidades
export async function POST(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { nombre } = await request.json()

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    await query("INSERT INTO localidades (nombre) VALUES (?)", [nombre])

    return NextResponse.json({ message: "Localidad creada correctamente" })
  } catch (error) {
    console.error("Error creating localidad:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
