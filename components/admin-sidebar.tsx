"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Trophy, MapPin, FileText, Home, Book, UserCheck, Settings } from "lucide-react"

const menuItems = [
  { href: "/admin/dashboard", label: "Inicio", icon: Home },
  { href: "/admin/disciplinas", label: "Disciplinas", icon: Trophy },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/localidades", label: "Localidades", icon: MapPin },
  { href: "/admin/documentacion", label: "Documentación", icon: Book },
  { href: "/admin/equipos", label: "Equipos", icon: UserCheck },
  { href: "/admin/reportes", label: "Reportes", icon: FileText },
  { href: "/admin/configuraciones", label: "Configuraciones", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div
      className="w-64 text-neuquen-secondary h-full flex flex-col"
      style={{ background: "linear-gradient(to bottom, #2b3e4c, #1a252e 70%, #0f161d)" }}
    >
      <div className="p-6 border-b border-neuquen-secondary/20">
        <h2 className="text-xl font-bold">Panel Administrador</h2>
        <p className="text-sm opacity-80">Juegos Regionales Neuquén</p>
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
    </div>
  )
}
