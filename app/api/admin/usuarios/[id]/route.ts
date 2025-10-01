import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const body = await request.json()
    const userId = Number.parseInt(params.id)

    if (body.activo !== undefined) {
      // Status toggle update
      await query("UPDATE usuarios SET activo = ? WHERE id = ?", [body.activo, userId])
      return NextResponse.json({ message: "Usuario actualizado correctamente" })
    }

    // Full user edit
    const { email, nombre, apellido, dni, password, rol, localidad_id } = body

    if (!email || !nombre || !apellido || !dni || !rol) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Check if email is already taken by another user
    const existingUser = await query("SELECT id FROM usuarios WHERE email = ? AND id != ?", [email, userId])
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "El email ya está registrado por otro usuario" }, { status: 400 })
    }

    // Check if DNI is already taken by another user
    const existingDni = await query("SELECT id FROM usuarios WHERE dni = ? AND id != ?", [dni, userId])
    if (existingDni.length > 0) {
      return NextResponse.json({ error: "El DNI ya está registrado por otro usuario" }, { status: 400 })
    }

    // Update user data
    if (password && password.trim() !== "") {
      // Update with new password
      const hashedPassword = await bcrypt.hash(password, 10)
      await query(
        "UPDATE usuarios SET email = ?, nombre = ?, apellido = ?, dni = ?, password_hash = ?, rol = ?, localidad_id = ? WHERE id = ?",
        [email, nombre, apellido, dni, hashedPassword, rol, localidad_id, userId],
      )
    } else {
      // Update without changing password
      await query(
        "UPDATE usuarios SET email = ?, nombre = ?, apellido = ?, dni = ?, rol = ?, localidad_id = ? WHERE id = ?",
        [email, nombre, apellido, dni, rol, localidad_id, userId],
      )
    }

    return NextResponse.json({ message: "Usuario actualizado correctamente" })
  } catch (error) {
    console.error("Error updating usuario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const userId = Number.parseInt(params.id)

    // No permitir eliminar el propio usuario
    if (sessionData.id === userId) {
      return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 })
    }

    const userToDelete = await query("SELECT email FROM usuarios WHERE id = ?", [userId])
    if (userToDelete.length > 0 && userToDelete[0].email === "aaisen@neuquen.gov.ar") {
      return NextResponse.json({ error: "Este usuario no puede ser eliminado" }, { status: 403 })
    }

    await query("DELETE FROM usuarios WHERE id = ?", [userId])

    return NextResponse.json({ message: "Usuario eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting usuario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
