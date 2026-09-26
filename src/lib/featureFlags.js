// Feature flags shared by every screen that exposes the feature.
//
// OAUTH_ENABLED: Google/GitHub sign-in. The PKCE callback (src/app/auth/callback/route.ts) is
// ready, but the providers still have to be configured in Supabase → Auth → Providers, with
// https://www.jeshu.cfd/auth/callback added to the redirect URLs. Before enabling it, check
// the browser-session flag: the code exchange happens on the server, so the client never
// receives SIGNED_IN and gastos_session_alive wouldn't be written (see README → OAuth).
export const OAUTH_ENABLED = false
