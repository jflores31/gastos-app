"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@mui/material/styles"
import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material"
import { ArrowBack, MarkEmailRead, LockReset } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"
import { AuthCard } from "../components/auth/AuthCard"
import { AuthErrorAlert } from "../components/auth/AuthErrorAlert"
import { darkFieldSx } from "../components/auth/authStyles"

export default function ForgotPasswordPage() {
  const theme = useTheme()
  const [isDark, setIsDark] = useState(false)
  useEffect(() => { setIsDark(theme.palette.mode === "dark") }, [theme.palette.mode])

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const darkField = darkFieldSx(isDark, { accent: "#38bdf8", labelAccent: "#7dd3fc" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
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
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      bgcolor: isDark ? "#07080f" : "background.default",
      p: { xs: 2, sm: 3 },
    }}>
      {/* Blobs — acento azul cielo */}
      <Box sx={{
        position: "absolute", top: "-20%", left: "-10%",
        width: 580, height: 580, borderRadius: "50%", pointerEvents: "none",
        background: isDark
          ? "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 68%)"
          : "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 68%)",
      }} />
      <Box sx={{
        position: "absolute", bottom: "-18%", right: "-8%",
        width: 500, height: 500, borderRadius: "50%", pointerEvents: "none",
        background: isDark
          ? "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 68%)"
          : "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 68%)",
      }} />
      <Box sx={{
        position: "absolute", top: "55%", right: "28%",
        width: 280, height: 280, borderRadius: "50%", pointerEvents: "none",
        background: isDark
          ? "radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)",
      }} />

      {success ? (
        /* ── Success state ── */
        <AuthCard maxWidth={440} p={{ xs: 4, sm: 5.5 }} accentColor="rgba(56,189,248,0.10)" sx={{ textAlign: "center" }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: "50%", mx: "auto", mb: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #38bdf8, #0284c7)",
            boxShadow: "0 0 0 12px rgba(56,189,248,0.1), 0 14px 40px rgba(56,189,248,0.35)",
          }}>
            <MarkEmailRead sx={{ fontSize: 38, color: "#fff" }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5,
            color: isDark ? "#f1f5f9" : "text.primary" }}>
            Revisa tu email
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.75,
            color: isDark ? "rgba(255,255,255,0.42)" : "text.secondary" }}>
            Enviamos un enlace a
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 3.5, wordBreak: "break-all",
            color: isDark ? "#7dd3fc" : "primary.main" }}>
            {email}
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, lineHeight: 1.7,
            color: isDark ? "rgba(255,255,255,0.3)" : "text.secondary" }}>
            Haz click en el enlace del email para restablecer tu contraseña. Si no lo ves, revisa tu carpeta de spam.
          </Typography>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button fullWidth startIcon={<ArrowBack sx={{ fontSize: 17 }} />}
              variant="outlined" color="inherit"
              sx={{
                py: 1.4, borderRadius: "10px", fontWeight: 700, fontSize: 14.5, textTransform: "none",
                ...(isDark ? {
                  color: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  bgcolor: "rgba(255,255,255,0.05)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.09)", borderColor: "rgba(255,255,255,0.2)", color: "#fff" },
                } : {}),
                transition: "background-color 0.18s, border-color 0.18s, color 0.18s",
              }}
            >
              Volver al login
            </Button>
          </Link>
        </AuthCard>
      ) : (
        /* ── Form state ── */
        <AuthCard maxWidth={440} accentColor="rgba(56,189,248,0.10)">
          {/* Back link */}
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Typography variant="body2" sx={{
              display: "inline-flex", alignItems: "center", gap: 0.5, mb: 4,
              fontWeight: 500, transition: "color 0.15s",
              color: isDark ? "rgba(255,255,255,0.3)" : "text.secondary",
              "&:hover": { color: isDark ? "rgba(255,255,255,0.65)" : "text.primary" },
            }}>
              <ArrowBack sx={{ fontSize: 15 }} /> Volver al login
            </Typography>
          </Link>

          {/* Icon + heading */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{
              width: 70, height: 70, borderRadius: "18px", mb: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
              boxShadow: "0 0 0 10px rgba(56,189,248,0.1), 0 14px 40px rgba(56,189,248,0.35)",
            }}>
              <LockReset sx={{ fontSize: 36, color: "#fff" }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 1,
              color: isDark ? "#f1f5f9" : "text.primary" }}>
              Recuperar contraseña
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.75,
              color: isDark ? "rgba(255,255,255,0.35)" : "text.secondary" }}>
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
              sx={{ mb: 3, ...darkField }}
            />
            <Button
              fullWidth type="submit" disabled={loading}
              sx={{
                py: 1.55, borderRadius: "10px", fontWeight: 700, fontSize: 15,
                textTransform: "none", letterSpacing: 0.2,
                background: "linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)",
                color: "#fff",
                boxShadow: "0 4px 22px rgba(56,189,248,0.38)",
                "&:hover:not(:disabled)": {
                  background: "linear-gradient(90deg, #7dd3fc 0%, #38bdf8 100%)",
                  boxShadow: "0 6px 30px rgba(56,189,248,0.5)",
                  transform: "translateY(-1px)",
                },
                "&:disabled": { background: "rgba(56,189,248,0.3)", color: "rgba(255,255,255,0.38)", boxShadow: "none" },
                transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: "rgba(255,255,255,0.8)" }} /> : "Enviar enlace"}
            </Button>
          </form>
        </AuthCard>
      )}
    </Box>
  )
}
