import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
}

export const runtime = "nodejs"
export const maxDuration = 30

// GET - Obtener todos los documentos
export async function GET(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

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

// POST - Subir nuevo documento
export async function POST(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const formData = await request.formData()
    const titulo = formData.get("titulo") as string
    const archivo = formData.get("archivo") as File

    if (!titulo || !archivo) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Título y archivo son requeridos" }, { status: 400 })
    }

    // Validar tipo de archivo
    const tiposPermitidos = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ]

    if (!tiposPermitidos.includes(archivo.type)) {
      console.log("[v0] File type not allowed:", archivo.type)
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
    }

    if (archivo.size > 25 * 1024 * 1024) {
      console.log("[v0] File too large:", archivo.size)
      return NextResponse.json({ error: "El archivo es demasiado grande (máximo 25MB)" }, { status: 400 })
    }

    const buffer = Buffer.from(await archivo.arrayBuffer())

    const connection = await mysql.createConnection(dbConfig)

    const usuarioId = sessionData?.usuario_id || sessionData?.id

    if (!usuarioId) {
      return NextResponse.json({ error: "ID de usuario no encontrado en la sesión" }, { status: 400 })
    }

    const [result] = await connection.execute(
      `INSERT INTO documentacion (titulo, nombre_archivo, tipo_archivo, tamaño_archivo, contenido_archivo, subido_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [titulo, archivo.name, archivo.type, archivo.size, buffer, usuarioId],
    )

    await connection.end()

    return NextResponse.json({
      message: "Documento subido correctamente",
      id: (result as any).insertId,
    })
  } catch (error) {
    console.error("Error al subir documento:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
