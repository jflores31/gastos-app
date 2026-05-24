"use client"

import { useMemo, useEffect } from "react"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { useSettings } from "../../context/SettingsContext.jsx"
import { getTheme } from "../../theme/materialTheme.js"

export default function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, palette } = useSettings()

  const muiTheme = useMemo(() => {
    return getTheme(theme, palette)
  }, [theme, palette])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--accent", muiTheme.palette.primary.main)
    root.style.setProperty("--income", muiTheme.palette.success.main)
    root.style.setProperty("--expense", muiTheme.palette.error.main)
    root.style.setProperty("--bg", muiTheme.palette.background.paper)
    root.setAttribute("data-theme", theme)
  }, [muiTheme, theme])

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}