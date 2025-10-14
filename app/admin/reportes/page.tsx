"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Filter, Users, Trophy, Printer, UserCheck, Shield, FileSpreadsheet } from "lucide-react"
import {
  generarReporteCompleto,
  generarReporteEquipo,
  generarListaBuenaFe,
  type EquipoReporte,
} from "@/lib/pdf-generator"
import { generarReporteExcelCompleto, generarReporteExcelEquipo } from "@/lib/excel-generator"
import { apiRequest } from "@/lib/api-client"

interface FiltrosReporte {
  disciplina: string
  localidad: string
  genero: string
}

interface AtletasPorDisciplinaData {
  detallePorDisciplinaLocalidad: Array<{
    disciplina: string
    disciplina_genero: string
    localidad: string
    total_deportistas: number
    deportistas_masculinos: number
    deportistas_femeninos: number
    total_equipos: number
  }>
  resumenPorDisciplina: Array<{
    disciplina: string
    disciplina_genero: string
    total_deportistas: number
    deportistas_masculinos: number
    deportistas_femeninos: number
    localidades_participantes: number
    total_equipos: number
  }>
  resumenPorLocalidad: Array<{
    localidad: string
    total_deportistas: number
    deportistas_masculinos: number
    deportistas_femeninos: number
    disciplinas_participantes: number
    total_equipos: number
  }>
}

