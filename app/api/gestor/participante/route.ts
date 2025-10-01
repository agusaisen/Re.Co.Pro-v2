import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/session-helpers"

export async function POST(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    if (!sessionData) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { dni, nombre, apellido, fecha_nacimiento, genero, tipo, telefono, email } = await request.json()

    if (!dni || !nombre || !apellido || !fecha_nacimiento || !genero) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const connection = await getConnection()

    const [existingParticipant] = await connection.execute(
      "SELECT id FROM participantes WHERE dni = ? AND localidad_id = ?",
      [dni, sessionData.localidad_id],
    )

    if (Array.isArray(existingParticipant) && existingParticipant.length > 0) {
      return NextResponse.json(
        {
          error: "Ya existe un participante con este DNI en su localidad",
        },
        { status: 400 },
      )
    }

    const [participantInOtherLocality] = await connection.execute(
      "SELECT l.nombre as localidad_nombre FROM participantes p JOIN localidades l ON p.localidad_id = l.id WHERE p.dni = ? AND p.localidad_id != ?",
      [dni, sessionData.localidad_id],
    )

    if (Array.isArray(participantInOtherLocality) && participantInOtherLocality.length > 0) {
      const otherLocalidad = (participantInOtherLocality[0] as any).localidad_nombre
      return NextResponse.json(
        {
          error: `Este DNI ya está registrado en la localidad de ${otherLocalidad}. Un participante no puede estar en múltiples localidades.`,
        },
        { status: 400 },
      )
    }

    const [result] = await connection.execute(
      "INSERT INTO participantes (dni, nombre, apellido, fecha_nacimiento, genero, tipo, localidad_id, telefono, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [dni, nombre, apellido, fecha_nacimiento, genero, tipo, sessionData.localidad_id, telefono, email],
    )

    return NextResponse.json({
      success: true,
      participante_id: (result as any).insertId,
    })
  } catch (error) {
    console.error("Error al crear participante:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
