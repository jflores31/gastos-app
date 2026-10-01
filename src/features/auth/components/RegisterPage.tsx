"use client"

import { useState } from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box, Typography, TextField, Button, Divider, IconButton, InputAdornment, CircularProgress,
} from "@mui/material"
import { AccountBalanceWallet, Google, GitHub, Visibility, VisibilityOff, CheckCircle } from "@/theme/icons"
import Link from "next/link"
import { signInWithOAuth, signUp } from "../data/authApi"
import { AuthCard } from "./AuthCard"
import { AuthErrorAlert } from "./AuthErrorAlert"
import { buttonSpinnerSx, dividerLabelSx, mutedColor, oauthButtonSx, passwordToggleSx, titleColor } from "./auth.styles"
import { registerStyles } from "./RegisterPage.styles"
import { OAUTH_ENABLED } from "@/lib/featureFlags"

export default function RegisterPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"

  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const s = registerStyles(isDark)

  const handleOAuth = (provider: "google" | "github") => {
    const origin = window.location.origin.replace(/^https:\/\/www\./, "https://")
    signInWithOAuth({ provider, options: { redirectTo: `${origin}/auth/callback?next=/` } })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); setLoading(false); return }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); setLoading(false); return }
    try {
      const { error: authError } = await signUp({
        email, password,
        options: {
          data: { full_name: `${name} ${lastName}`.trim() },
          emailRedirectTo: `${window.location.origin.replace(/^https:\/\/www\./, "https://")}/login`,
        },
      })
      if (authError) { setError(authError.message || "Error al registrar") }
      else setSuccess(true)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Box sx={s.successPage}>
        {s.blobs.map((blob, i) => <Box key={i} sx={blob} />)}
        <AuthCard maxWidth={420} p={{ xs: 4, sm: 6 }} accentColor={s.cardAccent} sx={{ textAlign: "center" }}>
          <Box sx={s.successBadge}>
            <CheckCircle sx={{ fontSize: 42, color: "common.white" }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: titleColor(isDark) }}>
            ¡Listo!
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7, color: mutedColor(isDark, 0.45) }}>
            Revisa tu email para confirmar tu cuenta y luego inicia sesión.
          </Typography>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button fullWidth sx={s.successButton}>
              Ir a iniciar sesión
            </Button>
          </Link>
        </AuthCard>
      </Box>
    )
  }

  return (
    <Box sx={s.page}>
      {s.blobs.map((blob, i) => <Box key={i} sx={blob} />)}

      {/* Card */}
      <AuthCard maxWidth={480} p={{ xs: 3.5, sm: 5 }} accentColor={s.cardAccent}>

        {/* Branding */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={s.badge}>
            <AccountBalanceWallet sx={{ fontSize: 36, color: "common.white" }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1, color: titleColor(isDark) }}>
            Crear cuenta
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, letterSpacing: 0.2, color: mutedColor(isDark, 0.32) }}>
            Es gratis, siempre
          </Typography>
        </Box>

        {/* Error */}
        <AuthErrorAlert error={error} />

        {/* OAuth — se activa con OAUTH_ENABLED en src/lib/featureFlags.ts */}
        {OAUTH_ENABLED && (
          <>
            <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
              {([["google", <Google key="g" sx={{ fontSize: 17 }} />], ["github", <GitHub key="gh" sx={{ fontSize: 17 }} />]] as const).map(([p, icon]) => (
                <Button key={p} fullWidth startIcon={icon} onClick={() => handleOAuth(p)}
                  variant="outlined" color="inherit"
                  sx={oauthButtonSx(isDark)}
                >
                  {p === "google" ? "Google" : "GitHub"}
                </Button>
              ))}
            </Box>
            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" sx={dividerLabelSx(isDark)}>
                O CON EMAIL
              </Typography>
            </Divider>
          </>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} aria-label="Crear cuenta" aria-busy={loading}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2 }}>
            <TextField
              fullWidth label="Nombre" value={name}
              onChange={(e) => setName(e.target.value)}
              required autoComplete="given-name"
              sx={s.field}
            />
            <TextField
              fullWidth label="Apellidos" value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required autoComplete="family-name"
              sx={s.field}
            />
          </Box>

          <TextField
            fullWidth label="Email" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email"
            slotProps={{ htmlInput: { spellCheck: false } }}
            sx={{ mb: 2, ...s.field }}
          />

          <TextField
            fullWidth label="Contraseña"
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
            {loading ? <CircularProgress size={20} sx={buttonSpinnerSx} /> : "Crear cuenta gratis"}
          </Button>
        </form>

        <Typography variant="body2" sx={{ textAlign: "center", fontSize: 13, color: mutedColor(isDark, 0.28) }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Typography component="span" variant="body2" sx={s.loginLink}>
              Inicia sesión
            </Typography>
          </Link>
        </Typography>
      </AuthCard>
    </Box>
  )
}
