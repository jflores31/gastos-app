"use client"

import { useState, useEffect, Suspense } from "react"
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, Chip } from "@mui/material"
import { ArrowBack, LockReset } from "@mui/icons-material"
import Link from "next/link"
import { createClient } from "../../lib/supabase"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true)
    })

    // Handle race condition: event may have fired before listener registered
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password })

    if (authError) {
      setError(authError.message || "Error al restablecer")
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (!ready) {
    return (
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, textAlign: "center", p: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>Verificando enlace...</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Si llegaste aquí por error, el enlace puede haber expirado.
        </Typography>
        <Link href="/forgot-password" style={{ textDecoration: "none" }}>
          <Button variant="outlined">Solicitar nuevo enlace</Button>
        </Link>
      </Card>
    )
  }

  if (success) {
    return (
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, textAlign: "center", p: 4 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: "success.main", mx: "auto", mb: 2 }}>✓</Avatar>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>¡Contraseña actualizada!</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tu contraseña ha sido restablecida exitosamente.
        </Typography>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <Button variant="contained" fullWidth sx={{ borderRadius: 2 }}>Ir a Login</Button>
        </Link>
      </Card>
    )
  }

  return (
    <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, borderTop: "4px solid", borderTopColor: "warning.main" }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: "warning.main", color: "warning.contrastText", mx: "auto", mb: 2 }}><LockReset sx={{ fontSize: 32 }} /></Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Nueva Contraseña</Typography>
          <Typography variant="body2" color="text.secondary">Ingresa tu nueva contraseña</Typography>
        </Box>

        {error && (
          <Chip label={error} color="error" variant="outlined" sx={{ width: "100%", mb: 2, justifyContent: "center" }} />
        )}

        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Nueva Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 2 }} />
          <TextField fullWidth label="Confirmar Contraseña" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required sx={{ mb: 3 }} />
          <Button fullWidth variant="contained" type="submit" disabled={loading} color="warning" sx={{ py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: 16 }}>
            {loading ? "Restableciendo..." : "Restablecer Contraseña"}
          </Button>
        </form>

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Typography variant="body2" color="primary" sx={{ cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
              <ArrowBack fontSize="small" />
              Volver al login
            </Typography>
          </Link>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
      <Suspense fallback={
        <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 3, textAlign: "center", p: 4 }}>
          <Typography>Cargando...</Typography>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </Box>
  )
}
