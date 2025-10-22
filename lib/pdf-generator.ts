import jsPDF from "jspdf"

export interface ParticipanteReporte {
  dni: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  edad: number
  disciplina: string
  equipo: string
  localidad: string
  tipo: "deportista" | "entrenador" | "delegado"
  genero: "MASCULINO" | "FEMENINO"
}

export interface EquipoReporte {
  id: number
  disciplina: string
  nombre_equipo: string
  localidad: string
  participantes: ParticipanteReporte[]
  fecha_creacion: string
}

function drawTable(doc: jsPDF, headers: string[], rows: string[][], startY: number, columnWidths: number[]): number {
  const rowHeight = 8
  const headerHeight = 10
  let currentY = startY

  // Draw header
  doc.setFillColor(43, 62, 76) // neuquen-primary color
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.rect(
    20,
    currentY,
    columnWidths.reduce((sum, w) => sum + w, 0),
    headerHeight,
    "F",
  )

  let currentX = 20
  headers.forEach((header, index) => {
    doc.text(header, currentX + 2, currentY + 7)
    currentX += columnWidths[index]
  })

  currentY += headerHeight

  // Draw rows
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)

  rows.forEach((row, rowIndex) => {
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(
        20,
        currentY,
        columnWidths.reduce((sum, w) => sum + w, 0),
        rowHeight,
        "F",
      )
    }

    currentX = 20
    row.forEach((cell, cellIndex) => {
      // Truncate text if too long
      const maxWidth = columnWidths[cellIndex] - 4
      let text = cell
      if (doc.getTextWidth(text) > maxWidth) {
        while (doc.getTextWidth(text + "...") > maxWidth && text.length > 0) {
          text = text.slice(0, -1)
        }
        text += "..."
      }

      doc.text(text, currentX + 2, currentY + 6)
      currentX += columnWidths[cellIndex]
    })

    currentY += rowHeight
  })

  // Draw table border
  doc.setDrawColor(200, 200, 200)
  doc.rect(
    20,
    startY,
    columnWidths.reduce((sum, w) => sum + w, 0),
    currentY - startY,
  )

  // Draw column separators
  currentX = 20
  columnWidths.forEach((width, index) => {
    if (index < columnWidths.length - 1) {
      currentX += width
      doc.line(currentX, startY, currentX, currentY)
    }
  })

  return currentY
}

function formatearFechaSafe(fechaString: string): string {
  if (!fechaString) return ""
  // Extract only the date part to avoid timezone conversion
  const fechaSolo = fechaString.split("T")[0]
  const [year, month, day] = fechaSolo.split("-")
  return `${day}/${month}/${year}`
}

