import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionData = getSessionFromRequest(request)

    if (!sessionData) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }

    const authError = requireRole(sessionData, "gestor")
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { id: equipoId } = await params

    let requestBody
    try {
      requestBody = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Error parsing request body" }, { status: 400 })
    }

    const { dni, nombre, apellido, fecha_nacimiento, genero, tipo } = requestBody

    if (!dni || !nombre || !apellido || !fecha_nacimiento || !genero || !tipo) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar que el equipo pertenece al gestor
    const equipoResult = (await query(
      `SELECT e.id, e.localidad_id, e.disciplina_id, d.genero as disciplina_genero, d.año_desde, d.año_hasta, d.cantidad_integrantes, d.entrenadores, d.delegados
       FROM equipos e 
       JOIN disciplinas d ON e.disciplina_id = d.id 
       WHERE e.id = ? AND e.usuario_creador_id = ?`,
      [equipoId, sessionData.id],
    )) as any[]

    if (equipoResult.length === 0) {
      return NextResponse.json({ error: "Equipo no encontrado o no autorizado" }, { status: 404 })
    }

    const equipo = equipoResult[0]

    // Validar género para deportistas
    if (tipo === "deportista" && genero !== equipo.disciplina_genero) {
      if (genero.trim().toLowerCase() !== equipo.disciplina_genero.trim().toLowerCase()) {
        return NextResponse.json(
          {
            error: `El género del deportista debe coincidir con el de la disciplina (${equipo.disciplina_genero})`,
          },
          { status: 400 },
        )
      }
    }

    // Validar edad para deportistas
    if (tipo === "deportista") {
      let birthYear: number

      if (fecha_nacimiento.includes("-")) {
        birthYear = Number.parseInt(fecha_nacimiento.split("-")[0])
      } else if (fecha_nacimiento.includes("/")) {
        const parts = fecha_nacimiento.split("/")
        birthYear = Number.parseInt(parts[2])
      } else {
        return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 })
      }

      if (birthYear < equipo.año_desde || birthYear > equipo.año_hasta) {
        return NextResponse.json(
          {
            error: `Año de nacimiento ${birthYear} no está en el rango permitido (${equipo.año_desde}-${equipo.año_hasta})`,
          },
          { status: 400 },
        )
      }
    }

    // Verificar límites de participantes por tipo
    const participantesActuales = (await query(
      `SELECT p.tipo, COUNT(*) as cantidad
       FROM participantes p
       JOIN equipo_participantes ep ON p.id = ep.participante_id
       WHERE ep.equipo_id = ?
       GROUP BY p.tipo`,
      [equipoId],
    )) as any[]

    const conteos = {
      deportista: 0,
      entrenador: 0,
      delegado: 0,
    }

    participantesActuales.forEach((p) => {
      conteos[p.tipo as keyof typeof conteos] = p.cantidad
    })

    // Verificar límites
    if (tipo === "deportista" && conteos.deportista >= equipo.cantidad_integrantes) {
      return NextResponse.json(
        {
          error: `Se ha alcanzado el límite de deportistas (${equipo.cantidad_integrantes})`,
        },
        { status: 400 },
      )
    }
    if (tipo === "entrenador" && conteos.entrenador >= equipo.entrenadores) {
      return NextResponse.json(
        {
          error: `Se ha alcanzado el límite de entrenadores (${equipo.entrenadores})`,
        },
        { status: 400 },
      )
    }
    if (tipo === "delegado" && conteos.delegado >= equipo.delegados) {
      return NextResponse.json(
        {
          error: `Se ha alcanzado el límite de delegados (${equipo.delegados})`,
        },
        { status: 400 },
      )
    }

    // Buscar o crear participante
    const participanteResult = (await query("SELECT id FROM participantes WHERE dni = ? AND localidad_id = ?", [
      dni,
      equipo.localidad_id,
    ])) as any[]

    let participanteId: number

    if (participanteResult.length > 0) {
      // Actualizar participante existente
      participanteId = participanteResult[0].id
      await query(
        "UPDATE participantes SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?, tipo = ? WHERE id = ?",
        [nombre, apellido, fecha_nacimiento, genero, tipo, participanteId],
      )
    } else {
      // Crear nuevo participante
      const insertResult = (await query(
        "INSERT INTO participantes (dni, nombre, apellido, fecha_nacimiento, genero, tipo, localidad_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [dni, nombre, apellido, fecha_nacimiento, genero, tipo, equipo.localidad_id],
      )) as any

      participanteId = insertResult.insertId
    }

    // Verificar si ya está en el equipo
    const yaEnEquipo = (await query("SELECT id FROM equipo_participantes WHERE equipo_id = ? AND participante_id = ?", [
      equipoId,
      participanteId,
    ])) as any[]

    if (yaEnEquipo.length > 0) {
      return NextResponse.json({ error: "El participante ya está en este equipo" }, { status: 400 })
    }

    // Agregar al equipo
    await query("INSERT INTO equipo_participantes (equipo_id, participante_id) VALUES (?, ?)", [
      equipoId,
      participanteId,
    ])

    return NextResponse.json({ message: "Participante agregado correctamente", participanteId })
  } catch (error) {
    console.error("Error in POST /api/gestor/equipos/[id]/participantes:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
