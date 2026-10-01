"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@mui/material/styles"
import {
  Box, Typography, TextField, Button, Divider, IconButton, InputAdornment, CircularProgress,
} from "@mui/material"
import { AccountBalanceWallet, Google, GitHub, Visibility, VisibilityOff } from "@/theme/icons"
import Link from "next/link"
import { getSession, signInWithOAuth, signInWithPassword, signOut, mfa } from "../data/authApi"
import { AuthCard } from "./AuthCard"
import { AuthErrorAlert } from "./AuthErrorAlert"
import { AuthThemeToggle } from "./AuthThemeToggle"
import { buttonSpinnerSx, dividerLabelSx, mutedColor, oauthButtonSx, passwordToggleSx, titleColor } from "./auth.styles"
import { loginStyles } from "./LoginPage.styles"
import { OAUTH_ENABLED } from "@/lib/featureFlags"
import { needsSecondStep, verifiedTotp } from "../domain/mfa"
import type { Session } from "../data/authApi"

// The TOTP factor still to verify when the session owes the second step, else null.
const pendingFactor = (session: Session | null) =>
  session && needsSecondStep(session.user, session.access_token) ? verifiedTotp(session.user)?.id ?? null : null

export default function LoginPage() {
  const router = useRouter()
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // Two-step verification: after the password, the factor whose code is asked for.
  const [mfaFactor, setMfaFactor] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const code = params.get("error_code") || hashParams.get("error_code")
    // Reads the URL once after hydration (the server can't see the hash).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (code === "otp_expired") setError("El enlace de recuperación expiró. Solicita uno nuevo.")
    // Sent back by the proxy: signed in with the password, the code is still owed.
    if (params.get("mfa") === "1") {
      getSession().then(({ data }) => setMfaFactor(pendingFactor(data.session)))
    }
  }, [])

  const handleOAuth = (provider: "google" | "github") => {
    const origin = window.location.origin.replace(/^https:\/\/www\./, "https://")
    signInWithOAuth({ provider, options: { redirectTo: `${origin}/auth/callback?next=/` } })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const { data, error: authError } = await signInWithPassword({ email, password })
      if (authError) {
        const msg = authError.message?.toLowerCase() ?? ""
        setError(msg.includes("email not confirmed") ? "Confirma tu email antes de iniciar sesión" : "Credenciales inválidas")
      } else {
        const factor = pendingFactor(data.session)
        if (factor) setMfaFactor(factor)
        else router.push("/")
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaFactor) return
    setLoading(true)
    setError("")
    try {
      const { error: mfaError } = await mfa.challengeAndVerify({ factorId: mfaFactor, code: mfaCode.trim() })
      if (mfaError) setError("Código incorrecto. Intenta de nuevo.")
      else router.push("/")
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Leaves the half-open session and goes back to the email and password.
  const cancelMfa = async () => {
    await signOut()
    setMfaFactor(null)
    setMfaCode("")
    setError("")
  }

  const s = loginStyles(isDark)

  return (
    <Box sx={s.page}>
      {/* Day / night toggle */}
      <AuthThemeToggle />

      {/* Gradient blobs */}
      {s.blobs.map((blob, i) => <Box key={i} sx={blob} />)}

      {/* Card */}
      <AuthCard maxWidth={460} accentColor={s.cardAccent}>

        {/* Branding */}
        <Box sx={{ textAlign: "center", mb: 4.5 }}>
          <Box sx={s.badge}>
            <AccountBalanceWallet sx={{ fontSize: 36, color: "common.white" }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1, color: titleColor(isDark) }}>
            Finanzas
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, letterSpacing: 0.2, color: mutedColor(isDark, 0.32) }}>
            Bienvenido de vuelta
          </Typography>
        </Box>

        {/* Error */}
        <AuthErrorAlert error={error} />

        {mfaFactor ? (
          <form onSubmit={handleMfa} aria-label="Verificación en dos pasos" aria-busy={loading}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1, color: titleColor(isDark) }}>
              Verificación en dos pasos
            </Typography>
            <Typography variant="body2" sx={{ mb: 2.5, color: mutedColor(isDark, 0.55) }}>
              Escribe el código de 6 dígitos de tu app de autenticación.
            </Typography>
            <TextField
              fullWidth label="Código" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
              required autoFocus autoComplete="one-time-code"
              slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6, pattern: "[0-9]{6}" } }}
              sx={{ mb: 3, ...s.field }}
            />
            <Button fullWidth type="submit" variant="contained" disabled={loading || mfaCode.length !== 6} sx={s.mfaButton}>
              {loading ? <CircularProgress size={20} color="inherit" /> : "Verificar"}
            </Button>
            <Button fullWidth color="inherit" onClick={cancelMfa} disabled={loading} sx={{ textTransform: "none" }}>
              Usar otra cuenta
            </Button>
          </form>
        ) : (<>
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
        <form onSubmit={handleSubmit} aria-label="Iniciar sesión" aria-busy={loading}>
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
            required autoComplete="current-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small" edge="end"
                      onClick={() => setShowPwd(!showPwd)}
                      aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                      sx={passwordToggleSx(isDark)}
                    >
                      {showPwd ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 1, ...s.field }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Link href="/forgot-password" style={{ textDecoration: "none" }}>
              <Typography variant="body2" sx={s.forgotLink}>
                ¿Olvidaste tu contraseña?
              </Typography>
            </Link>
          </Box>

          <Button
            fullWidth type="submit" disabled={loading}
            sx={s.submit}
          >
            {loading ? <CircularProgress size={20} sx={buttonSpinnerSx} /> : "Ingresar"}
          </Button>
        </form>

        <Typography variant="body2" sx={{ textAlign: "center", fontSize: 13, color: mutedColor(isDark, 0.28) }}>
          ¿No tienes cuenta?{" "}
          <Link href="/register" style={{ textDecoration: "none" }}>
            <Typography component="span" variant="body2" sx={s.signupLink}>
              Regístrate gratis
            </Typography>
          </Link>
        </Typography>
        </>)}
      </AuthCard>
    </Box>
  )
}
