"use client"

import { useState, useEffect, Suspense } from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box, Typography, TextField, Button, CircularProgress, IconButton, InputAdornment,
} from "@mui/material"
import { ArrowBack, LockReset, CheckCircle, ErrorOutlined, Visibility, VisibilityOff } from "@/theme/icons"
import Link from "next/link"
import linkStyles from "./auth.module.css"
import { getSession, onAuthStateChange, updateUser } from "../data/authApi"
import { AuthCard } from "./AuthCard"
import { AuthErrorAlert } from "./AuthErrorAlert"
import { backLinkSx, buttonSpinnerSx, mutedColor, passwordToggleSx, titleColor } from "./auth.styles"
import { resetStyles } from "./ResetPasswordPage.styles"

function ResetPasswordForm() {
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)

  const s = resetStyles(isDark)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const errorCode = params.get("error_code") || hashParams.get("error_code")

    if (errorCode === "otp_expired" || params.get("error") === "access_denied") {
      // Reads the URL once after hydration (the server can't see the hash).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpired(true)
      return
    }

    const { data: { subscription } } = onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true)
    })
    getSession().then(({ data: { session } }) => {
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
      const { error: authError } = await updateUser({ password })
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
      <AuthCard maxWidth={440} accentColor={s.cardAccent} sx={{ textAlign: "center" }}>
        <Box sx={s.expiredBadge}>
          <ErrorOutlined sx={{ fontSize: 38, color: "common.white" }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: titleColor(isDark) }}>
          Enlace expirado
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, lineHeight: 1.75, color: mutedColor(isDark, 0.38) }}>
          El enlace de recuperación ya no es válido. Los enlaces expiran después de 1 hora o si ya fueron usados.
        </Typography>
        <Link href="/forgot-password" className={linkStyles.link}>
          <Button fullWidth sx={s.expiredButton}>
            Solicitar nuevo enlace
          </Button>
        </Link>
        <Link href="/login" className={linkStyles.link}>
          <Typography variant="body2" sx={s.expiredBackLink}>
            <ArrowBack sx={{ fontSize: 15 }} /> Volver al login
          </Typography>
        </Link>
      </AuthCard>
    )
  }

  /* ── Verifying ── */
  if (!ready) {
    return (
      <AuthCard maxWidth={440} accentColor={s.cardAccent} sx={{ textAlign: "center" }}>
        <CircularProgress size={48} sx={{ ...s.spinner, mb: 3 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: titleColor(isDark) }}>
          Verificando enlace...
        </Typography>
        <Typography variant="body2" sx={{ color: mutedColor(isDark, 0.35) }}>
          Esto solo tarda un momento.
        </Typography>
      </AuthCard>
    )
  }

  /* ── Success ── */
  if (success) {
    return (
      <AuthCard maxWidth={440} accentColor={s.cardAccent} sx={{ textAlign: "center" }}>
        <Box sx={s.successBadge}>
          <CheckCircle sx={{ fontSize: 38, color: "common.white" }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: titleColor(isDark) }}>
          ¡Contraseña actualizada!
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, lineHeight: 1.75, color: mutedColor(isDark, 0.38) }}>
          Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.
        </Typography>
        <Link href="/login" className={linkStyles.link}>
          <Button fullWidth sx={s.successButton}>
            Ir a iniciar sesión
          </Button>
        </Link>
      </AuthCard>
    )
  }

  /* ── Form ── */
  return (
    <AuthCard maxWidth={440} accentColor={s.cardAccent}>
      {/* Back link */}
      <Link href="/login" className={linkStyles.link}>
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
          Nueva contraseña
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.75, color: mutedColor(isDark, 0.35) }}>
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
                    sx={passwordToggleSx(isDark)}>
                    {showPwd ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2, ...s.field }}
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
                    sx={passwordToggleSx(isDark)}>
                    {showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 3, ...s.field }}
        />
        <Button
          fullWidth type="submit" disabled={loading}
          sx={s.submit}
        >
          {loading ? <CircularProgress size={20} sx={buttonSpinnerSx} /> : "Restablecer contraseña"}
        </Button>
      </form>
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"
  const s = resetStyles(isDark)

  return (
    <Box sx={s.page}>
      {s.blobs.map((blob, i) => <Box key={i} sx={blob} />)}
      <Suspense fallback={
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <CircularProgress size={40} sx={s.spinner} />
        </Box>
      }>
        <ResetPasswordForm />
      </Suspense>
    </Box>
  )
}
