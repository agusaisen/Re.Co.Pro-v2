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

    const { nombre, region, activa } = await request.json()
    const localidadId = Number.parseInt(params.id)

    await query("UPDATE localidades SET nombre = ?, region = ?, activa = ? WHERE id = ?", [
      nombre,
      region || null,
      activa ?? true,
      localidadId,
    ])

    return NextResponse.json({ message: "Localidad actualizada correctamente" })
  } catch (error) {
    console.error("Error updating localidad:", error)
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

    const localidadId = Number.parseInt(params.id)

    await query("DELETE FROM localidades WHERE id = ?", [localidadId])

    return NextResponse.json({ message: "Localidad eliminada correctamente" })
  } catch (error) {
    console.error("Error deleting localidad:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
