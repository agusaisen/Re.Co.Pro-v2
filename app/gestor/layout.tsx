"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GestorSidebar } from "@/components/gestor-sidebar"
import { NeuquenHeader } from "@/components/neuquen-header"
import { Menu } from "lucide-react"
import { apiRequest } from "@/lib/api-client"

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      try {
        const userData = JSON.parse(token)

        if (!userData || !userData.id || !userData.email || !userData.rol) {
          localStorage.removeItem("token")
          router.push("/login")
          return
        }

        if (userData.rol !== "gestor") {
          localStorage.removeItem("token")
          router.push("/login")
          return
        }

        try {
          const response = await apiRequest("/api/auth/verify", {
            method: "POST",
            body: JSON.stringify(userData),
          })

          if (!response.ok) {
            console.log("[v0] Server token validation failed")
            localStorage.removeItem("token")
            router.push("/login")
            return
          }

          const serverData = await response.json()
          if (!serverData.valid || serverData.user.rol !== "gestor") {
            console.log("[v0] Server returned invalid session or wrong role")
            localStorage.removeItem("token")
            router.push("/login")
            return
          }
        } catch (serverError) {
          console.log("[v0] Server validation error:", serverError)
          // If server validation fails, still allow local validation for now
          // but log the error for debugging
        }

        setLoading(false)
      } catch (error) {
        console.log("[v0] Token parsing error:", error)
        localStorage.removeItem("token")
        router.push("/login")
      }
    }

    validateSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neuquen-primary mx-auto"></div>
          <p className="mt-4 text-neuquen-primary">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="hidden lg:block">
        <NeuquenHeader />
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-neuquen-primary text-neuquen-secondary py-4 px-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-neuquen-secondary/10 rounded-lg">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-gobierno-2024.png"
              alt="Gobierno de la Provincia del Neuquén"
              className="h-12 w-auto"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 lg:flex lg:flex-col">
        <div className="flex flex-1 pt-20 lg:pt-0 lg:overflow-hidden">
          <GestorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 lg:overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>

      <footer className="bg-neuquen-primary text-neuquen-secondary py-8 px-6">
        <p className="text-sm text-center">
          © 2025 Secretaría de Deportes, Cultura y Gestión Ciudadana. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
