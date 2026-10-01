"use client"

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { flagAnomalies } from "@/features/transactions/domain/anomalies"
import { accountBalance } from "@/data/helpers"
import { fetchAllRows } from "@/lib/supabase/fetchAllRows"
import { reportError } from "@/lib/reportError"
import { needsSecondStep } from "@/lib/mfa"

const DataContext = createContext(null)

function mapRow(row) {
  const d = new Date(row.fecha)
  return {
    id: row.id,
    tipo: row.tipo,
    categoria: row.categoria,
    concepto: row.concepto,
    valor: Number(row.valor),
    // The currency it was entered in, what was typed and that day's rate (units per
    // 1 PEN). In PEN, and in rows from before the column existed, the original is `valor`.
    moneda: row.moneda ?? "PEN",
    montoOriginal: row.monto_original == null ? null : Number(row.monto_original),
    tasa: row.tasa == null ? null : Number(row.tasa),
    cuentaId: row.cuenta_id ?? null,
    date: d,
    dia: d.getDate(),
    mes: d.getMonth(),
    año: d.getFullYear(),
    // Detection lives client-side in flagAnomalies() (see flaggedTxs below).
    anomaly: false,
    // Set while the transaction is in the trash (soft delete).
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  }
}

// Deleted transactions stay in the trash this long, then load() removes them for good.
export const TRASH_DAYS = 30

// The currency columns of a transaction being saved (see mapRow). Sent on every write,
// so an edit back to PEN clears the original amount and the rate.
const currencyColumns = (tx) => (tx.moneda && tx.moneda !== "PEN"
  ? { moneda: tx.moneda, monto_original: tx.montoOriginal, tasa: tx.tasa }
  : { moneda: "PEN", monto_original: null, tasa: null })

function mapGoal(row) {
  return {
    id: row.id,
    es: row.label_es,
    en: row.label_en,
    target: Number(row.target),
    current: Number(row.current_amount),
    deadline: row.deadline,
    color: row.color,
    icon: row.icon,
  }
}

function mapAccount(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    // As typed, as of balanceAt; the current balance adds what moved later (accountBalance).
    balance: Number(row.balance),
    balanceAt: row.balance_at ? new Date(row.balance_at) : undefined,
    color: row.color,
    limit: row.account_limit != null ? Number(row.account_limit) : undefined,
  }
}

function mapInvestment(row) {
  return {
    id: row.id,
    es: row.label_es,
    en: row.label_en,
    value: Number(row.value),
    return: Number(row.return_rate),
    type: row.type,
  }
}

function mapDebt(row) {
  return {
    id: row.id,
    es: row.label_es,
    en: row.label_en,
    balance: Number(row.balance),
    rate: Number(row.rate),
    monthly: Number(row.monthly),
    remaining: Number(row.remaining) || 0,
    original_months: Number(row.original_months) || 0,
  }
}

function mapSubscription(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    cycle: row.cycle,
    category: row.category,
  }
}

// Row sent to Supabase for each entity (the inverse of the map* functions above).
// user_id is added by useTableCrud from the current session.
const goalToRow = (g) => ({
  label_es: g.es,
  label_en: g.en,
  target: g.target,
  current_amount: g.current,
  deadline: g.deadline || null,
  color: g.color,
  icon: g.icon,
})
const accountToRow = (a) => ({
  name: a.name,
  type: a.type,
  balance: a.balance,
  // Set by the browser, like the dates of the transactions it is compared with.
  balance_at: a.balanceAt?.toISOString(),
  color: a.color,
  account_limit: a.limit ?? null,
})

function mapTransfer(row) {
  return {
    id: row.id,
    origen: row.origen ?? null,
    destino: row.destino ?? null,
    monto: Number(row.monto),
    date: new Date(row.fecha),
    nota: row.nota ?? null,
  }
}
const transferToRow = (tr) => ({
  origen: tr.origen,
  destino: tr.destino,
  monto: tr.monto,
  fecha: tr.date.toISOString(),
  nota: tr.nota || null,
})
const investmentToRow = (inv) => ({
  label_es: inv.es,
  label_en: inv.en,
  value: inv.value,
  return_rate: inv.return,
  type: inv.type,
})
const debtToRow = (d) => ({
  label_es: d.es,
  label_en: d.en,
  balance: d.balance,
  rate: d.rate,
  monthly: d.monthly,
  remaining: d.remaining,
  original_months: d.original_months,
})
const subscriptionToRow = (sub) => ({
  name: sub.name,
  price: sub.price,
  cycle: sub.cycle,
  category: sub.category,
})
const customCatToRow = (c) => ({ nombre: c.nombre, tipo: c.tipo, color: c.color, icon: c.icon ?? null })
const keepRow = (row) => row // custom categories are kept as raw rows

