export async function GET() {
  try {
    console.log("[v0] Testing database connection...")

    // Test environment variables
    const dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? "***" : undefined,
    }

    console.log("[v0] Database config:", dbConfig)

    // Test database connection
    const mysql = require("mysql2/promise")
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

    console.log("[v0] Database connected successfully")

    // Test query to get all users
    const [users] = await connection.execute("SELECT id, email, nombre, apellido, rol, password_hash FROM usuarios")
    console.log("[v0] Users found:", users)

    await connection.end()

    return Response.json({
      success: true,
      config: dbConfig,
      users: users,
    })
  } catch (error) {
    console.error("[v0] Database debug error:", error)
    return Response.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
