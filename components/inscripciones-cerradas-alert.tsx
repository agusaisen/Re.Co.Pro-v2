import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Calendar } from "lucide-react"

interface InscripcionesCerradasAlertProps {
  fechaInicio: string
  fechaFin: string
  fechaActual: string
}

export function InscripcionesCerradasAlert({ fechaInicio, fechaFin, fechaActual }: InscripcionesCerradasAlertProps) {
  const formatearFecha = (fecha: string) => {
    if (!fecha || fecha === "") {
      return "No configurada"
    }

    const date = new Date(fecha)
    if (isNaN(date.getTime())) {
      return "Fecha inválida"
    }

    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const fechaInicioDate = new Date(fechaInicio)
  const fechaActualDate = new Date(fechaActual)
  const estaAntesDePeriodo =
    !isNaN(fechaInicioDate.getTime()) && !isNaN(fechaActualDate.getTime()) && fechaActualDate < fechaInicioDate

  return (
    <Alert className="border-amber-500 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">
        {estaAntesDePeriodo ? "Inscripciones aún no habilitadas" : "Período de inscripciones cerrado"}
      </AlertTitle>
      <AlertDescription className="text-amber-800 space-y-2">
        <p>
          {estaAntesDePeriodo
            ? "El período de inscripciones aún no ha comenzado."
            : "El período de inscripciones ha finalizado."}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>
            Período habilitado: <strong>{formatearFecha(fechaInicio)}</strong> al{" "}
            <strong>{formatearFecha(fechaFin)}</strong>
          </span>
        </div>
        <p className="text-sm">
          Durante este período solo puedes visualizar los equipos existentes. No es posible agregar nuevos equipos ni
          editar los actuales.
        </p>
      </AlertDescription>
    </Alert>
  )
}
