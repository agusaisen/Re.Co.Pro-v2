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

    const configuraciones = await query(`SELECT clave, valor, descripcion FROM configuracion ORDER BY clave`)

    // Convertir array de configuraciones a objeto para facilitar el uso
    const config: Record<string, string> = {}
    for (const conf of configuraciones as any[]) {
      config[conf.clave] = conf.valor
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error al obtener configuración:", error)
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const body = await request.json()
    const { fecha_inicio_inscripciones, fecha_fin_inscripciones } = body

    if (!fecha_inicio_inscripciones || !fecha_fin_inscripciones) {
      return NextResponse.json({ error: "Fechas de inicio y fin son requeridas" }, { status: 400 })
    }

    // Validar que la fecha de inicio sea anterior a la fecha de fin
    if (new Date(fecha_inicio_inscripciones) >= new Date(fecha_fin_inscripciones)) {
      return NextResponse.json({ error: "La fecha de inicio debe ser anterior a la fecha de fin" }, { status: 400 })
    }

    // Actualizar configuraciones
    await query(`UPDATE configuracion SET valor = ? WHERE clave = 'fecha_inicio_inscripciones'`, [
      fecha_inicio_inscripciones,
    ])

    await query(`UPDATE configuracion SET valor = ? WHERE clave = 'fecha_fin_inscripciones'`, [fecha_fin_inscripciones])

    return NextResponse.json({
      message: "Configuración actualizada correctamente",
      fecha_inicio_inscripciones,
      fecha_fin_inscripciones,
    })
  } catch (error) {
    console.error("Error al actualizar configuración:", error)
    return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 })
  }
}
