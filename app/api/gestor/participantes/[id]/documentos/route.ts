import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireAnyRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

// GET - Obtener documentos de un participante
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireAnyRole(sessionData, ["gestor", "administrador"])

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const participanteId = params.id

    // Verificar que el participante existe y es un deportista
    const participante = await query("SELECT id, tipo, localidad_id FROM participantes WHERE id = ?", [participanteId])

    if (participante.length === 0) {
      return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 })
    }

    if (participante[0].tipo !== "deportista") {
      return NextResponse.json({ error: "Solo se pueden vincular documentos a deportistas" }, { status: 400 })
    }

    // Verificar permisos: gestor solo puede ver participantes de su localidad
    if (sessionData.rol === "gestor" && participante[0].localidad_id !== sessionData.localidad_id) {
      return NextResponse.json({ error: "No tienes permisos para ver este participante" }, { status: 403 })
    }

    // Obtener documentos vinculados al participante
    const documentos = await query(
      `
      SELECT 
        d.id,
        d.titulo,
        d.nombre_archivo,
        d.tipo_archivo,
        d.tamaño_archivo,
        d.fecha_subida,
        u.nombre as subido_por_nombre,
        u.apellido as subido_por_apellido
      FROM documento_participante dp
      JOIN documentacion d ON dp.documento_id = d.id
      JOIN usuarios u ON d.subido_por = u.id
      WHERE dp.participante_id = ?
      ORDER BY d.fecha_subida DESC
    `,
      [participanteId],
    )

    return NextResponse.json({ success: true, data: documentos })
  } catch (error) {
    console.error("Error fetching participant documents:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST - Subir documento para un participante
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireAnyRole(sessionData, ["gestor"])

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const participanteId = params.id

    // Verificar que el participante existe y es un deportista
    const participante = await query("SELECT id, tipo, localidad_id FROM participantes WHERE id = ?", [participanteId])

    if (participante.length === 0) {
      return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 })
    }

    if (participante[0].tipo !== "deportista") {
      return NextResponse.json({ error: "Solo se pueden vincular documentos a deportistas" }, { status: 400 })
    }

    // Verificar permisos: gestor solo puede subir documentos para participantes de su localidad
    if (participante[0].localidad_id !== sessionData.localidad_id) {
      return NextResponse.json(
        { error: "No tienes permisos para subir documentos a este participante" },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const titulo = formData.get("titulo") as string

    if (!file || !titulo) {
      return NextResponse.json({ error: "Archivo y título son requeridos" }, { status: 400 })
    }

    // Validar tamaño del archivo (4.5MB límite de Vercel)
    const maxSize = 4.5 * 1024 * 1024 // 4.5MB en bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "El archivo es demasiado grande. El tamaño máximo permitido es 4.5MB",
        },
        { status: 400 },
      )
    }

    // Validar tipo de archivo
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Tipo de archivo no permitido. Solo se permiten PDF, imágenes (JPG, PNG) y documentos de Word",
        },
        { status: 400 },
      )
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Insertar documento en la base de datos
    const documentoResult = await query(
      `
      INSERT INTO documentacion (titulo, nombre_archivo, tipo_archivo, tamaño_archivo, contenido_archivo, subido_por)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [titulo, file.name, file.type, file.size, buffer, sessionData.id],
    )

    const documentoId = (documentoResult as any).insertId

    // Vincular documento al participante
    await query(
      `
      INSERT INTO documento_participante (documento_id, participante_id)
      VALUES (?, ?)
    `,
      [documentoId, participanteId],
    )

    return NextResponse.json({
      success: true,
      message: "Documento subido y vinculado correctamente",
      documentoId,
    })
  } catch (error) {
    console.error("Error uploading participant document:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// DELETE - Desvincular documento de un participante
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireAnyRole(sessionData, ["gestor"])

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { searchParams } = new URL(request.url)
    const documentoId = searchParams.get("documentoId")

    if (!documentoId) {
      return NextResponse.json({ error: "ID del documento es requerido" }, { status: 400 })
    }

    const participanteId = params.id

    // Verificar permisos y que el vínculo existe
    const vinculo = await query(
      `
      SELECT dp.id, p.localidad_id 
      FROM documento_participante dp
      JOIN participantes p ON dp.participante_id = p.id
      WHERE dp.documento_id = ? AND dp.participante_id = ?
    `,
      [documentoId, participanteId],
    )

    if (vinculo.length === 0) {
      return NextResponse.json({ error: "Vínculo no encontrado" }, { status: 404 })
    }

    // Verificar permisos de localidad
    if (vinculo[0].localidad_id !== sessionData.localidad_id) {
      return NextResponse.json({ error: "No tienes permisos para desvincular este documento" }, { status: 403 })
    }

    // Eliminar vínculo (esto NO elimina el documento, solo el vínculo)
    await query("DELETE FROM documento_participante WHERE documento_id = ? AND participante_id = ?", [
      documentoId,
      participanteId,
    ])

    return NextResponse.json({
      success: true,
      message: "Documento desvinculado correctamente",
    })
  } catch (error) {
    console.error("Error unlinking participant document:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
