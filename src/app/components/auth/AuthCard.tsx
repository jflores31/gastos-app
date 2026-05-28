"use client"

import { Box } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { type ReactNode } from "react"
import { cardBaseSx } from "./authStyles"

interface AuthCardProps {
  children: ReactNode
  maxWidth?: number
  p?: object | number
  accentColor?: string
  sx?: object
}

export function AuthCard({
  children,
  maxWidth = 460,
  p = { xs: 3.5, sm: 5.5 },
  accentColor = "rgba(99,102,241,0.10)",
  sx,
}: AuthCardProps) {
  const { palette } = useTheme()
  const isDark = palette.mode === "dark"

  return (
    <Box
      sx={{
        ...cardBaseSx(isDark),
        maxWidth,
        p,
        boxShadow: isDark
          ? "0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)"
          : `0 8px 32px ${accentColor}, 0 2px 8px rgba(0,0,0,0.06)`,
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}
