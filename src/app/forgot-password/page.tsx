"use client"

import { useState } from "react"
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, Chip } from "@mui/material"
import { ArrowBack, LockReset } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin.replace(/^https:\/\/www\./, "https://")}/reset-password`,
    })

    if (authError) {
      setError(authError.message || "Error al enviar email")
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
        <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, textAlign: "center", p: 4 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: "info.main", mx: "auto", mb: 2 }}>✉</Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>Email enviado</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Revisa tu correo para restablecer tu contraseña.
          </Typography>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button variant="outlined" startIcon={<ArrowBack />}>Volver al login</Button>
          </Link>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, borderTop: "4px solid", borderTopColor: "info.main" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "info.main", color: "info.contrastText", mx: "auto", mb: 2 }}><LockReset sx={{ fontSize: 32 }} /></Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Recuperar Contraseña</Typography>
            <Typography variant="body2" color="text.secondary">Ingresa tu email y te enviaremos un enlace</Typography>
          </Box>

          {error && (
            <Chip role="alert" label={error} color="error" variant="outlined" sx={{ width: "100%", mb: 2, justifyContent: "center" }} />
          )}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" sx={{ mb: 3 }} />
            <Button fullWidth variant="contained" type="submit" disabled={loading} color="info" sx={{ py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: 16 }}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </form>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Typography variant="body2" color="primary" sx={{ cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                <ArrowBack fontSize="small" />
                Volver al login
              </Typography>
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
