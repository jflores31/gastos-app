"use client"

import Link from "next/link"
import { Box, Typography, Button } from "@mui/material"

export default function NotFound() {
  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 2, p: 3,
    }}>
      <Typography variant="h1" sx={{ fontWeight: 800, fontSize: { xs: "4rem", sm: "6rem" }, lineHeight: 1 }}>
        404
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>Página no encontrada</Typography>
      <Typography variant="body2" color="text.secondary">
        La página que buscas no existe o fue movida.
      </Typography>
      <Button component={Link} href="/" variant="contained" sx={{ mt: 1, borderRadius: "10px", textTransform: "none", fontWeight: 600 }}>
        Volver al inicio
      </Button>
    </Box>
  )
}
