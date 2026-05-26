"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, Box, Typography, TextField, Button, Avatar, Divider, Chip, IconButton
} from "@mui/material"
import { Close, Google, GitHub } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../lib/supabase"

export default function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError("Credenciales inválidas")
      setLoading(false)
    } else {
      onClose()
    }
  }

  const handleSocialLogin = (provider) => {
    const supabase = createClient()
    const origin = window.location.origin.replace(/^https:\/\/www\./, "https://")
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${origin}/` },
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: "relative", p: 4 }}>
          <IconButton onClick={onClose} aria-label="Cerrar" sx={{ position: "absolute", top: 16, right: 16 }}>
            <Close />
          </IconButton>

          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 28, fontWeight: 700, mx: "auto", mb: 2 }}>
              ◈
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Finanzas</Typography>
            <Typography variant="body2" color="text.secondary">Bienvenido de vuelta</Typography>
          </Box>

          {error && (
            <Chip role="alert" label={error} color="error" variant="outlined" sx={{ width: "100%", mb: 2, justifyContent: "center" }} />
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

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 2 }}>
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
        </Box>
      </DialogContent>
    </Dialog>
  )
}
