"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Users,
  Trophy,
  Plus,
  Trash2,
  FolderEdit as UserEdit,
  Download,
  FileText,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { apiRequest } from "@/lib/api-client"
import { generarReporteEquipo, type EquipoReporte } from "@/lib/pdf-generator"

interface Participante {
  id: number
  dni: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  genero: string
  edad: number
  tipo: "deportista" | "entrenador" | "delegado"
}

interface EquipoDetalle {
  id: number
  nombre_equipo: string
  disciplina_nombre: string
  disciplina_id: number
  localidad_nombre: string
  created_at: string
  participantes: Participante[]
}

interface ParticipanteForm {
  dni: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  genero: string
  tipo: "deportista" | "entrenador" | "delegado"
}

interface DocumentoParticipante {
  id: number
  titulo: string
  nombre_archivo: string
  tipo_archivo: string
  tamaño_archivo: number
  fecha_subida: string
  subido_por_nombre: string
  subido_por_apellido: string
}

export default function EquipoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [equipo, setEquipo] = useState<EquipoDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [nombreEquipo, setNombreEquipo] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participante | null>(null)
  const [participantForm, setParticipantForm] = useState<ParticipanteForm>({
    dni: "",
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    genero: "",
    tipo: "deportista",
  })

  const [generandoPDF, setGenerandoPDF] = useState(false)

  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null)
  const [participantDocuments, setParticipantDocuments] = useState<DocumentoParticipante[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchEquipoDetalle()
    }
  }, [params.id])

  const fetchEquipoDetalle = async () => {
    try {
      const response = await apiRequest(`/api/gestor/equipos/${params.id}`)

      if (response.ok) {
        const data = await response.json()
        setEquipo(data)
        setNombreEquipo(data.nombre_equipo || "")
      } else {
        setError("Error al cargar los detalles del equipo")
      }
    } catch (error) {
      console.error("Error fetching equipo detalle:", error)
      setError("Error de conexión al cargar el equipo")
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipantDocuments = async (participantId: number) => {
    setLoadingDocuments(true)
    try {
      const response = await apiRequest(`/api/gestor/participantes/${participantId}/documentos`)
      if (response.ok) {
        const data = await response.json()
        setParticipantDocuments(data.data || [])
      } else {
        setError("Error al cargar documentos del participante")
      }
    } catch (error) {
      console.error("Error fetching participant documents:", error)
      setError("Error de conexión al cargar documentos")
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleUploadDocument = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && selectedParticipantId) {
        // Validate file size
        const maxSize = 4.5 * 1024 * 1024
        if (file.size > maxSize) {
          setError("El archivo es demasiado grande. El tamaño máximo permitido es 4.5MB")
          return
        }

        const titulo = prompt("Ingrese un título para el documento:")
        if (titulo && titulo.trim()) {
          setUploadingDocument(true)
          try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("titulo", titulo.trim())

            const response = await apiRequest(`/api/gestor/participantes/${selectedParticipantId}/documentos`, {
              method: "POST",
              body: formData,
            })

            if (response.ok) {
              setMessage("Documento subido correctamente")
              fetchParticipantDocuments(selectedParticipantId) // Refresh documents
            } else {
              const data = await response.json()
              setError(data.error || "Error al subir documento")
            }
          } catch (error) {
            setError("Error de conexión al subir documento")
          } finally {
            setUploadingDocument(false)
          }
        }
      }
    }
    input.click()
  }

  const handleDownloadDocument = async (documentId: number, filename: string) => {
    if (!selectedParticipantId) return

    try {
      const response = await apiRequest(`/api/gestor/participantes/${selectedParticipantId}/documentos/${documentId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError("Error al descargar documento")
      }
    } catch (error) {
      setError("Error de conexión al descargar documento")
    }
  }

  const handleUnlinkDocument = async (documentId: number) => {
    if (!selectedParticipantId) return

    if (!confirm("¿Estás seguro de que deseas desvincular este documento del deportista?")) {
      return
    }

    try {
      const response = await apiRequest(
        `/api/gestor/participantes/${selectedParticipantId}/documentos?documentoId=${documentId}`,
        {
          method: "DELETE",
        },
      )

      if (response.ok) {
        setMessage("Documento desvinculado correctamente")
        fetchParticipantDocuments(selectedParticipantId) // Refresh documents
      } else {
        const data = await response.json()
        setError(data.error || "Error al desvincular documento")
      }
    } catch (error) {
      setError("Error de conexión al desvincular documento")
    }
  }

  const openDocumentsModal = (participant: Participante) => {
    if (participant.tipo !== "deportista") {
      setError("Solo se pueden gestionar documentos de deportistas")
      return
    }

    setSelectedParticipantId(participant.id)
    setShowDocumentsModal(true)
    fetchParticipantDocuments(participant.id)
  }

  const handleSave = async () => {
    if (!equipo) return

    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await apiRequest(`/api/gestor/equipos/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre_equipo: nombreEquipo,
        }),
      })

      if (response.ok) {
        setMessage("Equipo actualizado correctamente")
        setEditMode(false)
        // Actualizar el estado local
        setEquipo({ ...equipo, nombre_equipo: nombreEquipo })
      } else {
        const data = await response.json()
        setError(data.error || "Error al actualizar el equipo")
      }
    } catch (error) {
      setError("Error de conexión al actualizar el equipo")
    } finally {
      setSaving(false)
    }
  }

  const handleAddParticipant = async () => {
    if (!equipo) return

    setSaving(true)
    setError("")

    try {
      const response = await apiRequest(`/api/gestor/equipos/${params.id}/participantes`, {
        method: "POST",
        body: JSON.stringify(participantForm),
      })

      if (response.ok) {
        setMessage("Participante agregado correctamente")
        setShowAddModal(false)
        resetParticipantForm()
        fetchEquipoDetalle() // Refresh data
      } else {
        const data = await response.json()
        setError(data.error || "Error al agregar participante")
      }
    } catch (error) {
      setError("Error de conexión al agregar participante")
    } finally {
      setSaving(false)
    }
  }

  const handleEditParticipant = async () => {
    if (!equipo || !editingParticipant) return

    setSaving(true)
    setError("")

    try {
      const response = await apiRequest(`/api/gestor/equipos/${params.id}/participantes/${editingParticipant.id}`, {
        method: "PUT",
        body: JSON.stringify(participantForm),
      })

      if (response.ok) {
        setMessage("Participante actualizado correctamente")
        setShowEditModal(false)
        setEditingParticipant(null)
        resetParticipantForm()
        fetchEquipoDetalle() // Refresh data
      } else {
        const data = await response.json()
        setError(data.error || "Error al actualizar participante")
      }
    } catch (error) {
      setError("Error de conexión al actualizar participante")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveParticipant = async (participantId: number) => {
    if (!equipo) return

    if (!confirm("¿Estás seguro de que deseas remover este participante del equipo?")) {
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await apiRequest(`/api/gestor/equipos/${params.id}/participantes/${participantId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage("Participante removido correctamente")
        fetchEquipoDetalle() // Refresh data
      } else {
        const data = await response.json()
        setError(data.error || "Error al remover participante")
      }
    } catch (error) {
      setError("Error de conexión al remover participante")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerarReporte = async () => {
    if (!equipo) return

    setGenerandoPDF(true)

    try {
      const equipoReporte: EquipoReporte = {
        id: equipo.id,
        disciplina: equipo.disciplina_nombre || "",
        nombre_equipo: equipo.nombre_equipo || `Equipo de ${equipo.disciplina_nombre}`,
        localidad: equipo.localidad_nombre || "",
        fecha_creacion: equipo.created_at || "",
        participantes: equipo.participantes.map((p) => ({
          dni: p.dni || "",
          nombre: p.nombre || "",
          apellido: p.apellido || "",
          fecha_nacimiento: p.fecha_nacimiento || "",
          edad: p.edad || calcularEdad(p.fecha_nacimiento || ""),
          disciplina: equipo.disciplina_nombre || "",
          equipo: equipo.nombre_equipo || `Equipo de ${equipo.disciplina_nombre}`,
          localidad: equipo.localidad_nombre || "",
          tipo: p.tipo || "deportista",
          genero: (p.genero || "masculino").toUpperCase() as "MASCULINO" | "FEMENINO",
        })),
      }

      await generarReporteEquipo(equipoReporte)
    } catch (error) {
      console.error("Error generando reporte:", error)
      setError("Error al generar el reporte PDF")
    } finally {
      setGenerandoPDF(false)
    }
  }

  const openEditModal = (participant: Participante) => {
    setEditingParticipant(participant)

    const normalizeGender = (gender: string): string => {
      if (!gender) return ""
      return gender.toLowerCase()
    }

    const formData = {
      dni: participant.dni || "",
      nombre: participant.nombre || "",
      apellido: participant.apellido || "",
      fecha_nacimiento: participant.fecha_nacimiento ? participant.fecha_nacimiento.split("T")[0] : "",
      genero: normalizeGender(participant.genero),
      tipo: participant.tipo || "deportista",
    }

    setParticipantForm(formData)
    setShowEditModal(true)
  }

  const resetParticipantForm = () => {
    setParticipantForm({
      dni: "",
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",
      genero: "",
      tipo: "deportista",
    })
  }

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }

    return edad
  }

  const formatearFecha = (fechaString: string): string => {
    if (!fechaString) return ""

    // Split the date string to avoid timezone conversion
    const fecha = fechaString.split("T")[0] // Get only the date part (YYYY-MM-DD)
    const [year, month, day] = fecha.split("-")

    // Create date using local timezone
    const fechaLocal = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

    return fechaLocal.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!equipo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/gestor/equipos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-neuquen-primary">Equipo no encontrado</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">El equipo solicitado no existe o no tienes permisos para verlo.</p>
            <Link href="/gestor/equipos" className="mt-4 inline-block">
              <Button>Volver a Mis Equipos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/gestor/equipos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neuquen-primary">
              {equipo.nombre_equipo || `Equipo de ${equipo.disciplina_nombre}`}
            </h1>
            <p className="text-gray-600 mt-1">Detalles y gestión del equipo</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-neuquen-primary hover:bg-neuquen-primary/90">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)} className="bg-neuquen-accent hover:bg-neuquen-accent/90">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {message && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Equipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Información del Equipo
              </CardTitle>
              <CardDescription>Datos generales del equipo inscrito</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre-equipo">Nombre del Equipo</Label>
                  {editMode ? (
                    <Input
                      id="nombre-equipo"
                      value={nombreEquipo}
                      onChange={(e) => setNombreEquipo(e.target.value)}
                      placeholder="Nombre del equipo"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{equipo.nombre_equipo || "Sin nombre asignado"}</p>
                  )}
                </div>
                <div>
                  <Label>Disciplina</Label>
                  <p className="text-sm font-medium mt-1">{equipo.disciplina_nombre}</p>
                </div>
                <div>
                  <Label>Localidad</Label>
                  <p className="text-sm font-medium mt-1">{equipo.localidad_nombre}</p>
                </div>
                <div>
                  <Label>Fecha de Inscripción</Label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(equipo.created_at).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participantes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participantes ({equipo.participantes.length})
                  </CardTitle>
                  <CardDescription>Lista de participantes del equipo</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setParticipantForm({ ...participantForm, tipo: "deportista" })
                      setShowAddModal(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Deportista
                  </Button>
                  {equipo.participantes.filter((p) => p.tipo === "entrenador").length === 0 && (
                    <Button
                      onClick={() => {
                        setParticipantForm({ ...participantForm, tipo: "entrenador" })
                        setShowAddModal(true)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Entrenador/a
                    </Button>
                  )}
                  {equipo.participantes.filter((p) => p.tipo === "delegado").length === 0 && (
                    <Button
                      onClick={() => {
                        setParticipantForm({ ...participantForm, tipo: "delegado" })
                        setShowAddModal(true)
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Delegado/a
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Deportistas */}
                {equipo.participantes.filter((p) => p.tipo === "deportista").length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Deportistas ({equipo.participantes.filter((p) => p.tipo === "deportista").length})
                      </h4>
                      <Button
                        onClick={() => {
                          setParticipantForm({ ...participantForm, tipo: "deportista" })
                          setShowAddModal(true)
                        }}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {equipo.participantes
                        .filter((p) => p.tipo === "deportista")
                        .map((participante, index) => (
                          <div key={participante.id} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                            <div className="flex justify-between items-start mb-3">
                              <h5 className="font-medium text-blue-800">Deportista {index + 1}</h5>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {calcularEdad(participante.fecha_nacimiento)} años
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDocumentsModal(participante)}
                                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEditModal(participante)}>
                                  <UserEdit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveParticipant(participante.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">DNI:</span>
                                <p className="mt-1">{participante.dni}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Nombre:</span>
                                <p className="mt-1">{participante.nombre}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Apellido:</span>
                                <p className="mt-1">{participante.apellido}</p>
                              </div>
                              <div className="md:col-span-3">
                                <span className="font-medium text-gray-600">Fecha de Nacimiento:</span>
                                <p className="mt-1">{formatearFecha(participante.fecha_nacimiento)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Entrenadores */}
                {equipo.participantes.filter((p) => p.tipo === "entrenador").length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Entrenadores/as ({equipo.participantes.filter((p) => p.tipo === "entrenador").length})
                      </h4>
                      <Button
                        onClick={() => {
                          setParticipantForm({ ...participantForm, tipo: "entrenador" })
                          setShowAddModal(true)
                        }}
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {equipo.participantes
                        .filter((p) => p.tipo === "entrenador")
                        .map((participante, index) => (
                          <div key={participante.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                            <div className="flex justify-between items-start mb-3">
                              <h5 className="font-medium text-green-800">Entrenador/a {index + 1}</h5>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  {calcularEdad(participante.fecha_nacimiento)} años
                                </Badge>
                                <Button size="sm" variant="outline" onClick={() => openEditModal(participante)}>
                                  <UserEdit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveParticipant(participante.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">DNI:</span>
                                <p className="mt-1">{participante.dni}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Nombre:</span>
                                <p className="mt-1">{participante.nombre}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Apellido:</span>
                                <p className="mt-1">{participante.apellido}</p>
                              </div>
                              <div className="md:col-span-3">
                                <span className="font-medium text-gray-600">Fecha de Nacimiento:</span>
                                <p className="mt-1">{formatearFecha(participante.fecha_nacimiento)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Delegados */}
                {equipo.participantes.filter((p) => p.tipo === "delegado").length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Delegados/as ({equipo.participantes.filter((p) => p.tipo === "delegado").length})
                      </h4>
                      <Button
                        onClick={() => {
                          setParticipantForm({ ...participantForm, tipo: "delegado" })
                          setShowAddModal(true)
                        }}
                        variant="outline"
                        size="sm"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {equipo.participantes
                        .filter((p) => p.tipo === "delegado")
                        .map((participante, index) => (
                          <div key={participante.id} className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                            <div className="flex justify-between items-start mb-3">
                              <h5 className="font-medium text-purple-800">Delegado/a {index + 1}</h5>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                  {calcularEdad(participante.fecha_nacimiento)} años
                                </Badge>
                                <Button size="sm" variant="outline" onClick={() => openEditModal(participante)}>
                                  <UserEdit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveParticipant(participante.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">DNI:</span>
                                <p className="mt-1">{participante.dni}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Nombre:</span>
                                <p className="mt-1">{participante.nombre}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Apellido:</span>
                                <p className="mt-1">{participante.apellido}</p>
                              </div>
                              <div className="md:col-span-3">
                                <span className="font-medium text-gray-600">Fecha de Nacimiento:</span>
                                <p className="mt-1">{formatearFecha(participante.fecha_nacimiento)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {equipo.participantes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay participantes registrados en este equipo
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <Button
                        onClick={() => {
                          setParticipantForm({ ...participantForm, tipo: "deportista" })
                          setShowAddModal(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Deportista
                      </Button>
                      <Button
                        onClick={() => {
                          setParticipantForm({ ...participantForm, tipo: "entrenador" })
                          setShowAddModal(true)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Entrenador/a
                      </Button>
                      <Button
                        onClick={() => {
                          setParticipantForm({ ...participantForm, tipo: "delegado" })
                          setShowAddModal(true)
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Delegado/a
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-neuquen-primary">Acciones Disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">Gestiona tu equipo y genera reportes</p>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserEdit className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">Editar Participantes</p>
                  </div>
                  <p className="text-xs text-blue-600">Agregar, editar o eliminar participantes del equipo</p>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-medium text-purple-800">Gestionar Documentos</p>
                  </div>
                  <p className="text-xs text-purple-600">Subir y gestionar documentos de los deportistas</p>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Edit className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">Editar Nombre</p>
                  </div>
                  <p className="text-xs text-green-600">Cambiar el nombre del equipo en cualquier momento</p>
                </div>

                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <p className="text-sm font-medium text-orange-800">Generar Reporte</p>
                  </div>
                  <p className="text-xs text-orange-600 mb-3">Descargar reporte PDF con todos los datos del equipo</p>
                  <Button
                    onClick={handleGenerarReporte}
                    disabled={generandoPDF}
                    size="sm"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {generandoPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Documentos del Deportista</DialogTitle>
            <DialogDescription>
              Subir, descargar y gestionar documentos vinculados al deportista seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Documentos ({participantDocuments.length})</h4>
              <Button
                onClick={handleUploadDocument}
                disabled={uploadingDocument}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {uploadingDocument ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Documento
                  </>
                )}
              </Button>
            </div>

            {loadingDocuments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando documentos...</p>
              </div>
            ) : participantDocuments.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {participantDocuments.map((doc) => (
                  <div key={doc.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{doc.titulo}</p>
                          <p className="text-xs text-gray-500">
                            {doc.nombre_archivo} • {(doc.tamaño_archivo / 1024).toFixed(1)} KB
                          </p>
                          <p className="text-xs text-gray-400">
                            Subido por {doc.subido_por_nombre} {doc.subido_por_apellido} •{" "}
                            {new Date(doc.fecha_subida).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(doc.id, doc.nombre_archivo)}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnlinkDocument(doc.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay documentos vinculados a este deportista</p>
                <p className="text-sm">Haz clic en "Subir Documento" para comenzar</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentsModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Participante</DialogTitle>
            <DialogDescription>Completa los datos del nuevo participante para agregarlo al equipo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-dni">DNI</Label>
                <Input
                  id="add-dni"
                  value={participantForm.dni}
                  onChange={(e) => setParticipantForm({ ...participantForm, dni: e.target.value })}
                  placeholder="12345678"
                  maxLength={8}
                />
              </div>
              <div>
                <Label htmlFor="add-tipo">Tipo</Label>
                <Select
                  value={participantForm.tipo}
                  onValueChange={(value: any) => setParticipantForm({ ...participantForm, tipo: value })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="deportista">Deportista</SelectItem>
                    <SelectItem value="entrenador">Entrenador</SelectItem>
                    <SelectItem value="delegado">Delegado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-nombre">Nombre</Label>
                <Input
                  id="add-nombre"
                  value={participantForm.nombre}
                  onChange={(e) => setParticipantForm({ ...participantForm, nombre: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label htmlFor="add-apellido">Apellido</Label>
                <Input
                  id="add-apellido"
                  value={participantForm.apellido}
                  onChange={(e) => setParticipantForm({ ...participantForm, apellido: e.target.value })}
                  placeholder="Pérez"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-fecha">Fecha de Nacimiento</Label>
                <Input
                  id="add-fecha"
                  type="date"
                  value={participantForm.fecha_nacimiento}
                  onChange={(e) => setParticipantForm({ ...participantForm, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-genero">Género</Label>
                <Select
                  value={participantForm.genero}
                  onValueChange={(value) => setParticipantForm({ ...participantForm, genero: value })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddParticipant} disabled={saving}>
              {saving ? "Agregando..." : "Agregar Participante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Participante</DialogTitle>
            <DialogDescription>Modifica los datos del participante seleccionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-dni">DNI</Label>
                <Input
                  id="edit-dni"
                  value={participantForm.dni}
                  onChange={(e) => setParticipantForm({ ...participantForm, dni: e.target.value })}
                  placeholder="12345678"
                  maxLength={8}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Select
                  value={participantForm.tipo}
                  onValueChange={(value: any) => setParticipantForm({ ...participantForm, tipo: value })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="deportista">Deportista</SelectItem>
                    <SelectItem value="entrenador">Entrenador</SelectItem>
                    <SelectItem value="delegado">Delegado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={participantForm.nombre}
                  onChange={(e) => setParticipantForm({ ...participantForm, nombre: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label htmlFor="edit-apellido">Apellido</Label>
                <Input
                  id="edit-apellido"
                  value={participantForm.apellido}
                  onChange={(e) => setParticipantForm({ ...participantForm, apellido: e.target.value })}
                  placeholder="Pérez"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-fecha">Fecha de Nacimiento</Label>
                <Input
                  id="edit-fecha"
                  type="date"
                  value={participantForm.fecha_nacimiento}
                  onChange={(e) => setParticipantForm({ ...participantForm, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-genero">Género</Label>
                <Select
                  value={participantForm.genero}
                  onValueChange={(value) => {
                    setParticipantForm({ ...participantForm, genero: value })
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditParticipant} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