// custom_categories.icon is missing in a DB created before 0.0.1 that hasn't run
// supabase/schema.sql yet.
const CUSTOM_CAT_OPTIONAL_COLUMNS = ["icon"]

// Save (update when the item has an id, insert otherwise) and delete for a table whose rows
// map 1:1 to a list in state. Writes throw on error before touching state, so the callers'
// try/catch can show feedback. `optionalColumns` are dropped and the write retried once when
// PostgREST reports an unknown column (PGRST204), so saving works before a migration is run.
function useTableCrud({ supabase, requireUserId, table, setList, toRow, fromRow, optionalColumns }) {
  const save = useCallback(async (item) => {
    const row = { user_id: requireUserId(), ...toRow(item) }
    const write = (r) => item.id
      ? supabase.from(table).update(r).eq("id", item.id).select().single()
      : supabase.from(table).insert(r).select().single()

    let { data, error } = await write(row)
    if (error?.code === "PGRST204" && optionalColumns?.some((c) => c in row)) {
      const reduced = { ...row }
      optionalColumns.forEach((c) => delete reduced[c])
      ;({ data, error } = await write(reduced))
    }
    if (error) throw error
    if (data) {
      const mapped = fromRow(data)
      setList((prev) => item.id ? prev.map((x) => x.id === item.id ? mapped : x) : [...prev, mapped])
    }
  }, [supabase, requireUserId, table, setList, toRow, fromRow, optionalColumns])

  const remove = useCallback(async (id) => {
    const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", requireUserId())
    if (error) throw error
    setList((prev) => prev.filter((x) => x.id !== id))
  }, [supabase, requireUserId, table, setList])

  return { save, remove }
}

// Rows per insert request in addTxs() (CSV import).
export const IMPORT_CHUNK = 500

