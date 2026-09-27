# Security

🌐 [Español](SECURITY.md) · **English**

The app's security measures. The Content-Security-Policy details are in [SECURITY-CSP.md](SECURITY-CSP.md) (Spanish).

| Measure | Detail |
|---|---|
| HTTP Security Headers | CSP **with a per-request nonce** (`script-src 'self' 'nonce-…' 'strict-dynamic'`, no `'unsafe-inline'`; emotion's `<style>` tags carry the nonce too) generated in `proxy.ts`, with violations reported to `/api/csp-report`; the rest (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) in `next.config.mjs` |
| Two-step verification | TOTP with Supabase MFA (Profile). Once on, signing in asks for the code; `proxy.ts` keeps an `aal1` session on `/login?mfa=1` only, `DataContext` doesn't load until the code, and the database (`RESTRICTIVE` policies in [`supabase/schema.sql`](DATABASE.en.md#in-the-sql-part-2)) returns and accepts no rows without `aal2`, so it can't be skipped by calling the Supabase API directly either |
| RLS in Supabase | All tables with owner-only policies `FOR ALL TO authenticated USING / WITH CHECK (auth.uid() = user_id)` |
| Password policy | `minimum_password_length = 8` in `supabase/config.toml` |
| Guards in DELETE/UPDATE | Every mutation captures `{ error }` and does `throw error` on failure — local state is never mutated on error |
| Browser-session flag | `gastos_session_alive` in `sessionStorage` (cleared by the browser on close); reopening the browser forces re-login. The session survives normal page reloads. A tab opened by hand asks over `BroadcastChannel("gastos-session")` whether another tab is alive and, if one answers, inherits the session instead of signing out |
| Scoped automatic sign-outs | Inactivity, 8 h max age and reopened browser use `signOut({ scope: "local" })` (other devices' sessions are not revoked). Before an inactivity logout the shared `gastos_last_active` is re-read so an idle tab doesn't sign out a user who is active in another tab |
| Prolonged inactivity expiry | `gastos_last_active` in `localStorage` updated on every user event; if the tab has been inactive for >8 h, the session is closed on focus recovery |
| Amount limit | Maximum 10,000,000 (in PEN, the base currency) validated on client and with `max` attribute on the input |
| Error feedback | `loadError` in `DataContext` — banner with a Retry button if loading fails |
| Errors visible in production | Browser errors (Next error boundaries, data-loading failures, uncaught errors) are sent by `reportError()` to `/api/client-error`, which writes them as one `[client-error]` JSON line in the server logs (Vercel → Logs). Only the pathname is sent (no query string), with a size cap and at most 10 reports per page. The route accepts reports without a session so the auth pages are covered. Production keeps `console.error` and `console.warn` |

> Per-request nonce CSP architecture (`proxy.ts` flow, dynamic rendering, how to verify): **[SECURITY-CSP.md](SECURITY-CSP.md)** (Spanish).
