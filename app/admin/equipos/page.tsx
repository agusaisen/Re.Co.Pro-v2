"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, FileText, Search, Calendar, MapPin, Trophy, Eye, X } from "lucide-react"
import Link from "next/link"
import { apiRequest } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { generarPlanillaJuego, type EquipoReporte } from "@/lib/pdf-generator"

interface Equipo {
  id: number
  nombre_equipo: string
  disciplina: string
  localidad: string
  region: string
  created_at: string
  total_participantes: number
  total_deportistas: number
  total_documentos: number
}

export default function AdminEquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [generandoPlanilla, setGenerandoPlanilla] = useState<number | null>(null)
  const [equipoPreview, setEquipoPreview] = useState<EquipoReporte | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchEquipos()
  }, [])

  const fetchEquipos = async () => {
    try {
      const response = await apiRequest("/api/admin/equipos")

      if (response.ok) {
        const data = await response.json()
        setEquipos(data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los equipos",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const equiposFiltrados = equipos.filter((equipo) => {
    if (!busqueda) return true
    const busquedaLower = busqueda.toLowerCase()
    return (
      equipo.nombre_equipo?.toLowerCase().includes(busquedaLower) ||
      equipo.disciplina.toLowerCase().includes(busquedaLower) ||
      equipo.localidad.toLowerCase().includes(busquedaLower) ||
      equipo.region?.toLowerCase().includes(busquedaLower)
    )
  })

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const estadisticas = {
    totalEquipos: equipos.length,
    totalDeportistas: equipos.reduce((sum, e) => sum + e.total_deportistas, 0),
    totalDocumentos: equipos.reduce((sum, e) => sum + e.total_documentos, 0),
    equiposConDocumentos: equipos.filter((e) => e.total_documentos > 0).length,
  }

  const generarPlanilla = async (equipoId: number) => {
    try {
      setGenerandoPlanilla(equipoId)

      const response = await apiRequest("/api/admin/reportes/equipos")

      if (!response.ok) {
        throw new Error("Error al obtener datos del equipo")
      }

      const equipos: EquipoReporte[] = await response.json()
      const equipo = equipos.find((e) => e.id === equipoId)

      if (!equipo) {
        throw new Error("Equipo no encontrado")
      }

      await generarPlanillaJuego(equipo)

      toast({
        title: "Éxito",
        description: "Planilla de juego generada correctamente",
      })
    } catch (error) {
      console.error("Error generating game sheet:", error)
      toast({
        title: "Error",
        description: "No se pudo generar la planilla de juego",
        variant: "destructive",
      })
    } finally {
      setGenerandoPlanilla(null)
    }
  }

  const mostrarVistaPrevia = async (equipoId: number) => {
    try {
      setLoadingPreview(true)

      const response = await apiRequest("/api/admin/reportes/equipos")

      if (!response.ok) {
        throw new Error("Error al obtener datos del equipo")
      }

      const equipos: any[] = await response.json()
      const equipo = equipos.find((e) => e.id === equipoId)

      if (!equipo) {
        throw new Error("Equipo no encontrado")
      }

      const equipoTransformado: EquipoReporte = {
        id: equipo.id,
        nombre_equipo: equipo.nombre_equipo,
        disciplina: equipo.disciplina,
        localidad: equipo.localidad,
        deportistas: equipo.participantes.filter((p: any) => p.tipo === "deportista"),
        entrenadores: equipo.participantes.filter((p: any) => p.tipo === "entrenador"),
        delegados: equipo.participantes.filter((p: any) => p.tipo === "delegado"),
      }

      setEquipoPreview(equipoTransformado)
    } catch (error) {
      console.error("Error loading team preview:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la vista previa del equipo",
        variant: "destructive",
      })
    } finally {
      setLoadingPreview(false)
    }
  }

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neuquen-primary">Equipos y Documentos</h1>
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
        <h1 className="text-3xl font-bold text-neuquen-primary">Equipos y Documentos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona los equipos registrados y visualiza los documentos de los deportistas
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
              </div>
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documentos</p>
                <p className="text-2xl font-bold text-neuquen-primary">{estadisticas.totalDocumentos}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Equipos con Docs</p>
                <p className="text-2xl font-bold text-neuquen-primary">{estadisticas.equiposConDocumentos}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Equipos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre de equipo, disciplina, localidad o región..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipos Registrados</CardTitle>
          <CardDescription>{equiposFiltrados.length} equipos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {equiposFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {busqueda ? `No hay equipos que coincidan con "${busqueda}"` : "No hay equipos registrados"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Localidad</TableHead>
                  <TableHead>Región</TableHead>
                  <TableHead>Deportistas</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equiposFiltrados.map((equipo) => (
                  <TableRow key={equipo.id}>
                    <TableCell className="font-medium">
                      {equipo.nombre_equipo || `Equipo de ${equipo.disciplina}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{equipo.disciplina}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {equipo.localidad}
                      </div>
                    </TableCell>
                    <TableCell>
                      {equipo.region ? (
                        <Badge variant="outline" className="text-xs">
                          {equipo.region}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin región</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        {equipo.total_deportistas}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className={equipo.total_documentos > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                          {equipo.total_documentos}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatearFecha(equipo.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mostrarVistaPrevia(equipo.id)}
                          disabled={loadingPreview}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Vista Previa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generarPlanilla(equipo.id)}
                          disabled={generandoPlanilla === equipo.id}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {generandoPlanilla === equipo.id ? "Generando..." : "Imprimir Planilla"}
                        </Button>
                        <Link href={`/admin/equipos/${equipo.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Documentos
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {equipoPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neuquen-primary">Vista Previa del Equipo</h2>
              <Button variant="ghost" size="sm" onClick={() => setEquipoPreview(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Disciplina</p>
                    <p className="text-lg font-semibold">{equipoPreview.disciplina}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nombre del Equipo</p>
                    <p className="text-lg font-semibold">{equipoPreview.nombre_equipo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Localidad</p>
                    <p className="text-lg font-semibold">{equipoPreview.localidad}</p>
                  </div>
                </div>
              </div>

              {equipoPreview.deportistas && equipoPreview.deportistas.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-neuquen-primary mb-3">
                    Deportistas ({equipoPreview.deportistas.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DNI</TableHead>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Fecha Nac.</TableHead>
                          <TableHead>Edad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipoPreview.deportistas.map((deportista, index) => (
                          <TableRow key={index}>
                            <TableCell>{deportista.dni}</TableCell>
                            <TableCell>{`${deportista.nombre} ${deportista.apellido}`}</TableCell>
                            <TableCell>{new Date(deportista.fecha_nacimiento).toLocaleDateString("es-AR")}</TableCell>
                            <TableCell>{calcularEdad(deportista.fecha_nacimiento)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {equipoPreview.entrenadores && equipoPreview.entrenadores.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-neuquen-primary mb-3">
                    Entrenadores ({equipoPreview.entrenadores.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DNI</TableHead>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Fecha Nac.</TableHead>
                          <TableHead>Edad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipoPreview.entrenadores.map((entrenador, index) => (
                          <TableRow key={index}>
                            <TableCell>{entrenador.dni}</TableCell>
                            <TableCell>{`${entrenador.nombre} ${entrenador.apellido}`}</TableCell>
                            <TableCell>{new Date(entrenador.fecha_nacimiento).toLocaleDateString("es-AR")}</TableCell>
                            <TableCell>{calcularEdad(entrenador.fecha_nacimiento)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {equipoPreview.delegados && equipoPreview.delegados.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-neuquen-primary mb-3">
                    Delegados ({equipoPreview.delegados.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DNI</TableHead>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Fecha Nac.</TableHead>
                          <TableHead>Edad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipoPreview.delegados.map((delegado, index) => (
                          <TableRow key={index}>
                            <TableCell>{delegado.dni}</TableCell>
                            <TableCell>{`${delegado.nombre} ${delegado.apellido}`}</TableCell>
                            <TableCell>{new Date(delegado.fecha_nacimiento).toLocaleDateString("es-AR")}</TableCell>
                            <TableCell>{calcularEdad(delegado.fecha_nacimiento)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
              <Button onClick={() => setEquipoPreview(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
