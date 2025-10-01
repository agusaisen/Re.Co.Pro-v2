import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Admin equipos API - Starting request")

    const sessionData = getSessionFromRequest(request)
    console.log("[v0] Session data retrieved:", sessionData ? "Found" : "Not found")

    const authError = requireRole(sessionData, "administrador")
    console.log("[v0] Auth check result:", authError ? "Failed" : "Passed")

    if (authError) {
      console.log("[v0] Auth error:", authError)
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    console.log("[v0] Starting database query for equipos")

    const equiposQuery = `
      SELECT DISTINCT
        e.id,
        e.nombre_equipo,
        d.nombre as disciplina,
        l.nombre as localidad,
        e.created_at,
        COUNT(DISTINCT p.id) as total_participantes,
        COUNT(DISTINCT CASE WHEN p.tipo = 'deportista' THEN p.id END) as total_deportistas,
        COUNT(DISTINCT dp.documento_id) as total_documentos
      FROM equipos e
      JOIN disciplinas d ON e.disciplina_id = d.id
      JOIN localidades l ON e.localidad_id = l.id
      LEFT JOIN equipo_participantes ep ON e.id = ep.equipo_id
      LEFT JOIN participantes p ON ep.participante_id = p.id
      LEFT JOIN documento_participante dp ON p.id = dp.participante_id AND p.tipo = 'deportista'
      GROUP BY e.id, e.nombre_equipo, d.nombre, l.nombre, e.created_at
      ORDER BY e.created_at DESC
    `

    console.log("[v0] Executing query:", equiposQuery.substring(0, 100) + "...")
    const equipos = await query(equiposQuery)
    console.log("[v0] Query executed successfully, found", equipos.length, "equipos")

    return NextResponse.json(equipos)
  } catch (error) {
    console.error("[v0] Error in admin equipos API:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
