"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, Users, Calendar } from "lucide-react"
import Link from "next/link"
import { apiRequest } from "@/lib/api-client"

interface Equipo {
  id: number
  disciplina_nombre: string
  nombre_equipo: string
  participantes_count: number
  created_at: string
}

export default function MisEquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEquipos()
  }, [])

  const fetchEquipos = async () => {
    try {
      const response = await apiRequest("/api/gestor/equipos")

      if (response.ok) {
        const data = await response.json()
        setEquipos(data)
      }
    } catch (error) {
      console.error("Error fetching equipos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este equipo?")) return

    try {
      const response = await apiRequest(`/api/gestor/equipos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchEquipos()
      }
    } catch (error) {
      console.error("Error deleting equipo:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-neuquen-primary">Mis Equipos</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neuquen-primary">Mis Equipos</h1>
          <p className="text-gray-600 mt-2">Equipos que has registrado para los Juegos Regionales</p>
        </div>
        <Link href="/gestor/inscribir">
          <Button className="bg-neuquen-primary hover:bg-neuquen-primary/90 text-neuquen-secondary transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
            Inscribir Nuevo Equipo
          </Button>
        </Link>
      </div>

      {equipos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes equipos registrados</h3>
            <p className="text-gray-500 mb-4">Comienza inscribiendo tu primer equipo para los Juegos Regionales</p>
            <Link href="/gestor/inscribir">
              <Button className="bg-neuquen-accent hover:bg-neuquen-accent/90 transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
                Inscribir Primer Equipo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipos.map((equipo) => (
            <Card key={equipo.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-neuquen-primary">
                      {equipo.nombre_equipo || `Equipo de ${equipo.disciplina_nombre}`}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{equipo.disciplina_nombre}</Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{equipo.participantes_count} deportistas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Creado: {new Date(equipo.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Link href={`/gestor/equipos/${equipo.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalle
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(equipo.id)}
                      className="text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-[1.05] hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
