import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = request.headers.get("x-session")
    if (!session) {
      return NextResponse.json({ error: "Sesión no proporcionada" }, { status: 401 })
    }

    const sessionData = JSON.parse(session)
    if (sessionData.rol !== "gestor") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener fechas de inscripción
    const configuraciones = (await query(
      `SELECT clave, valor FROM configuracion 
       WHERE clave IN ('fecha_inicio_inscripciones', 'fecha_fin_inscripciones')`,
    )) as any[]

    const config: Record<string, string> = {}
    for (const conf of configuraciones) {
      config[conf.clave] = conf.valor
    }

    const fechaInicio = new Date(config.fecha_inicio_inscripciones)
    const fechaFin = new Date(config.fecha_fin_inscripciones)
    const fechaActual = new Date()

    // Verificar si estamos dentro del período de inscripciones
    const inscripcionesAbiertas = fechaActual >= fechaInicio && fechaActual <= fechaFin

    return NextResponse.json({
      inscripcionesAbiertas,
      fecha_inicio: config.fecha_inicio_inscripciones,
      fecha_fin: config.fecha_fin_inscripciones,
      fecha_actual: fechaActual.toISOString().split("T")[0],
    })
  } catch (error) {
    console.error("Error al verificar estado de inscripciones:", error)
    return NextResponse.json({ error: "Error al verificar estado de inscripciones" }, { status: 500 })
  }
}
