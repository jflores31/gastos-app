import { NextResponse, type NextRequest } from "next/server"

// Receives errors reported from the browser (src/lib/reportError.ts) and writes them to the
// server logs, where Vercel shows them under Logs. Reachable without a session (exempted in
// src/proxy.ts) so errors on the auth pages are reported too; the body is size-capped and
// only known string fields are kept, so the endpoint can't be used to write arbitrary data.

const MAX_BODY = 8 * 1024

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined)

export async function POST(request: NextRequest) {
  const raw = await request.text()
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 })

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw)
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  if (!data || typeof data !== "object" || typeof data.message !== "string") {
    return new NextResponse(null, { status: 400 })
  }

  const context: Record<string, string> = {}
  if (data.context && typeof data.context === "object") {
    for (const [k, v] of Object.entries(data.context as Record<string, unknown>).slice(0, 10)) {
      if (typeof v === "string") context[k.slice(0, 50)] = v.slice(0, 200)
    }
  }

  // One JSON line per report: easy to search in the Vercel logs, and JSON.stringify escapes
  // newlines so a crafted message can't forge extra log lines.
  console.error(
    "[client-error]",
    JSON.stringify({
      message: str(data.message, 500),
      name: str(data.name, 100),
      digest: str(data.digest, 100),
      path: str(data.path, 200),
      ts: str(data.ts, 40),
      context,
      stack: str(data.stack, 4000),
      userAgent: request.headers.get("user-agent")?.slice(0, 200),
    })
  )

  return new NextResponse(null, { status: 204 })
}
