import mysql from "mysql2/promise"

const dbConfig = {
  host: process.env.DB_HOST || "193.203.166.106",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  database: process.env.DB_NAME || "u904484423_dep_jr",
  user: process.env.DB_USER || "u904484423_dep_jr",
  password: process.env.DB_PASSWORD || "6^Qhu!wC",
  ssl: {
    rejectUnauthorized: false,
  },
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
}

let pool: mysql.Pool | null = null

export async function getConnection() {
  try {
    if (!pool) {
      console.log("[v0] Creating new database pool...")
      pool = mysql.createPool(dbConfig)
      console.log("[v0] Database pool created successfully")
    }
    return pool
  } catch (error) {
    console.error("[v0] Database pool creation error:", error)
    throw error
  }
}

export async function query(sql: string, params?: any[]) {
  let connection: mysql.PoolConnection | null = null
  try {
    console.log("[v0] Executing query:", sql, "with params:", params)
    const pool = await getConnection()
    connection = await pool.getConnection()
    const [results] = await connection.execute(sql, params)
    console.log("[v0] Query executed successfully")
    return results
  } catch (error) {
    console.error("[v0] Database query error:", error)
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

export async function closeConnection() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
