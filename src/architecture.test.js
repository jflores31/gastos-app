import { describe, it, expect } from "vitest"
import { buildGraph, cycles, violations } from "../scripts/dependency-map.mjs"

// The layer rules of docs/PROJECT-STRUCTURE.md, checked on every `npm test`:
// no import cycles, Supabase only in the data layer, shared code never importing features…
// KNOWN lists what the code breaks today; the refactor removes entries, never adds them
// (docs/ARCHITECTURE-AUDIT.md). A stale entry fails too, so the list can only shrink.
const KNOWN = new Set([
  "features/auth/components/ForgotPasswordPage.tsx: imports lib/supabase/client.ts (Supabase belongs in features/*/data or lib/supabase)",
  "features/auth/components/LoginPage.tsx: imports @supabase/supabase-js (Supabase belongs in features/*/data or lib/supabase)",
  "features/auth/components/LoginPage.tsx: imports lib/supabase/client.ts (Supabase belongs in features/*/data or lib/supabase)",
  "features/auth/components/RegisterPage.tsx: imports lib/supabase/client.ts (Supabase belongs in features/*/data or lib/supabase)",
  "features/auth/components/ResetPasswordPage.tsx: imports lib/supabase/client.ts (Supabase belongs in features/*/data or lib/supabase)",
  "components/DashboardStudio.jsx: imports lib/supabase/client.ts (Supabase belongs in features/*/data or lib/supabase)",
  "features/auth/components/LoginModal.jsx: imports lib/supabase/client.ts (Supabase belongs in features/*/data or lib/supabase)",
  "features/settings/components/ProfileTab.jsx: imports lib/supabase/client.ts (Supabase belongs in features/*/data or lib/supabase)",
  "features/auth/components/TwoFactorSection.jsx: imports lib/supabase/client.ts (Supabase belongs in features/*/data or lib/supabase)",
])

describe("arquitectura", () => {
  const nodes = buildGraph()

  it("no hay ciclos de importación", () => {
    expect(cycles(nodes)).toEqual([])
  })

  it("no aparecen violaciones nuevas de las capas", () => {
    expect(violations(nodes).filter((v) => !KNOWN.has(v))).toEqual([])
  })

  it("la lista de excepciones no tiene entradas ya resueltas", () => {
    const current = new Set(violations(nodes))
    expect([...KNOWN].filter((v) => !current.has(v))).toEqual([])
  })
})
