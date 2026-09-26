import { NextResponse, type NextRequest } from "next/server"

// Receives Content-Security-Policy violation reports (report-uri in src/proxy.ts) and writes
// them to the server logs, like /api/client-error. Accepts both formats:
// - report-uri (what the CSP uses today): { "csp-report": { "document-uri": …, … } }
// - Reporting API (report-to): [{ type: "csp-violation", body: { documentURL: …, … } }]
// Reachable without a session (exempted in src/proxy.ts). Size-capped, only known fields
// are kept, and URLs lose their query and hash (a reset link's token must not be logged).

const MAX_BODY = 8 * 1024
const MAX_REPORTS = 10

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined)
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined)

// "inline" / "eval" / "data" are kept as they are; URLs keep only origin + path.
function cleanUrl(v: unknown) {
  const s = str(v, 500)
  if (!s) return undefined
  try {
    const u = new URL(s)
    return (u.origin === "null" ? u.protocol : u.origin + u.pathname).slice(0, 300)
  } catch {
    return s.slice(0, 50)
  }
}

type Violation = {
  documentURL?: string
  blockedURL?: string
  directive?: string
  disposition?: string
  sourceFile?: string
  line?: number
  column?: number
  sample?: string
}

function fromLegacy(r: Record<string, unknown>): Violation {
  return {
    documentURL: cleanUrl(r["document-uri"]),
    blockedURL: cleanUrl(r["blocked-uri"]),
    directive: str(r["effective-directive"] ?? r["violated-directive"], 100),
    disposition: str(r.disposition, 20),
    sourceFile: cleanUrl(r["source-file"]),
    line: num(r["line-number"]),
    column: num(r["column-number"]),
    sample: str(r["script-sample"], 100),
  }
}

function fromReportingApi(b: Record<string, unknown>): Violation {
  return {
    documentURL: cleanUrl(b.documentURL),
    blockedURL: cleanUrl(b.blockedURL),
    directive: str(b.effectiveDirective, 100),
    disposition: str(b.disposition, 20),
    sourceFile: cleanUrl(b.sourceFile),
    line: num(b.lineNumber),
    column: num(b.columnNumber),
    sample: str(b.sample, 100),
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)

export async function POST(request: NextRequest) {
  const raw = await request.text()
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 })

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  let violations: Violation[]
  if (Array.isArray(data)) {
    violations = data
      .filter((r) => isObject(r) && r.type === "csp-violation" && isObject(r.body))
      .slice(0, MAX_REPORTS)
      .map((r) => fromReportingApi(r.body as Record<string, unknown>))
  } else if (isObject(data) && isObject(data["csp-report"])) {
    violations = [fromLegacy(data["csp-report"])]
  } else {
    return new NextResponse(null, { status: 400 })
  }

  const userAgent = str(request.headers.get("user-agent"), 300)
  for (const v of violations) {
    // One JSON line per violation, as /api/client-error does. console.error survives
    // removeConsole in production (next.config.mjs).
    console.error("[csp-report]", JSON.stringify({ ...v, userAgent, ts: new Date().toISOString() }))
  }
  return new NextResponse(null, { status: 204 })
}
