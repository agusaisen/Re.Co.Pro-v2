"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { NeuquenHeader } from "@/components/neuquen-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    let sessionData
    try {
      sessionData = JSON.parse(token)
    } catch {
      localStorage.removeItem("token")
      router.push("/login")
      return
    }

    // Verificar que el token sea válido y el usuario sea admin
    fetch("/api/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.valid || data.user.rol !== "administrador") {
          localStorage.removeItem("token")
          router.push("/login")
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        localStorage.removeItem("token")
        router.push("/login")
      })
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
    <div className="h-screen bg-gray-50 flex flex-col">
      <NeuquenHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <footer className="bg-neuquen-primary text-neuquen-secondary py-8 px-6">
        <p className="text-sm text-center">
          © 2025 Secretaría de Deportes, Cultura y Gestión Ciudadana. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
