import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const equipoId = Number.parseInt(params.id)

    // Obtener información del equipo
    const equipoQuery = `
      SELECT 
        e.id,
        e.nombre_equipo,
        d.nombre as disciplina,
        l.nombre as localidad
      FROM equipos e
      JOIN disciplinas d ON e.disciplina_id = d.id
      JOIN localidades l ON e.localidad_id = l.id
      WHERE e.id = ?
    `
    const equipoResult = await query(equipoQuery, [equipoId])

    if (equipoResult.length === 0) {
      return NextResponse.json({ message: "Equipo no encontrado" }, { status: 404 })
    }

    const equipo = equipoResult[0]

    // Obtener deportistas con sus documentos
    const deportistasQuery = `
      SELECT 
        p.id,
        p.nombre,
        p.apellido,
        p.dni,
        p.genero,
        doc.id as documento_id,
        doc.titulo as documento_titulo,
        doc.nombre_archivo,
        doc.tipo_archivo,
        doc.tamaño_archivo,
        dp.created_at as fecha_vinculacion
      FROM participantes p
      JOIN equipo_participantes ep ON p.id = ep.participante_id
      LEFT JOIN documento_participante dp ON p.id = dp.participante_id
      LEFT JOIN documentacion doc ON dp.documento_id = doc.id
      WHERE ep.equipo_id = ? AND p.tipo = 'deportista'
      ORDER BY p.apellido, p.nombre, dp.created_at DESC
    `

    const deportistasResult = await query(deportistasQuery, [equipoId])

    // Agrupar documentos por deportista
    const deportistasMap = new Map()

    deportistasResult.forEach((row: any) => {
      const deportistaId = row.id

      if (!deportistasMap.has(deportistaId)) {
        deportistasMap.set(deportistaId, {
          id: row.id,
          nombre: row.nombre,
          apellido: row.apellido,
          dni: row.dni,
          genero: row.genero,
          documentos: [],
        })
      }

      if (row.documento_id) {
        deportistasMap.get(deportistaId).documentos.push({
          id: row.documento_id,
          titulo: row.documento_titulo,
          nombre_archivo: row.nombre_archivo,
          tipo_archivo: row.tipo_archivo,
          tamaño_archivo: row.tamaño_archivo,
          fecha_vinculacion: row.fecha_vinculacion,
        })
      }
    })

    const deportistas = Array.from(deportistasMap.values())

    return NextResponse.json({
      equipo,
      deportistas,
    })
  } catch (error) {
    console.error("Error fetching team documents:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
