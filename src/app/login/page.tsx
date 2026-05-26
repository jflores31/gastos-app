"use client"

import { useState } from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box, Typography, TextField, Button, Chip, Divider, IconButton, InputAdornment, CircularProgress,
} from "@mui/material"
import { AccountBalanceWallet, Google, GitHub, Visibility, VisibilityOff } from "@mui/icons-material"

const OAUTH_ENABLED = false
import Link from "next/link"
import { createClient } from "../../lib/supabase"

export default function LoginPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(() => {
    if (typeof window === "undefined") return ""
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const code = params.get("error_code") || hashParams.get("error_code")
    if (code === "otp_expired") return "El enlace de recuperación expiró. Solicita uno nuevo."
    return ""
  })

  const handleOAuth = (provider: "google" | "github") => {
    const supabase = createClient()
    const origin = window.location.origin.replace(/^https:\/\/www\./, "https://")
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${origin}/` } })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      const msg = authError.message?.toLowerCase() ?? ""
      setError(msg.includes("email not confirmed") ? "Confirma tu email antes de iniciar sesión" : "Credenciales inválidas")
      setLoading(false)
    } else {
      window.location.href = "/"
    }
  }

  const darkField = isDark ? {
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      bgcolor: "rgba(255,255,255,0.03)",
      "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.28)" },
      "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: 1.5 },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.38)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#a5b4fc" },
  } : {}

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
      <Box sx={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 460,
        bgcolor: isDark ? "transparent" : "background.paper",
        background: isDark ? "rgba(255,255,255,0.045)" : undefined,
        border: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,0.09)" : "divider",
        backdropFilter: isDark ? "blur(36px)" : "none",
        borderRadius: "20px",
        p: { xs: 3.5, sm: 5.5 },
        boxShadow: isDark
          ? "0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)"
          : "0 8px 32px rgba(99,102,241,0.10), 0 2px 8px rgba(0,0,0,0.06)",
      }}>

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
        {error && (
          <Box sx={{ mb: 2.5 }}>
            <Chip
              role="alert" label={error}
              sx={{
                width: "100%", justifyContent: "flex-start", px: 1.5, height: "auto", py: 0.75,
                bgcolor: "rgba(239,68,68,0.1)", color: isDark ? "#fca5a5" : "error.dark",
                border: "1px solid rgba(239,68,68,0.22)", borderRadius: "10px",
                "& .MuiChip-label": { whiteSpace: "normal" },
              }}
            />
            {error.includes("expiró") && (
              <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                <Typography variant="body2" sx={{ color: "error.main", textAlign: "center", fontWeight: 600, mt: 0.75 }}>
                  Solicitar nuevo enlace &rarr;
                </Typography>
              </Link>
            )}
          </Box>
        )}

        {/* OAuth — activar cuando esté implementado: OAUTH_ENABLED = true */}
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
                    transition: "all 0.18s",
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
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email"
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
              transition: "all 0.2s",
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
      </Box>
    </Box>
  )
}
