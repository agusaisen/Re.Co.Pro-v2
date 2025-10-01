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

// GET - Descargar documento
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    // Only handle download action
    if (action !== "download") {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    const sessionData = getSessionFromRequest(request)
    const authError = requireAnyRole(sessionData, ["administrador", "coordinador"])

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const connection = await mysql.createConnection(dbConfig)

    const [rows] = await connection.execute(
      "SELECT nombre_archivo, tipo_archivo, contenido_archivo FROM documentacion WHERE id = ?",
      [params.id],
    )

    await connection.end()

    const documents = rows as any[]
    if (documents.length === 0) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    const document = documents[0]

    if (!document.contenido_archivo) {
      return NextResponse.json({ error: "Contenido del archivo no encontrado" }, { status: 404 })
    }

    // Create response with file content
    const response = new NextResponse(document.contenido_archivo)

    response.headers.set("Content-Type", document.tipo_archivo || "application/octet-stream")
    response.headers.set("Content-Disposition", `attachment; filename="${document.nombre_archivo}"`)

    return response
  } catch (error) {
    console.error("Error al descargar documento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// DELETE - Eliminar documento
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireAnyRole(sessionData, ["administrador"])

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const connection = await mysql.createConnection(dbConfig)

    const [result] = await connection.execute("DELETE FROM documentacion WHERE id = ?", [params.id])

    await connection.end()

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Documento eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar documento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
