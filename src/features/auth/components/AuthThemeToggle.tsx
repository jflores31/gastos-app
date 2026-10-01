"use client"

import { IconButton, Tooltip } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { LightMode, DarkMode } from "@/theme/icons"
import { useSettings } from "@/contexts/SettingsContext"

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
        sx={{
          position: "absolute", top: { xs: 14, sm: 22 }, right: { xs: 14, sm: 22 }, zIndex: 3,
          width: 44, height: 44,
          color: isDark ? "rgba(255,255,255,0.72)" : "text.secondary",
          bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.035)",
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "divider",
          backdropFilter: "blur(8px)",
          "&:hover": {
            bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
            color: isDark ? "#fff" : "text.primary",
          },
          "& .MuiSvgIcon-root": { transition: "transform 0.3s cubic-bezier(.4,0,.2,1)" },
          "&:hover .MuiSvgIcon-root": { transform: "rotate(35deg)" },
          transition: "background-color 0.2s, border-color 0.2s, color 0.2s",
        }}
      >
        {isDark ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
      </IconButton>
    </Tooltip>
  )
}
