import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireAnyRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

// GET - Descargar documento específico de un participante
export async function GET(request: NextRequest, { params }: { params: { id: string; documentoId: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireAnyRole(sessionData, ["gestor", "administrador"])

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const participanteId = params.id
    const documentoId = params.documentoId

    // Verificar que el vínculo existe y el usuario tiene permisos
    const documento = await query(
      `
      SELECT 
        d.id,
        d.titulo,
        d.nombre_archivo,
        d.tipo_archivo,
        d.contenido_archivo,
        p.localidad_id
      FROM documento_participante dp
      JOIN documentacion d ON dp.documento_id = d.id
      JOIN participantes p ON dp.participante_id = p.id
      WHERE dp.documento_id = ? AND dp.participante_id = ?
    `,
      [documentoId, participanteId],
    )

    if (documento.length === 0) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    // Verificar permisos de localidad para gestores
    if (sessionData.rol === "gestor" && documento[0].localidad_id !== sessionData.localidad_id) {
      return NextResponse.json({ error: "No tienes permisos para descargar este documento" }, { status: 403 })
    }

    const doc = documento[0]

    // Retornar el archivo
    return new NextResponse(doc.contenido_archivo, {
      headers: {
        "Content-Type": doc.tipo_archivo,
        "Content-Disposition": `attachment; filename="${doc.nombre_archivo}"`,
        "Content-Length": doc.contenido_archivo.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading participant document:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
