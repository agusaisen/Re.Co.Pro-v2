"use client"

import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/api-client"

interface InscripcionesStatus {
  inscripcionesAbiertas: boolean
  fecha_inicio: string
  fecha_fin: string
  fecha_actual: string
  loading: boolean
  error: string | null
}

export function useInscripcionesStatus(): InscripcionesStatus {
  const [status, setStatus] = useState<InscripcionesStatus>({
    inscripcionesAbiertas: true,
    fecha_inicio: "",
    fecha_fin: "",
    fecha_actual: "",
    loading: true,
    error: null,
  })

  useEffect(() => {
    const verificarEstado = async () => {
      try {
        const response = await apiRequest("/api/gestor/configuracion/inscripciones")
        const data = await response.json()

        setStatus({
          inscripcionesAbiertas: data.inscripcionesAbiertas,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          fecha_actual: data.fecha_actual,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error("Error al verificar estado de inscripciones:", error)
        setStatus((prev) => ({
          ...prev,
          loading: false,
          error: "Error al verificar el estado de las inscripciones",
        }))
      }
    }

    verificarEstado()
  }, [])

  return status
}
