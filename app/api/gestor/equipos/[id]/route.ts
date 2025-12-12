import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    if (!sessionData || !sessionData.id) {
      console.error("[v0] Session data missing or invalid:", sessionData)
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    console.log("[v0] Fetching equipo:", params.id, "for user:", sessionData.id)

    // Obtener detalles del equipo
    const equipoResult = (await query(
      `
      SELECT 
        e.id,
        e.nombre_equipo,
        e.created_at,
        d.nombre as disciplina_nombre,
        d.id as disciplina_id,
        l.nombre as localidad_nombre
      FROM equipos e
      JOIN disciplinas d ON e.disciplina_id = d.id
      JOIN localidades l ON e.localidad_id = l.id
      WHERE e.id = ? AND e.usuario_creador_id = ?
    `,
      [params.id, sessionData.id],
    )) as any[]

    console.log("[v0] Equipo query result:", equipoResult.length > 0 ? "found" : "not found")

    if (equipoResult.length === 0) {
      return NextResponse.json({ error: "Equipo no encontrado o no autorizado" }, { status: 404 })
    }

    const equipo = equipoResult[0]

    // Obtener participantes del equipo
    const participantes = (await query(
      `
      SELECT 
        p.id,
        p.dni,
        p.nombre,
        p.apellido,
        p.fecha_nacimiento,
        p.genero,
        p.tipo
      FROM participantes p
      JOIN equipo_participantes ep ON p.id = ep.participante_id
      WHERE ep.equipo_id = ?
      ORDER BY 
        CASE p.tipo 
          WHEN 'deportista' THEN 1 
          WHEN 'entrenador' THEN 2 
          WHEN 'delegado' THEN 3 
        END,
        p.nombre, p.apellido
    `,
      [params.id],
    )) as any[]

    console.log("[v0] Participantes found:", participantes.length)

    return NextResponse.json({
      ...equipo,
      participantes,
    })
  } catch (error) {
    console.error("Error fetching equipo details:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    if (!sessionData || !sessionData.id) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    const { nombre_equipo } = await request.json()

    // Verificar que el equipo pertenece al gestor
    const equipoResult = (await query("SELECT id FROM equipos WHERE id = ? AND usuario_creador_id = ?", [
      params.id,
      sessionData.id,
    ])) as any[]

    if (equipoResult.length === 0) {
      return NextResponse.json({ error: "Equipo no encontrado o no autorizado" }, { status: 404 })
    }

    // Actualizar el nombre del equipo
    await query("UPDATE equipos SET nombre_equipo = ? WHERE id = ?", [nombre_equipo || null, params.id])

    return NextResponse.json({ message: "Equipo actualizado correctamente" })
  } catch (error) {
    console.error("Error updating equipo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "gestor")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    if (!sessionData || !sessionData.id) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    // Verificar que el equipo pertenece al gestor
    const equipoResult = (await query("SELECT id FROM equipos WHERE id = ? AND usuario_creador_id = ?", [
      params.id,
      sessionData.id,
    ])) as any[]

    if (equipoResult.length === 0) {
      return NextResponse.json({ error: "Equipo no encontrado o no autorizado" }, { status: 404 })
    }

    // Eliminar participantes del equipo
    await query("DELETE FROM equipo_participantes WHERE equipo_id = ?", [params.id])

    // Eliminar el equipo
    await query("DELETE FROM equipos WHERE id = ?", [params.id])

    return NextResponse.json({ message: "Equipo eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting equipo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
