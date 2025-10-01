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

    const { estado } = await request.json()
    const inscripcionId = Number.parseInt(params.id)

    if (!["PENDIENTE", "APROBADA", "RECHAZADA"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    await query("UPDATE equipos SET estado = ? WHERE id = ?", [estado, inscripcionId])

    return NextResponse.json({ message: "Estado actualizado correctamente" })
  } catch (error) {
    console.error("Error updating inscripcion:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
