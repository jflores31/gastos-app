// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor, cleanup } from "@testing-library/react"
import { DataProvider, useData } from "./DataContext.jsx"

// Stand-in for the supabase-js client. `from(table)` returns a chainable, awaitable builder
// that records its calls; `fake.respond(table, calls)` decides what each query resolves to.
const fake = vi.hoisted(() => {
  const state = {
    authCallback: null,
    getUser: null, // set in beforeEach (vi isn't available inside vi.hoisted's return value yet)
    queries: [],
    respond: () => ({ data: [], error: null }),
  }
  const methods = ["select", "order", "range", "insert", "update", "delete", "upsert", "eq", "is", "not", "lt", "single"]
  state.client = {
    auth: {
      onAuthStateChange: (cb) => {
        state.authCallback = cb
        return { data: { subscription: { unsubscribe() {} } } }
      },
      getUser: (...args) => state.getUser(...args),
    },
    from: (table) => {
      const q = { table, calls: [] }
      for (const m of methods) q[m] = (...args) => { q.calls.push([m, ...args]); return q }
      q.then = (resolve, reject) => Promise.resolve().then(() => state.respond(table, q.calls)).then(resolve, reject)
      state.queries.push(q)
      return q
    },
  }
  return state
})
vi.mock("../lib/supabase", () => ({ createClient: () => fake.client }))

const has = (calls, name) => calls.find((c) => c[0] === name)
const writes = () => fake.queries.filter((q) => q.calls.some((c) => ["insert", "update", "delete", "upsert"].includes(c[0])))

