"use client"

import { useState, useEffect, Suspense } from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box, Typography, TextField, Button, CircularProgress, IconButton, InputAdornment,
} from "@mui/material"
import { ArrowBack, LockReset, CheckCircle, ErrorOutlined, Visibility, VisibilityOff } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"
import { AuthCard } from "../components/auth/AuthCard"
import { AuthErrorAlert } from "../components/auth/AuthErrorAlert"
import { darkFieldSx } from "../components/auth/authStyles"

const Blobs = ({ isDark }: { isDark: boolean }) => (
  <>
    <Box sx={{
      position: "absolute", top: "-18%", right: "-10%",
      width: 600, height: 600, borderRadius: "50%", pointerEvents: "none",
      background: isDark
        ? "radial-gradient(circle, rgba(245,158,11,0.17) 0%, transparent 68%)"
        : "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 68%)",
    }} />
    <Box sx={{
      position: "absolute", bottom: "-15%", left: "-8%",
      width: 520, height: 520, borderRadius: "50%", pointerEvents: "none",
      background: isDark
        ? "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 68%)"
        : "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 68%)",
    }} />
    <Box sx={{
      position: "absolute", top: "50%", left: "25%",
      width: 300, height: 300, borderRadius: "50%", pointerEvents: "none",
      background: isDark
        ? "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)"
        : "radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)",
    }} />
  </>
)

