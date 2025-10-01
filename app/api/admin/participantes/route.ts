import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
    const localidad = searchParams.get("localidad")

    let sql = `
      SELECT p.*, l.nombre as localidad_nombre 
      FROM participantes p 
      LEFT JOIN localidades l ON p.localidad_id = l.id
      WHERE 1=1
    `
    const params: any[] = []

    if (tipo) {
      sql += " AND p.tipo = ?"
      params.push(tipo)
    }

    if (localidad) {
      sql += " AND p.localidad_id = ?"
      params.push(localidad)
    }

    sql += " ORDER BY p.apellido, p.nombre"

    const participantes = await query(sql, params)

    return NextResponse.json({ success: true, data: participantes })
  } catch (error) {
    console.error("Error fetching participantes:", error)
    return NextResponse.json({ success: false, error: "Error al obtener participantes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dni, nombre, apellido, fecha_nacimiento, tipo, localidad_id, telefono, email } = body

    // Validaciones
    if (!dni || !nombre || !apellido || !fecha_nacimiento || !tipo || !localidad_id) {
      return NextResponse.json(
        { success: false, error: "Todos los campos obligatorios deben ser completados" },
        { status: 400 },
      )
    }

    // Validar edad según tipo
    const fechaNac = new Date(fecha_nacimiento)
    const hoy = new Date()
    const edad = hoy.getFullYear() - fechaNac.getFullYear()

    if (tipo === "entrenador" || tipo === "delegado") {
      if (edad < 18) {
        return NextResponse.json(
          { success: false, error: "Entrenadores y delegados deben ser mayores de 18 años" },
          { status: 400 },
        )
      }
    }

    // Verificar si el DNI ya existe
    const existingParticipante = await query("SELECT id FROM participantes WHERE dni = ?", [dni])

    if (existingParticipante.length > 0) {
      return NextResponse.json({ success: false, error: "Ya existe un participante con ese DNI" }, { status: 400 })
    }

    // Insertar nuevo participante
    const result = await query(
      `INSERT INTO participantes 
       (dni, nombre, apellido, fecha_nacimiento, tipo, localidad_id, telefono, email) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dni, nombre, apellido, fecha_nacimiento, tipo, localidad_id, telefono, email],
    )

    return NextResponse.json({
      success: true,
      message: "Participante creado exitosamente",
      id: result.insertId,
    })
  } catch (error) {
    console.error("Error creating participante:", error)
    return NextResponse.json({ success: false, error: "Error al crear participante" }, { status: 500 })
  }
}
