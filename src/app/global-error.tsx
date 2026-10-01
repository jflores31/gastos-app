"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/reportError"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    reportError(error, { where: "app/global-error.tsx" })
  }, [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
        <h2 style={{ margin: 0 }}>Algo salió mal</h2>
        <button onClick={reset} style={{ padding: "8px 20px", cursor: "pointer" }}>
          Intentar de nuevo
        </button>
      </body>
    </html>
  )
}
