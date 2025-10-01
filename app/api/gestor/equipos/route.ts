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

    const equipos = await query(
      `
      SELECT 
        e.id,
        e.nombre_equipo,
        e.created_at,
        d.nombre as disciplina_nombre,
        COUNT(CASE WHEN p.tipo = 'deportista' THEN 1 END) as participantes_count
      FROM equipos e
      JOIN disciplinas d ON e.disciplina_id = d.id
      LEFT JOIN equipo_participantes ep ON e.id = ep.equipo_id
      LEFT JOIN participantes p ON ep.participante_id = p.id
      WHERE e.usuario_creador_id = ?
      GROUP BY e.id, e.nombre_equipo, e.created_at, d.nombre
      ORDER BY e.created_at DESC
    `,
      [sessionData.id],
    )

    return NextResponse.json(equipos)
  } catch (error) {
    console.error("Error fetching equipos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { disciplina_id, nombre_equipo, participantes } = await request.json()

    if (!disciplina_id || !participantes || participantes.length === 0) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Verificar que no existe ya un equipo de esta disciplina para este gestor en su localidad
    const equipoExistente = (await query(
      "SELECT id FROM equipos WHERE disciplina_id = ? AND localidad_id = ? AND usuario_creador_id = ?",
      [disciplina_id, sessionData.localidad_id, sessionData.id],
    )) as any[]

    if (equipoExistente.length > 0) {
      return NextResponse.json({ error: "Ya tienes un equipo inscrito en esta disciplina" }, { status: 400 })
    }

    // Crear el equipo
    const equipoResult = (await query(
      "INSERT INTO equipos (disciplina_id, localidad_id, usuario_creador_id, nombre_equipo) VALUES (?, ?, ?, ?)",
      [disciplina_id, sessionData.localidad_id, sessionData.id, nombre_equipo || null],
    )) as any

    const equipoId = equipoResult.insertId

    // Procesar participantes
    for (const participante of participantes) {
      // Verificar si el participante ya existe
      let participanteId
      const existente = (await query("SELECT id FROM participantes WHERE dni = ?", [participante.dni])) as any[]

      if (existente.length > 0) {
        participanteId = existente[0].id
      } else {
        const participanteResult = (await query(
          "INSERT INTO participantes (dni, nombre, apellido, fecha_nacimiento, genero, tipo, localidad_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            participante.dni,
            participante.nombre,
            participante.apellido,
            participante.fecha_nacimiento,
            participante.genero,
            participante.tipo,
            sessionData.localidad_id,
          ],
        )) as any
        participanteId = participanteResult.insertId
      }

      // Agregar participante al equipo
      await query("INSERT INTO equipo_participantes (equipo_id, participante_id) VALUES (?, ?)", [
        equipoId,
        participanteId,
      ])
    }

    return NextResponse.json({
      message: "Equipo inscrito correctamente",
      equipoId,
    })
  } catch (error) {
    console.error("Error creating equipo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