async function mountSignedInKeepingQueries(userId = "u1") {
  const hook = renderHook(() => useData(), { wrapper: DataProvider })
  await act(async () => { fake.authCallback("INITIAL_SESSION", { user: { id: userId } }) })
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

async function mountSignedIn(userId = "u1") {
  const hook = renderHook(() => useData(), { wrapper: DataProvider })
  await act(async () => { fake.authCallback("INITIAL_SESSION", userId ? { user: { id: userId } } : null) })
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  fake.queries = [] // forget the load queries; tests look at writes
  return hook
}

describe("DataContext", () => {
  beforeEach(() => {
    fake.queries = []
    fake.getUser = vi.fn(async () => ({ data: { user: { id: "u1" } } }))
    fake.respond = (table, calls) => {
      if (has(calls, "single")) {
        const insert = has(calls, "insert")
        const update = has(calls, "update")
        const id = insert ? `${table}-new` : has(calls, "eq")?.[2]
        return { data: { id, ...(insert?.[1] ?? update?.[1]) }, error: null }
      }
      return { data: [], error: null }
    }
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("con sesión carga las 8 tablas y mapea las transacciones; las borradas van a la papelera", async () => {
    const loaded = []
    fake.respond = (table, calls) => {
      loaded.push(table)
      if (table === "transactions" && has(calls, "range")) {
        if (has(calls, "not")) {
          return { data: [{ id: "t2", tipo: "EGRESO", categoria: "COMIDA", concepto: "PAN", valor: "2", fecha: "2026-09-02T12:00:00Z", deleted_at: "2026-09-20T10:00:00Z" }], error: null }
        }
        return { data: [{ id: "t1", tipo: "EGRESO", categoria: "COMIDA", concepto: "MENU", valor: "12.50", fecha: "2026-09-01T12:00:00Z", deleted_at: null }], error: null }
      }
      return { data: [], error: null }
    }
    const { result } = renderHook(() => useData(), { wrapper: DataProvider })
    await act(async () => { fake.authCallback("INITIAL_SESSION", { user: { id: "u1" } }) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(new Set(loaded)).toEqual(new Set(["transactions", "budgets", "goals", "accounts", "investments", "debts", "subscriptions", "custom_categories"]))
    expect(result.current.txs).toHaveLength(1)
    expect(result.current.txs[0]).toMatchObject({ id: "t1", valor: 12.5, categoria: "COMIDA", deletedAt: null })
    expect(result.current.trash).toEqual([expect.objectContaining({ id: "t2", deletedAt: new Date("2026-09-20T10:00:00Z") })])
    // The active list excludes the trash; the trash query asks for deleted_at not null.
    const txQueries = fake.queries.filter((q) => q.table === "transactions" && has(q.calls, "select"))
    expect(txQueries.map((q) => has(q.calls, "is") ?? has(q.calls, "not"))).toEqual([["is", "deleted_at", null], ["not", "deleted_at", "is", null]])
  })

  it("al cargar elimina de verdad lo que lleva más de 30 días en la papelera", async () => {
    vi.useFakeTimers({ now: new Date("2026-09-30T12:00:00Z"), toFake: ["Date"] })
    try {
      await mountSignedInKeepingQueries()
      const purge = fake.queries.find((q) => q.table === "transactions" && has(q.calls, "delete"))
      expect(has(purge.calls, "lt")).toEqual(["lt", "deleted_at", "2026-08-31T12:00:00.000Z"])
    } finally {
      vi.useRealTimers()
    }
  })

  it("borrar una transacción la manda a la papelera; restaurar la devuelve; eliminar definitivamente y vaciar borran de verdad", async () => {
    fake.respond = (table, calls) => {
      const update = has(calls, "update")
      if (update && has(calls, "single")) {
        return { data: { id: has(calls, "eq")[2], tipo: "EGRESO", categoria: "COMIDA", concepto: "PAN", valor: 2, fecha: "2026-09-02T12:00:00Z", ...update[1] }, error: null }
      }
      if (has(calls, "insert")) return { data: { id: "t9", ...has(calls, "insert")[1] }, error: null }
      return { data: [], error: null }
    }
    const { result } = await mountSignedIn("u1")
    await act(() => result.current.addTx({ tipo: "EGRESO", categoria: "COMIDA", concepto: "PAN", valor: 2, date: new Date("2026-09-02T12:00:00Z") }))
    expect(result.current.txs).toHaveLength(1)

    await act(() => result.current.deleteTx("t9"))
    const soft = writes().find((q) => has(q.calls, "update"))
    expect(has(soft.calls, "update")[1].deleted_at).toEqual(expect.any(String))
    expect(soft.calls.filter((c) => c[0] === "eq")).toEqual([["eq", "id", "t9"], ["eq", "user_id", "u1"]])
    expect(writes().some((q) => has(q.calls, "delete"))).toBe(false)
    expect(result.current.txs).toEqual([])
    expect(result.current.trash).toEqual([expect.objectContaining({ id: "t9", deletedAt: expect.any(Date) })])

    await act(() => result.current.restoreTx("t9"))
    expect(result.current.trash).toEqual([])
    expect(result.current.txs).toEqual([expect.objectContaining({ id: "t9", deletedAt: null })])

    await act(() => result.current.deleteTx("t9"))
    await act(() => result.current.purgeTx("t9"))
    const hard = writes().find((q) => has(q.calls, "delete"))
    expect(hard.calls.filter((c) => ["eq", "not"].includes(c[0]))).toEqual([["eq", "id", "t9"], ["eq", "user_id", "u1"], ["not", "deleted_at", "is", null]])
    expect(result.current.trash).toEqual([])

    await act(() => result.current.emptyTrash())
    const empty = writes().filter((q) => has(q.calls, "delete")).at(-1)
    expect(empty.calls.filter((c) => ["eq", "not"].includes(c[0]))).toEqual([["eq", "user_id", "u1"], ["not", "deleted_at", "is", null]])
  })

  it("guardar una meta nueva inserta con el user_id de la sesión, sin llamar a auth.getUser()", async () => {
    const { result } = await mountSignedIn("u1")
    await act(() => result.current.saveGoal({ es: "Viaje", en: "Viaje", target: 1000, current: 0, deadline: null, color: "#38BDF8", icon: "Flight" }))

    const [q] = writes()
    expect(q.table).toBe("goals")
    expect(has(q.calls, "insert")[1]).toMatchObject({ user_id: "u1", label_es: "Viaje", target: 1000, icon: "Flight", deadline: null })
    expect(result.current.goals).toEqual([expect.objectContaining({ id: "goals-new", es: "Viaje", target: 1000, icon: "Flight" })])
    expect(fake.getUser).not.toHaveBeenCalled()
  })

  it("editar hace update por id y reemplaza el elemento", async () => {
    const { result } = await mountSignedIn()
    await act(() => result.current.saveAccount({ name: "BCP", type: "bank", balance: 10, color: "#000" }))
    await act(() => result.current.saveAccount({ id: "accounts-new", name: "BCP Ahorro", type: "bank", balance: 20, color: "#000" }))

    const update = writes().find((q) => has(q.calls, "update"))
    expect(has(update.calls, "eq")).toEqual(["eq", "id", "accounts-new"])
    expect(result.current.accounts).toEqual([expect.objectContaining({ id: "accounts-new", name: "BCP Ahorro", balance: 20 })])
  })

  it("borrar filtra por id y por user_id", async () => {
    const { result } = await mountSignedIn("u1")
    await act(() => result.current.saveDebt({ es: "Auto", en: "Auto", balance: 500, rate: 10, monthly: 50, remaining: 10, original_months: 12 }))
    await act(() => result.current.deleteDebt("debts-new"))

    const del = writes().find((q) => has(q.calls, "delete"))
    expect(del.calls.filter((c) => c[0] === "eq")).toEqual([["eq", "id", "debts-new"], ["eq", "user_id", "u1"]])
    expect(result.current.debts).toEqual([])
  })

  it("si Supabase devuelve error, lanza y no cambia el estado", async () => {
    const { result } = await mountSignedIn()
    fake.respond = () => ({ data: null, error: { message: "RLS", code: "42501" } })
    await expect(act(() => result.current.saveSubscription({ name: "Netflix", price: 40, cycle: "monthly", category: "STREAMING" })))
      .rejects.toMatchObject({ message: "RLS" })
    expect(result.current.subscriptions).toEqual([])
  })

  it("sin sesión, las mutaciones lanzan en vez de no hacer nada", async () => {
    const { result } = await mountSignedIn()
    await act(async () => { fake.authCallback("SIGNED_OUT", null) })
    await expect(act(() => result.current.saveGoal({ es: "X", en: "X", target: 1, current: 0 }))).rejects.toThrow(/sesión/)
    await expect(act(() => result.current.addTx({ tipo: "EGRESO", categoria: "COMIDA", concepto: "X", valor: 1, date: new Date() }))).rejects.toThrow(/sesión/)
    expect(writes()).toEqual([])
  })

  it("categoría personalizada: si falta la columna icon (PGRST204) reintenta sin ella", async () => {
    const { result } = await mountSignedIn("u1")
    let attempt = 0
    fake.respond = (table, calls) => {
      attempt++
      const row = has(calls, "insert")[1]
      if ("icon" in row) return { data: null, error: { code: "PGRST204", message: "Could not find the 'icon' column" } }
      return { data: { id: "cc1", ...row }, error: null }
    }
    await act(() => result.current.saveCustomCat({ nombre: "Gatos", tipo: "EGRESO", color: "#123456", icon: "Pets" }))
    expect(attempt).toBe(2)
    expect(result.current.customCats).toEqual([{ id: "cc1", user_id: "u1", nombre: "Gatos", tipo: "EGRESO", color: "#123456" }])
  })

  it("addTxs inserta en lotes de 500 con el user_id de la sesión y agrega todo al estado", async () => {
    fake.respond = (table, calls) => {
      const insert = has(calls, "insert")
      if (insert) return { data: insert[1].map((r, i) => ({ id: `n${i}`, ...r })), error: null }
      return { data: [], error: null }
    }
    const { result } = await mountSignedIn()
    const list = Array.from({ length: 1200 }, (_, i) => ({ tipo: "EGRESO", categoria: "COMIDA", concepto: `X${i}`, valor: 1, date: new Date(2026, 0, 1 + (i % 28)) }))
    let saved
    await act(async () => { saved = await result.current.addTxs(list) })
    expect(saved).toBe(1200)
    expect(writes().map((q) => has(q.calls, "insert")[1].length)).toEqual([500, 500, 200])
    expect(has(writes()[0].calls, "insert")[1][0]).toMatchObject({ user_id: "u1", concepto: "X0", fecha: list[0].date.toISOString() })
    expect(has(writes()[0].calls, "insert")[1][0]).not.toHaveProperty("anomaly")
    expect(result.current.txs).toHaveLength(1200)
    expect(fake.getUser).not.toHaveBeenCalled()
  })

  it("addTxs: si falla un lote, lanza con cuántas filas ya se guardaron y conserva esas", async () => {
    let n = 0
    fake.respond = (table, calls) => {
      const insert = has(calls, "insert")
      if (!insert) return { data: [], error: null }
      return ++n === 2 ? { data: null, error: { message: "boom" } } : { data: insert[1].map((r, i) => ({ id: `n${n}-${i}`, ...r })), error: null }
    }
    const { result } = await mountSignedIn()
    const list = Array.from({ length: 700 }, (_, i) => ({ tipo: "EGRESO", categoria: "COMIDA", concepto: `X${i}`, valor: 1, date: new Date(2026, 0, 2) }))
    let err
    await act(async () => { try { await result.current.addTxs(list) } catch (e) { err = e } })
    expect(err).toMatchObject({ message: "boom", saved: 500 })
    expect(result.current.txs).toHaveLength(500)
  })

  it("transacciones y presupuestos también usan el usuario de la sesión", async () => {
    const { result } = await mountSignedIn("u1")
    await act(() => result.current.addTx({ tipo: "EGRESO", categoria: "COMIDA", concepto: "MENU", valor: 15, date: new Date("2026-09-02T12:00:00Z") }))
    await act(() => result.current.setEditBudgets({ COMIDA: 500 }))

    const [insertTx, upsert] = writes()
    expect(has(insertTx.calls, "insert")[1]).toMatchObject({ user_id: "u1", valor: 15, fecha: "2026-09-02T12:00:00.000Z" })
    // The anomaly column is on its way out: nothing writes it any more.
    expect(has(insertTx.calls, "insert")[1]).not.toHaveProperty("anomaly")
    expect(has(upsert.calls, "upsert")[1]).toEqual([{ user_id: "u1", categoria: "COMIDA", monto: 500, periodo: "month" }])
    expect(result.current.editBudgets).toEqual({ COMIDA: 500 })

    // A period update is saved with every row and kept in state.
    await act(() => result.current.setEditBudgets((b) => ({ ...b, VIAJES: 1200 }), { VIAJES: "year" }))
    expect(has(writes().at(-1).calls, "upsert")[1]).toEqual([
      { user_id: "u1", categoria: "COMIDA", monto: 500, periodo: "month" },
      { user_id: "u1", categoria: "VIAJES", monto: 1200, periodo: "year" },
    ])
    expect(result.current.budgetPeriods).toEqual({ COMIDA: "month", VIAJES: "year" })
    expect(fake.getUser).not.toHaveBeenCalled()
  })
})
