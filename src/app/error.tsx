"use client"

import { useEffect } from "react"
import { Box, Typography, Button } from "@mui/material"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 2, p: 3,
    }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Algo salió mal</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {error.digest ? `Error: ${error.digest}` : "Ocurrió un error inesperado."}
      </Typography>
      <Button variant="outlined" onClick={reset}>Intentar de nuevo</Button>
    </Box>
  )
}