function ResetPasswordForm() {
  const theme = useTheme()
  const [isDark, setIsDark] = useState(false)
  useEffect(() => { setIsDark(theme.palette.mode === "dark") }, [theme.palette.mode])

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)

  const darkField = darkFieldSx(isDark, { accent: "#f59e0b", labelAccent: "#fcd34d", helperText: true })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const errorCode = params.get("error_code") || hashParams.get("error_code")

    if (errorCode === "otp_expired" || params.get("error") === "access_denied") {
      setExpired(true)
      return
    }

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); setLoading(false); return }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); setLoading(false); return }
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) setError(authError.message || "Error al restablecer")
      else setSuccess(true)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  /* ── Expired ── */
  if (expired) {
    return (
      <AuthCard maxWidth={440} accentColor="rgba(245,158,11,0.10)" sx={{ textAlign: "center" }}>
        <Box sx={{
          width: 72, height: 72, borderRadius: "50%", mx: "auto", mb: 3,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #ef4444, #b91c1c)",
          boxShadow: "0 0 0 12px rgba(239,68,68,0.1), 0 14px 40px rgba(239,68,68,0.32)",
        }}>
          <ErrorOutlined sx={{ fontSize: 38, color: "#fff" }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5,
          color: isDark ? "#f1f5f9" : "text.primary" }}>
          Enlace expirado
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, lineHeight: 1.75,
          color: isDark ? "rgba(255,255,255,0.38)" : "text.secondary" }}>
          El enlace de recuperación ya no es válido. Los enlaces expiran después de 1 hora o si ya fueron usados.
        </Typography>
        <Link href="/forgot-password" style={{ textDecoration: "none" }}>
          <Button fullWidth sx={{
            py: 1.45, borderRadius: "10px", fontWeight: 700, fontSize: 14.5, textTransform: "none", mb: 1.5,
            background: "linear-gradient(90deg, #ef4444, #dc2626)",
            color: "#fff", boxShadow: "0 4px 22px rgba(239,68,68,0.35)",
            "&:hover": { background: "linear-gradient(90deg, #f87171, #ef4444)", boxShadow: "0 6px 30px rgba(239,68,68,0.48)", transform: "translateY(-1px)" },
            transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
          }}>
            Solicitar nuevo enlace
          </Button>
        </Link>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <Typography variant="body2" sx={{
            display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.5,
            transition: "color 0.15s",
            color: isDark ? "rgba(255,255,255,0.28)" : "text.secondary",
            "&:hover": { color: isDark ? "rgba(255,255,255,0.6)" : "text.primary" },
          }}>
            <ArrowBack sx={{ fontSize: 15 }} /> Volver al login
          </Typography>
        </Link>
      </AuthCard>
    )
  }

  /* ── Verifying ── */
  if (!ready) {
    return (
      <AuthCard maxWidth={440} accentColor="rgba(245,158,11,0.10)" sx={{ textAlign: "center" }}>
        <CircularProgress size={48} sx={{ color: "#f59e0b", mb: 3 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1,
          color: isDark ? "#f1f5f9" : "text.primary" }}>
          Verificando enlace...
        </Typography>
        <Typography variant="body2" sx={{ color: isDark ? "rgba(255,255,255,0.35)" : "text.secondary" }}>
          Esto solo tarda un momento.
        </Typography>
      </AuthCard>
    )
  }

  /* ── Success ── */
  if (success) {
    return (
      <AuthCard maxWidth={440} accentColor="rgba(245,158,11,0.10)" sx={{ textAlign: "center" }}>
        <Box sx={{
          width: 72, height: 72, borderRadius: "50%", mx: "auto", mb: 3,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          boxShadow: "0 0 0 12px rgba(34,197,94,0.1), 0 14px 40px rgba(34,197,94,0.35)",
        }}>
          <CheckCircle sx={{ fontSize: 38, color: "#fff" }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5,
          color: isDark ? "#f1f5f9" : "text.primary" }}>
          ¡Contraseña actualizada!
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, lineHeight: 1.75,
          color: isDark ? "rgba(255,255,255,0.38)" : "text.secondary" }}>
          Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.
        </Typography>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <Button fullWidth sx={{
            py: 1.45, borderRadius: "10px", fontWeight: 700, fontSize: 14.5, textTransform: "none",
            background: "linear-gradient(90deg, #22c55e, #16a34a)",
            color: "#fff", boxShadow: "0 4px 22px rgba(34,197,94,0.38)",
            "&:hover": { background: "linear-gradient(90deg, #4ade80, #22c55e)", boxShadow: "0 6px 30px rgba(34,197,94,0.5)", transform: "translateY(-1px)" },
            transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
          }}>
            Ir a iniciar sesión
          </Button>
        </Link>
      </AuthCard>
    )
  }

  /* ── Form ── */
  return (
    <AuthCard maxWidth={440} accentColor="rgba(245,158,11,0.10)">
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
          background: "linear-gradient(135deg, #f59e0b 0%, #6366f1 100%)",
          boxShadow: "0 0 0 10px rgba(245,158,11,0.1), 0 14px 40px rgba(245,158,11,0.35)",
        }}>
          <LockReset sx={{ fontSize: 36, color: "#fff" }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 1,
          color: isDark ? "#f1f5f9" : "text.primary" }}>
          Nueva contraseña
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.75,
          color: isDark ? "rgba(255,255,255,0.35)" : "text.secondary" }}>
          Elige una contraseña segura para tu cuenta.
        </Typography>
      </Box>

      {/* Error */}
      <AuthErrorAlert error={error} />

      {/* Form */}
      <form onSubmit={handleSubmit} aria-label="Nueva contraseña" aria-busy={loading}>
        <TextField
          fullWidth label="Nueva contraseña"
          type={showPwd ? "text" : "password"}
          value={password} onChange={(e) => setPassword(e.target.value)}
          required autoComplete="new-password"
          helperText="Mínimo 8 caracteres"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                    sx={isDark ? { color: "rgba(255,255,255,0.32)", "&:hover": { color: "rgba(255,255,255,0.65)" } } : {}}>
                    {showPwd ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2, ...darkField }}
        />
        <TextField
          fullWidth label="Confirmar contraseña"
          type={showConfirm ? "text" : "password"}
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          required autoComplete="new-password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                    sx={isDark ? { color: "rgba(255,255,255,0.32)", "&:hover": { color: "rgba(255,255,255,0.65)" } } : {}}>
                    {showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 3, ...darkField }}
        />
        <Button
          fullWidth type="submit" disabled={loading}
          sx={{
            py: 1.55, borderRadius: "10px", fontWeight: 700, fontSize: 15,
            textTransform: "none", letterSpacing: 0.2,
            background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
            color: "#fff",
            boxShadow: "0 4px 22px rgba(245,158,11,0.38)",
            "&:hover:not(:disabled)": {
              background: "linear-gradient(90deg, #fcd34d 0%, #f59e0b 100%)",
              boxShadow: "0 6px 30px rgba(245,158,11,0.5)",
              transform: "translateY(-1px)",
            },
            "&:disabled": { background: "rgba(245,158,11,0.3)", color: "rgba(255,255,255,0.38)", boxShadow: "none" },
            transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: "rgba(255,255,255,0.8)" }} /> : "Restablecer contraseña"}
        </Button>
      </form>
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  const theme = useTheme()
  const [isDark, setIsDark] = useState(false)
  useEffect(() => { setIsDark(theme.palette.mode === "dark") }, [theme.palette.mode])

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      bgcolor: isDark ? "#07080f" : "background.default",
      p: { xs: 2, sm: 3 },
    }}>
      <Blobs isDark={isDark} />
      <Suspense fallback={
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <CircularProgress size={40} sx={{ color: "#f59e0b" }} />
        </Box>
      }>
        <ResetPasswordForm />
      </Suspense>
    </Box>
  )
}
