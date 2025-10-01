import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    // Obtener disciplinas que el gestor aún no ha inscrito en su localidad
    const disciplinasDisponibles = await query(
      `
      SELECT d.* 
      FROM disciplinas d
      WHERE d.activa = TRUE 
      AND d.id NOT IN (
        SELECT DISTINCT e.disciplina_id 
        FROM equipos e 
        WHERE e.localidad_id = ? AND e.usuario_creador_id = ?
      )
      ORDER BY d.nombre
    `,
      [sessionData.localidad_id, sessionData.id],
    )

    return NextResponse.json(disciplinasDisponibles)
  } catch (error) {
    console.error("Error fetching disciplinas disponibles:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
