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

    // Consulta para obtener deportistas por disciplina y localidad
    const atletasPorDisciplinaLocalidad = await query(`
      SELECT 
        d.nombre as disciplina,
        d.genero as disciplina_genero,
        l.nombre as localidad,
        COUNT(DISTINCT p.id) as total_deportistas,
        COUNT(CASE WHEN p.genero = 'MASCULINO' THEN 1 END) as deportistas_masculinos,
        COUNT(CASE WHEN p.genero = 'FEMENINO' THEN 1 END) as deportistas_femeninos,
        COUNT(DISTINCT e.id) as total_equipos
      FROM participantes p
      JOIN equipo_participantes ep ON p.id = ep.participante_id
      JOIN equipos e ON ep.equipo_id = e.id
      JOIN disciplinas d ON e.disciplina_id = d.id
      JOIN localidades l ON p.localidad_id = l.id
      WHERE p.tipo = 'deportista'
      GROUP BY d.id, l.id, d.nombre, l.nombre, d.genero
      ORDER BY d.nombre, l.nombre
    `)

    // Resumen por disciplina
    const resumenPorDisciplina = await query(`
      SELECT 
        d.nombre as disciplina,
        d.genero as disciplina_genero,
        COUNT(DISTINCT p.id) as total_deportistas,
        COUNT(CASE WHEN p.genero = 'MASCULINO' THEN 1 END) as deportistas_masculinos,
        COUNT(CASE WHEN p.genero = 'FEMENINO' THEN 1 END) as deportistas_femeninos,
        COUNT(DISTINCT l.id) as localidades_participantes,
        COUNT(DISTINCT e.id) as total_equipos
      FROM participantes p
      JOIN equipo_participantes ep ON p.id = ep.participante_id
      JOIN equipos e ON ep.equipo_id = e.id
      JOIN disciplinas d ON e.disciplina_id = d.id
      JOIN localidades l ON p.localidad_id = l.id
      WHERE p.tipo = 'deportista'
      GROUP BY d.id, d.nombre, d.genero
      ORDER BY total_deportistas DESC
    `)

    // Resumen por localidad
    const resumenPorLocalidad = await query(`
      SELECT 
        l.nombre as localidad,
        COUNT(DISTINCT p.id) as total_deportistas,
        COUNT(CASE WHEN p.genero = 'MASCULINO' THEN 1 END) as deportistas_masculinos,
        COUNT(CASE WHEN p.genero = 'FEMENINO' THEN 1 END) as deportistas_femeninos,
        COUNT(DISTINCT d.id) as disciplinas_participantes,
        COUNT(DISTINCT e.id) as total_equipos
      FROM participantes p
      JOIN equipo_participantes ep ON p.id = ep.participante_id
      JOIN equipos e ON ep.equipo_id = e.id
      JOIN disciplinas d ON e.disciplina_id = d.id
      JOIN localidades l ON p.localidad_id = l.id
      WHERE p.tipo = 'deportista'
      GROUP BY l.id, l.nombre
      ORDER BY total_deportistas DESC
    `)

    return NextResponse.json({
      detallePorDisciplinaLocalidad: atletasPorDisciplinaLocalidad,
      resumenPorDisciplina: resumenPorDisciplina,
      resumenPorLocalidad: resumenPorLocalidad,
    })
  } catch (error) {
    console.error("Error fetching atletas por disciplina y localidad:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
