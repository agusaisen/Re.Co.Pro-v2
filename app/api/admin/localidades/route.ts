import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)

    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      console.log(" Returning auth error:", authError)
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const localidades = await query("SELECT * FROM localidades WHERE activa = 1 ORDER BY nombre")

    return NextResponse.json(localidades)
  } catch (error) {
    console.error(" Error fetching localidades:", error)
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

    const { nombre, region } = await request.json()

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    await query("INSERT INTO localidades (nombre, region) VALUES (?, ?)", [nombre, region || null])

    return NextResponse.json({ message: "Localidad creada correctamente" })
  } catch (error) {
    console.error("Error creating localidad:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
