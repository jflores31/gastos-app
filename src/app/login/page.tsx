"use client"

import { useState } from "react"
import {
  Box, Typography, TextField, Button, Avatar, Chip, Divider, IconButton, InputAdornment,
} from "@mui/material"
import { AccountBalanceWallet, Google, GitHub, Visibility, VisibilityOff, TrendingUp, PieChart, Savings } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"

const FEATURES = [
  { icon: <TrendingUp sx={{ fontSize: 20 }} />, text: "Registra gastos e ingresos al instante" },
  { icon: <PieChart sx={{ fontSize: 20 }} />, text: "Análisis visual de tus finanzas" },
  { icon: <Savings sx={{ fontSize: 20 }} />, text: "Presupuestos inteligentes con alertas" },
]

export default function LoginPage() {
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

  const handleOAuth = (provider: "google" | "github") => {
    const supabase = createClient()
    const origin = window.location.origin.replace(/^https:\/\/www\./, "https://")
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${origin}/` } })
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* ── LEFT PANEL ── */}
      <Box sx={{
        display: { xs: "none", md: "flex" },
        width: "44%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 6,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(150deg, #0a1628 0%, #0d2e6e 45%, #1565c0 100%)",
      }}>
        {/* Decorative blobs */}
        <Box sx={{ position: "absolute", top: -100, right: -100, width: 380, height: 380, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />
        <Box sx={{ position: "absolute", bottom: -80, left: -80, width: 320, height: 320, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />
        <Box sx={{ position: "absolute", top: "35%", left: -40, width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(99,179,237,0.08)" }} />

        {/* Branding */}
        <Box sx={{ position: "relative", textAlign: "center", mb: 6 }}>
          <Box sx={{
            width: 88, height: 88, borderRadius: 4, mx: "auto", mb: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}>
            <AccountBalanceWallet sx={{ fontSize: 44, color: "#fff" }} />
          </Box>
          <Typography variant="h3" sx={{ color: "#fff", letterSpacing: -1, fontWeight: 800 }}>
            Finanzas
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.55)", mt: 1, fontWeight: 400 }}>
            Toma el control de tu dinero
          </Typography>
        </Box>

        {/* Feature list */}
        <Box sx={{ position: "relative", width: "100%", maxWidth: 340 }}>
          {FEATURES.map((f, i) => (
            <Box key={i} sx={{
              display: "flex", alignItems: "center", gap: 2, mb: 2, p: 2, borderRadius: 3,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(6px)",
            }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                bgcolor: "rgba(99,179,237,0.2)", color: "#90caf9",
              }}>
                {f.icon}
              </Box>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                {f.text}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Bottom tagline */}
        <Typography variant="caption" sx={{ position: "absolute", bottom: 24, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>
          jeshu.cfd · Finanzas personales
        </Typography>
      </Box>

      {/* ── RIGHT PANEL ── */}
      <Box sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 3, sm: 5 },
        bgcolor: "background.default",
      }}>
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile logo */}
          <Box sx={{ textAlign: "center", mb: 4, display: { md: "none" } }}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: "primary.main", mx: "auto", mb: 1.5 }}>
              <AccountBalanceWallet sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Finanzas</Typography>
          </Box>

          {/* Heading */}
          <Typography variant="h4" sx={{ mb: 0.5, display: { xs: "none", md: "block" }, fontWeight: 800 }}>
            Bienvenido
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Ingresa con tu cuenta para continuar
          </Typography>

          {/* OAuth */}
          <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
            {([["google", <Google key="g" />], ["github", <GitHub key="gh" />]] as const).map(([p, icon]) => (
              <Button
                key={p} fullWidth variant="outlined"
                startIcon={icon}
                onClick={() => handleOAuth(p)}
                sx={{ py: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 600, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", bgcolor: "primary.light" } }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.disabled" sx={{ px: 1, fontWeight: 600, letterSpacing: 0.5 }}>
              O CON EMAIL
            </Typography>
          </Divider>

          {/* Error */}
          {error && (
            <Box sx={{ mb: 2 }}>
              <Chip role="alert" label={error} color="error" variant="outlined" sx={{ width: "100%", justifyContent: "center", mb: error.includes("expiró") ? 1 : 0 }} />
              {error.includes("expiró") && (
                <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                  <Typography variant="body2" color="error" sx={{ textAlign: "center", fontWeight: 600, mt: 0.5 }}>
                    → Solicitar nuevo enlace
                  </Typography>
                </Link>
              )}
            </Box>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Email" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Contraseña"
              type={showPwd ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password"
              slotProps={{ input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPwd(!showPwd)} edge="end" aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}>
                      {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              } }}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
              <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 500, cursor: "pointer" }}>
                  ¿Olvidaste tu contraseña?
                </Typography>
              </Link>
            </Box>
            <Button
              fullWidth variant="contained" type="submit" disabled={loading}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 16, mb: 2, boxShadow: "0 4px 14px rgba(21,101,192,0.4)" }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" style={{ textDecoration: "none" }}>
              <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                Regístrate gratis
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
