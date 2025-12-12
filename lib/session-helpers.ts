import type { NextRequest } from "next/server"
import { verifySession } from "./auth"
import { headers } from "next/headers"

export function getSessionFromRequest(request: NextRequest) {
  try {
    console.log("[v0] All headers:", Object.fromEntries(request.headers.entries()))

    const sessionHeader = request.headers.get("x-session-data")

    console.log("[v0] Session header received:", sessionHeader ? "present" : "missing")

    if (!sessionHeader) {
      console.log("[v0] No session header found")
      return null
    }

    const sessionData = JSON.parse(sessionHeader)
    console.log("[v0] Parsed session data:", { id: sessionData.id, rol: sessionData.rol })

    if (!verifySession(sessionData)) {
      console.log("[v0] Session verification failed")
      return null
    }

    console.log("[v0] Session verified successfully")
    return sessionData
  } catch (error) {
    console.log("[v0] Error in getSessionFromRequest:", error)
    return null
  }
}

export async function getServerSession() {
  try {
    const headersList = await headers()
    const sessionHeader = headersList.get("x-session-data")

    console.log("[v0] Server session header received:", sessionHeader ? "present" : "missing")

    if (!sessionHeader) {
      console.log("[v0] No server session header found")
      return null
    }

    const sessionData = JSON.parse(sessionHeader)
    console.log("[v0] Parsed server session data:", { id: sessionData.id, rol: sessionData.rol })

    if (!verifySession(sessionData)) {
      console.log("[v0] Server session verification failed")
      return null
    }

    console.log("[v0] Server session verified successfully")
    return sessionData
  } catch (error) {
    console.log("[v0] Error in getServerSession:", error)
    return null
  }
}

export function requireAuth(sessionData: any) {
  if (!sessionData) {
    return { error: "Sesión no proporcionada", status: 401 }
  }
  return null
}

export function requireRole(sessionData: any, requiredRole: string) {
  const authError = requireAuth(sessionData)
  if (authError) return authError

  if (sessionData.rol !== requiredRole) {
    return { error: "Acceso no autorizado", status: 403 }
  }
  return null
}

export function requireAnyRole(sessionData: any, requiredRoles: string[]) {
  const authError = requireAuth(sessionData)
  if (authError) return authError

  if (!requiredRoles.includes(sessionData.rol)) {
    return { error: "Acceso no autorizado", status: 403 }
  }
  return null
}
