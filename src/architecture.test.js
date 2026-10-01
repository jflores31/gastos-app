import { describe, it, expect } from "vitest"
import { buildGraph, cycles, violations } from "../scripts/dependency-map.mjs"

// The layer rules of docs/PROJECT-STRUCTURE.md, checked on every `npm test`:
// no import cycles, Supabase only in the data layer, shared code never importing features…
// KNOWN lists what the code breaks today; the refactor removed every entry (the last ones,
// UI calling Supabase, with features/auth/data/authApi.ts). Keep it empty: fix the code instead.
// A stale entry fails too.
const KNOWN = new Set([])

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
