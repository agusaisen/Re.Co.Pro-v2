export async function GET() {
  try {
   

    // Test environment variables
    const dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? "***" : undefined,
    }


    // Test database connection
    const mysql = require("mysql2/promise")
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

  

    // Test query to get all users
    const [users] = await connection.execute("SELECT id, email, nombre, apellido, rol, password_hash FROM usuarios")
    

    await connection.end()

    return Response.json({
      success: true,
      config: dbConfig,
      users: users,
    })
  } catch (error) {
    console.error(" Database debug error:", error)
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
