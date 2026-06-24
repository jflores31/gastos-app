import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Per-request CSP. The nonce must be unique per response, so the policy lives here
// (middleware) instead of the static next.config.mjs headers. Next.js reads the nonce
// from the request `Content-Security-Policy` header and stamps it onto its <script> tags.
// Note: style-src keeps 'unsafe-inline' — MUI/emotion inject styles at runtime.
function buildCsp(nonce: string): string {
  const dev = process.env.NODE_ENV !== "production"
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")
}

export default async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const csp = buildCsp(nonce)

  // Forward the nonce + CSP on the *request* headers so Next injects the nonce into
  // its scripts. Rebuilt from request.headers after every cookie mutation so we keep
  // both the refreshed auth cookies and the CSP on the same forwarded request.
  const forwardHeaders = () => {
    const h = new Headers(request.headers)
    h.set("x-nonce", nonce)
    h.set("Content-Security-Policy", csp)
    return h
  }

  let supabaseResponse = NextResponse.next({ request: { headers: forwardHeaders() } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: forwardHeaders() } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  // OAuth lands here with a `code` but no session yet — let it through to exchange it.
  const isCallback = pathname.startsWith("/auth/callback")

  if (!user && !isAuthPage && !isCallback) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const redirect = NextResponse.redirect(url)
    redirect.headers.set("Content-Security-Policy", csp)
    return redirect
  }

  if (user && isAuthPage && !pathname.startsWith("/reset-password")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    const redirect = NextResponse.redirect(url)
    redirect.headers.set("Content-Security-Policy", csp)
    return redirect
  }

  supabaseResponse.headers.set("Content-Security-Policy", csp)
  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
