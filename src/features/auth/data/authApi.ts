import { createClient } from "@/lib/supabase/client"
import type { Session, AuthChangeEvent, Provider, UserAttributes } from "@supabase/supabase-js"

export type { Session }

// The only place where the auth screens reach Supabase Auth. Each function is the
// supabase-js call with the same arguments and the same result ({ data, error }), on the
// browser client (a singleton: the same one the rest of the app uses).
const auth = () => createClient().auth

export const getSession = () => auth().getSession()

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) =>
  auth().onAuthStateChange(callback)

export const signInWithPassword = (credentials: { email: string; password: string }) =>
  auth().signInWithPassword(credentials)

// Google or GitHub; the provider sends the user back to /auth/callback (see `redirectTo`).
export const signInWithOAuth = (params: { provider: Provider; options: { redirectTo: string } }) =>
  auth().signInWithOAuth(params)

export const signUp = (params: { email: string; password: string; options?: { emailRedirectTo?: string; data?: object } }) =>
  auth().signUp(params)

export const resetPasswordForEmail = (email: string, options: { redirectTo: string }) =>
  auth().resetPasswordForEmail(email, options)

// A new password, or user_metadata (name, avatar, favorite categories).
export const updateUser = (attributes: UserAttributes) => auth().updateUser(attributes)

// "global" (the default) ends the session on every device; "local" only in this browser.
export const signOut = (options?: { scope?: "global" | "local" | "others" }) => auth().signOut(options)

// Two-step verification (TOTP).
export const mfa = {
  listFactors: () => auth().mfa.listFactors(),
  enroll: (params: { factorType: "totp"; friendlyName?: string; issuer?: string }) => auth().mfa.enroll(params),
  unenroll: (params: { factorId: string }) => auth().mfa.unenroll(params),
  challengeAndVerify: (params: { factorId: string; code: string }) => auth().mfa.challengeAndVerify(params),
}
