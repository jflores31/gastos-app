"use client"

import { useEffect } from "react"
import { Box, Typography, Button } from "@mui/material"
import { reportError } from "@/lib/reportError"
import { statusPageSx } from "./status.styles"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    reportError(error, { where: "app/error.tsx" })
  }, [error])

  return (
    <Box sx={statusPageSx}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Algo salió mal</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {error.digest ? `Error: ${error.digest}` : "Ocurrió un error inesperado."}
      </Typography>
      <Button variant="outlined" onClick={reset}>Intentar de nuevo</Button>
    </Box>
  )
}
