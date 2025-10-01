import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { sendEmail } from "@/lib/email-service"

function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    const users = await query("SELECT id, nombre, apellido, email FROM usuarios WHERE email = ? AND activo = TRUE", [
      email,
    ])

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "No se encontró un usuario con ese correo electrónico" }, { status: 404 })
    }

    const user = users[0] as { id: number; nombre: string; apellido: string; email: string }

    const temporaryPassword = generateTemporaryPassword()
    const hashedPassword = await hashPassword(temporaryPassword)

    await query("UPDATE usuarios SET password_hash = ? WHERE id = ?", [hashedPassword, user.id])

    const emailHtml = generateForgotPasswordEmail({
      nombre: user.nombre,
      email: user.email,
      temporaryPassword,
    })

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Contraseña Temporal - Juegos Regionales Neuquinos",
      html: emailHtml,
    })

    if (!emailResult.success) {
      console.error(" Failed to send forgot password email:", emailResult.message)
      return NextResponse.json({ error: "Error al enviar el correo electrónico" }, { status: 500 })
    }

    return NextResponse.json({ message: "Contraseña temporal enviada exitosamente" })
  } catch (error) {
    console.error(" Forgot password error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

function generateForgotPasswordEmail(userData: {
  nombre: string
  email: string
  temporaryPassword: string
}) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.juegosregionalesneuquinos.ar"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Contraseña Temporal - Juegos Regionales Neuquinos</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #475569; margin: 0; padding: 0; background-color: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { 
          background: #2b3e4c; 
          color: #f4e1ba; 
          padding: 30px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
        }
        .header h1 { margin: 0 0 10px 0; font-size: 24px; }
        .header p { margin: 0; opacity: 0.9; }
        .content { 
          background: #ffffff; 
          padding: 30px; 
          border-radius: 0 0 8px 8px; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .credentials { 
          background: #f1f5f9; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #dc2626; 
        }
        .credentials h3 { 
          color: #2b3e4c; 
          margin: 0 0 15px 0; 
          font-size: 18px; 
        }
        .button { 
          display: inline-block; 
          background: #059669; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0; 
          font-weight: bold;
        }
        .button:hover { background: #10b981; }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          color: #87b867; 
          font-size: 14px; 
          background: #2b3e4c;
          color: #f4e1ba;
          padding: 20px;
          border-radius: 8px;
        }
        .important { 
          background: #fef2f2; 
          color: #dc2626; 
          padding: 15px; 
          border-radius: 6px; 
          margin: 20px 0;
          border-left: 4px solid #dc2626;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Contraseña Temporal</h1>
          <p>Juegos Regionales Neuquinos</p>
        </div>
        <div class="content">
          <p>Hola <strong>${userData.nombre}</strong>,</p>
          <p>Has solicitado una contraseña temporal para acceder al sistema.</p>
          
          <div class="credentials">
            <h3>Nueva Contraseña Temporal:</h3>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Contraseña Temporal:</strong> <span style="font-size: 18px; font-weight: bold; color: #dc2626;">${userData.temporaryPassword}</span></p>
          </div>
          
          <p>Puedes acceder al sistema haciendo clic en el siguiente enlace:</p>
          <a href="${loginUrl}/login" class="button">Acceder al Sistema</a>
          
          <div class="important">
            <p><strong>¡Importante!</strong></p>
            <ul>
              <li>Esta contraseña es temporal y debe ser cambiada inmediatamente después del primer acceso.</li>
              <li>Por seguridad, te recomendamos cambiar tu contraseña desde el menú de usuario.</li>
              <li>Si no solicitaste este cambio, contacta inmediatamente al soporte técnico.</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p><strong>Secretaría de Deportes, Cultura y Gestión Ciudadana</strong></p>
          <p>Provincia del Neuquén</p>
          <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">Este es un email automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
