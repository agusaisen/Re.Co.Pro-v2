"use client"

import type React from "react"
import { ConfirmationModal } from "@/components/confirmation-modal"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Participante {
  id: number
  dni: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  tipo: "deportista" | "entrenador" | "delegado"
  localidad_id: number
  localidad_nombre: string
  telefono?: string
  email?: string
}

interface Localidad {
  id: number
  nombre: string
}

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [localidades, setLocalidades] = useState<Localidad[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>("deportista")
  const [filtroLocalidad, setFiltroLocalidad] = useState<string>("1")
  const [busqueda, setBusqueda] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null)

  const [formData, setFormData] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    tipo: "deportista" as "deportista" | "entrenador" | "delegado",
    localidad_id: "",
    telefono: "",
    email: "",
  })

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    participanteId: number | null
    participanteName: string
  }>({
    isOpen: false,
    participanteId: null,
    participanteName: "",
  })

  useEffect(() => {
    fetchParticipantes()
    fetchLocalidades()
  }, [filtroTipo, filtroLocalidad])

  const fetchParticipantes = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroTipo) params.append("tipo", filtroTipo)
      if (filtroLocalidad) params.append("localidad", filtroLocalidad)

      const response = await fetch(`/api/admin/participantes?${params}`)
      const data = await response.json()

      if (data.success) {
        setParticipantes(data.data)
      }
    } catch (error) {
      console.error("Error fetching participantes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocalidades = async () => {
    try {
      const response = await fetch("/api/admin/localidades")
      const data = await response.json()
      if (data.success) {
        setLocalidades(data.data)
      }
    } catch (error) {
      console.error("Error fetching localidades:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingParticipante
        ? `/api/admin/participantes/${editingParticipante.id}`
        : "/api/admin/participantes"

      const method = editingParticipante ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setShowDialog(false)
        setEditingParticipante(null)
        resetForm()
        fetchParticipantes()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Error saving participante:", error)
      alert("Error al guardar participante")
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.participanteId) return

    try {
      const response = await fetch(`/api/admin/participantes/${deleteModal.participanteId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        fetchParticipantes()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Error deleting participante:", error)
      alert("Error al eliminar participante")
    }
  }

  const resetForm = () => {
    setFormData({
      dni: "",
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",
      tipo: "deportista",
      localidad_id: "",
      telefono: "",
      email: "",
    })
  }

  const openEditDialog = (participante: Participante) => {
    setEditingParticipante(participante)
    setFormData({
      dni: participante.dni,
      nombre: participante.nombre,
      apellido: participante.apellido,
      fecha_nacimiento: participante.fecha_nacimiento,
      tipo: participante.tipo,
      localidad_id: participante.localidad_id.toString(),
      telefono: participante.telefono || "",
      email: participante.email || "",
    })
    setShowDialog(true)
  }

  const openDeleteModal = (participante: Participante) => {
    setDeleteModal({
      isOpen: true,
      participanteId: participante.id,
      participanteName: `${participante.nombre} ${participante.apellido}`,
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      participanteId: null,
      participanteName: "",
    })
  }

  const participantesFiltrados = participantes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.dni.includes(busqueda),
  )

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "deportista":
        return "bg-blue-100 text-blue-800"
      case "entrenador":
        return "bg-green-100 text-green-800"
      case "delegado":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="p-6">Cargando participantes...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Participantes</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
                setEditingParticipante(null)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Participante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingParticipante ? "Editar Participante" : "Nuevo Participante"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deportista">Deportista</SelectItem>
                      <SelectItem value="entrenador">Entrenador</SelectItem>
                      <SelectItem value="delegado">Delegado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="localidad_id">Localidad</Label>
                <Select
                  value={formData.localidad_id}
                  onValueChange={(value) => setFormData({ ...formData, localidad_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar localidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {localidades.map((localidad) => (
                      <SelectItem key={localidad.id} value={localidad.id.toString()}>
                        {localidad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingParticipante ? "Actualizar" : "Crear"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="busqueda">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="busqueda"
                  placeholder="Nombre, apellido o DNI"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filtro-tipo">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deportista">Deportistas</SelectItem>
                  <SelectItem value="entrenador">Entrenadores</SelectItem>
                  <SelectItem value="delegado">Delegados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtro-localidad">Localidad</Label>
              <Select value={filtroLocalidad} onValueChange={setFiltroLocalidad}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las localidades" />
                </SelectTrigger>
                <SelectContent>
                  {localidades.map((localidad) => (
                    <SelectItem key={localidad.id} value={localidad.id.toString()}>
                      {localidad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de participantes */}
      <Card>
        <CardHeader>
          <CardTitle>Participantes ({participantesFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {participantesFiltrados.map((participante) => (
              <div key={participante.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {participante.nombre} {participante.apellido}
                      </h3>
                      <p className="text-sm text-gray-600">
                        DNI: {participante.dni} | {participante.localidad_nombre}
                      </p>
                      {participante.telefono && <p className="text-sm text-gray-600">Tel: {participante.telefono}</p>}
                    </div>
                    <Badge className={getTipoBadgeColor(participante.tipo)}>{participante.tipo}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(participante)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openDeleteModal(participante)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {participantesFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">No se encontraron participantes</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Participante"
        description={`¿Está seguro de que desea eliminar al participante "${deleteModal.participanteName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  )
}
