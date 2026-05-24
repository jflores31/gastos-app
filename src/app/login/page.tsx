"use client"

import { useState } from "react"
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, Chip } from "@mui/material"
import { AccountBalanceWallet } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(() => {
    if (typeof window === "undefined") return ""
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const code = params.get("error_code") || hashParams.get("error_code")
    if (code === "otp_expired") return "El enlace de recuperación expiró. Solicita uno nuevo."
    return ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      const msg = authError.message?.toLowerCase() ?? ""
      if (msg.includes("email not confirmed")) {
        setError("Confirma tu email antes de iniciar sesión")
      } else {
        setError("Credenciales inválidas")
      }
      setLoading(false)
    } else {
      window.location.href = "/"
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, borderTop: "4px solid", borderTopColor: "primary.main" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", color: "primary.contrastText", mx: "auto", mb: 2 }}>
              <AccountBalanceWallet sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Finanzas</Typography>
            <Typography variant="body2" color="text.secondary">Bienvenido de vuelta</Typography>
          </Box>

          {error && (
            <Box sx={{ mb: 2 }}>
              <Chip label={error} color="error" variant="outlined" sx={{ width: "100%", mb: 1, justifyContent: "center" }} />
              {error.includes("expiró") && (
                <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                  <Typography variant="body2" color="error" sx={{ textAlign: "center", fontWeight: 600, cursor: "pointer" }}>
                    → Solicitar nuevo enlace
                  </Typography>
                </Link>
              )}
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
                  ¿Olvidaste tu contraseña?
                </Typography>
              </Link>
            </Box>
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: 16 }}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ¿No tienes cuenta?{" "}
              <Link href="/register" style={{ textDecoration: "none" }}>
                <Typography component="span" variant="body2" color="primary" sx={{ cursor: "pointer", fontWeight: 600 }}>
                  Regístrate
                </Typography>
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
