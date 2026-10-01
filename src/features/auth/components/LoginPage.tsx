"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@mui/material/styles"
import {
  Box, Typography, TextField, Button, Divider, IconButton, InputAdornment, CircularProgress,
} from "@mui/material"
import { AccountBalanceWallet, Google, GitHub, Visibility, VisibilityOff } from "@/theme/icons"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AuthCard } from "./AuthCard"
import { AuthErrorAlert } from "./AuthErrorAlert"
import { AuthThemeToggle } from "./AuthThemeToggle"
import { darkFieldSx } from "./authStyles"
import { OAUTH_ENABLED } from "@/lib/featureFlags"
import { needsSecondStep, verifiedTotp } from "../domain/mfa"
import type { Session } from "@supabase/supabase-js"

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
      createClient().auth.getSession().then(({ data }) => setMfaFactor(pendingFactor(data.session)))
    }
  }, [])

  const handleOAuth = (provider: "google" | "github") => {
    const supabase = createClient()
    const origin = window.location.origin.replace(/^https:\/\/www\./, "https://")
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${origin}/auth/callback?next=/` } })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
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
      const { error: mfaError } = await createClient().auth.mfa.challengeAndVerify({ factorId: mfaFactor, code: mfaCode.trim() })
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
    await createClient().auth.signOut()
    setMfaFactor(null)
    setMfaCode("")
    setError("")
  }

  const darkField = darkFieldSx(isDark, { accent: "#6366f1", labelAccent: "#a5b4fc" })

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
      {/* Day / night toggle */}
      <AuthThemeToggle />

      {/* Gradient blobs */}
      <Box sx={{
        position: "absolute", top: "-20%", left: "-12%",
        width: 650, height: 650, borderRadius: "50%", pointerEvents: "none",
        background: isDark
          ? "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 68%)"
          : "radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 68%)",
      }} />
      <Box sx={{
        position: "absolute", bottom: "-18%", right: "-8%",
        width: 550, height: 550, borderRadius: "50%", pointerEvents: "none",
        background: isDark
          ? "radial-gradient(circle, rgba(34,197,94,0.14) 0%, transparent 68%)"
          : "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 68%)",
      }} />
      <Box sx={{
        position: "absolute", top: "52%", right: "22%",
        width: 320, height: 320, borderRadius: "50%", pointerEvents: "none",
        background: isDark
          ? "radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
      }} />

      {/* Card */}
      <AuthCard maxWidth={460} accentColor="rgba(99,102,241,0.10)">

        {/* Branding */}
        <Box sx={{ textAlign: "center", mb: 4.5 }}>
          <Box sx={{
            width: 70, height: 70, borderRadius: "18px", mx: "auto", mb: 2.5,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #6366f1 0%, #22c55e 100%)",
            boxShadow: "0 0 0 10px rgba(99,102,241,0.1), 0 14px 40px rgba(99,102,241,0.35)",
          }}>
            <AccountBalanceWallet sx={{ fontSize: 36, color: "#fff" }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1,
            color: isDark ? "#f1f5f9" : "text.primary" }}>
            Finanzas
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, letterSpacing: 0.2,
            color: isDark ? "rgba(255,255,255,0.32)" : "text.secondary" }}>
            Bienvenido de vuelta
          </Typography>
        </Box>

        {/* Error */}
        <AuthErrorAlert error={error} />

        {mfaFactor ? (
          <form onSubmit={handleMfa} aria-label="Verificación en dos pasos" aria-busy={loading}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1, color: isDark ? "#f1f5f9" : "text.primary" }}>
              Verificación en dos pasos
            </Typography>
            <Typography variant="body2" sx={{ mb: 2.5, color: isDark ? "rgba(255,255,255,0.55)" : "text.secondary" }}>
              Escribe el código de 6 dígitos de tu app de autenticación.
            </Typography>
            <TextField
              fullWidth label="Código" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
              required autoFocus autoComplete="one-time-code"
              slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6, pattern: "[0-9]{6}" } }}
              sx={{ mb: 3, ...darkField }}
            />
            <Button fullWidth type="submit" variant="contained" disabled={loading || mfaCode.length !== 6}
              sx={{ py: 1.4, borderRadius: "10px", fontWeight: 700, textTransform: "none", mb: 1.5 }}>
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
                  sx={{
                    py: 1.25, borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13.5,
                    ...(isDark ? {
                      color: "rgba(255,255,255,0.72)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      bgcolor: "rgba(255,255,255,0.05)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.09)", borderColor: "rgba(255,255,255,0.2)", color: "#fff" },
                    } : {}),
                    transition: "background-color 0.18s, border-color 0.18s, color 0.18s",
                  }}
                >
                  {p === "google" ? "Google" : "GitHub"}
                </Button>
              ))}
            </Box>
            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1.8, fontSize: 10,
                color: isDark ? "rgba(255,255,255,0.22)" : "text.disabled" }}>
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
            sx={{ mb: 2, ...darkField }}
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
                      sx={isDark ? { color: "rgba(255,255,255,0.32)", "&:hover": { color: "rgba(255,255,255,0.65)" } } : {}}
                    >
                      {showPwd ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 1, ...darkField }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Link href="/forgot-password" style={{ textDecoration: "none" }}>
              <Typography variant="body2" sx={{
                fontWeight: 500,
                color: isDark ? "rgba(165,180,252,0.75)" : "primary.main",
                "&:hover": { color: isDark ? "#a5b4fc" : "primary.dark" },
                transition: "color 0.15s",
              }}>
                ¿Olvidaste tu contraseña?
              </Typography>
            </Link>
          </Box>

          <Button
            fullWidth type="submit" disabled={loading}
            sx={{
              py: 1.55, borderRadius: "10px", fontWeight: 700, fontSize: 15,
              textTransform: "none", letterSpacing: 0.2, mb: 3.5,
              background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              boxShadow: "0 4px 22px rgba(99,102,241,0.42)",
              "&:hover:not(:disabled)": {
                background: "linear-gradient(90deg, #818cf8 0%, #6366f1 100%)",
                boxShadow: "0 6px 30px rgba(99,102,241,0.55)",
                transform: "translateY(-1px)",
              },
              "&:disabled": { background: "rgba(99,102,241,0.3)", color: "rgba(255,255,255,0.38)", boxShadow: "none" },
              transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "rgba(255,255,255,0.8)" }} /> : "Ingresar"}
          </Button>
        </form>

        <Typography variant="body2" sx={{ textAlign: "center", fontSize: 13,
          color: isDark ? "rgba(255,255,255,0.28)" : "text.secondary" }}>
          ¿No tienes cuenta?{" "}
          <Link href="/register" style={{ textDecoration: "none" }}>
            <Typography component="span" variant="body2" sx={{
              fontWeight: 700, fontSize: 13,
              color: isDark ? "#a5b4fc" : "primary.main",
              "&:hover": { color: isDark ? "#818cf8" : "primary.dark" },
              transition: "color 0.15s",
            }}>
              Regístrate gratis
            </Typography>
          </Link>
        </Typography>
        </>)}
      </AuthCard>
    </Box>
  )
}
