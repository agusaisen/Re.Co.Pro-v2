"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Save, AlertCircle, CheckCircle2 } from "lucide-react"
import { apiRequest } from "@/lib/api-client"

export default function ConfiguracionesPage() {
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState("")

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      const config = await apiRequest("/api/admin/configuracion")
      setFechaInicio(config.fecha_inicio_inscripciones || "")
      setFechaFin(config.fecha_fin_inscripciones || "")
    } catch (error) {
      console.error("Error al cargar configuración:", error)
      setError("Error al cargar la configuración")
    } finally {
      setLoading(false)
    }
  }

  const guardarConfiguracion = async () => {
    setError("")
    setExito("")

    if (!fechaInicio || !fechaFin) {
      setError("Ambas fechas son requeridas")
      return
    }

    if (new Date(fechaInicio) >= new Date(fechaFin)) {
      setError("La fecha de inicio debe ser anterior a la fecha de fin")
      return
    }

    try {
      setGuardando(true)
      await apiRequest("/api/admin/configuracion", {
        method: "PUT",
        body: JSON.stringify({
          fecha_inicio_inscripciones: fechaInicio,
          fecha_fin_inscripciones: fechaFin,
        }),
      })
      setExito("Configuración guardada correctamente")
      setTimeout(() => setExito(""), 3000)
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      setError("Error al guardar la configuración")
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neuquen-primary mx-auto"></div>
          <p className="mt-4 text-neuquen-primary">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neuquen-dark">Configuraciones</h1>
        <p className="text-muted-foreground mt-2">Administra las configuraciones del sistema</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {exito && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{exito}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período de Inscripciones
          </CardTitle>
          <CardDescription>
            Define el rango de fechas en el cual los gestores podrán inscribir equipos. Fuera de este período, solo
            podrán visualizar los equipos existentes sin poder agregar o editar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fecha-inicio">Fecha de Inicio</Label>
              <Input
                id="fecha-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">Primer día en que se pueden hacer inscripciones</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha-fin">Fecha de Fin</Label>
              <Input
                id="fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">Último día en que se pueden hacer inscripciones</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={guardarConfiguracion} disabled={guardando} className="gap-2">
              <Save className="h-4 w-4" />
              {guardando ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Información</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>
            <strong>Durante el período de inscripciones:</strong> Los gestores pueden agregar nuevos equipos y editar
            los existentes.
          </p>
          <p>
            <strong>Fuera del período de inscripciones:</strong> Los gestores solo pueden visualizar los equipos
            cargados, sin posibilidad de agregar o modificar.
          </p>
          <p>
            <strong>Como administrador:</strong> Siempre tienes acceso completo a todas las funcionalidades,
            independientemente del período configurado.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
