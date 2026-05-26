"use client"

import { useState } from "react"
import {
  Box, Typography, TextField, Button, Chip, IconButton, InputAdornment, CircularProgress,
} from "@mui/material"
import { AccountBalanceWallet, Visibility, VisibilityOff, CheckCircle } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"

const darkField = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    bgcolor: "rgba(255,255,255,0.03)",
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.28)" },
    "&.Mui-focused fieldset": { borderColor: "#22c55e", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.38)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#86efac" },
  "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.3)" },
} as const

const Blobs = () => (
  <>
    <Box sx={{
      position: "absolute", top: "-18%", right: "-10%",
      width: 620, height: 620, borderRadius: "50%", pointerEvents: "none",
      background: "radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 68%)",
    }} />
    <Box sx={{
      position: "absolute", bottom: "-15%", left: "-8%",
      width: 520, height: 520, borderRadius: "50%", pointerEvents: "none",
      background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 68%)",
    }} />
    <Box sx={{
      position: "absolute", top: "45%", left: "30%",
      width: 300, height: 300, borderRadius: "50%", pointerEvents: "none",
      background: "radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)",
    }} />
  </>
)

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
      <Box sx={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden", bgcolor: "#07080f", p: 3,
      }}>
        <Blobs />
        <Box sx={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 420, textAlign: "center",
          background: "rgba(255,255,255,0.045)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(36px)",
          borderRadius: "20px",
          p: { xs: 4, sm: 6 },
          boxShadow: "0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: "50%", mx: "auto", mb: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            boxShadow: "0 0 0 12px rgba(34,197,94,0.1), 0 14px 40px rgba(34,197,94,0.35)",
          }}>
            <CheckCircle sx={{ fontSize: 42, color: "#fff" }} />
          </Box>
          <Typography variant="h4" sx={{ color: "#f1f5f9", fontWeight: 800, mb: 1.5 }}>
            ¡Listo!
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.45)", mb: 4, lineHeight: 1.7 }}>
            Revisa tu email para confirmar tu cuenta y luego inicia sesión.
          </Typography>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button fullWidth sx={{
              py: 1.5, borderRadius: "10px", fontWeight: 700, fontSize: 15, textTransform: "none",
              background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
              color: "#fff", boxShadow: "0 4px 22px rgba(34,197,94,0.4)",
              "&:hover": { background: "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)", boxShadow: "0 6px 30px rgba(34,197,94,0.5)", transform: "translateY(-1px)" },
              transition: "all 0.2s",
            }}>
              Ir a iniciar sesión
            </Button>
          </Link>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      bgcolor: "#07080f",
      p: { xs: 2, sm: 3 },
      py: { xs: 4, sm: 5 },
    }}>
      <Blobs />

      {/* Glass card */}
      <Box sx={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 480,
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(36px)",
        borderRadius: "20px",
        p: { xs: 3.5, sm: 5 },
        boxShadow: "0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}>

        {/* Branding */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{
            width: 70, height: 70, borderRadius: "18px", mx: "auto", mb: 2.5,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #22c55e 0%, #6366f1 100%)",
            boxShadow: "0 0 0 10px rgba(34,197,94,0.1), 0 14px 40px rgba(34,197,94,0.38)",
          }}>
            <AccountBalanceWallet sx={{ fontSize: 36, color: "#fff" }} />
          </Box>
          <Typography variant="h4" sx={{ color: "#f1f5f9", fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>
            Crear cuenta
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.32)", mt: 0.75, letterSpacing: 0.2 }}>
            Es gratis, siempre
          </Typography>
        </Box>

        {/* Error */}
        {error && (
          <Chip
            role="alert" label={error}
            sx={{
              width: "100%", justifyContent: "flex-start", px: 1.5, height: "auto", py: 0.75, mb: 2.5,
              bgcolor: "rgba(239,68,68,0.1)", color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.22)", borderRadius: "10px",
              "& .MuiChip-label": { whiteSpace: "normal" },
            }}
          />
        )}


        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2 }}>
            <TextField
              fullWidth label="Nombre" value={name}
              onChange={(e) => setName(e.target.value)}
              required autoComplete="given-name"
              sx={darkField}
            />
            <TextField
              fullWidth label="Apellidos" value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required autoComplete="family-name"
              sx={darkField}
            />
          </Box>

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
            required autoComplete="new-password"
            helperText="Mínimo 8 caracteres"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" onClick={() => setShowPwd(!showPwd)}
                      aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                      sx={{ color: "rgba(255,255,255,0.32)", "&:hover": { color: "rgba(255,255,255,0.65)" } }}>
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
                      sx={{ color: "rgba(255,255,255,0.32)", "&:hover": { color: "rgba(255,255,255,0.65)" } }}>
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
              textTransform: "none", letterSpacing: 0.2, mb: 3.5,
              background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
              color: "#fff",
              boxShadow: "0 4px 22px rgba(34,197,94,0.38)",
              "&:hover:not(:disabled)": {
                background: "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)",
                boxShadow: "0 6px 30px rgba(34,197,94,0.5)",
                transform: "translateY(-1px)",
              },
              "&:disabled": { background: "rgba(34,197,94,0.3)", color: "rgba(255,255,255,0.38)", boxShadow: "none" },
              transition: "all 0.2s",
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "rgba(255,255,255,0.8)" }} /> : "Crear cuenta gratis"}
          </Button>
        </form>

        <Typography variant="body2" sx={{ textAlign: "center", color: "rgba(255,255,255,0.28)", fontSize: 13 }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Typography component="span" variant="body2" sx={{ color: "#86efac", fontWeight: 700, fontSize: 13, "&:hover": { color: "#4ade80" }, transition: "color 0.15s" }}>
              Inicia sesión
            </Typography>
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
