import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { nombre, año_desde, año_hasta, cantidad_integrantes, entrenadores, delegados, activa, genero } =
      await request.json() // Changed from edad_minima/edad_maxima to año_desde/año_hasta

    await query(
      "UPDATE disciplinas SET nombre = ?, año_desde = ?, año_hasta = ?, cantidad_integrantes = ?, entrenadores = ?, delegados = ?, activa = ?, genero = ? WHERE id = ?", // Changed column names
      [nombre, año_desde, año_hasta, cantidad_integrantes, entrenadores, delegados, activa, genero, params.id],
    )

    return NextResponse.json({ message: "Disciplina actualizada correctamente" })
  } catch (error) {
    console.error("Error updating disciplina:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    await query("DELETE FROM disciplinas WHERE id = ?", [params.id])

    return NextResponse.json({ message: "Disciplina eliminada correctamente" })
  } catch (error) {
    console.error("Error deleting disciplina:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
