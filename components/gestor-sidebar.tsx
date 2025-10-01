"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Users, Plus, Home, X, Key, LogOut, Book } from "lucide-react"
import { useState, useEffect } from "react"

const menuItems = [
  { href: "/gestor/dashboard", label: "Inicio", icon: Home },
  { href: "/gestor/equipos", label: "Mis Equipos", icon: Users },
  { href: "/gestor/inscribir", label: "Inscribir Equipo", icon: Plus },
  { href: "/gestor/documentacion", label: "Documentación", icon: Book },
]

interface GestorSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function GestorSidebar({ isOpen = true, onClose }: GestorSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const user = JSON.parse(token)
        setUserData(user)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleChangePassword = () => {
    router.push("/gestor/change-password")
    onClose?.()
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />}

      <div
        className={`
        fixed left-0 top-0 bottom-0 z-50 w-64 text-neuquen-secondary 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-40
      `}
        style={{ background: "linear-gradient(to bottom, #2b3e4c, #1a252e 70%, #0f161d)" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-neuquen-secondary/20 lg:justify-start">
          <div>
            <h2 className="text-xl font-bold">Panel Gestor</h2>
            <p className="text-sm opacity-80">Juegos Regionales Neuquén</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-neuquen-secondary/10 rounded">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose} // Close mobile menu on navigation
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? "bg-neuquen-accent text-white" : "hover:bg-neuquen-secondary/10"
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="lg:hidden border-t border-neuquen-secondary/20 p-4">
          {userData && (
            <div className="mb-4">
              <p className="text-sm font-medium">
                {userData.nombre} {userData.apellido}
              </p>
              <p className="text-xs opacity-70">{userData.email}</p>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleChangePassword}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neuquen-secondary/10 transition-colors text-left"
            >
              <Key size={20} />
              Cambiar Contraseña
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-left"
            >
              <LogOut size={20} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
