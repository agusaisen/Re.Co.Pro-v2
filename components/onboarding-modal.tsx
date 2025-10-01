"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Plus, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
}

export function OnboardingModal({ isOpen, onClose, userName }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: `¡Bienvenido, ${userName}!`,
      description: "Te ayudaremos a inscribir tu primer equipo en los Juegos Regionales",
      icon: <Trophy className="h-12 w-12 text-neuquen-accent" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Como gestor deportivo, puedes inscribir equipos de tu localidad en diferentes disciplinas deportivas.
          </p>
          <div className="bg-neuquen-accent/10 p-4 rounded-lg">
            <h4 className="font-medium text-neuquen-primary mb-2">¿Qué puedes hacer?</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Inscribir equipos en múltiples disciplinas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Gestionar deportistas, entrenadores y delegados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Generar reportes de tus equipos
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Cómo inscribir un equipo",
      description: "Sigue estos pasos para crear tu primer equipo",
      icon: <Users className="h-12 w-12 text-neuquen-accent" />,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-neuquen-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Selecciona una disciplina</h4>
                <p className="text-sm text-gray-600">Elige el deporte en el que quieres participar</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-neuquen-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Agrega los participantes</h4>
                <p className="text-sm text-gray-600">Deportistas, entrenadores y delegados</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-neuquen-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Completa los datos</h4>
                <p className="text-sm text-gray-600">DNI, nombres, fechas de nacimiento</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "¡Listo para empezar!",
      description: "Comienza inscribiendo tu primer equipo",
      icon: <Plus className="h-12 w-12 text-neuquen-accent" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Ahora que conoces el proceso, ¡es hora de inscribir tu primer equipo!</p>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Recordatorio importante:</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Solo puedes inscribir un equipo por disciplina</li>
              <li>• Verifica las edades permitidas para cada disciplina</li>
              <li>• Los entrenadores y delegados deben ser mayores de 21 años</li>
            </ul>
          </div>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = () => {
    localStorage.setItem("onboarding_completed", "true")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl min-w-[600px] w-full mx-4">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">{steps[currentStep].icon}</div>
          <DialogTitle className="text-center text-xl">{steps[currentStep].title}</DialogTitle>
          <DialogDescription className="text-center">{steps[currentStep].description}</DialogDescription>
        </DialogHeader>

        <div className="py-6">{steps[currentStep].content}</div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentStep ? "bg-neuquen-accent" : "bg-gray-300"}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Anterior
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} className="bg-neuquen-accent hover:bg-neuquen-accent/90">
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleFinish}>
                  Saltar por ahora
                </Button>
                <Link href="/gestor/inscribir">
                  <Button onClick={handleFinish} className="bg-neuquen-accent hover:bg-neuquen-accent/90">
                    Inscribir mi primer equipo
                    <Plus className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
