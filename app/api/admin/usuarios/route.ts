import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest, requireRole } from "@/lib/session-helpers"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import { sendEmail, generateWelcomeEmail } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
   
    const sessionData = getSessionFromRequest(request)
 

    const authError = requireRole(sessionData, "administrador")
    

    if (authError) {
      console.log(" Returning auth error:", authError)
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

   
    const usuarios = await query(`
      SELECT u.*, l.nombre as localidad_nombre 
      FROM usuarios u 
      LEFT JOIN localidades l ON u.localidad_id = l.id 
      ORDER BY u.nombre, u.apellido
    `)

   
    return NextResponse.json(usuarios)
  } catch (error) {
    console.error(" Error fetching usuarios:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionData = getSessionFromRequest(request)
    const authError = requireRole(sessionData, "administrador")

    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { email, nombre, apellido, dni, password, rol, localidad_id } = await request.json()

    if (!email || !nombre || !apellido || !dni || !password || !rol) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    const existingUser = await query("SELECT id FROM usuarios WHERE email = ?", [email])
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
    }

    const existingDni = await query("SELECT id FROM usuarios WHERE dni = ?", [dni])
    if (existingDni.length > 0) {
      return NextResponse.json({ error: "El DNI ya está registrado" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await query(
      "INSERT INTO usuarios (email, nombre, apellido, dni, password_hash, rol, localidad_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [email, nombre, apellido, dni, hashedPassword, rol, localidad_id],
    )

    let emailSent = false
    let emailError = null

    try {
   

      let localidadNombre = "No asignada"
      if (localidad_id) {
        const localidadResult = await query("SELECT nombre FROM localidades WHERE id = ?", [localidad_id])
        if (localidadResult.length > 0) {
          localidadNombre = localidadResult[0].nombre
        }
      }

      const emailTemplate = generateWelcomeEmail({
        nombre: `${nombre} ${apellido}`,
        email,
        password, // Send the plain password in email (user will change it)
        rol,
        localidad: localidadNombre, // Add locality to email data
      })

     

      // Simplified email sending without timeout race condition
      const emailResult = await sendEmail({
        to: email,
        subject: "Bienvenido a Juegos Regionales Neuquinos - Datos de acceso",
        html: emailTemplate,
      })

     
      emailSent = emailResult.success

      if (!emailResult.success) {
        emailError = emailResult.message
      }
    } catch (error) {
      console.error(" Error sending welcome email:", error)
      emailError = error.message || "Error desconocido al enviar email"
    }

    // Return success with email status
    const response = {
      message: "Usuario creado correctamente",
      emailSent,
      ...(emailError && { emailError }),
    }

  
    return NextResponse.json(response)
  } catch (error) {
    console.error(" Error creating usuario:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
