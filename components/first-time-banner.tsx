"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, X, Lightbulb } from "lucide-react"
import Link from "next/link"

interface FirstTimeBannerProps {
  hasTeams: boolean
}

export function FirstTimeBanner({ hasTeams }: FirstTimeBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboarding_completed")
    const bannerDismissed = localStorage.getItem("first_time_banner_dismissed")

    // Show banner if user hasn't completed onboarding, has no teams, and hasn't dismissed the banner
    if (!onboardingCompleted && !hasTeams && !bannerDismissed) {
      setIsVisible(true)
    }
  }, [hasTeams])

  const handleDismiss = () => {
    localStorage.setItem("first_time_banner_dismissed", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <Card className="border-neuquen-accent/30 bg-gradient-to-r from-neuquen-accent/5 to-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="bg-neuquen-accent/10 p-2 rounded-lg">
            <Lightbulb className="h-6 w-6 text-neuquen-accent" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-neuquen-primary mb-1">¡Comienza inscribiendo tu primer equipo!</h3>
            <p className="text-sm text-gray-600 mb-3">
              Como gestor deportivo, puedes inscribir equipos de tu localidad en diferentes disciplinas. Te guiaremos
              paso a paso en el proceso.
            </p>

            <div className="flex gap-2">
              <Link href="/gestor/inscribir">
                <Button size="sm" className="bg-neuquen-accent hover:bg-neuquen-accent/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Inscribir primer equipo
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleDismiss}>
                Recordar más tarde
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
