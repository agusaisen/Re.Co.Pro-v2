"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, X, Power } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiRequest } from "@/lib/api-client"
import { ConfirmationModal } from "@/components/confirmation-modal"

interface Disciplina {
  id: number
  nombre: string
  año_desde: number
  año_hasta: number
  cantidad_integrantes: number
  entrenadores: number
  delegados: number
  activa: boolean
  genero: "MASCULINO" | "FEMENINO"
}

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [message, setMessage] = useState("")
  const [newDisciplina, setNewDisciplina] = useState({
    nombre: "",
    año_desde: "",
    año_hasta: "",
    cantidad_integrantes: "",
    entrenadores: "",
    delegados: "",
    genero: "MASCULINO" as "MASCULINO" | "FEMENINO",
  })
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    disciplinaId: number | null
    disciplinaName: string
  }>({
    isOpen: false,
    disciplinaId: null,
    disciplinaName: "",
  })

  useEffect(() => {
    fetchDisciplinas()
  }, [])

  const fetchDisciplinas = async () => {
    try {
      const response = await apiRequest("/api/admin/disciplinas")

      if (response.ok) {
        const data = await response.json()
        setDisciplinas(data)
      }
    } catch (error) {
      console.error("Error fetching disciplinas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (disciplina: Disciplina) => {
    try {
      const response = await apiRequest(`/api/admin/disciplinas/${disciplina.id}`, {
        method: "PUT",
        body: JSON.stringify(disciplina),
      })

      if (response.ok) {
        setMessage("Disciplina actualizada correctamente")
        setEditingId(null)
        fetchDisciplinas()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error updating disciplina:", error)
    }
  }

  const handleAdd = async () => {
    try {
      const response = await apiRequest("/api/admin/disciplinas", {
        method: "POST",
        body: JSON.stringify({
          nombre: newDisciplina.nombre,
          año_desde: Number.parseInt(newDisciplina.año_desde),
          año_hasta: Number.parseInt(newDisciplina.año_hasta),
          cantidad_integrantes: Number.parseInt(newDisciplina.cantidad_integrantes),
          entrenadores: Number.parseInt(newDisciplina.entrenadores),
          delegados: Number.parseInt(newDisciplina.delegados),
          genero: newDisciplina.genero,
        }),
      })

      if (response.ok) {
        setMessage("Disciplina creada correctamente")
        setShowAddForm(false)
        setNewDisciplina({
          nombre: "",
          año_desde: "",
          año_hasta: "",
          cantidad_integrantes: "",
          entrenadores: "",
          delegados: "",
          genero: "MASCULINO",
        })
        fetchDisciplinas()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error creating disciplina:", error)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.disciplinaId) return

    try {
      const response = await apiRequest(`/api/admin/disciplinas/${deleteModal.disciplinaId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage("Disciplina eliminada correctamente")
        fetchDisciplinas()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error deleting disciplina:", error)
    }
  }

  const handleToggle = async (disciplina: Disciplina) => {
    try {
      const response = await apiRequest(`/api/admin/disciplinas/${disciplina.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...disciplina,
          activa: !disciplina.activa,
        }),
      })

      if (response.ok) {
        setMessage(`Disciplina ${!disciplina.activa ? "activada" : "desactivada"} correctamente`)
        fetchDisciplinas()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error toggling disciplina:", error)
    }
  }

  const openDeleteModal = (disciplina: Disciplina) => {
    setDeleteModal({
      isOpen: true,
      disciplinaId: disciplina.id,
      disciplinaName: disciplina.nombre,
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      disciplinaId: null,
      disciplinaName: "",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neuquen-primary">Gestión de Disciplinas</h1>
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
          <h1 className="text-3xl font-bold text-neuquen-primary">Gestión de Disciplinas</h1>
          <p className="text-gray-600 mt-2">Administrar disciplinas deportivas y sus configuraciones</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-neuquen-primary hover:bg-neuquen-primary/90 text-neuquen-secondary transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Disciplina
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
            <CardTitle>Nueva Disciplina</CardTitle>
            <CardDescription>Agregar una nueva disciplina deportiva</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={newDisciplina.nombre}
                  onChange={(e) => setNewDisciplina({ ...newDisciplina, nombre: e.target.value })}
                  placeholder="Ej: Voley"
                />
              </div>
              <div>
                <Label htmlFor="genero">Género</Label>
                <select
                  id="genero"
                  value={newDisciplina.genero}
                  onChange={(e) =>
                    setNewDisciplina({ ...newDisciplina, genero: e.target.value as "MASCULINO" | "FEMENINO" })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
              </div>
              <div>
                <Label htmlFor="año_desde">Año Desde</Label>
                <Input
                  id="año_desde"
                  type="number"
                  value={newDisciplina.año_desde}
                  onChange={(e) => setNewDisciplina({ ...newDisciplina, año_desde: e.target.value })}
                  placeholder="Ej: 1989"
                />
              </div>
              <div>
                <Label htmlFor="año_hasta">Año Hasta</Label>
                <Input
                  id="año_hasta"
                  type="number"
                  value={newDisciplina.año_hasta}
                  onChange={(e) => setNewDisciplina({ ...newDisciplina, año_hasta: e.target.value })}
                  placeholder="Ej: 2008"
                />
              </div>
              <div>
                <Label htmlFor="cantidad_integrantes">Deportistas</Label>
                <Input
                  id="cantidad_integrantes"
                  type="number"
                  value={newDisciplina.cantidad_integrantes}
                  onChange={(e) => setNewDisciplina({ ...newDisciplina, cantidad_integrantes: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="entrenadores">Entrenadores</Label>
                <Input
                  id="entrenadores"
                  type="number"
                  value={newDisciplina.entrenadores}
                  onChange={(e) => setNewDisciplina({ ...newDisciplina, entrenadores: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="delegados">Delegados</Label>
                <Input
                  id="delegados"
                  type="number"
                  value={newDisciplina.delegados}
                  onChange={(e) => setNewDisciplina({ ...newDisciplina, delegados: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleAdd}
                className="bg-neuquen-accent hover:bg-neuquen-accent/90 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="transition-all duration-200 hover:scale-[1.02]"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {disciplinas.map((disciplina) => (
          <Card key={disciplina.id}>
            <CardContent className="p-6">
              {editingId === disciplina.id ? (
                <EditDisciplinaForm disciplina={disciplina} onSave={handleSave} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neuquen-primary">{disciplina.nombre}</h3>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            disciplina.genero === "MASCULINO"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-pink-100 text-pink-800"
                          }`}
                        >
                          {disciplina.genero}
                        </span>
                        <span>
                          Años de nacimiento: {disciplina.año_desde} - {disciplina.año_hasta}
                        </span>
                        <span>Deportistas: {disciplina.cantidad_integrantes}</span>
                        <span>Entrenadores: {disciplina.entrenadores}</span>
                        <span>Delegados: {disciplina.delegados}</span>
                      </div>
                    </div>
                    <Badge variant={disciplina.activa ? "default" : "secondary"}>
                      {disciplina.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(disciplina)}
                      className={`transition-all duration-200 hover:scale-[1.05] ${
                        disciplina.activa
                          ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                      }`}
                      title={disciplina.activa ? "Desactivar disciplina" : "Activar disciplina"}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(disciplina.id)}
                      className="transition-all duration-200 hover:scale-[1.05]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(disciplina)}
                      className="text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-[1.05] hover:bg-red-50"
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
        title="Eliminar Disciplina"
        description={`¿Está seguro de que desea eliminar la disciplina "${deleteModal.disciplinaName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  )
}

function EditDisciplinaForm({
  disciplina,
  onSave,
  onCancel,
}: {
  disciplina: Disciplina
  onSave: (disciplina: Disciplina) => void
  onCancel: () => void
}) {
  const [editData, setEditData] = useState(disciplina)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="edit-nombre">Nombre</Label>
          <Input
            id="edit-nombre"
            value={editData.nombre}
            onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-genero">Género</Label>
          <select
            id="edit-genero"
            value={editData.genero}
            onChange={(e) => setEditData({ ...editData, genero: e.target.value as "MASCULINO" | "FEMENINO" })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
          </select>
        </div>
        <div>
          <Label htmlFor="edit-año-desde">Año Desde</Label>
          <Input
            id="edit-año-desde"
            type="number"
            value={editData.año_desde}
            onChange={(e) => setEditData({ ...editData, año_desde: Number.parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="edit-año-hasta">Año Hasta</Label>
          <Input
            id="edit-año-hasta"
            type="number"
            value={editData.año_hasta}
            onChange={(e) => setEditData({ ...editData, año_hasta: Number.parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="edit-integrantes">Deportistas</Label>
          <Input
            id="edit-integrantes"
            type="number"
            value={editData.cantidad_integrantes}
            onChange={(e) => setEditData({ ...editData, cantidad_integrantes: Number.parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="edit-entrenadores">Entrenadores</Label>
          <Input
            id="edit-entrenadores"
            type="number"
            value={editData.entrenadores}
            onChange={(e) => setEditData({ ...editData, entrenadores: Number.parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="edit-delegados">Delegados</Label>
          <Input
            id="edit-delegados"
            type="number"
            value={editData.delegados}
            onChange={(e) => setEditData({ ...editData, delegados: Number.parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSave(editData)}
          className="bg-neuquen-accent hover:bg-neuquen-accent/90 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
        >
          <Save className="mr-2 h-4 w-4" />
          Guardar
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="transition-all duration-200 hover:scale-[1.02] bg-transparent"
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}
