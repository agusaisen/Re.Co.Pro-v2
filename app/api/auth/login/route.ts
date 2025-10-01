import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
  
    const { email, password } = await request.json()
   

    if (!email || !password) {
      console.log("Email y contraseña son requeridos")
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const user = await authenticateUser(email, password)
 

    if (!user) {
      console.log("Credenciales invalidas")
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

   
    return NextResponse.json({
      message: "Login exitoso",
      user: user,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
