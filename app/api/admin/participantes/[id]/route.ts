import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const participante = await query(
      `SELECT p.*, l.nombre as localidad_nombre 
       FROM participantes p 
       LEFT JOIN localidades l ON p.localidad_id = l.id 
       WHERE p.id = ?`,
      [params.id],
    )

    if (participante.length === 0) {
      return NextResponse.json({ success: false, error: "Participante no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: participante[0] })
  } catch (error) {
    console.error("Error fetching participante:", error)
    return NextResponse.json({ success: false, error: "Error al obtener participante" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { dni, nombre, apellido, fecha_nacimiento, tipo, localidad_id, telefono, email } = body

    // Validaciones
    if (!dni || !nombre || !apellido || !fecha_nacimiento || !tipo || !localidad_id) {
      return NextResponse.json(
        { success: false, error: "Todos los campos obligatorios deben ser completados" },
        { status: 400 },
      )
    }

    // Validar edad según tipo
    const fechaNac = new Date(fecha_nacimiento)
    const hoy = new Date()
    const edad = hoy.getFullYear() - fechaNac.getFullYear()

    if (tipo === "entrenador" || tipo === "delegado") {
      if (edad < 18) {
        return NextResponse.json(
          { success: false, error: "Entrenadores y delegados deben ser mayores de 18 años" },
          { status: 400 },
        )
      }
    }

    // Verificar si el DNI ya existe en otro participante
    const existingParticipante = await query("SELECT id FROM participantes WHERE dni = ? AND id != ?", [dni, params.id])

    if (existingParticipante.length > 0) {
      return NextResponse.json({ success: false, error: "Ya existe otro participante con ese DNI" }, { status: 400 })
    }

    // Actualizar participante
    await query(
      `UPDATE participantes 
       SET dni = ?, nombre = ?, apellido = ?, fecha_nacimiento = ?, 
           tipo = ?, localidad_id = ?, telefono = ?, email = ?
       WHERE id = ?`,
      [dni, nombre, apellido, fecha_nacimiento, tipo, localidad_id, telefono, email, params.id],
    )

    return NextResponse.json({
      success: true,
      message: "Participante actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating participante:", error)
    return NextResponse.json({ success: false, error: "Error al actualizar participante" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar si el participante está asociado a algún equipo
    const equiposAsociados = await query(
      "SELECT COUNT(*) as count FROM equipo_participantes WHERE participante_id = ?",
      [params.id],
    )

    if (equiposAsociados[0].count > 0) {
      return NextResponse.json(
        { success: false, error: "No se puede eliminar el participante porque está asociado a uno o más equipos" },
        { status: 400 },
      )
    }

    // Eliminar participante
    const result = await query("DELETE FROM participantes WHERE id = ?", [params.id])

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Participante no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Participante eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error deleting participante:", error)
    return NextResponse.json({ success: false, error: "Error al eliminar participante" }, { status: 500 })
  }
}
