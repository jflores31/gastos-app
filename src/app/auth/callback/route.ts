import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

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
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

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
