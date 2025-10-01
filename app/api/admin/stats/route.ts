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

    const usuariosResult = await query("SELECT COUNT(*) as total FROM usuarios WHERE activo = 1")
    const disciplinasResult = await query("SELECT COUNT(*) as total FROM disciplinas WHERE activa = 1")
    const localidadesResult = await query("SELECT COUNT(*) as total FROM localidades WHERE activa = 1")
    const participantesResult = await query("SELECT COUNT(*) as total FROM participantes")

    return NextResponse.json({
      totalUsuarios: Number(usuariosResult[0]?.total) || 0,
      totalDisciplinas: Number(disciplinasResult[0]?.total) || 0,
      totalLocalidades: Number(localidadesResult[0]?.total) || 0,
      totalParticipantes: Number(participantesResult[0]?.total) || 0,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
