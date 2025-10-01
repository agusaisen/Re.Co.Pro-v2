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

    const equipos = await query(`
      SELECT 
        e.id,
        e.nombre_equipo,
        e.created_at as fecha_creacion,
        d.nombre as disciplina,
        d.genero as disciplina_genero,
        l.nombre as localidad,
        p.dni,
        p.nombre,
        p.apellido,
        p.fecha_nacimiento,
        p.genero,
        p.tipo,
        YEAR(CURDATE()) - YEAR(p.fecha_nacimiento) - 
        (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(p.fecha_nacimiento, '%m%d')) as edad
      FROM equipos e
      JOIN disciplinas d ON e.disciplina_id = d.id
      JOIN localidades l ON e.localidad_id = l.id
      JOIN equipo_participantes ep ON e.id = ep.equipo_id
      JOIN participantes p ON ep.participante_id = p.id
      ORDER BY e.id, p.apellido, p.nombre
    `)

    // Agrupar por equipo
    const equiposAgrupados = equipos.reduce((acc: any, row: any) => {
      const equipoId = row.id

      if (!acc[equipoId]) {
        acc[equipoId] = {
          id: row.id,
          nombre_equipo: row.nombre_equipo,
          fecha_creacion: row.fecha_creacion,
          disciplina: row.disciplina,
          disciplina_genero: row.disciplina_genero,
          localidad: row.localidad,
          participantes: [],
        }
      }

      acc[equipoId].participantes.push({
        dni: row.dni,
        nombre: row.nombre,
        apellido: row.apellido,
        fecha_nacimiento: row.fecha_nacimiento,
        genero: row.genero,
        tipo: row.tipo,
        edad: row.edad,
        disciplina: row.disciplina,
        equipo: row.nombre_equipo || `Equipo de ${row.disciplina}`,
        localidad: row.localidad,
      })

      return acc
    }, {})

    return NextResponse.json(Object.values(equiposAgrupados))
  } catch (error) {
    console.error("Error fetching equipos for report:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
