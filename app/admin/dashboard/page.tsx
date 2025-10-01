"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, MapPin, UserCheck } from "lucide-react"
import { apiRequest } from "@/lib/api-client"

interface DashboardStats {
  totalUsuarios: number
  totalDisciplinas: number
  totalLocalidades: number
  totalParticipantes: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    totalDisciplinas: 0,
    totalLocalidades: 0,
    totalParticipantes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await apiRequest("/api/admin/stats")

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error("Failed to fetch stats:", response.status)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Usuarios",
      value: stats.totalUsuarios,
      description: "Usuarios registrados en el sistema",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Disciplinas",
      value: stats.totalDisciplinas,
      description: "Disciplinas deportivas disponibles",
      icon: Trophy,
      color: "text-green-600",
    },
    {
      title: "Localidades",
      value: stats.totalLocalidades,
      description: "Localidades participantes",
      icon: MapPin,
      color: "text-purple-600",
    },
    {
      title: "Participantes",
      value: stats.totalParticipantes,
      description: "Total de participantes registrados",
      icon: UserCheck,
      color: "text-orange-600",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neuquen-primary">Panel Administrativo</h1>
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
      <div>
        <h1 className="text-3xl font-bold text-neuquen-primary">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">Resumen general del sistema de Juegos Regionales</p>
      </div>

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
                <div className="text-2xl font-bold text-neuquen-primary">{card.value}</div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
