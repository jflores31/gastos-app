// Two-step verification (TOTP with Supabase MFA). A session starts at "aal1" with the
// password and reaches "aal2" once the code is verified. For a user with a verified
// factor, only "aal2" counts: the proxy keeps an "aal1" session on /login, DataContext
// waits for the second step and the database's RLS returns nothing before it
// (20260927050000_mfa_aal2.sql).

type Factor = { id: string; factor_type?: string; status: string }
type WithFactors = { factors?: Factor[] | null } | null | undefined

// The assurance level in an access token's claims. The token is only read here, not
// verified: callers use it after Supabase validated the same session (getUser()).
export function tokenAal(accessToken?: string | null): string | null {
  try {
    const part = accessToken?.split(".")[1]
    if (!part) return null
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=")
    return JSON.parse(atob(base64)).aal ?? null
  } catch {
    return null
  }
}

// The user's verified TOTP factor, if two-step verification is on.
export const verifiedTotp = (user: WithFactors) =>
  user?.factors?.find((f) => f.status === "verified" && (f.factor_type ?? "totp") === "totp") ?? null

// Signed in with the password but still owing the code.
export const needsSecondStep = (user: WithFactors, accessToken?: string | null) =>
  !!verifiedTotp(user) && tokenAal(accessToken) !== "aal2"
