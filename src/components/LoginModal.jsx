"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, Box, Typography, TextField, Button, Avatar, Divider, Chip, IconButton, CircularProgress
} from "@mui/material"
import { Close, Google, GitHub } from "@/theme/icons"
import { OAUTH_ENABLED } from "../lib/featureFlags"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useSettings } from "../context/SettingsContext"

export default function LoginModal({ open, onClose }) {
  const { t } = useSettings()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(t.loginModal.invalidCredentials)
      } else {
        onClose()
        window.location.reload()
      }
    } catch {
      setError(t.loginModal.connectionErrorPleaseTryAgain)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider) => {
    const supabase = createClient()
    const origin = window.location.origin.replace(/^https:\/\/www\./, "https://")
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${origin}/auth/callback?next=/` },
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: "relative", p: 4 }}>
          <IconButton onClick={onClose} aria-label={t.common.close} sx={{ position: "absolute", top: 16, right: 16 }}>
            <Close />
          </IconButton>

          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 28, fontWeight: 700, mx: "auto", mb: 2 }}>
              ◈
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Finanzas</Typography>
            <Typography variant="body2" color="text.secondary">{t.loginModal.welcomeBack}</Typography>
          </Box>

          {error && (
            <Chip role="alert" label={error} color="error" variant="outlined" sx={{ width: "100%", mb: 2, justifyContent: "center" }} />
          )}

          <form onSubmit={handleSubmit} aria-label={t.common.signIn} aria-busy={loading}>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" slotProps={{ htmlInput: { spellCheck: false } }} sx={{ mb: 2 }} />
            <TextField fullWidth label={t.loginModal.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" sx={{ mb: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
                  {t.loginModal.forgotYourPassword}
                </Typography>
              </Link>
            </Box>
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: 16 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : (t.loginModal.signIn)}
            </Button>
          </form>

          {/* Same flag as the login and register pages: hidden until the providers are set up. */}
          {OAUTH_ENABLED && (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">{t.loginModal.orContinueWith}</Typography>
              </Divider>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 2 }}>
                <Button variant="outlined" startIcon={<Google />} onClick={() => handleSocialLogin("google")} sx={{ flex: 1, borderRadius: 2 }}>
                  Google
                </Button>
                <Button variant="outlined" startIcon={<GitHub />} onClick={() => handleSocialLogin("github")} sx={{ flex: 1, borderRadius: 2 }}>
                  GitHub
                </Button>
              </Box>
            </>
          )}

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {t.loginModal.donTHaveAnAccount}{" "}
              <Link href="/register" style={{ textDecoration: "none" }}>
                <Typography component="span" variant="body2" color="primary" sx={{ cursor: "pointer", fontWeight: 600 }}>
                  {t.loginModal.signUp}
                </Typography>
              </Link>
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