export function DataProvider({ children }) {
  const [txs, setTxs] = useState([])
  const [trash, setTrash] = useState([]) // deleted transactions, newest deletion first
  const [editBudgets, setEditBudgetsState] = useState({})
  const [budgetPeriods, setBudgetPeriods] = useState({}) // { categoria: "week" | "month" | "year" }
  const [goals, setGoals] = useState([])
  const [accounts, setAccounts] = useState([])
  const [transfers, setTransfers] = useState([])
  const [investments, setInvestments] = useState([])
  const [debts, setDebts] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [customCats, setCustomCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // One client for the provider (createBrowserClient is a singleton anyway).
  const supabase = useMemo(() => createClient(), [])

  // The signed-in user's id, taken from the auth events below. Mutations read it instead of
  // calling supabase.auth.getUser(), which made a request to the Auth server before every
  // write. RLS still checks the JWT on the server, so a stale id can't write another user's rows.
  const userIdRef = useRef(null)
  const requireUserId = useCallback(() => {
    const id = userIdRef.current
    // Throw instead of silently returning: callers catch it and show an error toast rather
    // than a false "saved".
    if (!id) throw new Error("No hay sesión activa. Vuelve a iniciar sesión.")
    return id
  }, [])

  useEffect(() => {
    // Dedupe: the load queries should run once per signed-in user, not on every
    // auth event (TOKEN_REFRESHED fires periodically). Reset on sign-out and on
    // a failed load so the next event retries.
    let loadedForUser = null

    async function load() {
      try {
        setLoading(true)
        setLoadError(null)
        // Trash older than TRASH_DAYS is deleted for good before loading. A failure
        // here only leaves it for the next load.
        const cutoff = new Date(Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000).toISOString()
        const { error: purgeError } = await supabase.from("transactions").delete().lt("deleted_at", cutoff)
        if (purgeError) console.error("[DataContext] trash purge:", purgeError.message)

        const results = await Promise.all([
          fetchAllRows(() =>
            supabase.from("transactions").select("*").is("deleted_at", null).order("fecha", { ascending: true }).order("id", { ascending: true })
          ),
          supabase.from("budgets").select("*"),
          supabase.from("goals").select("*").order("created_at"),
          supabase.from("accounts").select("*").order("created_at"),
          supabase.from("investments").select("*").order("created_at"),
          supabase.from("debts").select("*").order("created_at"),
          supabase.from("subscriptions").select("*").order("created_at"),
          supabase.from("custom_categories").select("*").order("created_at"),
          fetchAllRows(() =>
            supabase.from("transactions").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false }).order("id", { ascending: true })
          ),
          // Every transfer counts for the balances, so all pages.
          fetchAllRows(() => supabase.from("transfers").select("*").order("fecha", { ascending: true }).order("id", { ascending: true })),
        ])

        const [
          { data: txData, error: e1 },
          { data: budgetData, error: e2 },
          { data: goalsData, error: e3 },
          { data: accountsData, error: e4 },
          { data: investmentsData, error: e5 },
          { data: debtsData, error: e6 },
          { data: subsData, error: e7 },
          { data: customCatsData, error: e8 },
          { data: trashData, error: e9 },
          { data: transfersData, error: e10 },
        ] = results

        const errors = [e1, e2, e3, e4, e5, e6, e7, e8, e9, e10].filter(Boolean)
        errors.forEach((e, i) => console.error(`[DataContext] query error [${i}]:`, e.message))
        if (errors.length > 0) reportError(errors[0], { where: "DataContext.load", failedQueries: errors.length })
        if (errors.length > 0) {
          setLoadError(errors[0].message)
          loadedForUser = null // let the next auth event retry
        }

        if (txData) setTxs(txData.map(mapRow))
        if (budgetData) {
          setEditBudgetsState(Object.fromEntries(budgetData.map((b) => [b.categoria, Number(b.monto)])))
          setBudgetPeriods(Object.fromEntries(budgetData.map((b) => [b.categoria, b.periodo ?? "month"])))
        }
        if (goalsData) setGoals(goalsData.map(mapGoal))
        if (accountsData) setAccounts(accountsData.map(mapAccount))
        if (investmentsData) setInvestments(investmentsData.map(mapInvestment))
        if (debtsData) setDebts(debtsData.map(mapDebt))
        if (subsData) setSubscriptions(subsData.map(mapSubscription))
        if (customCatsData) setCustomCats(customCatsData)
        if (trashData) setTrash(trashData.map(mapRow))
        if (transfersData) setTransfers(transfersData.map(mapTransfer))
      } catch (err) {
        console.error("[DataContext] load() uncaught error:", err)
        reportError(err, { where: "DataContext.load" })
        setLoadError(err?.message ?? "Error desconocido")
        loadedForUser = null // let the next auth event retry
      } finally {
        setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        userIdRef.current = null
        loadedForUser = null
        setTxs([])
        setTrash([])
        setEditBudgetsState({})
        setBudgetPeriods({})
        setGoals([])
        setAccounts([])
        setTransfers([])
        setInvestments([])
        setDebts([])
        setSubscriptions([])
        setCustomCats([])
        setLoadError(null)
        setLoading(false)
        return
      }
      // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED and USER_UPDATED all carry
      // the session. Load from whichever event first brings a usable session
      // (not only INITIAL_SESSION, which can arrive empty on the first init and
      // never retry → the "refresh twice" bug). Dedupe so periodic token
      // refreshes don't re-run the load queries.
      const sessionUser = session?.user
      userIdRef.current = sessionUser?.id ?? null
      if (sessionUser) {
        // Two-step verification: the data waits for the code (MFA_CHALLENGE_VERIFIED
        // brings the aal2 session); before it the database would return nothing.
        if (needsSecondStep(sessionUser, session.access_token)) return
        if (loadedForUser !== sessionUser.id) {
          loadedForUser = sessionUser.id
          load()
        }
      } else if (event === "INITIAL_SESSION") {
        setLoading(false) // signed-out initial load: stop the spinner
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Transactions: kept sorted by date after every write.
  const addTx = useCallback(async (tx) => {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: requireUserId(),
        tipo: tx.tipo,
        categoria: tx.categoria,
        concepto: tx.concepto,
        valor: tx.valor,
        ...currencyColumns(tx),
        cuenta_id: tx.cuentaId ?? null,
        fecha: tx.date.toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    if (data) setTxs((prev) => [...prev, mapRow(data)].sort((a, b) => a.date - b.date))
  }, [supabase, requireUserId])

  // Bulk insert (CSV import) in chunks of IMPORT_CHUNK rows, one request each. Each
  // chunk is all or nothing; if one fails, the error carries how many rows were
  // already saved (`error.saved`) and those stay in state.
  const addTxs = useCallback(async (list) => {
    const userId = requireUserId()
    let saved = 0
    for (let i = 0; i < list.length; i += IMPORT_CHUNK) {
      const rows = list.slice(i, i + IMPORT_CHUNK).map((tx) => ({
        user_id: userId,
        tipo: tx.tipo,
        categoria: tx.categoria,
        concepto: tx.concepto,
        valor: tx.valor,
        ...currencyColumns(tx),
        cuenta_id: tx.cuentaId ?? null,
        fecha: tx.date.toISOString(),
      }))
      const { data, error } = await supabase.from("transactions").insert(rows).select()
      if (error) throw Object.assign(new Error(error.message), { saved })
      saved += data?.length ?? 0
      if (data?.length) setTxs((prev) => [...prev, ...data.map(mapRow)].sort((a, b) => a.date - b.date))
    }
    return saved
  }, [supabase, requireUserId])

  const updateTx = useCallback(async (tx) => {
    const { data, error } = await supabase
      .from("transactions")
      .update({
        tipo: tx.tipo,
        categoria: tx.categoria,
        concepto: tx.concepto,
        valor: tx.valor,
        ...currencyColumns(tx),
        cuenta_id: tx.cuentaId ?? null,
        fecha: tx.date.toISOString(),
      })
      .eq("id", tx.id)
      .eq("user_id", requireUserId())
      .select()
      .single()

    if (error) throw error
    if (data) setTxs((prev) => prev.map((x) => x.id === tx.id ? mapRow(data) : x).sort((a, b) => a.date - b.date))
  }, [supabase, requireUserId])

  // Deleting moves the transaction to the trash (deleted_at); restoreTx() brings it back.
  const deleteTx = useCallback(async (id) => {
    const { data, error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", requireUserId())
      .select()
      .single()
    if (error) throw error
    setTxs((prev) => prev.filter((x) => x.id !== id))
    if (data) setTrash((prev) => [mapRow(data), ...prev.filter((x) => x.id !== id)])
  }, [supabase, requireUserId])

  const restoreTx = useCallback(async (id) => {
    const { data, error } = await supabase
      .from("transactions")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("user_id", requireUserId())
      .select()
      .single()
    if (error) throw error
    setTrash((prev) => prev.filter((x) => x.id !== id))
    if (data) setTxs((prev) => [...prev.filter((x) => x.id !== id), mapRow(data)].sort((a, b) => a.date - b.date))
  }, [supabase, requireUserId])

  // Permanent delete, only from the trash.
  const purgeTx = useCallback(async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", requireUserId()).not("deleted_at", "is", null)
    if (error) throw error
    setTrash((prev) => prev.filter((x) => x.id !== id))
  }, [supabase, requireUserId])

  const emptyTrash = useCallback(async () => {
    const { error } = await supabase.from("transactions").delete().eq("user_id", requireUserId()).not("deleted_at", "is", null)
    if (error) throw error
    setTrash([])
  }, [supabase, requireUserId])

  // Budgets: one row per category, stored as { categoria: monto } plus
  // budgetPeriods { categoria: periodo } in state. `periodUpdates` changes the period of
  // some categories (new ones default to "month").
  const setEditBudgets = useCallback(
    async (updater, periodUpdates = {}) => {
      const newBudgets = typeof updater === "function" ? updater(editBudgets) : updater
      const newPeriods = { ...budgetPeriods, ...periodUpdates }
      const userId = requireUserId()

      const rows = Object.entries(newBudgets).map(([categoria, monto]) => ({
        user_id: userId,
        categoria,
        monto: Number(monto),
        periodo: newPeriods[categoria] ?? "month",
      }))
      if (rows.length > 0) {
        const { error } = await supabase.from("budgets").upsert(rows, { onConflict: "user_id,categoria" })
        if (error) throw error
      }
      setEditBudgetsState(newBudgets)
      setBudgetPeriods(Object.fromEntries(rows.map((r) => [r.categoria, r.periodo])))
    },
    [supabase, requireUserId, editBudgets, budgetPeriods]
  )

  const deleteBudgetCat = useCallback(async (cat) => {
    const { error } = await supabase.from("budgets").delete().eq("user_id", requireUserId()).eq("categoria", cat)
    if (error) throw error
    setEditBudgetsState((prev) => {
      const n = { ...prev }
      delete n[cat]
      return n
    })
    setBudgetPeriods((prev) => {
      const n = { ...prev }
      delete n[cat]
      return n
    })
  }, [supabase, requireUserId])

  // Everything else: generic save/delete.
  const crud = { supabase, requireUserId }
  const { save: saveCustomCat, remove: deleteCustomCat } = useTableCrud({
    ...crud, table: "custom_categories", setList: setCustomCats, toRow: customCatToRow, fromRow: keepRow,
    optionalColumns: CUSTOM_CAT_OPTIONAL_COLUMNS,
  })
  const { save: saveGoal, remove: deleteGoal } = useTableCrud({
    ...crud, table: "goals", setList: setGoals, toRow: goalToRow, fromRow: mapGoal,
  })
  const { save: saveAccount, remove: removeAccount } = useTableCrud({
    ...crud, table: "accounts", setList: setAccounts, toRow: accountToRow, fromRow: mapAccount,
  })
  // The database unlinks the deleted account's transactions and transfers (ON DELETE SET
  // NULL); mirror that, so the other accounts' balances stay as they were.
  const deleteAccount = useCallback(async (id) => {
    await removeAccount(id)
    const unlink = (list) => list.map((t) => (t.cuentaId === id ? { ...t, cuentaId: null } : t))
    setTxs(unlink)
    setTrash(unlink)
    setTransfers((prev) => prev.map((tr) => (tr.origen === id || tr.destino === id
      ? { ...tr, origen: tr.origen === id ? null : tr.origen, destino: tr.destino === id ? null : tr.destino }
      : tr)))
  }, [removeAccount])
  const { save: saveTransfer, remove: deleteTransfer } = useTableCrud({
    ...crud, table: "transfers", setList: setTransfers, toRow: transferToRow, fromRow: mapTransfer,
  })
  const { save: saveInvestment, remove: deleteInvestment } = useTableCrud({
    ...crud, table: "investments", setList: setInvestments, toRow: investmentToRow, fromRow: mapInvestment,
  })
  const { save: saveDebt, remove: deleteDebt } = useTableCrud({
    ...crud, table: "debts", setList: setDebts, toRow: debtToRow, fromRow: mapDebt,
  })
  const { save: saveSubscription, remove: deleteSubscription } = useTableCrud({
    ...crud, table: "subscriptions", setList: setSubscriptions, toRow: subscriptionToRow, fromRow: mapSubscription,
  })

  // Outlier detection lives client-side (the DB anomaly column is always false).
  // Recomputed whenever txs change so the score, insights and the ⚠ row flag agree.
  const flaggedTxs = useMemo(() => flagAnomalies(txs), [txs])
  // Each account with its balance today (`current`); `balance` stays the typed one.
  const accountsWithBalance = useMemo(
    () => accounts.map((a) => ({ ...a, current: accountBalance(a, txs, transfers) })),
    [accounts, txs, transfers],
  )

  const value = useMemo(
    () => ({
      txs: flaggedTxs, addTx, addTxs, updateTx, deleteTx,
      trash, restoreTx, purgeTx, emptyTrash,
      editBudgets, budgetPeriods, setEditBudgets, deleteBudgetCat,
      customCats, saveCustomCat, deleteCustomCat,
      goals, saveGoal, deleteGoal,
      accounts: accountsWithBalance, saveAccount, deleteAccount,
      transfers, saveTransfer, deleteTransfer,
      investments, saveInvestment, deleteInvestment,
      debts, saveDebt, deleteDebt,
      subscriptions, saveSubscription, deleteSubscription,
      loading, loadError,
    }),
    [
      flaggedTxs, addTx, addTxs, updateTx, deleteTx,
      trash, restoreTx, purgeTx, emptyTrash,
      editBudgets, budgetPeriods, setEditBudgets, deleteBudgetCat,
      customCats, saveCustomCat, deleteCustomCat,
      goals, saveGoal, deleteGoal,
      accountsWithBalance, saveAccount, deleteAccount,
      transfers, saveTransfer, deleteTransfer,
      investments, saveInvestment, deleteInvestment,
      debts, saveDebt, deleteDebt,
      subscriptions, saveSubscription, deleteSubscription,
      loading, loadError,
    ]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
