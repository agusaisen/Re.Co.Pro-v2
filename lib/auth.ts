import bcrypt from "bcryptjs"
import { query } from "./db"
import type { NextRequest } from "next/server"

export interface User {
  id: number
  nombre: string
  apellido: string
  dni: string
  email: string
  localidad_id: number
  rol: "administrador" | "gestor"
}

export async function verifyToken(request: NextRequest): Promise<{ valid: boolean; user?: User }> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false }
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Parse the token (assuming it's JSON stored in localStorage)
    let sessionData
    try {
      sessionData = JSON.parse(token)
    } catch {
      return { valid: false }
    }

    // Verify session data structure
    if (!verifySession(sessionData)) {
      return { valid: false }
    }

    // Verify user still exists and is active
    const users = (await query("SELECT * FROM usuarios WHERE id = ? AND activo = TRUE", [sessionData.id])) as any[]

    if (users.length === 0) {
      return { valid: false }
    }

    const user = users[0]
    return {
      valid: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni,
        email: user.email,
        localidad_id: user.localidad_id,
        rol: user.rol,
      },
    }
  } catch (error) {
    console.error("Error verifying token:", error)
    return { valid: false }
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    console.log("[v0] Attempting to authenticate user:", email)

    const users = (await query("SELECT * FROM usuarios WHERE email = ? AND activo = TRUE", [email])) as any[]

    console.log("[v0] Users found:", users.length)
    if (users.length === 0) {
      console.log("[v0] No user found with email:", email)
      return null
    }

    const user = users[0]
    console.log("[v0] User found:", { id: user.id, email: user.email, rol: user.rol })
    console.log("[v0] Password hash from DB:", user.password_hash)
    console.log("[v0] Input password:", password)

    if (!user.password_hash) {
      console.log("[v0] No password hash found for user")
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log("[v0] Password validation result:", isValidPassword)

    if (!isValidPassword) {
      console.log("[v0] Invalid password for user:", email)
      return null
    }

    console.log("[v0] Authentication successful for user:", email)
    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      email: user.email,
      localidad_id: user.localidad_id,
      rol: user.rol,
    }
  } catch (error) {
    console.error("[v0] Error authenticating user:", error)
    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    return null
  }
}

export function createSession(user: User) {
  return {
    id: user.id,
    email: user.email,
    rol: user.rol,
    localidad_id: user.localidad_id,
    nombre: user.nombre,
    apellido: user.apellido,
    dni: user.dni,
  }
}

export function verifySession(sessionData: any): boolean {
  console.log("[v0] Verifying session data:", sessionData)
  const isValid = sessionData && sessionData.id && sessionData.email && sessionData.rol
  console.log("[v0] Session verification result:", isValid)
  return isValid
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
