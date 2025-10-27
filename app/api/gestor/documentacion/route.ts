import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { getSessionFromRequest, requireAnyRole } from "@/lib/session-helpers"

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
}

// GET - Obtener todos los documentos (solo lectura para gestores)
export async function GET(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireAnyRole(sessionData, ["gestor", "administrador"])

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const connection = await mysql.createConnection(dbConfig)

    const [rows] = await connection.execute(`
      SELECT 
        d.id,
        d.titulo,
        d.nombre_archivo,
        d.tipo_archivo,
        d.tamaño_archivo,
        d.fecha_subida,
        d.subido_por,
        CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario
      FROM documentacion d
      JOIN usuarios u ON d.subido_por = u.id
      WHERE u.rol = 'administrador'
      ORDER BY d.fecha_subida DESC
    `)

    await connection.end()

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener documentos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
