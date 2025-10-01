"use client"

import { useState } from "react"
import { Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select"

const NuevoEquipoPage = () => {
  const [participantForm, setParticipantForm] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    genero: "MASCULINO" as "MASCULINO" | "FEMENINO",
    tipo: "deportista" as "deportista" | "entrenador" | "delegado",
    telefono: "",
    email: "",
  })

  return (
    <div>
      {/* ... existing code ... */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="genero">Género</Label>
          <Select
            value={participantForm.genero}
            onValueChange={(value: "MASCULINO" | "FEMENINO") =>
              setParticipantForm((prev) => ({ ...prev, genero: value }))
            }
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
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Select
            value={participantForm.tipo}
            onValueChange={(value: "deportista" | "entrenador" | "delegado") =>
              setParticipantForm((prev) => ({ ...prev, tipo: value }))
            }
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="deportista">Deportista</SelectItem>
              <SelectItem value="entrenador">Entrenador</SelectItem>
              <SelectItem value="delegado">Delegado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* ... existing code ... */}
    </div>
  )
}

export default NuevoEquipoPage
