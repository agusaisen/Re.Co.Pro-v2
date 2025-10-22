"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, Eye, Search, AlertCircle, Calendar, Users, Trophy } from "lucide-react"
import Link from "next/link"
import { apiRequest } from "@/lib/api-client"
import { useInscripcionesStatus } from "@/hooks/use-inscripciones-status"

interface Inscripcion {
  id: number
  nombre_equipo: string
  disciplina_nombre: string
  localidad_nombre: string
  participantes_count: number
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA"
  created_at: string
  gestor_nombre: string
  gestor_apellido: string
}

export default function InscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [filteredInscripciones, setFilteredInscripciones] = useState<Inscripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState<"TODAS" | "PENDIENTE" | "APROBADA" | "RECHAZADA">("TODAS")
  const [procesando, setProcesando] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const {
    inscripcionesAbiertas,
    fecha_inicio,
    fecha_fin,
    fecha_actual,
    loading: loadingStatus,
  } = useInscripcionesStatus()

  useEffect(() => {
    fetchInscripciones()
  }, [])

  useEffect(() => {
    filterInscripciones()
  }, [inscripciones, searchTerm, filterEstado])

  const fetchInscripciones = async () => {
    try {
      const data = await apiRequest("/api/admin/inscripciones")
      setInscripciones(data)
    } catch (error) {
      console.error("Error fetching inscripciones:", error)
      setError("Error al cargar las inscripciones")
    } finally {
      setLoading(false)
    }
  }

  const filterInscripciones = () => {
    let filtered = inscripciones

    if (filterEstado !== "TODAS") {
      filtered = filtered.filter((i) => i.estado === filterEstado)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.nombre_equipo?.toLowerCase().includes(term) ||
          i.disciplina_nombre.toLowerCase().includes(term) ||
          i.localidad_nombre.toLowerCase().includes(term) ||
          `${i.gestor_nombre} ${i.gestor_apellido}`.toLowerCase().includes(term),
      )
    }

    setFilteredInscripciones(filtered)
  }

  const handleUpdateEstado = async (id: number, estado: "APROBADA" | "RECHAZADA") => {
    if (!inscripcionesAbiertas) {
      setError("No se pueden aprobar o rechazar inscripciones fuera del período configurado")
      return
    }

    const confirmMessage =
      estado === "APROBADA"
        ? "¿Está seguro de que desea aprobar esta inscripción?"
        : "¿Está seguro de que desea rechazar esta inscripción?"

    if (!confirm(confirmMessage)) return

    setProcesando(id)
    setError("")
    setMessage("")

    try {
      await apiRequest(`/api/admin/inscripciones/${id}`, {
        method: "PUT",
        body: JSON.stringify({ estado }),
      })

      setMessage(`Inscripción ${estado === "APROBADA" ? "aprobada" : "rechazada"} correctamente`)
      fetchInscripciones()
    } catch (error) {
      console.error("Error updating inscripcion:", error)
      setError("Error al actualizar el estado de la inscripción")
    } finally {
      setProcesando(null)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pendiente
          </Badge>
        )
      case "APROBADA":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Aprobada
          </Badge>
        )
      case "RECHAZADA":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Rechazada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const stats = {
    total: inscripciones.length,
    pendientes: inscripciones.filter((i) => i.estado === "PENDIENTE").length,
    aprobadas: inscripciones.filter((i) => i.estado === "APROBADA").length,
    rechazadas: inscripciones.filter((i) => i.estado === "RECHAZADA").length,
  }

  if (loading || loadingStatus) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neuquen-primary">Gestión de Inscripciones</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neuquen-primary">Gestión de Inscripciones</h1>
        <p className="text-muted-foreground mt-2">Revisa y gestiona las inscripciones de equipos</p>
      </div>

      {!inscripcionesAbiertas && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Período de inscripciones cerrado.</strong> Las acciones de aprobar/rechazar están deshabilitadas
            fuera del período configurado ({fecha_inicio ? new Date(fecha_inicio).toLocaleDateString("es-AR") : "N/A"} -{" "}
            {fecha_fin ? new Date(fecha_fin).toLocaleDateString("es-AR") : "N/A"}). Fecha actual:{" "}
            {fecha_actual ? new Date(fecha_actual).toLocaleDateString("es-AR") : "N/A"}.
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Inscripciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neuquen-primary">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Aprobadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.aprobadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rechazadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.rechazadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por equipo, disciplina, localidad o gestor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterEstado === "TODAS" ? "default" : "outline"}
                onClick={() => setFilterEstado("TODAS")}
                size="sm"
              >
                Todas
              </Button>
              <Button
                variant={filterEstado === "PENDIENTE" ? "default" : "outline"}
                onClick={() => setFilterEstado("PENDIENTE")}
                size="sm"
                className={filterEstado === "PENDIENTE" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
              >
                Pendientes
              </Button>
              <Button
                variant={filterEstado === "APROBADA" ? "default" : "outline"}
                onClick={() => setFilterEstado("APROBADA")}
                size="sm"
                className={filterEstado === "APROBADA" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Aprobadas
              </Button>
              <Button
                variant={filterEstado === "RECHAZADA" ? "default" : "outline"}
                onClick={() => setFilterEstado("RECHAZADA")}
                size="sm"
                className={filterEstado === "RECHAZADA" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Rechazadas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Inscripciones */}
      {filteredInscripciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron inscripciones</h3>
            <p className="text-gray-500">
              {searchTerm || filterEstado !== "TODAS"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Aún no hay equipos inscritos"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInscripciones.map((inscripcion) => (
            <Card key={inscripcion.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-neuquen-primary">
                          {inscripcion.nombre_equipo || `Equipo de ${inscripcion.disciplina_nombre}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getEstadoBadge(inscripcion.estado)}
                          <Badge variant="outline">{inscripcion.disciplina_nombre}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{inscripcion.participantes_count} participantes</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Trophy className="h-4 w-4" />
                        <span>{inscripcion.localidad_nombre}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(inscripcion.created_at).toLocaleDateString("es-AR")}</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Gestor: {inscripcion.gestor_nombre} {inscripcion.gestor_apellido}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:min-w-[200px]">
                    <Link href={`/admin/equipos/${inscripcion.id}`}>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalle
                      </Button>
                    </Link>

                    {inscripcion.estado === "PENDIENTE" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateEstado(inscripcion.id, "APROBADA")}
                          disabled={procesando === inscripcion.id || !inscripcionesAbiertas}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          size="sm"
                        >
                          {procesando === inscripcion.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprobar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleUpdateEstado(inscripcion.id, "RECHAZADA")}
                          disabled={procesando === inscripcion.id || !inscripcionesAbiertas}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          size="sm"
                        >
                          {procesando === inscripcion.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {inscripcion.estado !== "PENDIENTE" && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        {inscripcion.estado === "APROBADA" ? "Inscripción aprobada" : "Inscripción rechazada"}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
