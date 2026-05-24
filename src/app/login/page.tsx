"use client"

import { useState } from "react"
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, Divider, Chip } from "@mui/material"
import { Google, GitHub } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError("Credenciales inválidas")
      setLoading(false)
    } else {
      window.location.href = "/"
    }
  }

  const handleSocialLogin = (provider: "google" | "github") => {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, borderTop: "4px solid", borderTopColor: "primary.main" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 28, fontWeight: 700, mx: "auto", mb: 2 }}>
              ◈
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Finanzas</Typography>
            <Typography variant="body2" color="text.secondary">Bienvenido de vuelta</Typography>
          </Box>

          {error && (
            <Chip label={error} color="error" variant="outlined" sx={{ width: "100%", mb: 2, justifyContent: "center" }} />
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

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">o continuar con</Typography>
          </Divider>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="outlined" startIcon={<Google />} onClick={() => handleSocialLogin("google")} sx={{ flex: 1, borderRadius: 2 }}>
              Google
            </Button>
            <Button variant="outlined" startIcon={<GitHub />} onClick={() => handleSocialLogin("github")} sx={{ flex: 1, borderRadius: 2 }}>
              GitHub
            </Button>
          </Box>

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
