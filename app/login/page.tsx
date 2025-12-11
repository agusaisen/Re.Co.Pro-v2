"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NeuquenHeader } from "@/components/neuquen-header"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState("")
  const [showRegister, setShowRegister] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Login successful, user data:", data.user)
        localStorage.setItem("token", JSON.stringify(data.user))

        if (data.user.rol === "administrador") {
          console.log("[v0] Redirecting to admin dashboard")
          router.push("/admin/dashboard")
        } else {
          console.log("[v0] Redirecting to gestor dashboard")
          router.push("/gestor/dashboard")
        }
      } else {
        setError(data.error || "Error al iniciar sesión")
      }
    } catch (error) {
      setError("Error de conexión. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setShowForgotPassword(true)
    setForgotEmail("")
    setForgotMessage("")
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotMessage("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setForgotMessage("Se ha enviado una contraseña temporal a su correo electrónico.")
      } else {
        setForgotMessage(data.error || "Error al procesar la solicitud")
      }
    } catch (error) {
      setForgotMessage("Error de conexión. Intente nuevamente.")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleRegister = () => {
    setShowRegister(true)
  }

  return (
    <div className="min-h-screen bg-neuquen-accent flex flex-col">
      <NeuquenHeader />

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-neuquen-primary">Iniciar Sesión</CardTitle>
            <CardDescription>Ingrese sus credenciales para acceder al sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-neuquen-primary hover:bg-neuquen-primary/90 text-neuquen-secondary"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>

              <div className="text-center text-sm text-muted-foreground space-y-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-neuquen-primary hover:underline block w-full cursor-pointer"
                >
                  ¿Olvidó su contraseña?
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="text-neuquen-primary hover:underline block w-full cursor-pointer"
                >
                  ¿No tiene una cuenta? Regístrate
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-neuquen-primary">¿Olvidó su contraseña?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!forgotMessage ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ingrese su correo electrónico y le enviaremos una contraseña temporal.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Correo Electrónico</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-neuquen-primary hover:bg-neuquen-primary/90 text-neuquen-secondary"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? "Enviando..." : "Enviar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      disabled={forgotLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-center">{forgotMessage}</p>
                  <Button
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full bg-neuquen-primary hover:bg-neuquen-primary/90 text-neuquen-secondary"
                  >
                    Entendido
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-neuquen-primary">Registro de Institución</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para registrarse en la plataforma de Juegos Regionales, debe contactarse con el sector de Deporte Comunitario indicando mail, nombre, apellido y localidad.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Información de contacto:</p>
                <p className="text-sm">📧 Email: deportecomunitario@neuquen.gov.ar</p>
                              </div>

              <Button
                onClick={() => setShowRegister(false)}
                className="w-full bg-neuquen-primary hover:bg-neuquen-primary/90 text-neuquen-secondary"
              >
                Entendido
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <footer className="bg-neuquen-primary text-neuquen-secondary py-8 px-6">
        <p className="text-sm text-center">
          © 2025 Secretaría de Deportes, Cultura y Gestión Ciudadana. Todos los derechos reservados.
        </p>
        <p>
          Next-Gen Web, made in Patagonia by  <a href="https://www.lanin.studio/">Lanin Studio.</a>
        </p>
      </footer>
    </div>
  )
}
