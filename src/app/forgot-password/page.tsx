"use client"

import { useState } from "react"
import { Box, Typography, TextField, Button, Chip, Avatar } from "@mui/material"
import { ArrowBack, MarkEmailRead, LockReset } from "@mui/icons-material"
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
    if (authError) { setError(authError.message || "Error al enviar email"); setLoading(false) }
    else setSuccess(true)
  }

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      bgcolor: "background.default", p: 3,
      background: (theme) => theme.palette.mode === "dark"
        ? "linear-gradient(180deg, #0a1628 0%, #0d1b2a 100%)"
        : "linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%)",
    }}>
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        {success ? (
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{
              width: 88, height: 88, borderRadius: "50%", mx: "auto", mb: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              bgcolor: "info.light",
            }}>
              <MarkEmailRead sx={{ fontSize: 48, color: "info.main" }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }} gutterBottom>Revisa tu email</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Enviamos un enlace a <strong>{email}</strong> para restablecer tu contraseña.
            </Typography>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button variant="outlined" startIcon={<ArrowBack />} sx={{ borderRadius: 2, fontWeight: 600 }}>
                Volver al login
              </Button>
            </Link>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 4, cursor: "pointer", "&:hover": { color: "primary.main" } }}>
                  <ArrowBack sx={{ fontSize: 16 }} /> Volver al login
                </Typography>
              </Link>
              <Box sx={{
                width: 72, height: 72, borderRadius: 3, mb: 3,
                display: "flex", alignItems: "center", justifyContent: "center",
                bgcolor: "info.light",
              }}>
                <LockReset sx={{ fontSize: 36, color: "info.main" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }} gutterBottom>
                Recuperar contraseña
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </Typography>
            </Box>

            {error && (
              <Chip role="alert" label={error} color="error" variant="outlined" sx={{ width: "100%", mb: 2, justifyContent: "center" }} />
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Email" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth variant="contained" color="info" type="submit" disabled={loading}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 16, boxShadow: "0 4px 14px rgba(2,136,209,0.35)" }}
              >
                {loading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          </>
        )}
      </Box>
    </Box>
  )
}