export default function AdminReportesPage() {
  const [equipos, setEquipos] = useState<EquipoReporte[]>([])
  const [disciplinas, setDisciplinas] = useState<any[]>([])
  const [localidades, setLocalidades] = useState<any[]>([])
  const [filtros, setFiltros] = useState<FiltrosReporte>({ disciplina: "all", localidad: "all", genero: "all" })
  const [busquedaEquipos, setBusquedaEquipos] = useState("")
  const [loading, setLoading] = useState(true)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [generandoExcel, setGenerandoExcel] = useState(false)
  const [generandoEquipoPDF, setGenerandoEquipoPDF] = useState<number | null>(null)
  const [generandoEquipoExcel, setGenerandoEquipoExcel] = useState<number | null>(null)
  const [atletasPorDisciplina, setAtletasPorDisciplina] = useState<AtletasPorDisciplinaData | null>(null)
  const [mostrandoReporteAtletas, setMostrandoReporteAtletas] = useState(false)
  const [generandoListaBuenaFe, setGenerandoListaBuenaFe] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const equiposResponse = await apiRequest("/api/admin/reportes/equipos")
      const disciplinasResponse = await apiRequest("/api/admin/disciplinas")
      const localidadesResponse = await apiRequest("/api/admin/localidades")

      if (equiposResponse.ok && disciplinasResponse.ok && localidadesResponse.ok) {
        const equiposData = await equiposResponse.json()
        const disciplinasData = await disciplinasResponse.json()
        const localidadesData = await localidadesResponse.json()

        setEquipos(equiposData)
        setDisciplinas(disciplinasData.data || disciplinasData)
        setLocalidades(localidadesData.data || localidadesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAtletasPorDisciplina = async () => {
    try {
      const response = await apiRequest("/api/admin/reportes/atletas-disciplina-localidad")
      if (response.ok) {
        const data = await response.json()
        setAtletasPorDisciplina(data)
        setMostrandoReporteAtletas(true)
      }
    } catch (error) {
      console.error("Error fetching atletas por disciplina:", error)
    }
  }

  const equiposFiltrados = equipos.filter((equipo) => {
    if (filtros.disciplina !== "all" && equipo.disciplina !== filtros.disciplina) return false
    if (filtros.localidad !== "all" && equipo.localidad !== filtros.localidad) return false
    if (filtros.genero !== "all") {
      const tieneParticipanteGenero = equipo.participantes.some((p) => p.genero === filtros.genero)
      if (!tieneParticipanteGenero) return false
    }
    return true
  })

  const equiposMostrados = equiposFiltrados.filter((equipo) => {
    if (!busquedaEquipos) return true
    const busqueda = busquedaEquipos.toLowerCase()
    const nombreEquipo = (equipo.nombre_equipo || `Equipo de ${equipo.disciplina}`).toLowerCase()
    return (
      nombreEquipo.includes(busqueda) ||
      equipo.disciplina.toLowerCase().includes(busqueda) ||
      equipo.localidad.toLowerCase().includes(busqueda)
    )
  })

  const handleGenerarReporte = async (tipo: "completo" | "filtrado") => {
    setGenerandoPDF(true)

    try {
      const equiposParaReporte = tipo === "completo" ? equipos : equiposFiltrados
      const titulo =
        tipo === "completo"
          ? "Reporte Completo de Inscripciones"
          : `Reporte Filtrado - ${filtros.disciplina === "all" ? "Todas las disciplinas" : filtros.disciplina} - ${filtros.localidad === "all" ? "Todas las localidades" : filtros.localidad} - ${filtros.genero === "all" ? "Todos los géneros" : filtros.genero}`

      await generarReporteCompleto(equiposParaReporte, titulo)
    } catch (error) {
      console.error("Error generando reporte:", error)
    } finally {
      setGenerandoPDF(false)
    }
  }

  const handleGenerarReporteEquipo = async (equipo: EquipoReporte) => {
    setGenerandoEquipoPDF(equipo.id)

    try {
      await generarReporteEquipo(equipo)
    } catch (error) {
      console.error("Error generando reporte de equipo:", error)
    } finally {
      setGenerandoEquipoPDF(null)
    }
  }

  const handleGenerarReporteExcel = async (tipo: "completo" | "filtrado") => {
    setGenerandoExcel(true)

    try {
      const equiposParaReporte = tipo === "completo" ? equipos : equiposFiltrados
      const titulo =
        tipo === "completo"
          ? "Reporte Completo de Inscripciones"
          : `Reporte Filtrado - ${filtros.disciplina === "all" ? "Todas las disciplinas" : filtros.disciplina} - ${filtros.localidad === "all" ? "Todas las localidades" : filtros.localidad} - ${filtros.genero === "all" ? "Todos los géneros" : filtros.genero}`

      await generarReporteExcelCompleto(equiposParaReporte, titulo)
    } catch (error) {
      console.error("Error generando reporte Excel:", error)
    } finally {
      setGenerandoExcel(false)
    }
  }

  const handleGenerarReporteEquipoExcel = async (equipo: EquipoReporte) => {
    setGenerandoEquipoExcel(equipo.id)

    try {
      await generarReporteExcelEquipo(equipo)
    } catch (error) {
      console.error("Error generando reporte Excel de equipo:", error)
    } finally {
      setGenerandoEquipoExcel(null)
    }
  }

  const handleGenerarListaBuenaFe = async (equipo: EquipoReporte) => {
    setGenerandoListaBuenaFe(equipo.id)

    try {
      await generarListaBuenaFe(equipo)
    } catch (error) {
      console.error("Error generando Lista de Buena Fe:", error)
    } finally {
      setGenerandoListaBuenaFe(null)
    }
  }

  const estadisticas = {
    totalEquipos: equiposFiltrados.length,
    totalDeportistas: equiposFiltrados.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "deportista").length,
      0,
    ),
    disciplinasActivas: [...new Set(equiposFiltrados.map((e) => e.disciplina))].length,
    localidadesParticipantes: [...new Set(equiposFiltrados.map((e) => e.localidad))].length,
    deportistasMasculinos: equiposFiltrados.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "deportista" && p.genero === "MASCULINO").length,
      0,
    ),
    deportistasFemeninos: equiposFiltrados.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "deportista" && p.genero === "FEMENINO").length,
      0,
    ),
    deportistas: equiposFiltrados.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "deportista").length,
      0,
    ),
    entrenadores: equiposFiltrados.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "entrenador").length,
      0,
    ),
    delegados: equiposFiltrados.reduce(
      (sum, e) => sum + e.participantes.filter((p) => p.tipo === "delegado").length,
      0,
    ),
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neuquen-primary">Reportes y Exportación</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neuquen-primary">Reportes y Exportación</h1>
        <p className="text-gray-600 mt-2">
          Generar reportes en PDF y Excel de las inscripciones con estadísticas por género
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Equipos</p>
                <p className="text-2xl font-bold text-neuquen-primary">{estadisticas.totalEquipos}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deportistas</p>
                <p className="text-2xl font-bold text-neuquen-primary">{estadisticas.totalDeportistas}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    ♂ {estadisticas.deportistasMasculinos}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ♀ {estadisticas.deportistasFemeninos}
                  </Badge>
                </div>
              </div>
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por Roles</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{estadisticas.deportistas} Deportistas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{estadisticas.entrenadores} Entrenadores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">{estadisticas.delegados} Delegados</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disciplinas/Localidades</p>
                <p className="text-2xl font-bold text-neuquen-primary">
                  {estadisticas.disciplinasActivas}/{estadisticas.localidadesParticipantes}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Reporte
          </CardTitle>
          <CardDescription>Filtra los datos antes de generar el reporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Disciplina</label>
              <Select onValueChange={(value) => setFiltros({ ...filtros, disciplina: value })}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todas las disciplinas" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Todas las disciplinas</SelectItem>
                  {disciplinas.map((disciplina) => (
                    <SelectItem key={disciplina.id} value={disciplina.nombre}>
                      {disciplina.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Localidad</label>
              <Select onValueChange={(value) => setFiltros({ ...filtros, localidad: value })}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todas las localidades" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Todas las localidades</SelectItem>
                  {localidades.map((localidad) => (
                    <SelectItem key={localidad.id} value={localidad.nombre}>
                      {localidad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Género</label>
              <Select onValueChange={(value) => setFiltros({ ...filtros, genero: value })}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todos los géneros" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Todos los géneros</SelectItem>
                  <SelectItem value="MASCULINO">Masculino</SelectItem>
                  <SelectItem value="FEMENINO">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-neuquen-primary">Reporte Completo</CardTitle>
            <CardDescription>Exportar todos los equipos y participantes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>• Incluye todos los equipos de todas las disciplinas</p>
                <p>• Resumen por disciplina, localidad y género</p>
                <p>• Listado completo de participantes con roles</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => handleGenerarReporte("completo")}
                  disabled={generandoPDF || generandoExcel}
                  className="bg-neuquen-primary hover:bg-neuquen-primary/90 text-neuquen-secondary"
                >
                  {generandoPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      PDF Completo
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleGenerarReporteExcel("completo")}
                  disabled={generandoPDF || generandoExcel}
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  {generandoExcel ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel Completo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-neuquen-primary">Reporte Filtrado</CardTitle>
            <CardDescription>Exportar según los filtros seleccionados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>• Disciplina: {filtros.disciplina === "all" ? "Todas" : filtros.disciplina}</p>
                <p>• Localidad: {filtros.localidad === "all" ? "Todas" : filtros.localidad}</p>
                <p>• Género: {filtros.genero === "all" ? "Todos" : filtros.genero}</p>
                <p>• Equipos incluidos: {equiposFiltrados.length}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => handleGenerarReporte("filtrado")}
                  disabled={generandoPDF || generandoExcel || equiposFiltrados.length === 0}
                  variant="outline"
                  className="bg-white"
                >
                  {generandoPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      PDF Filtrado
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleGenerarReporteExcel("filtrado")}
                  disabled={generandoPDF || generandoExcel || equiposFiltrados.length === 0}
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  {generandoExcel ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel Filtrado
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipos Registrados</CardTitle>
          <CardDescription>Lista de equipos con opción de generar PDF y Excel individual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, disciplina o localidad..."
                value={busquedaEquipos}
                onChange={(e) => setBusquedaEquipos(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuquen-primary focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {equiposMostrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {busquedaEquipos
                  ? `No hay equipos que coincidan con "${busquedaEquipos}"`
                  : "No hay equipos que coincidan con los filtros seleccionados"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {equiposMostrados.map((equipo) => (
                <div key={equipo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-lg">{equipo.nombre_equipo || `Equipo de ${equipo.disciplina}`}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{equipo.disciplina}</Badge>
                      <Badge variant="outline">{equipo.localidad}</Badge>
                      <Badge variant="outline">{equipo.participantes.length} participantes</Badge>
                      <Badge variant="outline">
                        {equipo.participantes.filter((p) => p.tipo === "deportista").length} deportistas
                      </Badge>
                      <Badge variant="outline">
                        ♂ {equipo.participantes.filter((p) => p.genero === "MASCULINO").length} / ♀{" "}
                        {equipo.participantes.filter((p) => p.genero === "FEMENINO").length}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Creado: {new Date(equipo.fecha_creacion).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button
                      onClick={() => handleGenerarReporteEquipo(equipo)}
                      disabled={
                        generandoEquipoPDF === equipo.id ||
                        generandoEquipoExcel === equipo.id ||
                        generandoListaBuenaFe === equipo.id
                      }
                      variant="outline"
                      size="sm"
                      className="bg-white"
                    >
                      {generandoEquipoPDF === equipo.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <Printer className="mr-2 h-4 w-4" />
                          PDF
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGenerarListaBuenaFe(equipo)}
                      disabled={
                        generandoEquipoPDF === equipo.id ||
                        generandoEquipoExcel === equipo.id ||
                        generandoListaBuenaFe === equipo.id
                      }
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      {generandoListaBuenaFe === equipo.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Lista Buena Fe
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGenerarReporteEquipoExcel(equipo)}
                      disabled={
                        generandoEquipoPDF === equipo.id ||
                        generandoEquipoExcel === equipo.id ||
                        generandoListaBuenaFe === equipo.id
                      }
                      variant="outline"
                      size="sm"
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      {generandoEquipoExcel === equipo.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Excel
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
