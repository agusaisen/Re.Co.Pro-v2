"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/api-client"

interface Documento {
  id: number
  titulo: string
  nombre_archivo: string
  tipo_archivo: string
  tamaño_archivo: number
  fecha_subida: string
  subido_por: number
  nombre_usuario: string
}

export default function GestorDocumentacionPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    cargarDocumentos()
  }, [])

  const cargarDocumentos = async () => {
    try {
      const response = await apiRequest("/api/gestor/documentacion")

      if (response.ok) {
        const data = await response.json()
        setDocumentos(data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los documentos",
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

  const descargarDocumento = async (id: number, nombreArchivo: string) => {
    try {
      const response = await apiRequest(`/api/download/${id}`)

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

        toast({
          title: "Éxito",
          description: "Documento descargado correctamente",
        })
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

  const getFileIcon = (tipoArchivo: string) => {
    if (tipoArchivo.includes("pdf")) return "📄"
    if (tipoArchivo.includes("word") || tipoArchivo.includes("document")) return "📝"
    if (tipoArchivo.includes("excel") || tipoArchivo.includes("sheet")) return "📊"
    if (tipoArchivo.includes("image")) return "🖼️"
    return "📁"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neuquen-primary mx-auto"></div>
          <p className="mt-4 text-neuquen-primary">Cargando documentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neuquen-primary">Documentación</h1>
        <p className="text-gray-600 mt-2">Documentos importantes y recursos disponibles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos Disponibles
          </CardTitle>
          <CardDescription>
            Descarga los documentos oficiales y recursos necesarios para la gestión de equipos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos disponibles</h3>
              <p className="text-gray-500">Los administradores aún no han subido documentos al sistema.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-xl">ℹ️</div>
                  <div>
                    <h4 className="font-medium text-blue-900">Información importante</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Estos documentos contienen información oficial sobre reglamentos, formularios y guías para la
                      correcta gestión de equipos en los Juegos Regionales.
                    </p>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Fecha de Publicación</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentos.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(doc.tipo_archivo)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{doc.titulo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatearFecha(doc.fecha_subida)}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => descargarDocumento(doc.id, doc.nombre_archivo)}
                          className="hover:bg-neuquen-primary hover:text-neuquen-dark transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
