"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Users, AlertCircle, UserCheck, Shield, Upload, FileText, X } from "lucide-react"
import { Trophy } from "lucide-react"
import { apiRequest } from "@/lib/api-client"

interface Disciplina {
  id: number
  nombre: string
  año_desde: number
  año_hasta: number
  cantidad_integrantes: number
  entrenadores: number
  delegados: number
  genero: "MASCULINO" | "FEMENINO"
}

interface Participante {
  dni: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  genero: "MASCULINO" | "FEMENINO"
  tipo: "deportista" | "entrenador" | "delegado"
  telefono?: string
  email?: string
  edad?: number
  isExisting?: boolean
  documentos?: File[]
  documentosTitulos?: string[]
}

export default function InscribirEquipoPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null)
  const [nombreEquipo, setNombreEquipo] = useState("")
  const [deportistas, setDeportistas] = useState<Participante[]>([])
  const [entrenadores, setEntrenadores] = useState<Participante[]>([])
  const [delegados, setDelegados] = useState<Participante[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [dniErrors, setDniErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchDisciplinas()
  }, [])

  const fetchDisciplinas = async () => {
    try {
      const response = await apiRequest("/api/gestor/disciplinas-disponibles")
      if (response.ok) {
        const data = await response.json()
        setDisciplinas(data)
      } else {
        setError("Error al cargar las disciplinas disponibles")
      }
    } catch (error) {
      console.error("Error fetching disciplinas:", error)
      setError("Error de conexión al cargar disciplinas")
    }
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

  const buscarParticipantePorDNI = async (dni: string): Promise<Participante | null> => {
    try {
      const response = await apiRequest(`/api/gestor/participante/${dni}`)
      if (response.ok) {
        const data = await response.json()
        return {
          ...data,
          isExisting: true,
          edad: calcularEdad(data.fecha_nacimiento),
        }
      }
    } catch (error) {
      console.error("Error buscando participante:", error)
    }
    return null
  }

  const agregarDeportista = () => {
    if (!selectedDisciplina || deportistas.length >= selectedDisciplina.cantidad_integrantes) {
      setError(`No puedes agregar más de ${selectedDisciplina?.cantidad_integrantes} deportistas`)
      return
    }
    const defaultGender = selectedDisciplina.genero || "MASCULINO"
    setDeportistas([
      ...deportistas,
      {
        dni: "",
        nombre: "",
        apellido: "",
        fecha_nacimiento: "",
        genero: defaultGender,
        tipo: "deportista",
        documentos: [],
        documentosTitulos: [],
      },
    ])
  }

  const agregarEntrenador = () => {
    if (!selectedDisciplina || entrenadores.length >= selectedDisciplina.entrenadores) {
      setError(`No puedes agregar más de ${selectedDisciplina?.entrenadores} entrenadores`)
      return
    }
    const defaultGender = selectedDisciplina.genero || "MASCULINO"
    setEntrenadores([
      ...entrenadores,
      { dni: "", nombre: "", apellido: "", fecha_nacimiento: "", genero: defaultGender, tipo: "entrenador" },
    ])
  }

  const agregarDelegado = () => {
    if (!selectedDisciplina || delegados.length >= selectedDisciplina.delegados) {
      setError(`No puedes agregar más de ${selectedDisciplina?.delegados} delegados`)
      return
    }
    const defaultGender = selectedDisciplina.genero || "MASCULINO"
    setDelegados([
      ...delegados,
      { dni: "", nombre: "", apellido: "", fecha_nacimiento: "", genero: defaultGender, tipo: "delegado" },
    ])
  }

  const actualizarParticipante = async (
    tipo: "deportista" | "entrenador" | "delegado",
    index: number,
    campo: string,
    valor: string,
  ) => {
    const getArray = () => {
      switch (tipo) {
        case "deportista":
          return deportistas
        case "entrenador":
          return entrenadores
        case "delegado":
          return delegados
      }
    }

    const setArray = (newArray: Participante[]) => {
      switch (tipo) {
        case "deportista":
          setDeportistas(newArray)
          break
        case "entrenador":
          setEntrenadores(newArray)
          break
        case "delegado":
          setDelegados(newArray)
          break
      }
    }

    const array = [...getArray()]
    array[index] = { ...array[index], [campo]: valor }

    if (campo === "dni" && valor.length >= 8 && /^\d+$/.test(valor)) {
      const errorKey = `${tipo}-${index}`
      setDniErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })

      const existente = await buscarParticipantePorDNI(valor)
      if (existente) {
        if (tipo === "deportista" && selectedDisciplina) {
          if (existente.genero !== selectedDisciplina.genero) {
            setDniErrors((prev) => ({
              ...prev,
              [errorKey]: `Este participante tiene género ${existente.genero.toLowerCase()}, pero la disciplina requiere ${selectedDisciplina.genero.toLowerCase()}`,
            }))
            array[index].isExisting = false
            setArray(array)
            return
          }
        }

        const preservedDocs =
          tipo === "deportista"
            ? {
                documentos: array[index].documentos || [],
                documentosTitulos: array[index].documentosTitulos || [],
              }
            : {}

        let fechaNacimiento = existente.fecha_nacimiento
        if (fechaNacimiento) {
          fechaNacimiento = fechaNacimiento.split("T")[0]
        }

        array[index] = {
          ...existente,
          fecha_nacimiento: fechaNacimiento,
          tipo,
          ...preservedDocs,
        }

        if (fechaNacimiento) {
          array[index].edad = calcularEdad(fechaNacimiento)
        }
      } else {
        array[index].isExisting = false
      }
    }

    if (campo === "fecha_nacimiento" && valor) {
      array[index].edad = calcularEdad(valor)
    }

    setArray(array)
  }

  const eliminarParticipante = (tipo: "deportista" | "entrenador" | "delegado", index: number) => {
    switch (tipo) {
      case "deportista":
        setDeportistas(deportistas.filter((_, i) => i !== index))
        break
      case "entrenador":
        setEntrenadores(entrenadores.filter((_, i) => i !== index))
        break
      case "delegado":
        setDelegados(delegados.filter((_, i) => i !== index))
        break
    }
  }

  const agregarDocumentoDeportista = (index: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const maxSize = 4.5 * 1024 * 1024
        if (file.size > maxSize) {
          setError("El archivo es demasiado grande. El tamaño máximo permitido es 4.5MB")
          return
        }

        const titulo = prompt("Ingrese un título para el documento:")
        if (titulo && titulo.trim()) {
          const newDeportistas = [...deportistas]
          if (!newDeportistas[index].documentos) {
            newDeportistas[index].documentos = []
            newDeportistas[index].documentosTitulos = []
          }
          newDeportistas[index].documentos!.push(file)
          newDeportistas[index].documentosTitulos!.push(titulo.trim())
          setDeportistas(newDeportistas)
        }
      }
    }
    input.click()
  }

  const eliminarDocumentoDeportista = (deportistaIndex: number, documentoIndex: number) => {
    const newDeportistas = [...deportistas]
    newDeportistas[deportistaIndex].documentos!.splice(documentoIndex, 1)
    newDeportistas[deportistaIndex].documentosTitulos!.splice(documentoIndex, 1)
    setDeportistas(newDeportistas)
  }

  const validarFormulario = (): string[] => {
    const errores: string[] = []

    if (!selectedDisciplina) {
      errores.push("Debe seleccionar una disciplina")
    }

    if (!nombreEquipo.trim()) {
      errores.push("Debe ingresar un nombre para el equipo")
    }

    if (selectedDisciplina) {
      if (deportistas.length === 0) {
        errores.push("Debe tener al menos 1 deportista")
      }
      if (deportistas.length > selectedDisciplina.cantidad_integrantes) {
        errores.push(`No puede tener más de ${selectedDisciplina.cantidad_integrantes} deportistas`)
      }

      if (selectedDisciplina.entrenadores > 0 && entrenadores.length === 0) {
        errores.push("Debe tener al menos 1 entrenador/a")
      }
      if (entrenadores.length > selectedDisciplina.entrenadores) {
        errores.push(`No puede tener más de ${selectedDisciplina.entrenadores} entrenadores/as`)
      }

      if (selectedDisciplina.delegados > 0 && delegados.length === 0) {
        errores.push("Debe tener al menos 1 delegado/a")
      }
      if (delegados.length > selectedDisciplina.delegados) {
        errores.push(`No puede tener más de ${selectedDisciplina.delegados} delegados/as`)
      }

      deportistas.forEach((deportista, index) => {
        if (
          !deportista.dni ||
          !deportista.nombre ||
          !deportista.apellido ||
          !deportista.fecha_nacimiento ||
          !deportista.genero
        ) {
          errores.push(`Deportista ${index + 1}: Todos los campos son obligatorios`)
        }

        if (deportista.genero && selectedDisciplina.genero && deportista.genero !== selectedDisciplina.genero) {
          errores.push(
            `Deportista ${index + 1}: El género debe ser ${selectedDisciplina.genero.toLowerCase()} para esta disciplina`,
          )
        }

        if (deportista.fecha_nacimiento) {
          const fechaParts = deportista.fecha_nacimiento.split("-")
          const añoNacimiento = Number.parseInt(fechaParts[0], 10)
          if (añoNacimiento < selectedDisciplina.año_desde || añoNacimiento > selectedDisciplina.año_hasta) {
            errores.push(
              `Deportista ${index + 1}: Año de nacimiento ${añoNacimiento} no está en el rango permitido (${selectedDisciplina.año_desde}-${selectedDisciplina.año_hasta})`,
            )
          }
        }
      })

      entrenadores.forEach((entrenador, index) => {
        if (
          !entrenador.dni ||
          !entrenador.nombre ||
          !entrenador.apellido ||
          !entrenador.fecha_nacimiento ||
          !entrenador.genero
        ) {
          errores.push(`Entrenador ${index + 1}: Todos los campos son obligatorios`)
        }
        if (entrenador.edad !== undefined && entrenador.edad < 21) {
          errores.push(`Entrenador ${index + 1}: Debe ser mayor de 21 años (edad actual: ${entrenador.edad})`)
        }
      })

      delegados.forEach((delegado, index) => {
        if (!delegado.dni || !delegado.nombre || !delegado.apellido || !delegado.fecha_nacimiento || !delegado.genero) {
          errores.push(`Delegado ${index + 1}: Todos los campos son obligatorios`)
        }
        if (delegado.edad !== undefined && delegado.edad < 21) {
          errores.push(`Delegado ${index + 1}: Debe ser mayor de 21 años (edad actual: ${delegado.edad})`)
        }
      })
    }

    const allParticipants = [...deportistas, ...entrenadores, ...delegados]
    const dnis = allParticipants.map((p) => p.dni).filter((dni) => dni)
    const dnisDuplicados = dnis.filter((dni, index) => dnis.indexOf(dni) !== index)
    if (dnisDuplicados.length > 0) {
      errores.push("No puede haber DNIs duplicados en el mismo equipo")
    }

    return errores
  }

  const hasParticipantError = (
    participant: Participante,
    tipo: "deportista" | "entrenador" | "delegado",
    index: number,
  ): boolean => {
    if (!selectedDisciplina) return false

    if (
      !participant.dni ||
      !participant.nombre ||
      !participant.apellido ||
      !participant.fecha_nacimiento ||
      !participant.genero
    ) {
      return true
    }

    if ((tipo === "entrenador" || tipo === "delegado") && participant.edad !== undefined && participant.edad < 21) {
      return true
    }

    if (
      tipo === "deportista" &&
      participant.genero &&
      selectedDisciplina.genero &&
      participant.genero !== selectedDisciplina.genero
    ) {
      return true
    }

    if (tipo === "deportista" && participant.fecha_nacimiento) {
      const fechaParts = participant.fecha_nacimiento.split("-")
      const añoNacimiento = Number.parseInt(fechaParts[0], 10)
      if (añoNacimiento < selectedDisciplina.año_desde || añoNacimiento > selectedDisciplina.año_hasta) {
        return true
      }
    }

    const allParticipants = [...deportistas, ...entrenadores, ...delegados]
    const dnis = allParticipants.map((p) => p.dni).filter((dni) => dni)
    const currentDni = participant.dni
    if (currentDni && dnis.filter((dni) => dni === currentDni).length > 1) {
      return true
    }

    return false
  }

  const handleSubmit = async () => {
    setError("")
    setMessage("")

    const errores = validarFormulario()
    if (errores.length > 0) {
      setError(errores.join(". "))
      return
    }

    setLoading(true)

    try {
      const allParticipants = [...deportistas, ...entrenadores, ...delegados]
      const response = await apiRequest("/api/gestor/equipos", {
        method: "POST",
        body: JSON.stringify({
          disciplina_id: selectedDisciplina!.id,
          nombre_equipo: nombreEquipo,
          participantes: allParticipants,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const equipoId = data.equipoId

        for (let i = 0; i < deportistas.length; i++) {
          const deportista = deportistas[i]
          if (deportista.documentos && deportista.documentos.length > 0) {
            const equipoResponse = await apiRequest(`/api/gestor/equipos/${equipoId}`)
            if (equipoResponse.ok) {
              const equipoData = await equipoResponse.json()
              const participanteCreado = equipoData.participantes.find(
                (p: any) => p.dni === deportista.dni && p.tipo === "deportista",
              )

              if (participanteCreado) {
                for (let j = 0; j < deportista.documentos.length; j++) {
                  const formData = new FormData()
                  formData.append("file", deportista.documentos[j])
                  formData.append("titulo", deportista.documentosTitulos![j])

                  await apiRequest(`/api/gestor/participantes/${participanteCreado.id}/documentos`, {
                    method: "POST",
                    body: formData,
                  })
                }
              }
            }
          }
        }

        setMessage("Equipo inscripto correctamente con documentos")
        setSelectedDisciplina(null)
        setNombreEquipo("")
        setDeportistas([])
        setEntrenadores([])
        setDelegados([])
        setTimeout(() => {
          window.location.href = "/gestor/equipos"
        }, 2000)
      } else {
        setError(data.error || "Error al inscribir el equipo")
      }
    } catch (error) {
      setError("Error de conexión. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const renderParticipantForm = (
    participants: Participante[],
    tipo: "deportista" | "entrenador" | "delegado",
    maxCount: number,
    onAdd: () => void,
    icon: React.ReactNode,
    title: string,
    ageValidation?: { min: number; max: number },
  ) => (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title} ({participants.length}/{maxCount})
          </CardTitle>
          <CardDescription>
            {tipo === "deportista"
              ? `Años de nacimiento: ${selectedDisciplina?.año_desde}-${selectedDisciplina?.año_hasta}`
              : "Debe ser mayor de 21 años"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {participants.map((participant, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg space-y-4 ${
                hasParticipantError(participant, tipo, index) ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium">
                  {title.slice(0, -1)} {index + 1}
                  {hasParticipantError(participant, tipo, index) && (
                    <AlertCircle className="inline-block h-4 w-4 text-red-500 ml-2" />
                  )}
                </h4>
                <div className="flex items-center gap-2">
                  {participant.isExisting && <Badge variant="secondary">Datos existentes</Badge>}
                  {participant.edad !== undefined && (
                    <Badge
                      variant={
                        tipo === "deportista"
                          ? (() => {
                              const fechaParts = participant.fecha_nacimiento.split("-")
                              const añoNacimiento = Number.parseInt(fechaParts[0], 10)
                              return añoNacimiento >= selectedDisciplina!.año_desde &&
                                añoNacimiento <= selectedDisciplina!.año_hasta
                                ? "default"
                                : "destructive"
                            })()
                          : participant.edad >= 21
                            ? "default"
                            : "destructive"
                      }
                    >
                      {participant.edad} años
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarParticipante(tipo, index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>DNI</Label>
                  <Input
                    value={participant.dni}
                    onChange={(e) => actualizarParticipante(tipo, index, "dni", e.target.value)}
                    placeholder="12345678"
                    maxLength={8}
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                  {dniErrors[`${tipo}-${index}`] && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600">{dniErrors[`${tipo}-${index}`]}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Fecha de Nacimiento</Label>
                  <Input
                    type="date"
                    value={participant.fecha_nacimiento}
                    onChange={(e) => actualizarParticipante(tipo, index, "fecha_nacimiento", e.target.value)}
                    disabled={participant.isExisting}
                  />
                </div>
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={participant.nombre}
                    onChange={(e) => actualizarParticipante(tipo, index, "nombre", e.target.value)}
                    placeholder="Juan"
                    disabled={participant.isExisting}
                  />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input
                    value={participant.apellido}
                    onChange={(e) => actualizarParticipante(tipo, index, "apellido", e.target.value)}
                    placeholder="Pérez"
                    disabled={participant.isExisting}
                  />
                </div>
                <div>
                  <Label>Género</Label>
                  <Select
                    value={participant.genero}
                    onValueChange={(value: "MASCULINO" | "FEMENINO") =>
                      actualizarParticipante(tipo, index, "genero", value)
                    }
                    disabled={participant.isExisting}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="MASCULINO">Masculino</SelectItem>
                      <SelectItem value="FEMENINO">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tipo === "deportista" && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Documentos del Deportista</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => agregarDocumentoDeportista(index)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Subir Documento
                    </Button>
                  </div>

                  {participant.documentos && participant.documentos.length > 0 ? (
                    <div className="space-y-2">
                      {participant.documentos.map((doc, docIndex) => (
                        <div
                          key={docIndex}
                          className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                {participant.documentosTitulos![docIndex]}
                              </p>
                              <p className="text-xs text-blue-600">
                                {doc.name} ({(doc.size / 1024).toFixed(1)} KB)
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarDocumentoDeportista(index, docIndex)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      No hay documentos cargados. Los documentos son opcionales pero recomendados.
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Formatos permitidos: PDF, JPG, PNG, DOC, DOCX. Tamaño máximo: 4.5MB por archivo.
                  </p>
                </div>
              )}
            </div>
          ))}

          {participants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {icon}
              <p>
                No hay {title}
                {title === "Entrenadores" ? "/as" : title === "Delegados" ? "/as" : ""} agregados
              </p>
              <p className="text-sm">Haz clic en "Agregar" para comenzar</p>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Button
              onClick={onAdd}
              disabled={participants.length >= maxCount}
              className="bg-neuquen-accent hover:bg-neuquen-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar {title.slice(0, -1)}
              {title === "Entrenadores" ? "/a" : title === "Delegados" ? "/a" : ""}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neuquen-primary">Inscribir Equipo</h1>
        <p className="text-gray-600 mt-2">Registra un nuevo equipo para los Juegos Regionales</p>
      </div>

      {message && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Disciplina Deportiva
              </CardTitle>
              <CardDescription>Selecciona la disciplina para tu equipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="disciplina">Disciplina</Label>
                <Select
                  onValueChange={(value) => {
                    const disciplina = disciplinas.find((d) => d.id.toString() === value)
                    setSelectedDisciplina(disciplina || null)
                    setDeportistas([])
                    setEntrenadores([])
                    setDelegados([])
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecciona una disciplina" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {disciplinas.map((disciplina) => (
                      <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                        {disciplina.nombre} ({disciplina.cantidad_integrantes} deportistas, {disciplina.entrenadores}{" "}
                        entrenadores, {disciplina.delegados} delegados)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDisciplina && (
                <div className="p-4 bg-neuquen-accent/10 rounded-lg">
                  <h4 className="font-medium text-neuquen-primary mb-2">Información de la disciplina:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Género:</span>{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedDisciplina.genero === "MASCULINO"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-pink-100 text-pink-800"
                        }`}
                      >
                        {selectedDisciplina.genero}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Deportistas:</span> {selectedDisciplina.cantidad_integrantes} (
                      {selectedDisciplina.año_desde}-{selectedDisciplina.año_hasta})
                    </div>
                    <div>
                      <span className="font-medium">Entrenadores:</span> {selectedDisciplina.entrenadores} (21+ años)
                    </div>
                    <div>
                      <span className="font-medium">Delegados:</span> {selectedDisciplina.delegados} (21+ años)
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="nombre-equipo">Nombre del Equipo (Opcional)</Label>
                <Input
                  id="nombre-equipo"
                  value={nombreEquipo}
                  onChange={(e) => setNombreEquipo(e.target.value)}
                  placeholder="Ej: Los Leones de Neuquén"
                />
              </div>
            </CardContent>
          </Card>

          {selectedDisciplina && (
            <>
              {renderParticipantForm(
                deportistas,
                "deportista",
                selectedDisciplina.cantidad_integrantes,
                agregarDeportista,
                <Users className="h-5 w-5" />,
                "Deportistas",
              )}

              {renderParticipantForm(
                entrenadores,
                "entrenador",
                selectedDisciplina.entrenadores,
                agregarEntrenador,
                <UserCheck className="h-5 w-5" />,
                "Entrenadores",
              )}

              {renderParticipantForm(
                delegados,
                "delegado",
                selectedDisciplina.delegados,
                agregarDelegado,
                <Shield className="h-5 w-5" />,
                "Delegados",
              )}
            </>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-neuquen-primary">Información Importante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Roles del Equipo</p>
                <p className="text-xs text-blue-600 mt-1">
                  Deportistas: deben coincidir con el género de la disciplina y estar en el rango de edad.
                  Entrenadores/as y Delegados/as: mayores de 21 años, cualquier género
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">DNI Existente</p>
                <p className="text-xs text-green-600 mt-1">
                  Si el DNI ya está registrado, los datos se completarán automáticamente
                </p>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Límite por Disciplina</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Solo puedes inscribir un equipo por disciplina en tu localidad
                </p>
              </div>
            </CardContent>
          </Card>

          {selectedDisciplina && (deportistas.length > 0 || entrenadores.length > 0 || delegados.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-neuquen-primary">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Disciplina:</span>
                    <span className="font-medium">{selectedDisciplina.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deportistas:</span>
                    <span className="font-medium">
                      {deportistas.length}/{selectedDisciplina.cantidad_integrantes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrenadores/as:</span>
                    <span className="font-medium">
                      {entrenadores.length}/{selectedDisciplina.entrenadores}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delegados:</span>
                    <span className="font-medium">
                      {delegados.length}/{selectedDisciplina.delegados}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Documentos:</span>
                    <span className="font-medium">
                      {deportistas.reduce((total, d) => total + (d.documentos?.length || 0), 0)} archivos
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full bg-neuquen-primary hover:bg-neuquen-primary/90"
                    >
                      {loading ? "Inscribiendo..." : "Inscribir Equipo"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
