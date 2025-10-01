"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Download, Trash2, FileText, Plus } from "lucide-react"
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

export default function AdminDocumentacionPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    cargarDocumentos()
  }, [])

  const cargarDocumentos = async () => {
    try {
      const response = await apiRequest("/api/admin/documentacion")

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

  const subirDocumento = async () => {
    if (!titulo.trim() || !archivo) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      })
      return
    }

    const maxSize = 4.5 * 1024 * 1024 // 4.5MB in bytes
    if (archivo.size > maxSize) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 4.5MB. Por favor seleccione un archivo más pequeño.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("titulo", titulo)
      formData.append("archivo", archivo)

      const response = await apiRequest("/api/admin/documentacion", {
        method: "POST",
        body: formData,
        headers: {}, // Let apiRequest handle headers, but override Content-Type for FormData
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Documento subido correctamente",
        })
        setModalOpen(false)
        setTitulo("")
        setArchivo(null)
        cargarDocumentos()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Error al subir el documento",
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
      setUploading(false)
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

  const eliminarDocumento = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este documento?")) {
      return
    }

    try {
      const response = await apiRequest(`/api/admin/documentacion/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Documento eliminado correctamente",
        })
        cargarDocumentos()
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el documento",
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neuquen-primary">Documentación</h1>
          <p className="text-gray-600 mt-2">Gestiona los documentos del sistema</p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neuquen-primary hover:bg-neuquen-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Nuevo Documento</DialogTitle>
              <DialogDescription>Complete los campos para subir un nuevo documento al sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título del Documento</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ingrese el título del documento"
                />
              </div>
              <div>
                <Label htmlFor="archivo">Archivo</Label>
                <Input
                  id="archivo"
                  type="file"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG
                </p>
                <p className="text-sm text-amber-600 mt-1 font-medium">⚠️ Tamaño máximo: 4.5MB</p>
                {archivo && (
                  <p className="text-sm text-blue-600 mt-1">Archivo seleccionado: {formatearTamaño(archivo.size)}</p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={subirDocumento} disabled={uploading}>
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos Subidos
          </CardTitle>
          <CardDescription>Lista de todos los documentos disponibles en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay documentos subidos</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha de Subida</TableHead>
                  <TableHead>Subido por</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.titulo}</TableCell>
                    <TableCell>{doc.nombre_archivo}</TableCell>
                    <TableCell>{formatearTamaño(doc.tamaño_archivo)}</TableCell>
                    <TableCell>{formatearFecha(doc.fecha_subida)}</TableCell>
                    <TableCell>{doc.nombre_usuario}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => descargarDocumento(doc.id, doc.nombre_archivo)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarDocumento(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
