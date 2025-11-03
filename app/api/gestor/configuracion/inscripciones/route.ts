import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getArgentinaDate(): Date {
  // Get current date in Argentina timezone (America/Argentina/Buenos_Aires)
  const argentinaDateString = new Date().toLocaleString("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
  })
  return new Date(argentinaDateString)
}

export async function GET(request: NextRequest) {
  try {
    // Obtener fechas de inscripción
    const configuraciones = (await query(
      `SELECT clave, valor FROM configuracion 
       WHERE clave IN ('fecha_inicio_inscripciones', 'fecha_fin_inscripciones')`,
    )) as any[]

    const config: Record<string, string> = {}
    for (const conf of configuraciones) {
      config[conf.clave] = conf.valor
    }

    const fechaInicioStr = config.fecha_inicio_inscripciones
    const fechaFinStr = config.fecha_fin_inscripciones

    const fechaActualArgentina = getArgentinaDate()
    const fechaActualStr = fechaActualArgentina.toISOString().split("T")[0]

    // Si no hay fechas configuradas, las inscripciones están abiertas por defecto
    if (!fechaInicioStr || !fechaFinStr) {
      return NextResponse.json({
        inscripcionesAbiertas: true,
        fecha_inicio: "",
        fecha_fin: "",
        fecha_actual: fechaActualStr,
      })
    }

    // Set times to start of day (00:00:00) and end of day (23:59:59) in Argentina timezone
    const fechaInicio = new Date(fechaInicioStr + "T00:00:00")
    const fechaFin = new Date(fechaFinStr + "T23:59:59")

    // Verificar si estamos dentro del período de inscripciones
    const inscripcionesAbiertas = fechaActualArgentina >= fechaInicio && fechaActualArgentina <= fechaFin

    return NextResponse.json({
      inscripcionesAbiertas,
      fecha_inicio: fechaInicioStr,
      fecha_fin: fechaFinStr,
      fecha_actual: fechaActualStr,
    })
  } catch (error) {
    console.error("Error al verificar estado de inscripciones:", error)
    return NextResponse.json({ error: "Error al verificar estado de inscripciones" }, { status: 500 })
  }
}
