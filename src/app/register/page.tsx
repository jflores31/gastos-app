"use client"

import { useState } from "react"
import {
  Box, Typography, TextField, Button, Avatar, Chip, Divider, IconButton, InputAdornment,
} from "@mui/material"
import { AccountBalanceWallet, Google, GitHub, Visibility, VisibilityOff, CheckCircle, Shield, BarChart } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"

const PERKS = [
  { icon: <Shield sx={{ fontSize: 20 }} />, text: "Datos privados y seguros con cifrado" },
  { icon: <BarChart sx={{ fontSize: 20 }} />, text: "Reportes mensuales automáticos" },
  { icon: <CheckCircle sx={{ fontSize: 20 }} />, text: "Categorías personalizadas y metas" },
]

export default function RegisterPage() {
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

  const handleOAuth = (provider: "google" | "github") => {
    const supabase = createClient()
    const origin = window.location.origin.replace(/^https:\/\/www\./, "https://")
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${origin}/` } })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); setLoading(false); return }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); setLoading(false); return }
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: `${name} ${lastName}`.trim() },
        emailRedirectTo: `${window.location.origin.replace(/^https:\/\/www\./, "https://")}/login`,
      },
    })
    if (authError) { setError(authError.message || "Error al registrar"); setLoading(false) }
    else setSuccess(true)
  }

  if (success) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 3 }}>
        <Box sx={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <Box sx={{
            width: 88, height: 88, borderRadius: "50%", mx: "auto", mb: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: "success.light",
          }}>
            <CheckCircle sx={{ fontSize: 48, color: "success.main" }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }} gutterBottom>¡Listo!</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Revisa tu email para confirmar tu cuenta y luego inicia sesión.
          </Typography>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button variant="contained" fullWidth sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 16 }}>
              Ir a Login
            </Button>
          </Link>
        </Box>
      </Box>
    )
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
        background: "linear-gradient(150deg, #0a1f0f 0%, #1b5e20 50%, #2e7d32 100%)",
      }}>
        <Box sx={{ position: "absolute", top: -100, right: -100, width: 380, height: 380, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />
        <Box sx={{ position: "absolute", bottom: -80, left: -80, width: 320, height: 320, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />

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
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.55)", mt: 1 }}>
            Empieza gratis hoy mismo
          </Typography>
        </Box>

        <Box sx={{ position: "relative", width: "100%", maxWidth: 340 }}>
          {PERKS.map((f, i) => (
            <Box key={i} sx={{
              display: "flex", alignItems: "center", gap: 2, mb: 2, p: 2, borderRadius: 3,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(6px)",
            }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                bgcolor: "rgba(129,199,132,0.2)", color: "#a5d6a7",
              }}>
                {f.icon}
              </Box>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                {f.text}
              </Typography>
            </Box>
          ))}
        </Box>

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
        overflowY: "auto",
      }}>
        <Box sx={{ width: "100%", maxWidth: 420, py: 2 }}>
          {/* Mobile logo */}
          <Box sx={{ textAlign: "center", mb: 3, display: { md: "none" } }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "success.main", mx: "auto", mb: 1.5 }}>
              <AccountBalanceWallet sx={{ fontSize: 28 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Finanzas</Typography>
          </Box>

          <Typography variant="h4" sx={{ mb: 0.5, display: { xs: "none", md: "block" }, fontWeight: 800 }}>
            Crear cuenta
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Es gratis, siempre.
          </Typography>

          {/* OAuth */}
          <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
            {([["google", <Google key="g" />], ["github", <GitHub key="gh" />]] as const).map(([p, icon]) => (
              <Button
                key={p} fullWidth variant="outlined"
                startIcon={icon}
                onClick={() => handleOAuth(p)}
                sx={{ py: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 600, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "success.main", bgcolor: "success.light" } }}
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

          {error && (
            <Chip role="alert" label={error} color="error" variant="outlined" sx={{ width: "100%", mb: 2, justifyContent: "center" }} />
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2 }}>
              <TextField fullWidth label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="given-name" />
              <TextField fullWidth label="Apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
            </Box>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" sx={{ mb: 2 }} />
            <TextField
              fullWidth label="Contraseña"
              type={showPwd ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="new-password"
              helperText="Mínimo 8 caracteres"
              slotProps={{ input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPwd(!showPwd)} edge="end" aria-label={showPwd ? "Ocultar" : "Mostrar"}>
                      {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              } }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Confirmar contraseña"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required autoComplete="new-password"
              slotProps={{ input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)} edge="end" aria-label={showConfirm ? "Ocultar" : "Mostrar"}>
                      {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              } }}
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth variant="contained" color="success" type="submit" disabled={loading}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 16, mb: 2, boxShadow: "0 4px 14px rgba(46,125,50,0.4)" }}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </Button>
          </form>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                Inicia sesión
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
