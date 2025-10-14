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
    doc.addImage("/images/logo-neuquen.png", "PNG", 20, 10, 60, 20)
  } catch (error) {
    console.log("Logo not found, continuing without it")
  }

  doc.setFontSize(20)
  doc.setTextColor(43, 62, 76) // Color neuquen-primary
  doc.text("Juegos Regionales Neuquinos", 90, 25)

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text(titulo, 20, 45)

  doc.setFontSize(10)
  doc.text(`Generado el: ${formatearFechaSafe(new Date().toISOString())}`, 20, 55)

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
    doc.addImage("/images/logo-neuquen.png", "PNG", 20, 10, 60, 20)
  } catch (error) {
    console.log("Logo not found, continuing without it")
  }

  doc.setFontSize(18)
  doc.setTextColor(43, 62, 76)
  doc.text("Juegos Regionales Neuquinos", 90, 25)

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text("Reporte de Equipo", 20, 45)

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

export async function generarListaBuenaFe(equipo: EquipoReporte): Promise<void> {
  const doc = new jsPDF()

  // Add header image
  try {
    doc.addImage("/images/header lista.png", "PNG", 10, 10, 190, 30)
  } catch (error) {
    console.log("Header image not found, continuing without it")
  }

  let yPosition = 50

  // Title
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("JUEGOS REGIONALES NEUQUINOS 2025", 105, yPosition, { align: "center" })
  yPosition += 8
  doc.text("LISTA DE BUENA FE", 105, yPosition, { align: "center" })
  yPosition += 15

  // Athletes section
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("INSCRIPCIÓN DE ATLETAS", 20, yPosition)
  yPosition += 8

  // Athletes table
  const deportistas = equipo.participantes.filter((p) => p.tipo === "deportista")
  const atletasHeaders = ["Nº", "Nombre", "Apellido", "Día", "Mes", "Año", "D.N.I."]
  const atletasColumnWidths = [15, 40, 40, 15, 15, 15, 30]

  // Draw athletes table header
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(
    20,
    yPosition,
    atletasColumnWidths.reduce((a, b) => a + b, 0),
    8,
    "S",
  )

  let currentX = 20
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  atletasHeaders.forEach((header, index) => {
    doc.text(header, currentX + 2, yPosition + 5)
    if (index < atletasHeaders.length - 1) {
      currentX += atletasColumnWidths[index]
      doc.line(currentX, yPosition, currentX, yPosition + 8)
    }
  })

  yPosition += 8

  // Draw athletes rows (16 rows total)
  doc.setFont("helvetica", "normal")
  for (let i = 0; i < 16; i++) {
    const deportista = deportistas[i]
    const rowData = deportista
      ? [
          (i + 1).toString(),
          deportista.nombre,
          deportista.apellido,
          deportista.fecha_nacimiento.split("-")[2],
          deportista.fecha_nacimiento.split("-")[1],
          deportista.fecha_nacimiento.split("-")[0],
          deportista.dni,
        ]
      : [(i + 1).toString(), "", "", "", "", "", ""]

    doc.rect(
      20,
      yPosition,
      atletasColumnWidths.reduce((a, b) => a + b, 0),
      8,
      "S",
    )

    currentX = 20
    rowData.forEach((cell, index) => {
      doc.text(cell, currentX + 2, yPosition + 5)
      if (index < rowData.length - 1) {
        currentX += atletasColumnWidths[index]
        doc.line(currentX, yPosition, currentX, yPosition + 8)
      }
    })

    yPosition += 8
  }

  yPosition += 10

  // Coaches/Delegates section
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("INSCRIPCIÓN DE ENTRENADOR/A- DELEGADO/A", 20, yPosition)
  yPosition += 8

  // Coaches table
  const staffHeaders = ["Nº", "Nombre", "Apellido", "Día", "Mes", "Año", "D.N.I.", "Teléfono de contacto", "Firma"]
  const staffColumnWidths = [10, 30, 30, 12, 12, 12, 25, 35, 24]

  // Draw staff table header
  doc.rect(
    20,
    yPosition,
    staffColumnWidths.reduce((a, b) => a + b, 0),
    8,
    "S",
  )

  currentX = 20
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  staffHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1, yPosition + 5)
    if (index < staffHeaders.length - 1) {
      currentX += staffColumnWidths[index]
      doc.line(currentX, yPosition, currentX, yPosition + 8)
    }
  })

  yPosition += 8

  // Draw staff rows (2 rows)
  const staff = equipo.participantes.filter((p) => p.tipo === "entrenador" || p.tipo === "delegado")
  doc.setFont("helvetica", "normal")
  for (let i = 0; i < 2; i++) {
    const person = staff[i]
    const rowData = person
      ? [
          (i + 1).toString(),
          person.nombre,
          person.apellido,
          person.fecha_nacimiento.split("-")[2],
          person.fecha_nacimiento.split("-")[1],
          person.fecha_nacimiento.split("-")[0],
          person.dni,
          "",
          "",
        ]
      : [(i + 1).toString(), "", "", "", "", "", "", "", ""]

    doc.rect(
      20,
      yPosition,
      staffColumnWidths.reduce((a, b) => a + b, 0),
      8,
      "S",
    )

    currentX = 20
    rowData.forEach((cell, index) => {
      doc.text(cell, currentX + 1, yPosition + 5)
      if (index < rowData.length - 1) {
        currentX += staffColumnWidths[index]
        doc.line(currentX, yPosition, currentX, yPosition + 8)
      }
    })

    yPosition += 8
  }

  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 20
  } else {
    yPosition += 10
  }

  // Observations section
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Observaciones:", 20, yPosition)
  yPosition += 5

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  const observaciones = [
    "Los Técnicos y Delegados acreditados son responsables del cuidado y custodia de los mismos durante el periodo que se desarrolle el evento deportivo. Asimismo, se deja constancia que el",
    "comportamiento inadecuado, impropio o improcedente de las personas a cargo de los deportistas y las consecuencias dañosas ocasionadas durante el desarrollo de los juegos, es plena responsabilidad",
    "de todos los adultos que integran la planilla de inscripción.",
    "Esta planilla deberá ser presentada por duplicado el día de la competencia (original y fotocopia)",
    'La presentación de la presente Planilla de Inscripción, implica la aceptación de los Reglamentos Generales y Particulares del Programa "Juegos Regionales Neuquinos 2025".',
    "La presente tiene carácter de Declaración Jurada.",
  ]

  observaciones.forEach((line) => {
    doc.text(line, 20, yPosition, { maxWidth: 170 })
    yPosition += 4
  })

  yPosition += 5

  // Limits table
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("LIMITE DE INSCRIPTOS POR DISCIPLINA", 20, yPosition)
  yPosition += 6

  const limitsHeaders = ["Disciplina", "Cantidad de Deportistas por Genero"]
  const limitsData = [
    ["Básquet", "10"],
    ["Futbol", "16"],
    ["Vóley", "10"],
    ["Futsal", "10"],
    ["Tenis de Mesa", "3"],
  ]

  const limitsColumnWidths = [60, 60]

  // Draw limits table
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.rect(
    20,
    yPosition,
    limitsColumnWidths.reduce((a, b) => a + b, 0),
    7,
    "S",
  )
  currentX = 20
  limitsHeaders.forEach((header, index) => {
    doc.text(header, currentX + 2, yPosition + 5)
    if (index < limitsHeaders.length - 1) {
      currentX += limitsColumnWidths[index]
      doc.line(currentX, yPosition, currentX, yPosition + 7)
    }
  })
  yPosition += 7

  doc.setFont("helvetica", "normal")
  limitsData.forEach((row) => {
    doc.rect(
      20,
      yPosition,
      limitsColumnWidths.reduce((a, b) => a + b, 0),
      7,
      "S",
    )
    currentX = 20
    row.forEach((cell, index) => {
      doc.text(cell, currentX + 2, yPosition + 5)
      if (index < row.length - 1) {
        currentX += limitsColumnWidths[index]
        doc.line(currentX, yPosition, currentX, yPosition + 7)
      }
    })
    yPosition += 7
  })

  yPosition += 10

  // Footer fields (left blank as requested)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  const footerFields = [
    ["Municipio", equipo.localidad],
    ["Teléfono", ""],
    ["e-mail", ""],
    ["Director de Deportes", ""],
  ]

  footerFields.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, yPosition)
    doc.line(50, yPosition + 1, 120, yPosition + 1)
    if (value) {
      doc.text(value, 52, yPosition)
    }
    yPosition += 8
  })

  // Download
  const fileName = `Lista_Buena_Fe_${equipo.disciplina}_${equipo.localidad}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}
