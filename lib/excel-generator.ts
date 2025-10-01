import * as XLSX from "xlsx"
import type { EquipoReporte, ParticipanteReporte } from "./pdf-generator"

function formatearFechaSafe(fechaString: string): string {
  if (!fechaString) return ""
  // Extract only the date part to avoid timezone conversion
  const fechaSolo = fechaString.split("T")[0]
  const [year, month, day] = fechaSolo.split("-")
  return `${day}/${month}/${year}`
}

export async function generarReporteExcelCompleto(
  equipos: EquipoReporte[],
  titulo = "Reporte de Equipos",
): Promise<void> {
  const workbook = XLSX.utils.book_new()

  // Hoja 1: Resumen General
  const resumenData = [
    ["JUEGOS REGIONALES NEUQUINOS"],
    [titulo],
    [`Generado el: ${new Date().toLocaleDateString("es-AR")}`],
    [""],
    ["RESUMEN GENERAL"],
    ["Total de Equipos", equipos.length],
    [
      "Total de Deportistas",
      equipos.reduce((sum, e) => sum + e.participantes.filter((p) => p.tipo === "deportista").length, 0),
    ],
    [
      "Total de Entrenadores",
      equipos.reduce((sum, e) => sum + e.participantes.filter((p) => p.tipo === "entrenador").length, 0),
    ],
    [
      "Total de Delegados",
      equipos.reduce((sum, e) => sum + e.participantes.filter((p) => p.tipo === "delegado").length, 0),
    ],
    ["Total de Participantes", equipos.reduce((sum, e) => sum + e.participantes.length, 0)],
    [""],
    ["POR GÉNERO"],
    ["Masculino", equipos.reduce((sum, e) => sum + e.participantes.filter((p) => p.genero === "MASCULINO").length, 0)],
    ["Femenino", equipos.reduce((sum, e) => sum + e.participantes.filter((p) => p.genero === "FEMENINO").length, 0)],
  ]

  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen")

  // Hoja 2: Resumen por Disciplina
  const disciplinas = [...new Set(equipos.map((e) => e.disciplina))]
  const disciplinaData = [
    ["RESUMEN POR DISCIPLINA"],
    [""],
    [
      "Disciplina",
      "Equipos",
      "Deportistas",
      "Entrenadores",
      "Delegados",
      "Total Participantes",
      "Masculino",
      "Femenino",
    ],
  ]

  disciplinas.forEach((disciplina) => {
    const equiposDisciplina = equipos.filter((e) => e.disciplina === disciplina)
    const deportistas = equiposDisciplina.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "deportista").length,
      0,
    )
    const entrenadores = equiposDisciplina.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "entrenador").length,
      0,
    )
    const delegados = equiposDisciplina.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "delegado").length,
      0,
    )
    const masculinos = equiposDisciplina.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.genero === "MASCULINO").length,
      0,
    )
    const femeninos = equiposDisciplina.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.genero === "FEMENINO").length,
      0,
    )

    disciplinaData.push([
      disciplina,
      equiposDisciplina.length,
      deportistas,
      entrenadores,
      delegados,
      deportistas + entrenadores + delegados,
      masculinos,
      femeninos,
    ])
  })

  const disciplinaSheet = XLSX.utils.aoa_to_sheet(disciplinaData)
  XLSX.utils.book_append_sheet(workbook, disciplinaSheet, "Por Disciplina")

  // Hoja 3: Resumen por Localidad
  const localidades = [...new Set(equipos.map((e) => e.localidad))]
  const localidadData = [
    ["RESUMEN POR LOCALIDAD"],
    [""],
    [
      "Localidad",
      "Equipos",
      "Deportistas",
      "Entrenadores",
      "Delegados",
      "Total Participantes",
      "Masculino",
      "Femenino",
    ],
  ]

  localidades.forEach((localidad) => {
    const equiposLocalidad = equipos.filter((e) => e.localidad === localidad)
    const deportistas = equiposLocalidad.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "deportista").length,
      0,
    )
    const entrenadores = equiposLocalidad.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "entrenador").length,
      0,
    )
    const delegados = equiposLocalidad.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "delegado").length,
      0,
    )
    const masculinos = equiposLocalidad.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.genero === "MASCULINO").length,
      0,
    )
    const femeninos = equiposLocalidad.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.genero === "FEMENINO").length,
      0,
    )

    localidadData.push([
      localidad,
      equiposLocalidad.length,
      deportistas,
      entrenadores,
      delegados,
      deportistas + entrenadores + delegados,
      masculinos,
      femeninos,
    ])
  })

  const localidadSheet = XLSX.utils.aoa_to_sheet(localidadData)
  XLSX.utils.book_append_sheet(workbook, localidadSheet, "Por Localidad")

  // Hoja 4: Listado Completo de Participantes
  const participantesData = [
    ["LISTADO COMPLETO DE PARTICIPANTES"],
    [""],
    ["DNI", "Nombre", "Apellido", "Fecha Nacimiento", "Edad", "Género", "Tipo", "Disciplina", "Equipo", "Localidad"],
  ]

  const todosParticipantes: ParticipanteReporte[] = []
  equipos.forEach((equipo) => {
    equipo.participantes.forEach((participante) => {
      todosParticipantes.push(participante)
    })
  })

  // Ordenar por apellido y nombre
  todosParticipantes.sort((a, b) => {
    if (a.apellido !== b.apellido) return a.apellido.localeCompare(b.apellido)
    return a.nombre.localeCompare(b.nombre)
  })

  todosParticipantes.forEach((p) => {
    participantesData.push([
      p.dni,
      p.nombre,
      p.apellido,
      formatearFechaSafe(p.fecha_nacimiento),
      p.edad,
      p.genero,
      p.tipo,
      p.disciplina,
      p.equipo,
      p.localidad,
    ])
  })

  const participantesSheet = XLSX.utils.aoa_to_sheet(participantesData)
  XLSX.utils.book_append_sheet(workbook, participantesSheet, "Participantes")

  // Hoja 5: Detalle por Equipos
  const equiposData = [
    ["DETALLE POR EQUIPOS"],
    [""],
    [
      "ID Equipo",
      "Nombre Equipo",
      "Disciplina",
      "Localidad",
      "Fecha Creación",
      "Total Participantes",
      "Deportistas",
      "Entrenadores",
      "Delegados",
      "Masculino",
      "Femenino",
    ],
  ]

  equipos.forEach((equipo) => {
    const deportistas = equipo.participantes.filter((p) => p.tipo === "deportista").length
    const entrenadores = equipo.participantes.filter((p) => p.tipo === "entrenador").length
    const delegados = equipo.participantes.filter((p) => p.tipo === "delegado").length
    const masculinos = equipo.participantes.filter((p) => p.genero === "MASCULINO").length
    const femeninos = equipo.participantes.filter((p) => p.genero === "FEMENINO").length

    equiposData.push([
      equipo.id,
      equipo.nombre_equipo || "Sin nombre",
      equipo.disciplina,
      equipo.localidad,
      formatearFechaSafe(equipo.fecha_creacion),
      equipo.participantes.length,
      deportistas,
      entrenadores,
      delegados,
      masculinos,
      femeninos,
    ])
  })

  const equiposSheet = XLSX.utils.aoa_to_sheet(equiposData)
  XLSX.utils.book_append_sheet(workbook, equiposSheet, "Equipos")

  // Aplicar estilos básicos a las hojas
  const sheets = ["Resumen", "Por Disciplina", "Por Localidad", "Participantes", "Equipos"]
  sheets.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet["!cols"]) sheet["!cols"] = []

    // Ajustar ancho de columnas
    for (let i = 0; i < 15; i++) {
      if (!sheet["!cols"][i]) sheet["!cols"][i] = {}
      sheet["!cols"][i].wch = 15
    }
  })

  // Generar y descargar el archivo
  const fileName = `${titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export async function generarReporteExcelEquipo(equipo: EquipoReporte): Promise<void> {
  const workbook = XLSX.utils.book_new()

  // Hoja 1: Información del Equipo
  const infoData = [
    ["JUEGOS REGIONALES NEUQUINOS"],
    ["REPORTE DE EQUIPO"],
    [`Generado el: ${new Date().toLocaleDateString("es-AR")}`],
    [""],
    ["INFORMACIÓN DEL EQUIPO"],
    ["Disciplina", equipo.disciplina],
    ["Nombre del Equipo", equipo.nombre_equipo || "Sin nombre"],
    ["Localidad", equipo.localidad],
    [
      "Fecha de Inscripción", // Using safe date formatting instead of toLocaleDateString
      formatearFechaSafe(equipo.fecha_creacion),
    ],
    [""],
    ["RESUMEN DE PARTICIPANTES"],
    ["Total de Participantes", equipo.participantes.length],
    ["Deportistas", equipo.participantes.filter((p) => p.tipo === "deportista").length],
    ["Entrenadores", equipo.participantes.filter((p) => p.tipo === "entrenador").length],
    ["Delegados", equipo.participantes.filter((p) => p.tipo === "delegado").length],
    [""],
    ["POR GÉNERO"],
    ["Masculino", equipo.participantes.filter((p) => p.genero === "MASCULINO").length],
    ["Femenino", equipo.participantes.filter((p) => p.genero === "FEMENINO").length],
  ]

  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  XLSX.utils.book_append_sheet(workbook, infoSheet, "Información")

  // Hoja 2: Deportistas
  const deportistas = equipo.participantes.filter((p) => p.tipo === "deportista")
  if (deportistas.length > 0) {
    const deportistasData = [
      [`DEPORTISTAS (${deportistas.length})`],
      [""],
      ["#", "DNI", "Nombre", "Apellido", "Fecha Nacimiento", "Edad", "Género"],
    ]

    deportistas.forEach((p, index) => {
      deportistasData.push([
        index + 1,
        p.dni,
        p.nombre,
        p.apellido,
        formatearFechaSafe(p.fecha_nacimiento),
        p.edad,
        p.genero,
      ])
    })

    const deportistasSheet = XLSX.utils.aoa_to_sheet(deportistasData)
    XLSX.utils.book_append_sheet(workbook, deportistasSheet, "Deportistas")
  }

  // Hoja 3: Entrenadores
  const entrenadores = equipo.participantes.filter((p) => p.tipo === "entrenador")
  if (entrenadores.length > 0) {
    const entrenadoresData = [
      [`ENTRENADORES (${entrenadores.length})`],
      [""],
      ["#", "DNI", "Nombre", "Apellido", "Fecha Nacimiento", "Edad", "Género"],
    ]

    entrenadores.forEach((p, index) => {
      entrenadoresData.push([
        index + 1,
        p.dni,
        p.nombre,
        p.apellido,
        formatearFechaSafe(p.fecha_nacimiento),
        p.edad,
        p.genero,
      ])
    })

    const entrenadoresSheet = XLSX.utils.aoa_to_sheet(entrenadoresData)
    XLSX.utils.book_append_sheet(workbook, entrenadoresSheet, "Entrenadores")
  }

  // Hoja 4: Delegados
  const delegados = equipo.participantes.filter((p) => p.tipo === "delegado")
  if (delegados.length > 0) {
    const delegadosData = [
      [`DELEGADOS (${delegados.length})`],
      [""],
      ["#", "DNI", "Nombre", "Apellido", "Fecha Nacimiento", "Edad", "Género"],
    ]

    delegados.forEach((p, index) => {
      delegadosData.push([
        index + 1,
        p.dni,
        p.nombre,
        p.apellido,
        formatearFechaSafe(p.fecha_nacimiento),
        p.edad,
        p.genero,
      ])
    })

    const delegadosSheet = XLSX.utils.aoa_to_sheet(delegadosData)
    XLSX.utils.book_append_sheet(workbook, delegadosSheet, "Delegados")
  }

  // Aplicar estilos básicos
  Object.keys(workbook.Sheets).forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet["!cols"]) sheet["!cols"] = []

    // Ajustar ancho de columnas
    for (let i = 0; i < 10; i++) {
      if (!sheet["!cols"][i]) sheet["!cols"][i] = {}
      sheet["!cols"][i].wch = 15
    }
  })

  // Generar y descargar el archivo
  const fileName = `Equipo_${equipo.disciplina}_${equipo.localidad}_${new Date().toISOString().split("T")[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
