import nodemailer from "nodemailer"

interface EmailData {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailData) {
  try {
    // Check if we have SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("[v0] SMTP not configured, email would be sent to:", to)
      console.log("[v0] Subject:", subject)
      return { success: false, message: "SMTP not configured - email simulated only" }
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"Juegos Regionales Neuquinos" <${process.env.SMTP_FROM || "noreply@juegosregionalesneuquinos.ar"}>`,
      to,
      subject,
      html,
    })

    console.log("[v0] Email sent successfully:", info.messageId)
    return { success: true, message: "Email sent successfully" }
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return { success: false, message: "Failed to send email" }
  }
}

export function generateWelcomeEmail(userData: {
  nombre: string
  email: string
  password: string
  rol: string
  localidad?: string // Add optional locality parameter
}) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.juegosregionalesneuquinos.ar"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bienvenido a los Juegos Regionales Neuquinos</title>
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
        .logo { max-width: 200px; height: auto; margin-bottom: 15px; }
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
          border-left: 4px solid #059669; 
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
          background: #f4e1ba; 
          color: #2b3e4c; 
          padding: 15px; 
          border-radius: 6px; 
          margin: 20px 0;
          border-left: 4px solid #87b867;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Bienvenido a los Juegos Regionales Neuquinos!</h1>
          <p>Tu cuenta ha sido creada exitosamente</p>
        </div>
        <div class="content">
          <p>Hola <strong>${userData.nombre}</strong>,</p>
          <p>Tu cuenta como <strong>${userData.rol}</strong> ha sido creada en el sistema de Juegos Regionales de Neuquinos.</p>
          
          <div class="credentials">
            <h3>Datos de Acceso:</h3>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Contraseña:</strong> ${userData.password}</p>
            <p><strong>Rol:</strong> ${userData.rol}</p>
            ${userData.localidad ? `<p><strong>Localidad asignada:</strong> ${userData.localidad}</p>` : ""}
          </div>
          
          <p>Puedes acceder al sistema haciendo clic en el siguiente enlace:</p>
          <a href="${loginUrl}/login" class="button">Acceder al Sistema</a>
          
          <div class="important">
            <p><strong>Importante:</strong> Te recomendamos cambiar tu contraseña después del primer acceso por seguridad.</p>
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
