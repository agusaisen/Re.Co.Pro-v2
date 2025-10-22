import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { dni: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const participantes = (await query(
      "SELECT dni, nombre, apellido, fecha_nacimiento, genero FROM participantes WHERE dni = ?",
      [params.dni],
    )) as any[]

    if (participantes.length === 0) {
      return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 })
    }

    return NextResponse.json(participantes[0])
  } catch (error) {
    console.error("Error fetching participante:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
