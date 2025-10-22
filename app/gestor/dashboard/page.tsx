"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Plus, FileText } from "lucide-react"
import Link from "next/link"
import { apiRequest } from "@/lib/api-client"
import { FirstTimeBanner } from "@/components/first-time-banner"
import { OnboardingModal } from "@/components/onboarding-modal"

interface GestorStats {
  equiposCreados: number
  totalParticipantes: number
  localidad: string
  disciplinasDisponibles: number
}

export default function GestorDashboard() {
  const [stats, setStats] = useState<GestorStats>({
    equiposCreados: 0,
    totalParticipantes: 0,
    localidad: "",
    disciplinasDisponibles: 0,
  })
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchUserInfo()

    const onboardingCompleted = localStorage.getItem("onboarding_completed")
    if (!onboardingCompleted) {
      // Wait a bit for the page to load, then show onboarding
      setTimeout(() => setShowOnboarding(true), 1000)
    }
  }, [])

  const fetchStats = async () => {
    try {
      const response = await apiRequest("/api/gestor/stats")

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInfo = async () => {
    try {
      const response = await apiRequest("/api/auth/verify")

      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.user)
      }
    } catch (error) {
      console.error("Error fetching user info:", error)
    }
  }

  const statCards = [
    {
      title: "Equipos Creados",
      value: stats.equiposCreados,
      description: "Equipos que has registrado",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Participantes",
      value: stats.totalParticipantes,
      description: "Deportistas en tus equipos",
      icon: Trophy,
      color: "text-green-600",
    },
    {
      title: "Tu Localidad",
      value: stats.localidad,
      description: "Localidad de representación",
      icon: Trophy,
      color: "text-purple-600",
      isText: true,
    },
    {
      title: "Disciplinas Disponibles",
      value: stats.disciplinasDisponibles,
      description: "Disciplinas para inscribir",
      icon: Trophy,
      color: "text-orange-600",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neuquen-primary">Dashboard Gestor</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userName={userInfo?.nombre || "Gestor"}
      />

      <div>
        <h1 className="text-3xl font-bold text-neuquen-primary">Bienvenido, {userInfo?.nombre || "Gestor"}</h1>
        <p className="text-gray-600 mt-2">Panel de gestión para los Juegos Regionales</p>
      </div>

      <FirstTimeBanner hasTeams={stats.equiposCreados > 0} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neuquen-primary">{card.isText ? card.value : card.value}</div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-neuquen-primary">Acciones Rápidas</CardTitle>
            <CardDescription>Tareas frecuentes de gestión</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/gestor/inscribir">
                <Button className="w-full justify-start bg-neuquen-accent hover:bg-neuquen-accent/90 text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
                  <Plus className="mr-3 h-4 w-4" />
                  Inscribir Nuevo Equipo
                </Button>
              </Link>
              <Link href="/gestor/equipos">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                >
                  <Users className="mr-3 h-4 w-4" />
                  Ver Mis Equipos
                </Button>
              </Link>
              
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-neuquen-primary">Información Importante</CardTitle>
            <CardDescription>Recordatorios y avisos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Límite por disciplina</p>
                <p className="text-xs text-blue-600 mt-1">
                  Solo puedes inscribir un equipo por disciplina en tu localidad
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Edades permitidas</p>
                <p className="text-xs text-green-600 mt-1">
                  Verifica que todos los participantes cumplan con los rangos de edad
                </p>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Documentación</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Asegúrate de tener todos los DNI correctos antes de inscribir
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
