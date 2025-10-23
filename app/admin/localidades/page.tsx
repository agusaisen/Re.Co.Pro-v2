"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiRequest } from "@/lib/api-client"
import { ConfirmationModal } from "@/components/confirmation-modal"

interface Localidad {
  id: number
  nombre: string
  region: string | null
  activa: boolean
}

export default function LocalidadesPage() {
  const [localidades, setLocalidades] = useState<Localidad[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [message, setMessage] = useState("")
  const [newLocalidad, setNewLocalidad] = useState({
    nombre: "",
    region: "",
  })
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    localidadId: number | null
    localidadName: string
  }>({
    isOpen: false,
    localidadId: null,
    localidadName: "",
  })

  useEffect(() => {
    fetchLocalidades()
  }, [])

  const fetchLocalidades = async () => {
    try {
      const response = await apiRequest("/api/admin/localidades")

      if (response.ok) {
        const data = await response.json()
        setLocalidades(data)
      }
    } catch (error) {
      console.error("Error fetching localidades:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (localidad: Localidad) => {
    try {
      const response = await apiRequest(`/api/admin/localidades/${localidad.id}`, {
        method: "PUT",
        body: JSON.stringify(localidad),
      })

      if (response.ok) {
        setMessage("Localidad actualizada correctamente")
        setEditingId(null)
        fetchLocalidades()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error updating localidad:", error)
    }
  }

  const handleAdd = async () => {
    try {
      const response = await apiRequest("/api/admin/localidades", {
        method: "POST",
        body: JSON.stringify({
          nombre: newLocalidad.nombre,
          region: newLocalidad.region || null,
        }),
      })

      if (response.ok) {
        setMessage("Localidad creada correctamente")
        setShowAddForm(false)
        setNewLocalidad({ nombre: "", region: "" })
        fetchLocalidades()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error creating localidad:", error)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.localidadId) return

    try {
      const response = await apiRequest(`/api/admin/localidades/${deleteModal.localidadId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage("Localidad eliminada correctamente")
        fetchLocalidades()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error deleting localidad:", error)
    }
  }

  const openDeleteModal = (localidad: Localidad) => {
    setDeleteModal({
      isOpen: true,
      localidadId: localidad.id,
      localidadName: localidad.nombre,
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      localidadId: null,
      localidadName: "",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neuquen-primary">Gestión de Localidades</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neuquen-primary">Gestión de Localidades</h1>
          <p className="text-gray-600 mt-2">Administrar localidades participantes en los juegos regionales</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-neuquen-primary hover:bg-neuquen-primary/90 text-neuquen-secondary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Localidad
        </Button>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Localidad</CardTitle>
            <CardDescription>Agregar una nueva localidad participante</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Localidad</Label>
                <Input
                  id="nombre"
                  value={newLocalidad.nombre}
                  onChange={(e) => setNewLocalidad({ ...newLocalidad, nombre: e.target.value })}
                  placeholder="Ej: Neuquén Capital"
                />
              </div>
              <div>
                <Label htmlFor="region">Región</Label>
                <select
                  id="region"
                  value={newLocalidad.region}
                  onChange={(e) => setNewLocalidad({ ...newLocalidad, region: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Seleccionar región</option>
                  <option value="Región del Limay">Región del Limay</option>
                  <option value="Región Alto de Neuquén">Región Alto de Neuquén</option>
                  <option value="Región del Pehuén">Región del Pehuén</option>
                  <option value="Región de los Lagos del Sur">Región de los Lagos del Sur</option>
                  <option value="Región de la Comarca">Región de la Comarca</option>
                  <option value="Región Confluencia">Región Confluencia</option>
                  <option value="Región Vaca Muerta">Región Vaca Muerta</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd} className="bg-neuquen-accent hover:bg-neuquen-accent/90">
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {localidades.map((localidad) => (
          <Card key={localidad.id}>
            <CardContent className="p-6">
              {editingId === localidad.id ? (
                <EditLocalidadForm localidad={localidad} onSave={handleSave} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neuquen-primary">{localidad.nombre}</h3>
                      {localidad.region && <p className="text-sm text-gray-600 mt-1">{localidad.region}</p>}
                    </div>
                    <Badge variant={localidad.activa ? "default" : "secondary"}>
                      {localidad.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(localidad.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(localidad)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Localidad"
        description={`¿Está seguro de que desea eliminar la localidad "${deleteModal.localidadName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  )
}

function EditLocalidadForm({
  localidad,
  onSave,
  onCancel,
}: {
  localidad: Localidad
  onSave: (localidad: Localidad) => void
  onCancel: () => void
}) {
  const [editData, setEditData] = useState(localidad)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="edit-nombre">Nombre de la Localidad</Label>
          <Input
            id="edit-nombre"
            value={editData.nombre}
            onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-region">Región</Label>
          <select
            id="edit-region"
            value={editData.region || ""}
            onChange={(e) => setEditData({ ...editData, region: e.target.value || null })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Seleccionar región</option>
            <option value="Región del Limay">Región del Limay</option>
            <option value="Región Alto de Neuquén">Región Alto de Neuquén</option>
            <option value="Región del Pehuén">Región del Pehuén</option>
            <option value="Región de los Lagos del Sur">Región de los Lagos del Sur</option>
            <option value="Región de la Comarca">Región de la Comarca</option>
            <option value="Región Confluencia">Región Confluencia</option>
            <option value="Región Vaca Muerta">Región Vaca Muerta</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(editData)} className="bg-neuquen-accent hover:bg-neuquen-accent/90">
          <Save className="mr-2 h-4 w-4" />
          Guardar
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}