export async function generarReporteCompleto(equipos: EquipoReporte[], titulo = "Reporte de Equipos"): Promise<void> {
  const doc = new jsPDF()

  // Header con logo y título
  try {
    // Header image centered with proper aspect ratio
    // Assuming header image has ~7:1 aspect ratio (typical for headers)
    const headerWidth = 180 // Slightly narrower than full page
    const headerHeight = 25 // Maintains better proportions
    const xOffset = (210 - headerWidth) / 2 // Center horizontally
    doc.addImage("/images/header lista.png", "PNG", xOffset, 5, headerWidth, headerHeight)
  } catch (error) {
    console.log("Header image not found, using fallback")
    // Fallback to old header
    try {
      doc.addImage("/images/logo-neuquen.png", "PNG", 20, 10, 60, 20)
    } catch (error) {
      console.log("Logo not found, continuing without it")
    }
    doc.setFontSize(20)
    doc.setTextColor(43, 62, 76)
    doc.text("Juegos Regionales Neuquinos", 90, 25)
  }

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text(titulo, 20, 50)

  doc.setFontSize(10)
  doc.text(`Generado el: ${formatearFechaSafe(new Date().toISOString())}`, 20, 60)

  let yPosition = 75

  // Resumen por disciplina
  const disciplinas = [...new Set(equipos.map((e) => e.disciplina))]
  const resumenDisciplinas = disciplinas.map((disciplina) => {
    const equiposDisciplina = equipos.filter((e) => e.disciplina === disciplina)
    const totalDeportistas = equiposDisciplina.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "deportista").length,
      0,
    )
    return [disciplina, equiposDisciplina.length.toString(), totalDeportistas.toString()]
  })

  doc.setFontSize(14)
  doc.text("Resumen por Disciplina", 20, yPosition)
  yPosition += 10

  yPosition = drawTable(doc, ["Disciplina", "Equipos", "Deportistas"], resumenDisciplinas, yPosition, [80, 40, 40])

  yPosition += 20

  // Detalle por equipo
  equipos.forEach((equipo, index) => {
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(12)
    doc.setTextColor(43, 62, 76)
    doc.text(`${equipo.disciplina} - ${equipo.nombre_equipo || "Sin nombre"}`, 20, yPosition)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(`Localidad: ${equipo.localidad} | Fecha: ${formatearFechaSafe(equipo.fecha_creacion)}`, 20, yPosition + 8)

    yPosition += 20

    const participantesData = equipo.participantes.map((p) => [
      p.dni,
      `${p.nombre} ${p.apellido}`,
      formatearFechaSafe(p.fecha_nacimiento),
      p.edad.toString(),
      p.tipo || "deportista",
    ])

    yPosition = drawTable(
      doc,
      ["DNI", "Nombre Completo", "Fecha Nac.", "Edad", "Tipo"],
      participantesData,
      yPosition,
      [30, 60, 35, 20, 25],
    )

    yPosition += 15
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
    doc.text("Secretaría de Deportes, Cultura y Gestión Ciudadana", 20, doc.internal.pageSize.height - 10)
  }

  // Descargar el PDF
  const fileName = `${titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}

export async function generarReporteEquipo(equipo: EquipoReporte): Promise<void> {
  const doc = new jsPDF()

  // Header con logo
  try {
    // Header image centered with proper aspect ratio
    // Assuming header image has ~7:1 aspect ratio (typical for headers)
    const headerWidth = 180 // Slightly narrower than full page
    const headerHeight = 25 // Maintains better proportions
    const xOffset = (210 - headerWidth) / 2 // Center horizontally
    doc.addImage("/images/header lista.png", "PNG", xOffset, 5, headerWidth, headerHeight)
  } catch (error) {
    console.log("Header image not found, using fallback")
    // Fallback to old header
    try {
      doc.addImage("/images/logo-neuquen.png", "PNG", 20, 10, 60, 20)
    } catch (error) {
      console.log("Logo not found, continuing without it")
    }
    doc.setFontSize(18)
    doc.setTextColor(43, 62, 76)
    doc.text("Juegos Regionales Neuquinos", 90, 25)
  }

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text("Reporte de Equipo", 20, 50)

  // Información del equipo
  doc.setFontSize(12)
  doc.setTextColor(43, 62, 76)
  doc.text("INFORMACIÓN DEL EQUIPO", 20, 65)

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Disciplina: ${equipo.disciplina}`, 20, 75)
  doc.text(`Nombre del Equipo: ${equipo.nombre_equipo || "Sin nombre"}`, 20, 82)
  doc.text(`Localidad: ${equipo.localidad}`, 20, 89)
  doc.text(`Fecha de Inscripción: ${formatearFechaSafe(equipo.fecha_creacion)}`, 20, 96)

  // Total de Participantes
  const deportistas = equipo.participantes.filter((p) => p.tipo === "deportista")
  const entrenadores = equipo.participantes.filter((p) => p.tipo === "entrenador")
  const delegados = equipo.participantes.filter((p) => p.tipo === "delegado")

  doc.text(`Total de Participantes: ${equipo.participantes.length}`, 20, 103)
  doc.text(`  • Deportistas: ${deportistas.length}`, 25, 110)
  doc.text(`  • Entrenadores: ${entrenadores.length}`, 25, 117)
  doc.text(`  • Delegados: ${delegados.length}`, 25, 124)

  // Por Género
  const masculinos = equipo.participantes.filter((p) => p.genero === "MASCULINO")
  const femeninos = equipo.participantes.filter((p) => p.genero === "FEMENINO")
  doc.text(`Por Género: Masculino ${masculinos.length} | Femenino ${femeninos.length}`, 20, 131)

  let yPosition = 145

  // Deportistas
  if (deportistas.length > 0) {
    doc.setFontSize(14)
    doc.setTextColor(43, 62, 76)
    doc.text(`Deportistas (${deportistas.length})`, 20, yPosition)
    yPosition += 10

    const deportistasData = deportistas.map((p, index) => [
      (index + 1).toString(),
      p.dni,
      `${p.nombre} ${p.apellido}`,
      formatearFechaSafe(p.fecha_nacimiento),
      p.edad.toString(),
    ])

    yPosition = drawTable(
      doc,
      ["#", "DNI", "Nombre Completo", "Fecha Nac.", "Edad"],
      deportistasData,
      yPosition,
      [15, 30, 70, 35, 20],
    )

    yPosition += 15
  }

  // Entrenadores
  if (entrenadores.length > 0) {
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setTextColor(43, 62, 76)
    doc.text(`Entrenadores (${entrenadores.length})`, 20, yPosition)
    yPosition += 10

    const entrenadoresData = entrenadores.map((p, index) => [
      (index + 1).toString(),
      p.dni,
      `${p.nombre} ${p.apellido}`,
      formatearFechaSafe(p.fecha_nacimiento),
      p.edad.toString(),
    ])

    yPosition = drawTable(
      doc,
      ["#", "DNI", "Nombre Completo", "Fecha Nac.", "Edad"],
      entrenadoresData,
      yPosition,
      [15, 30, 70, 35, 20],
    )

    yPosition += 15
  }

  // Delegados
  if (delegados.length > 0) {
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setTextColor(43, 62, 76)
    doc.text(`Delegados (${delegados.length})`, 20, yPosition)
    yPosition += 10

    const delegadosData = delegados.map((p, index) => [
      (index + 1).toString(),
      p.dni,
      `${p.nombre} ${p.apellido}`,
      formatearFechaSafe(p.fecha_nacimiento),
      p.edad.toString(),
    ])

    yPosition = drawTable(
      doc,
      ["#", "DNI", "Nombre Completo", "Fecha Nac.", "Edad"],
      delegadosData,
      yPosition,
      [15, 30, 70, 35, 20],
    )
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text("Secretaría de Deportes, Cultura y Gestión Ciudadana", 20, doc.internal.pageSize.height - 10)
  doc.text(
    `Generado el: ${formatearFechaSafe(new Date().toISOString())}`,
    doc.internal.pageSize.width - 60,
    doc.internal.pageSize.height - 10,
  )

  // Descargar
  const fileName = `Equipo_${equipo.disciplina}_${equipo.localidad}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}

export async function generarPlanillaJuego(equipoId: number): Promise<void> {
  try {
    // Fetch team data from API
    const response = await fetch(`/api/admin/reportes/equipos`)
    if (!response.ok) {
      throw new Error("Error al obtener datos del equipo")
    }

    const equipos: EquipoReporte[] = await response.json()
    const equipo = equipos.find((e) => e.id === equipoId)

    if (!equipo) {
      throw new Error("Equipo no encontrado")
    }

    const doc = new jsPDF()

    // Header with image
    try {
      const headerWidth = 180
      const headerHeight = 25
      const xOffset = (210 - headerWidth) / 2
      doc.addImage("/images/header lista.png", "PNG", xOffset, 5, headerWidth, headerHeight)
    } catch (error) {
      console.log("Header image not found, using fallback")
      try {
        doc.addImage("/images/logo-neuquen.png", "PNG", 20, 10, 60, 20)
      } catch (error) {
        console.log("Logo not found, continuing without it")
      }
      doc.setFontSize(18)
      doc.setTextColor(43, 62, 76)
      doc.text("Juegos Regionales Neuquinos", 90, 25)
    }

    // Title
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text("PLANILLA DE JUEGO", 105, 45, { align: "center" })

    // Team information
    let yPosition = 60
    doc.setFontSize(12)
    doc.setTextColor(43, 62, 76)
    doc.text(`Disciplina: ${equipo.disciplina}`, 20, yPosition)
    yPosition += 8
    doc.text(`Equipo: ${equipo.nombre_equipo || `Equipo de ${equipo.disciplina}`}`, 20, yPosition)
    yPosition += 8
    doc.text(`Localidad: ${equipo.localidad}`, 20, yPosition)
    yPosition += 15

    // Deportistas section
    const deportistas = equipo.participantes.filter((p) => p.tipo === "deportista")
    if (deportistas.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(43, 62, 76)
      doc.text(`DEPORTISTAS (${deportistas.length})`, 20, yPosition)
      yPosition += 10

      const deportistasData = deportistas.map((p, index) => [
        (index + 1).toString(),
        p.dni,
        `${p.apellido}, ${p.nombre}`,
        formatearFechaSafe(p.fecha_nacimiento),
        p.edad.toString(),
        "", // Dorsal column - left blank
      ])

      yPosition = drawTable(
        doc,
        ["#", "DNI", "Nombre Completo", "Fecha Nac.", "Edad", "Dorsal"],
        deportistasData,
        yPosition,
        [12, 25, 60, 28, 15, 20],
      )

      yPosition += 15
    }

    // Entrenadores section
    const entrenadores = equipo.participantes.filter((p) => p.tipo === "entrenador")
    if (entrenadores.length > 0) {
      if (yPosition > 220) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(43, 62, 76)
      doc.text(`ENTRENADORES (${entrenadores.length})`, 20, yPosition)
      yPosition += 10

      const entrenadoresData = entrenadores.map((p, index) => [
        (index + 1).toString(),
        p.dni,
        `${p.apellido}, ${p.nombre}`,
        formatearFechaSafe(p.fecha_nacimiento),
        p.edad.toString(),
      ])

      yPosition = drawTable(
        doc,
        ["#", "DNI", "Nombre Completo", "Fecha Nac.", "Edad"],
        entrenadoresData,
        yPosition,
        [12, 28, 70, 35, 15],
      )

      yPosition += 15
    }

    // Delegados section
    const delegados = equipo.participantes.filter((p) => p.tipo === "delegado")
    if (delegados.length > 0) {
      if (yPosition > 220) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(43, 62, 76)
      doc.text(`DELEGADOS (${delegados.length})`, 20, yPosition)
      yPosition += 10

      const delegadosData = delegados.map((p, index) => [
        (index + 1).toString(),
        p.dni,
        `${p.apellido}, ${p.nombre}`,
        formatearFechaSafe(p.fecha_nacimiento),
        p.edad.toString(),
      ])

      yPosition = drawTable(
        doc,
        ["#", "DNI", "Nombre Completo", "Fecha Nac.", "Edad"],
        delegadosData,
        yPosition,
        [12, 28, 70, 35, 15],
      )
    }

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text("Secretaría de Deportes, Cultura y Gestión Ciudadana", 20, doc.internal.pageSize.height - 10)
    doc.text(
      `Generado el: ${formatearFechaSafe(new Date().toISOString())}`,
      doc.internal.pageSize.width - 60,
      doc.internal.pageSize.height - 10,
    )

    // Download
    const fileName = `Planilla_Juego_${equipo.disciplina}_${equipo.localidad}_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
  } catch (error) {
    console.error("Error generating game sheet:", error)
    throw error
  }
}
