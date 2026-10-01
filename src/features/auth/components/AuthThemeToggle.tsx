"use client"

import { IconButton, Tooltip } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { LightMode, DarkMode } from "@/theme/icons"
import { useSettings } from "@/contexts/SettingsContext"
import { themeToggleSx } from "./auth.styles"

// Floating sun/moon toggle for the auth screens — lets a user pick light/dark
// before signing in. Persists through useSettings (gastos-theme in localStorage).
export function AuthThemeToggle() {
  const { setTheme } = useSettings()
  const theme = useTheme()
  // From palette.mode, not localStorage: the first render is "light" on the server and
  // the client (settings load after mount), so this doesn't cause a hydration mismatch.
  const isDark = theme.palette.mode === "dark"

  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={label}
        sx={themeToggleSx(isDark)}
      >
        {isDark ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
      </IconButton>
    </Tooltip>
  )
}
