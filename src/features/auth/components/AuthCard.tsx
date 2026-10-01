"use client"

import { Box } from "@mui/material"
import { useTheme, type Theme } from "@mui/material/styles"
import type { ResponsiveStyleValue, SystemStyleObject } from "@mui/system"
import { type ReactNode } from "react"
import { cardBaseSx, cardShadow, defaultCardAccent } from "./auth.styles"

interface AuthCardProps {
  children: ReactNode
  maxWidth?: number
  p?: ResponsiveStyleValue<number>
  accentColor?: string
  sx?: SystemStyleObject<Theme>
}

export function AuthCard({
  children,
  maxWidth = 460,
  p = { xs: 3.5, sm: 5.5 },
  accentColor = defaultCardAccent,
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
        boxShadow: cardShadow(isDark, accentColor),
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}
