"use client"

import { useState } from "react"
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, Chip } from "@mui/material"
import { PersonAdd } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: `${name} ${lastName}`.trim() },
        emailRedirectTo: `${window.location.origin.replace(/^https:\/\/www\./, "https://")}/login`,
      },
    })

    if (authError) {
      setError(authError.message || "Error al registrar")
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
        <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, textAlign: "center", p: 4 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: "success.main", mx: "auto", mb: 2 }}>✓</Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>¡Registro exitoso!</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Revisa tu email para confirmar tu cuenta y luego inicia sesión.
          </Typography>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button variant="contained" fullWidth sx={{ borderRadius: 2 }}>Ir a Login</Button>
          </Link>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, borderTop: "4px solid", borderTopColor: "success.main" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "success.main", color: "success.contrastText", mx: "auto", mb: 2 }}><PersonAdd sx={{ fontSize: 32 }} /></Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Crear Cuenta</Typography>
            <Typography variant="body2" color="text.secondary">Comienza a gestionar tus finanzas</Typography>
          </Box>

          {error && (
            <Chip role="alert" label={error} color="error" variant="outlined" sx={{ width: "100%", mb: 2, justifyContent: "center" }} />
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2 }}>
              <TextField fullWidth label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="given-name" />
              <TextField fullWidth label="Apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
            </Box>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" sx={{ mb: 2 }} />
            <TextField fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" helperText="Mínimo 8 caracteres" sx={{ mb: 2 }} />
            <TextField fullWidth label="Confirmar Contraseña" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" sx={{ mb: 3 }} />
            <Button fullWidth variant="contained" type="submit" disabled={loading} color="success" sx={{ py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: 16 }}>
              {loading ? "Creando cuenta..." : "Registrarse"}
            </Button>
          </form>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Typography component="span" variant="body2" color="primary" sx={{ cursor: "pointer", fontWeight: 600 }}>
                  Inicia sesión
                </Typography>
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
