"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/reportError"
import styles from "./global-error.module.css"

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
      <body className={styles.page}>
        <h2 className={styles.title}>Algo salió mal</h2>
        <button onClick={reset} className={styles.retry}>
          Intentar de nuevo
        </button>
      </body>
    </html>
  )
}
