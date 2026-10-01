"use client"

import { Box, Chip, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import Link from "next/link"
import linkStyles from "./auth.module.css"
import { errorChipSx } from "./auth.styles"

interface AuthErrorAlertProps {
  error: string
  id?: string
}

export function AuthErrorAlert({ error, id = "auth-error" }: AuthErrorAlertProps) {
  const { palette } = useTheme()
  const isDark = palette.mode === "dark"

  if (!error) return null

  return (
    <Box id={id} role="alert" aria-live="assertive" aria-atomic="true" sx={{ mb: 2.5 }}>
      <Chip
        label={error}
        sx={errorChipSx(isDark)}
      />
      {(error.includes("expiró") || error.includes("expired")) && (
        <Link href="/forgot-password" className={linkStyles.link}>
          <Typography variant="body2" sx={{ color: "error.main", textAlign: "center", fontWeight: 600, mt: 0.75 }}>
            Solicitar nuevo enlace &rarr;
          </Typography>
        </Link>
      )}
    </Box>
  )
}
