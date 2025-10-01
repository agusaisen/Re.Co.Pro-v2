"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, X, Eye, EyeOff, Edit } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiRequest } from "@/lib/api-client"
import { ConfirmationModal } from "@/components/confirmation-modal"

interface Usuario {
  id: number
  email: string
  nombre: string
  apellido: string
  dni: string
  rol: string
  localidad_id: number | null
  localidad_nombre: string | null
  activo: boolean
}

interface Localidad {
  id: number
  nombre: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [localidades, setLocalidades] = useState<Localidad[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [newUsuario, setNewUsuario] = useState({
    email: "",
    nombre: "",
    apellido: "",
    dni: "",
    password: "",
    rol: "gestor",
    localidad_id: null,
  })
  const [editingUsuario, setEditingUsuario] = useState({
    email: "",
    nombre: "",
    apellido: "",
    dni: "",
    password: "",
    rol: "",
    localidad_id: null,
  })

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    userId: number | null
    userName: string
  }>({
    isOpen: false,
    userId: null,
    userName: "",
  })

  useEffect(() => {
    fetchUsuarios()
    fetchLocalidades()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const response = await apiRequest("/api/admin/usuarios")

      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error("Error fetching usuarios:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocalidades = async () => {
    try {
      const response = await apiRequest("/api/admin/localidades")

      if (response.ok) {
        const data = await response.json()
        setLocalidades(data)
      }
    } catch (error) {
      console.error("Error fetching localidades:", error)
    }
  }

  const handleAdd = async () => {
    if (newUsuario.rol === "gestor" && !newUsuario.localidad_id) {
      setMessage("La localidad es obligatoria para usuarios con rol de gestor")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    try {
      const response = await apiRequest("/api/admin/usuarios", {
        method: "POST",
        body: JSON.stringify({
          email: newUsuario.email,
          nombre: newUsuario.nombre,
          apellido: newUsuario.apellido,
          dni: newUsuario.dni,
          password: newUsuario.password,
          rol: newUsuario.rol,
          localidad_id: newUsuario.localidad_id,
        }),
      })

      if (response.ok) {
        setMessage("Usuario creado correctamente")
        setShowAddForm(false)
        setNewUsuario({
          email: "",
          nombre: "",
          apellido: "",
          dni: "",
          password: "",
          rol: "gestor",
          localidad_id: null,
        })
        fetchUsuarios()
        setTimeout(() => setMessage(""), 3000)
      } else {
        const error = await response.json()
        setMessage(error.error || "Error al crear usuario")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error creating usuario:", error)
      setMessage("Error al crear usuario")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.userId) return

    try {
      const response = await apiRequest(`/api/admin/usuarios/${deleteModal.userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage("Usuario eliminado correctamente")
        fetchUsuarios()
        setTimeout(() => setMessage(""), 3000)
      } else {
        const error = await response.json()
        setMessage(error.error || "Error al eliminar usuario")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error deleting usuario:", error)
      setMessage("Error al eliminar usuario")
      setTimeout(() => setMessage(""), 3000)
    }

    closeDeleteModal()
  }

  const toggleUserStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await apiRequest(`/api/admin/usuarios/${id}`, {
        method: "PUT",
        body: JSON.stringify({ activo: !currentStatus }),
      })

      if (response.ok) {
        setMessage(`Usuario ${!currentStatus ? "activado" : "desactivado"} correctamente`)
        fetchUsuarios()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error updating usuario:", error)
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingId(usuario.id)
    setEditingUsuario({
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      password: "",
      rol: usuario.rol,
      localidad_id: usuario.localidad_id,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    if (editingUsuario.rol === "gestor" && !editingUsuario.localidad_id) {
      setMessage("La localidad es obligatoria para usuarios con rol de gestor")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    try {
      const response = await apiRequest(`/api/admin/usuarios/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          email: editingUsuario.email,
          nombre: editingUsuario.nombre,
          apellido: editingUsuario.apellido,
          dni: editingUsuario.dni,
          password: editingUsuario.password,
          rol: editingUsuario.rol,
          localidad_id: editingUsuario.localidad_id,
        }),
      })

      if (response.ok) {
        setMessage("Usuario actualizado correctamente")
        setEditingId(null)
        setEditingUsuario({
          email: "",
          nombre: "",
          apellido: "",
          dni: "",
          password: "",
          rol: "",
          localidad_id: null,
        })
        fetchUsuarios()
        setTimeout(() => setMessage(""), 3000)
      } else {
        const error = await response.json()
        setMessage(error.error || "Error al actualizar usuario")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error updating usuario:", error)
      setMessage("Error al actualizar usuario")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingUsuario({
      email: "",
      nombre: "",
      apellido: "",
      dni: "",
      password: "",
      rol: "",
      localidad_id: null,
    })
  }

  const openDeleteModal = (usuario: Usuario) => {
    setDeleteModal({
      isOpen: true,
      userId: usuario.id,
      userName: `${usuario.nombre} ${usuario.apellido}`,
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      userId: null,
      userName: "",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neuquen-primary">Gestión de Usuarios</h1>
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
          <h1 className="text-3xl font-bold text-neuquen-primary">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">Administrar usuarios del sistema (gestores y administradores)</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-neuquen-primary hover:bg-neuquen-primary/90 text-neuquen-secondary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Usuario
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
            <CardTitle>Nuevo Usuario</CardTitle>
            <CardDescription>Crear un nuevo usuario del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUsuario.email}
                  onChange={(e) => setNewUsuario({ ...newUsuario, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={newUsuario.nombre}
                  onChange={(e) => setNewUsuario({ ...newUsuario, nombre: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={newUsuario.apellido}
                  onChange={(e) => setNewUsuario({ ...newUsuario, apellido: e.target.value })}
                  placeholder="Pérez"
                />
              </div>
              <div>
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={newUsuario.dni}
                  onChange={(e) => setNewUsuario({ ...newUsuario, dni: e.target.value })}
                  placeholder="12345678"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={newUsuario.password}
                    onChange={(e) => setNewUsuario({ ...newUsuario, password: e.target.value })}
                    placeholder="Contraseña segura"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="rol">Rol</Label>
                <Select value={newUsuario.rol} onValueChange={(value) => setNewUsuario({ ...newUsuario, rol: value })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="localidad">
                  Localidad {newUsuario.rol === "gestor" && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={newUsuario.localidad_id?.toString() || "0"}
                  onValueChange={(value) =>
                    setNewUsuario({ ...newUsuario, localidad_id: value === "0" ? null : Number.parseInt(value) })
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar localidad" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="0">Sin localidad</SelectItem>
                    {localidades.map((localidad) => (
                      <SelectItem key={localidad.id} value={localidad.id.toString()}>
                        {localidad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        {usuarios.map((usuario) => (
          <Card key={usuario.id}>
            <CardContent className="p-6">
              {editingId === usuario.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`edit-email-${usuario.id}`}>Email</Label>
                      <Input
                        id={`edit-email-${usuario.id}`}
                        type="email"
                        value={editingUsuario.email}
                        onChange={(e) => setEditingUsuario({ ...editingUsuario, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-nombre-${usuario.id}`}>Nombre</Label>
                      <Input
                        id={`edit-nombre-${usuario.id}`}
                        value={editingUsuario.nombre}
                        onChange={(e) => setEditingUsuario({ ...editingUsuario, nombre: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-apellido-${usuario.id}`}>Apellido</Label>
                      <Input
                        id={`edit-apellido-${usuario.id}`}
                        value={editingUsuario.apellido}
                        onChange={(e) => setEditingUsuario({ ...editingUsuario, apellido: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-dni-${usuario.id}`}>DNI</Label>
                      <Input
                        id={`edit-dni-${usuario.id}`}
                        value={editingUsuario.dni}
                        onChange={(e) => setEditingUsuario({ ...editingUsuario, dni: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-password-${usuario.id}`}>Nueva Contraseña (opcional)</Label>
                      <div className="relative">
                        <Input
                          id={`edit-password-${usuario.id}`}
                          type={showPassword ? "text" : "password"}
                          value={editingUsuario.password}
                          onChange={(e) => setEditingUsuario({ ...editingUsuario, password: e.target.value })}
                          placeholder="Dejar vacío para mantener actual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`edit-rol-${usuario.id}`}>Rol</Label>
                      <Select
                        value={editingUsuario.rol}
                        onValueChange={(value) => setEditingUsuario({ ...editingUsuario, rol: value })}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`edit-localidad-${usuario.id}`}>
                        Localidad {editingUsuario.rol === "gestor" && <span className="text-red-500">*</span>}
                      </Label>
                      <Select
                        value={editingUsuario.localidad_id?.toString() || "0"}
                        onValueChange={(value) =>
                          setEditingUsuario({
                            ...editingUsuario,
                            localidad_id: value === "0" ? null : Number.parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Seleccionar localidad" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="0">Sin localidad</SelectItem>
                          {localidades.map((localidad) => (
                            <SelectItem key={localidad.id} value={localidad.id.toString()}>
                              {localidad.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="bg-neuquen-accent hover:bg-neuquen-accent/90">
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neuquen-primary">
                        {usuario.nombre} {usuario.apellido}
                      </h3>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>{usuario.email}</span>
                        <span>• DNI: {usuario.dni}</span>
                        {usuario.localidad_nombre && <span>• {usuario.localidad_nombre}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={usuario.rol === "administrador" ? "default" : "secondary"}
                        className={usuario.rol === "gestor" ? "bg-yellow-500 text-white hover:bg-yellow-600" : ""}
                      >
                        {usuario.rol}
                      </Badge>
                      <Badge variant={usuario.activo ? "default" : "destructive"}>
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(usuario)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserStatus(usuario.id, usuario.activo)}
                      className={
                        usuario.activo ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
                      }
                    >
                      {usuario.activo ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(usuario)}
                      disabled={usuario.email === "aaisen@neuquen.gov.ar"}
                      className={
                        usuario.email === "aaisen@neuquen.gov.ar"
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-700"
                      }
                      title={usuario.email === "aaisen@neuquen.gov.ar" ? "Este usuario no puede ser eliminado" : ""}
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
        title="Eliminar Usuario"
        description={`¿Está seguro de que desea eliminar al usuario "${deleteModal.userName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  )
}
