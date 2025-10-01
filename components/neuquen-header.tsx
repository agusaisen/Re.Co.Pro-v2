"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Key } from "lucide-react"

interface UserData {
  id: number
  email: string
  nombre: string
  apellido: string
  rol: string
}

export function NeuquenHeader() {
  const [user, setUser] = useState<UserData | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === "/login"

  useEffect(() => {
    if (!isLoginPage) {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const sessionData = JSON.parse(token)
          setUser(sessionData)
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }
    }
  }, [isLoginPage])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleChangePassword = () => {
    if (user?.rol === "gestor") {
      router.push("/gestor/change-password")
    } else {
      router.push("/admin/change-password")
    }
  }

  return (
    <header className="bg-neuquen-primary text-neuquen-secondary py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo-gobierno-2024.png"
            alt="Gobierno de la Provincia del Neuquén"
            className="h-16 w-auto"
          />
        </div>

        {!isLoginPage && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-neuquen-secondary hover:bg-neuquen-secondary/10">
                <User className="h-4 w-4 mr-2" />
                {user.nombre} {user.apellido}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <div className="font-medium">
                  {user.nombre} {user.apellido}
                </div>
                <div className="text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground capitalize">{user.rol}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleChangePassword}>
                <Key className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
