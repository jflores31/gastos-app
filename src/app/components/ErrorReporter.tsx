"use client"

import { useEffect } from "react"
import { reportError } from "../../lib/reportError"

// Reports errors that escape React's error boundaries (event handlers, timers, promise
// rejections nobody awaited). Boundary errors are reported by src/app/error.tsx and
// src/app/global-error.tsx.
export default function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError(e.error ?? e.message, { where: "window.onerror" })
    const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason, { where: "unhandledrejection" })
    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])
  return null
}
