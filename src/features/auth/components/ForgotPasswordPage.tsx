"use client"

import { useState } from "react"
import { useTheme } from "@mui/material/styles"
import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material"
import { ArrowBack, MarkEmailRead, LockReset } from "@/theme/icons"
import Link from "next/link"
import { resetPasswordForEmail } from "../data/authApi"
import { AuthCard } from "./AuthCard"
import { AuthErrorAlert } from "./AuthErrorAlert"
import { backLinkSx, buttonSpinnerSx, mutedColor, titleColor } from "./auth.styles"
import { forgotStyles } from "./ForgotPasswordPage.styles"

export default function ForgotPasswordPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const s = forgotStyles(isDark)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const { error: authError } = await resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin.replace(/^https:\/\/www\./, "https://")}/reset-password`,
      })
      if (authError) setError(authError.message || "Error al enviar email")
      else setSuccess(true)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={s.page}>
      {/* Blobs — acento azul cielo */}
      {s.blobs.map((blob, i) => <Box key={i} sx={blob} />)}

      {success ? (
        /* ── Success state ── */
        <AuthCard maxWidth={440} p={{ xs: 4, sm: 5.5 }} accentColor={s.cardAccent} sx={{ textAlign: "center" }}>
          <Box sx={s.successBadge}>
            <MarkEmailRead sx={{ fontSize: 38, color: "common.white" }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: titleColor(isDark) }}>
            Revisa tu email
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.75, color: mutedColor(isDark, 0.42) }}>
            Enviamos un enlace a
          </Typography>
          <Typography variant="body2" sx={s.sentTo}>
            {email}
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, lineHeight: 1.7, color: mutedColor(isDark, 0.3) }}>
            Haz click en el enlace del email para restablecer tu contraseña. Si no lo ves, revisa tu carpeta de spam.
          </Typography>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button fullWidth startIcon={<ArrowBack sx={{ fontSize: 17 }} />}
              variant="outlined" color="inherit"
              sx={s.backButton}
            >
              Volver al login
            </Button>
          </Link>
        </AuthCard>
      ) : (
        /* ── Form state ── */
        <AuthCard maxWidth={440} accentColor={s.cardAccent}>
          {/* Back link */}
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Typography variant="body2" sx={backLinkSx(isDark, { mb: 4, alpha: 0.3 })}>
              <ArrowBack sx={{ fontSize: 15 }} /> Volver al login
            </Typography>
          </Link>

          {/* Icon + heading */}
          <Box sx={{ mb: 4 }}>
            <Box sx={s.badge}>
              <LockReset sx={{ fontSize: 36, color: "common.white" }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 1, color: titleColor(isDark) }}>
              Recuperar contraseña
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.75, color: mutedColor(isDark, 0.35) }}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </Typography>
          </Box>

          {/* Error */}
          <AuthErrorAlert error={error} />

          {/* Form */}
          <form onSubmit={handleSubmit} aria-label="Recuperar contraseña" aria-busy={loading}>
            <TextField
              fullWidth label="Email" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email"
              slotProps={{ htmlInput: { spellCheck: false } }}
              sx={{ mb: 3, ...s.field }}
            />
            <Button
              fullWidth type="submit" disabled={loading}
              sx={s.submit}
            >
              {loading ? <CircularProgress size={20} sx={buttonSpinnerSx} /> : "Enviar enlace"}
            </Button>
          </form>
        </AuthCard>
      )}
    </Box>
  )
}
