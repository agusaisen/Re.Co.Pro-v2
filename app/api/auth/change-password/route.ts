import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    const authHeader = request.headers.get("authorization")
    const sessionHeader = request.headers.get("x-session-data")

    let token: string | null = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else if (sessionHeader) {
      token = sessionHeader
    }

    if (!token) {
      return NextResponse.json({ error: "Token no válido" }, { status: 401 })
    }

    let userData
    try {
      userData = JSON.parse(token)
    } catch {
      return NextResponse.json({ error: "Token no válido" }, { status: 401 })
    }

    // Verificar contraseña actual
    const users = await query("SELECT password_hash FROM usuarios WHERE id = ?", [userData.id])

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const user = users[0] as { password_hash: string }
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 })
    }

    // Generar hash de la nueva contraseña
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Actualizar contraseña en la base de datos
    await query("UPDATE usuarios SET password_hash = ? WHERE id = ?", [newPasswordHash, userData.id])

    return NextResponse.json({ message: "Contraseña actualizada exitosamente" })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
