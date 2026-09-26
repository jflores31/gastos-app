// Sends a browser-side error to /api/client-error, which writes it to the server logs
// (Vercel → Logs). Production builds strip console.log/info, and errors that only live in
// the user's browser console are invisible to us — this is how they reach the developer.
// Never throws: reporting an error must not break the app.
//
// Only the pathname is sent (no query string or hash, which can carry auth codes), and a
// page load reports at most MAX_REPORTS distinct errors so a render loop can't flood logs.

const ENDPOINT = "/api/client-error"
const MAX_REPORTS = 10
const sent = new Set()

export function buildReport(error, context = {}) {
  const message = String(error?.message ?? error ?? "Unknown error").slice(0, 500)
  return {
    message,
    name: error?.name ? String(error.name).slice(0, 100) : undefined,
    stack: error?.stack ? String(error.stack).slice(0, 4000) : undefined,
    digest: error?.digest ? String(error.digest).slice(0, 100) : undefined,
    context: Object.fromEntries(
      Object.entries(context).slice(0, 10).map(([k, v]) => [String(k).slice(0, 50), String(v).slice(0, 200)])
    ),
    path: typeof location !== "undefined" ? location.pathname : undefined,
    ts: new Date().toISOString(),
  }
}

export function reportError(error, context = {}) {
  try {
    const report = buildReport(error, context)
    const key = `${report.message}|${report.context.where ?? ""}`
    if (sent.has(key) || sent.size >= MAX_REPORTS) return
    sent.add(key)

    const body = JSON.stringify(report)
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))
    } else if (typeof fetch === "function") {
      fetch(ENDPOINT, { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {})
    }
  } catch {
    // ignore — reporting is best effort
  }
}

// Test-only: forget which errors were already sent.
export function _resetReportedErrors() {
  sent.clear()
}
