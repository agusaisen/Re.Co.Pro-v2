import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participanteId: string }> },
) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      console.log(" Auth error:", authError)
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { id: equipoId, participanteId } = await params

    const body = await request.json()

    const { nombre, apellido, fecha_nacimiento, genero, tipo } = body

    const missingFields = []
    if (!nombre) missingFields.push("nombre")
    if (!apellido) missingFields.push("apellido")
    if (!fecha_nacimiento) missingFields.push("fecha_nacimiento")
    if (!genero) missingFields.push("genero")
    if (!tipo) missingFields.push("tipo")

    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields)
      return NextResponse.json(
        {
          error: `Campos requeridos faltantes: ${missingFields.join(", ")}`,
          missingFields,
        },
        { status: 400 },
      )
    }

    try {
      await query("SELECT 1 as test")
    } catch (dbTestError) {
      console.error(" Database connection test failed:", dbTestError)
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 })
    }

    // Verificar que el equipo pertenece al gestor y obtener info de disciplina
    const equipoResult = (await query(
      `SELECT e.id, e.disciplina_id, d.genero as disciplina_genero, d.año_desde, d.año_hasta
       FROM equipos e 
       JOIN disciplinas d ON e.disciplina_id = d.id 
       WHERE e.id = ? AND e.usuario_creador_id = ?`,
      [equipoId, sessionData.id],
    )) as any[]

    if (equipoResult.length === 0) {
      console.log(" Team not found or unauthorized")
      return NextResponse.json({ error: "Equipo no encontrado o no autorizado" }, { status: 404 })
    }

    const equipo = equipoResult[0]

    // Verificar que el participante está en el equipo
    const participanteEnEquipo = (await query(
      "SELECT id FROM equipo_participantes WHERE equipo_id = ? AND participante_id = ?",
      [equipoId, participanteId],
    )) as any[]

    if (participanteEnEquipo.length === 0) {
      console.log(" Participant not found in team")
      return NextResponse.json({ error: "Participante no encontrado en este equipo" }, { status: 404 })
    }

    if (tipo === "deportista") {
      if (equipo.disciplina_genero && equipo.disciplina_genero !== "mixto") {
        const disciplinaGenero = equipo.disciplina_genero.toLowerCase()
        const participanteGenero = genero.toLowerCase()

        if (participanteGenero !== disciplinaGenero) {
          return NextResponse.json(
            {
              error: `El género del deportista debe coincidir con el de la disciplina (${equipo.disciplina_genero})`,
            },
            { status: 400 },
          )
        }
      }

      if (equipo.año_desde && equipo.año_hasta) {
        try {
          const birthDate = new Date(fecha_nacimiento)
          const birthYear = birthDate.getFullYear()

          if (isNaN(birthYear) || birthYear < equipo.año_desde || birthYear > equipo.año_hasta) {
            return NextResponse.json(
              {
                error: `El año de nacimiento del deportista (${birthYear}) no está en el rango permitido (${equipo.año_desde}-${equipo.año_hasta})`,
              },
              { status: 400 },
            )
          }
        } catch (dateError) {
          console.error(" Date parsing error:", dateError)
          return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 })
        }
      }
    } else {
      console.log(" Skipping gender and age validation for non-athlete:", tipo)
    }

    let formattedDate = fecha_nacimiento
    if (fecha_nacimiento.includes("T")) {
      formattedDate = fecha_nacimiento.split("T")[0]
    }
    if (formattedDate.includes("/")) {
      const parts = formattedDate.split("/")
      if (parts.length === 3) {
        formattedDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
      }
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(formattedDate)) {
      console.log(" Invalid date format after formatting:", formattedDate)
      return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 })
    }

    try {
      const updateResult = await query(
        "UPDATE participantes SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?, tipo = ? WHERE id = ?",
        [nombre, apellido, formattedDate, genero.toUpperCase(), tipo, participanteId],
      )

      if (updateResult.affectedRows === 0) {
        console.log(" No rows were updated - participant might not exist")
        return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 })
      }

      return NextResponse.json({
        message: "Participante actualizado correctamente",
        affectedRows: updateResult.affectedRows,
      })
    } catch (dbError) {
      console.error(" Database update error:", dbError)
      console.error(" Database error message:", dbError.message)
      console.error(" Database error code:", dbError.code)
      console.error(" Database error errno:", dbError.errno)
      console.error(" Database error sqlState:", dbError.sqlState)
      console.error(" Database error sqlMessage:", dbError.sqlMessage)

      return NextResponse.json(
        {
          error: `Error de base de datos: ${dbError.message}`,
          code: dbError.code,
          errno: dbError.errno,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error(" Error updating participant - Full error:", error)
    console.error(" Error message:", error.message)
    console.error(" Error stack:", error.stack)
    console.error(" Error name:", error.name)

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error.message,
        name: error.name,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participanteId: string }> },
) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { id: equipoId, participanteId } = await params

    // Verificar que el equipo pertenece al gestor
    const equipoResult = (await query("SELECT id FROM equipos WHERE id = ? AND usuario_creador_id = ?", [
      equipoId,
      sessionData.id,
    ])) as any[]

    if (equipoResult.length === 0) {
      return NextResponse.json({ error: "Equipo no encontrado o no autorizado" }, { status: 404 })
    }

    // Verificar que el participante está en el equipo
    const participanteEnEquipo = (await query(
      "SELECT id FROM equipo_participantes WHERE equipo_id = ? AND participante_id = ?",
      [equipoId, participanteId],
    )) as any[]

    if (participanteEnEquipo.length === 0) {
      return NextResponse.json({ error: "Participante no encontrado en este equipo" }, { status: 404 })
    }

    // Remover del equipo
    await query("DELETE FROM equipo_participantes WHERE equipo_id = ? AND participante_id = ?", [
      equipoId,
      participanteId,
    ])

    return NextResponse.json({ message: "Participante removido del equipo correctamente" })
  } catch (error) {
    console.error("Error removing participant:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
