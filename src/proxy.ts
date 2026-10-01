import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { needsSecondStep } from "@/features/auth/domain/mfa"

// Per-request CSP. The nonce must be unique per response, so the policy lives here
// (middleware) instead of the static next.config.mjs headers. Next.js reads the nonce
// from the request `Content-Security-Policy` header and stamps it onto its <script> tags.
// Styles: <style> elements need the nonce too (emotion receives it in src/app/layout.tsx);
// only style="" attributes stay inline (style-src-attr), since MUI sets them on SSR markup.
// style-src keeps 'unsafe-inline' as the fallback for browsers without the -elem/-attr
// directives (Safari < 15.4, Firefox < 108); newer ones ignore it for <style> elements.
// Violations are reported to /api/csp-report with report-uri, which Chromium, Firefox and
// Safari send right away. No report-to: where both are present Chromium uses only report-to
// (the Reporting API), and in our tests it never delivered those reports.
// The configured Supabase origin is allowed explicitly, besides *.supabase.co: it covers a
// custom domain and the local mock the e2e tests run against (e2e/mock-supabase).
const supabaseOrigin = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin } catch { return "" }
})()

function buildCsp(nonce: string): string {
  const dev = process.env.NODE_ENV !== "production"
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // Dev: Next's hot reload injects <style> tags without the nonce.
    `style-src-elem 'self' ${dev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "style-src-attr 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""} https://*.supabase.co wss://*.supabase.co`,
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /api/csp-report",
  ].join("; ")
}

function withCsp(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp)
  return response
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
        // `headers` (no-store cache headers) arrive with the first cookie write: a CDN
        // must never cache a response carrying one user's refreshed session.
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: forwardHeaders() } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers ?? {}).forEach(([key, value]) => supabaseResponse.headers.set(key, value))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  // Two-step verification on and only the password given: the session stays on /login,
  // which asks for the code (?mfa=1). getUser() just validated this session's token.
  const secondStepPending = !!user &&
    needsSecondStep(user, (await supabase.auth.getSession()).data.session?.access_token)

  const { pathname } = request.nextUrl
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  // OAuth lands here with a `code` but no session yet — let it through to exchange it.
  const isCallback = pathname.startsWith("/auth/callback")
  // Browser error and CSP reports must get through without a session (the auth pages send them too).
  const isErrorReport = pathname === "/api/client-error" || pathname === "/api/csp-report"
  // The browser fetches the web app manifest without cookies before anyone signs in.
  const isManifest = pathname === "/manifest.webmanifest"

  if (!user && !isAuthPage && !isCallback && !isErrorReport && !isManifest) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return withCsp(NextResponse.redirect(url), csp)
  }

  if (secondStepPending && !pathname.startsWith("/login") && !isErrorReport && !isManifest) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = "?mfa=1"
    return withCsp(NextResponse.redirect(url), csp)
  }

  if (user && !secondStepPending && isAuthPage && !pathname.startsWith("/reset-password")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return withCsp(NextResponse.redirect(url), csp)
  }

  return withCsp(supabaseResponse, csp)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
