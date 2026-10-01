"use client"

import { Box, Chip, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import Link from "next/link"

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
        sx={{
          width: "100%", justifyContent: "flex-start", px: 1.5, height: "auto", py: 0.75,
          bgcolor: "rgba(239,68,68,0.1)", color: isDark ? "#fca5a5" : "error.dark",
          border: "1px solid rgba(239,68,68,0.22)", borderRadius: "10px",
          "& .MuiChip-label": { whiteSpace: "normal" },
        }}
      />
      {(error.includes("expiró") || error.includes("expired")) && (
        <Link href="/forgot-password" style={{ textDecoration: "none" }}>
          <Typography variant="body2" sx={{ color: "error.main", textAlign: "center", fontWeight: 600, mt: 0.75 }}>
            Solicitar nuevo enlace &rarr;
          </Typography>
        </Link>
      )}
    </Box>
  )
}
