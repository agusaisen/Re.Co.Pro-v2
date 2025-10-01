import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const disciplinas = await query("SELECT * FROM disciplinas ORDER BY nombre")

    return NextResponse.json(disciplinas)
  } catch (error) {
    console.error("Error fetching disciplinas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { nombre, año_desde, año_hasta, cantidad_integrantes, entrenadores, delegados, genero } = await request.json()

    if (
      !nombre ||
      !año_desde ||
      !año_hasta ||
      !cantidad_integrantes ||
      entrenadores === undefined ||
      delegados === undefined ||
      !genero
    ) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    await query(
      "INSERT INTO disciplinas (nombre, año_desde, año_hasta, cantidad_integrantes, entrenadores, delegados, genero) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nombre, año_desde, año_hasta, cantidad_integrantes, entrenadores, delegados, genero],
    )

    return NextResponse.json({ message: "Disciplina creada correctamente" })
  } catch (error) {
    console.error("Error creating disciplina:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
