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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[SERVER] Download endpoint called for ID:", params.id)

  try {
    console.log("[SERVER] Getting session from request...")
    const sessionData = getSessionFromRequest(request)
    console.log("[SERVER] Session data:", sessionData ? "Found" : "Not found")

    console.log("[SERVER] Checking user role authorization...")
    const authError = requireAnyRole(sessionData, ["administrador", "coordinador", "gestor"])

    if (authError) {
      console.log("[SERVER] Authorization failed:", authError)
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    console.log("[SERVER] Authorization successful, connecting to database...")
    const connection = await mysql.createConnection(dbConfig)
    console.log("[SERVER] Database connection established")

    console.log("[SERVER] Executing query for document ID:", params.id)
    const [rows] = await connection.execute(
      "SELECT nombre_archivo, tipo_archivo, contenido_archivo FROM documentacion WHERE id = ?",
      [params.id],
    )
    console.log("[SERVER] Query executed, rows found:", (rows as any[]).length)

    await connection.end()
    console.log("[SERVER] Database connection closed")

    const documents = rows as any[]
    if (documents.length === 0) {
      console.log("[SERVER] Document not found for ID:", params.id)
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    const document = documents[0]
    console.log("[SERVER] Document found:", {
      filename: document.nombre_archivo,
      type: document.tipo_archivo,
      hasContent: !!document.contenido_archivo,
    })

    console.log("[SERVER] Returning file response...")

    const encodedFilename = encodeURIComponent(document.nombre_archivo)

    return new NextResponse(document.contenido_archivo, {
      headers: {
        "Content-Type": document.tipo_archivo || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
      },
    })
  } catch (error) {
    console.error("[SERVER] Error in download endpoint:", error)
    console.error("[SERVER] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
