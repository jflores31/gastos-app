import { NextResponse, type NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// OAuth / PKCE callback: Supabase redirects here with a `code` that we exchange
// for a session (sets the auth cookies). Required by @supabase/ssr — without it
// the provider buttons would land on `/` with an un-exchanged `?code=...`.
// The route is exempted from the auth guard in src/proxy.ts (no session yet here).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // Only allow internal redirect targets — never an absolute/protocol-relative URL.
  const raw = searchParams.get("next") ?? "/"
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/"

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Honour the proxy host in production so we don't redirect off-domain.
      const forwardedHost = request.headers.get("x-forwarded-host")
      const base = process.env.NODE_ENV === "development" || !forwardedHost ? origin : `https://${forwardedHost}`
      return NextResponse.redirect(`${base}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
