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

    // Obtener estadísticas del gestor
    const [equiposResult] = (await Promise.all([
      query("SELECT COUNT(*) as count FROM equipos WHERE usuario_creador_id = ?", [sessionData.id]),
    ])) as any[]

    const [participantesResult] = (await Promise.all([
      query(
        `
        SELECT COUNT(ep.id) as count 
        FROM equipo_participantes ep 
        JOIN equipos e ON ep.equipo_id = e.id 
        WHERE e.usuario_creador_id = ?
      `,
        [sessionData.id],
      ),
    ])) as any[]

    const [localidadResult] = (await Promise.all([
      query("SELECT l.nombre FROM localidades l JOIN usuarios u ON l.id = u.localidad_id WHERE u.id = ?", [
        sessionData.id,
      ]),
    ])) as any[]

    const [disciplinasResult] = (await Promise.all([
      query("SELECT COUNT(*) as count FROM disciplinas WHERE activa = TRUE"),
    ])) as any[]

    return NextResponse.json({
      equiposCreados: equiposResult[0]?.count || 0,
      totalParticipantes: participantesResult[0]?.count || 0,
      localidad: localidadResult[0]?.nombre || "No definida",
      disciplinasDisponibles: disciplinasResult[0]?.count || 0,
    })
  } catch (error) {
    console.error("Gestor stats error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
