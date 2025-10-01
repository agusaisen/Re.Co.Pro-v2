import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string; participanteId: string } }) {
  try {
    console.log("[v0] PUT request started for participant:", params.participanteId, "in team:", params.id)

    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      console.log("[v0] Auth error:", authError)
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    console.log("[v0] Auth successful for user:", sessionData.id)

    const body = await request.json()
    console.log("[v0] Received PUT request body:", body)
    console.log("[v0] Params:", params)

    const { nombre, apellido, fecha_nacimiento, genero, tipo } = body

    const missingFields = []
    if (!nombre) missingFields.push("nombre")
    if (!apellido) missingFields.push("apellido")
    if (!fecha_nacimiento) missingFields.push("fecha_nacimiento")
    if (!genero) missingFields.push("genero")
    if (!tipo) missingFields.push("tipo")

    if (missingFields.length > 0) {
      console.log("[v0] Missing required fields:", missingFields)
      return NextResponse.json(
        {
          error: `Campos requeridos faltantes: ${missingFields.join(", ")}`,
          missingFields,
        },
        { status: 400 },
      )
    }

    console.log("[v0] All required fields present, proceeding with team verification")

    try {
      await query("SELECT 1 as test")
      console.log("[v0] Database connection test successful")
    } catch (dbTestError) {
      console.error("[v0] Database connection test failed:", dbTestError)
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 })
    }

    // Verificar que el equipo pertenece al gestor y obtener info de disciplina
    const equipoResult = (await query(
      `SELECT e.id, e.disciplina_id, d.genero as disciplina_genero, d.año_desde, d.año_hasta
       FROM equipos e 
       JOIN disciplinas d ON e.disciplina_id = d.id 
       WHERE e.id = ? AND e.usuario_creador_id = ?`,
      [params.id, sessionData.id],
    )) as any[]

    console.log("[v0] Team query result:", equipoResult)

    if (equipoResult.length === 0) {
      console.log("[v0] Team not found or unauthorized")
      return NextResponse.json({ error: "Equipo no encontrado o no autorizado" }, { status: 404 })
    }

    const equipo = equipoResult[0]
    console.log("[v0] Team info:", equipo)

    // Verificar que el participante está en el equipo
    const participanteEnEquipo = (await query(
      "SELECT id FROM equipo_participantes WHERE equipo_id = ? AND participante_id = ?",
      [params.id, params.participanteId],
    )) as any[]

    console.log("[v0] Participant in team check:", participanteEnEquipo)

    if (participanteEnEquipo.length === 0) {
      console.log("[v0] Participant not found in team")
      return NextResponse.json({ error: "Participante no encontrado en este equipo" }, { status: 404 })
    }

    if (tipo === "deportista") {
      if (equipo.disciplina_genero && equipo.disciplina_genero !== "mixto") {
        const disciplinaGenero = equipo.disciplina_genero.toLowerCase()
        const participanteGenero = genero.toLowerCase()

        console.log("[v0] Gender validation - discipline:", disciplinaGenero, "participant:", participanteGenero)

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

          console.log("[v0] Age validation - birth year:", birthYear)
          console.log("[v0] Year limits - desde:", equipo.año_desde, "hasta:", equipo.año_hasta)

          if (isNaN(birthYear) || birthYear < equipo.año_desde || birthYear > equipo.año_hasta) {
            return NextResponse.json(
              {
                error: `El año de nacimiento del deportista (${birthYear}) no está en el rango permitido (${equipo.año_desde}-${equipo.año_hasta})`,
              },
              { status: 400 },
            )
          }
        } catch (dateError) {
          console.error("[v0] Date parsing error:", dateError)
          return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 })
        }
      }
    } else {
      console.log("[v0] Skipping gender and age validation for non-athlete:", tipo)
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

    console.log("[v0] Date formatting - original:", fecha_nacimiento, "formatted:", formattedDate)

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(formattedDate)) {
      console.log("[v0] Invalid date format after formatting:", formattedDate)
      return NextResponse.json({ error: "Formato de fecha inválido" }, { status: 400 })
    }

    console.log("[v0] About to update participant with:", {
      nombre,
      apellido,
      formattedDate,
      genero: genero.toUpperCase(), // Ensure gender is uppercase for database
      tipo,
      participanteId: params.participanteId,
    })

    try {
      const updateResult = await query(
        "UPDATE participantes SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?, tipo = ? WHERE id = ?",
        [nombre, apellido, formattedDate, genero.toUpperCase(), tipo, params.participanteId],
      )

      console.log("[v0] Update query result:", updateResult)

      if (updateResult.affectedRows === 0) {
        console.log("[v0] No rows were updated - participant might not exist")
        return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 })
      }

      console.log("[v0] Participant updated successfully, affected rows:", updateResult.affectedRows)

      return NextResponse.json({
        message: "Participante actualizado correctamente",
        affectedRows: updateResult.affectedRows,
      })
    } catch (dbError) {
      console.error("[v0] Database update error:", dbError)
      console.error("[v0] Database error message:", dbError.message)
      console.error("[v0] Database error code:", dbError.code)
      console.error("[v0] Database error errno:", dbError.errno)
      console.error("[v0] Database error sqlState:", dbError.sqlState)
      console.error("[v0] Database error sqlMessage:", dbError.sqlMessage)

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
    console.error("[v0] Error updating participant - Full error:", error)
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error stack:", error.stack)
    console.error("[v0] Error name:", error.name)

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

export async function DELETE(request: NextRequest, { params }: { params: { id: string; participanteId: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    // Verificar que el equipo pertenece al gestor
    const equipoResult = (await query("SELECT id FROM equipos WHERE id = ? AND usuario_creador_id = ?", [
      params.id,
      sessionData.id,
    ])) as any[]

    if (equipoResult.length === 0) {
      return NextResponse.json({ error: "Equipo no encontrado o no autorizado" }, { status: 404 })
    }

    // Verificar que el participante está en el equipo
    const participanteEnEquipo = (await query(
      "SELECT id FROM equipo_participantes WHERE equipo_id = ? AND participante_id = ?",
      [params.id, params.participanteId],
    )) as any[]

    if (participanteEnEquipo.length === 0) {
      return NextResponse.json({ error: "Participante no encontrado en este equipo" }, { status: 404 })
    }

    // Remover del equipo
    await query("DELETE FROM equipo_participantes WHERE equipo_id = ? AND participante_id = ?", [
      params.id,
      params.participanteId,
    ])

    return NextResponse.json({ message: "Participante removido del equipo correctamente" })
  } catch (error) {
    console.error("Error removing participant:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
