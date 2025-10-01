"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, FileText, User, Users, MapPin, Trophy } from "lucide-react"
import Link from "next/link"
import { apiRequest } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Documento {
  id: number
  titulo: string
  nombre_archivo: string
  tipo_archivo: string
  tamaño_archivo: number
  fecha_vinculacion: string
}

interface Deportista {
  id: number
  nombre: string
  apellido: string
  dni: string
  genero: string
  documentos: Documento[]
}

interface EquipoInfo {
  id: number
  nombre_equipo: string
  disciplina: string
  localidad: string
}

interface TeamDocumentsData {
  equipo: EquipoInfo
  deportistas: Deportista[]
}

export default function AdminEquipoDocumentosPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<TeamDocumentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTeamDocuments()
  }, [])

  const fetchTeamDocuments = async () => {
    try {
      const response = await apiRequest(`/api/admin/equipos/${params.id}/documentos`)

      if (response.ok) {
        const teamData = await response.json()
        setData(teamData)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los documentos del equipo",
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

  const descargarDocumento = async (documentoId: number, nombreArchivo: string) => {
    try {
      const response = await apiRequest(`/api/download/${documentoId}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = nombreArchivo
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast({
          title: "Error",
          description: "No se pudo descargar el documento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    }
  }

  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/equipos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-neuquen-primary">Cargando...</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/equipos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-neuquen-primary">Equipo no encontrado</h1>
        </div>
      </div>
    )
  }

  const totalDocumentos = data.deportistas.reduce((sum, d) => sum + d.documentos.length, 0)
  const deportistasConDocumentos = data.deportistas.filter((d) => d.documentos.length > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/equipos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-neuquen-primary">
            {data.equipo.nombre_equipo || `Equipo de ${data.equipo.disciplina}`}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-gray-400" />
              <Badge variant="secondary">{data.equipo.disciplina}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{data.equipo.localidad}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deportistas</p>
                <p className="text-2xl font-bold text-neuquen-primary">{data.deportistas.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documentos</p>
                <p className="text-2xl font-bold text-neuquen-primary">{totalDocumentos}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Con Documentos</p>
                <p className="text-2xl font-bold text-neuquen-primary">{deportistasConDocumentos}</p>
              </div>
              <User className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Deportistas y Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Deportistas y sus Documentos</CardTitle>
          <CardDescription>Documentos vinculados a cada deportista del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          {data.deportistas.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay deportistas registrados en este equipo</p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.deportistas.map((deportista) => (
                <div key={deportista.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neuquen-primary">
                        {deportista.apellido}, {deportista.nombre}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>DNI: {deportista.dni}</span>
                        <Badge variant="outline" className="text-xs">
                          {deportista.genero}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={deportista.documentos.length > 0 ? "default" : "secondary"}>
                      {deportista.documentos.length} documento{deportista.documentos.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {deportista.documentos.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No hay documentos vinculados</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Archivo</TableHead>
                          <TableHead>Tamaño</TableHead>
                          <TableHead>Fecha Vinculación</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deportista.documentos.map((documento) => (
                          <TableRow key={documento.id}>
                            <TableCell className="font-medium">{documento.titulo}</TableCell>
                            <TableCell>{documento.nombre_archivo}</TableCell>
                            <TableCell>{formatearTamaño(documento.tamaño_archivo)}</TableCell>
                            <TableCell>{formatearFecha(documento.fecha_vinculacion)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => descargarDocumento(documento.id, documento.nombre_archivo)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Descargar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
