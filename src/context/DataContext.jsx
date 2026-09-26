"use client"

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { createClient } from "../lib/supabase"
import { flagAnomalies } from "../data/helpers.js"
import { fetchAllRows } from "../data/fetchAllRows.js"
import { reportError } from "../lib/reportError.js"

const DataContext = createContext(null)

function mapRow(row) {
  const d = new Date(row.fecha)
  return {
    id: row.id,
    tipo: row.tipo,
    categoria: row.categoria,
    concepto: row.concepto,
    valor: Number(row.valor),
    date: d,
    dia: d.getDate(),
    mes: d.getMonth(),
    año: d.getFullYear(),
    // Detection lives client-side in flagAnomalies() (see flaggedTxs below); the
    // DB column is always false, so seed false and let flagAnomalies be the source of truth.
    anomaly: false,
  }
}

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
    balance: Number(row.balance),
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
  color: a.color,
  account_limit: a.limit ?? null,
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

// custom_categories.icon only exists after supabase/migrations/upgrade_0.0.1.sql has run.
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

export function DataProvider({ children }) {
  const [txs, setTxs] = useState([])
  const [editBudgets, setEditBudgetsState] = useState({})
  const [goals, setGoals] = useState([])
  const [accounts, setAccounts] = useState([])
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
    // Dedupe: the 8 queries should run once per signed-in user, not on every
    // auth event (TOKEN_REFRESHED fires periodically). Reset on sign-out and on
    // a failed load so the next event retries.
    let loadedForUser = null

    async function load() {
      try {
        setLoading(true)
        setLoadError(null)
        const results = await Promise.all([
          fetchAllRows(() =>
            supabase.from("transactions").select("*").order("fecha", { ascending: true }).order("id", { ascending: true })
          ),
          supabase.from("budgets").select("*"),
          supabase.from("goals").select("*").order("created_at"),
          supabase.from("accounts").select("*").order("created_at"),
          supabase.from("investments").select("*").order("created_at"),
          supabase.from("debts").select("*").order("created_at"),
          supabase.from("subscriptions").select("*").order("created_at"),
          supabase.from("custom_categories").select("*").order("created_at"),
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
        ] = results

        const errors = [e1, e2, e3, e4, e5, e6, e7, e8].filter(Boolean)
        errors.forEach((e, i) => console.error(`[DataContext] query error [${i}]:`, e.message))
        if (errors.length > 0) reportError(errors[0], { where: "DataContext.load", failedQueries: errors.length })
        if (errors.length > 0) {
          setLoadError(errors[0].message)
          loadedForUser = null // let the next auth event retry
        }

        if (txData) setTxs(txData.map(mapRow))
        if (budgetData) {
          setEditBudgetsState(Object.fromEntries(budgetData.map((b) => [b.categoria, Number(b.monto)])))
        }
        if (goalsData) setGoals(goalsData.map(mapGoal))
        if (accountsData) setAccounts(accountsData.map(mapAccount))
        if (investmentsData) setInvestments(investmentsData.map(mapInvestment))
        if (debtsData) setDebts(debtsData.map(mapDebt))
        if (subsData) setSubscriptions(subsData.map(mapSubscription))
        if (customCatsData) setCustomCats(customCatsData)
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
        setEditBudgetsState({})
        setGoals([])
        setAccounts([])
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
      // refreshes don't re-run the 8 queries.
      const sessionUser = session?.user
      userIdRef.current = sessionUser?.id ?? null
      if (sessionUser) {
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
        fecha: tx.date.toISOString(),
        anomaly: false,
      })
      .select()
      .single()

    if (error) throw error
    if (data) setTxs((prev) => [...prev, mapRow(data)].sort((a, b) => a.date - b.date))
  }, [supabase, requireUserId])

  const updateTx = useCallback(async (tx) => {
    const { data, error } = await supabase
      .from("transactions")
      .update({
        tipo: tx.tipo,
        categoria: tx.categoria,
        concepto: tx.concepto,
        valor: tx.valor,
        fecha: tx.date.toISOString(),
      })
      .eq("id", tx.id)
      .eq("user_id", requireUserId())
      .select()
      .single()

    if (error) throw error
    if (data) setTxs((prev) => prev.map((x) => x.id === tx.id ? mapRow(data) : x).sort((a, b) => a.date - b.date))
  }, [supabase, requireUserId])

  const deleteTx = useCallback(async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", requireUserId())
    if (error) throw error
    setTxs((prev) => prev.filter((x) => x.id !== id))
  }, [supabase, requireUserId])

  // Budgets: one row per category, stored as { categoria: monto } in state.
  const setEditBudgets = useCallback(
    async (updater) => {
      const newBudgets = typeof updater === "function" ? updater(editBudgets) : updater
      const userId = requireUserId()

      const rows = Object.entries(newBudgets).map(([categoria, monto]) => ({
        user_id: userId,
        categoria,
        monto: Number(monto),
      }))
      if (rows.length > 0) {
        const { error } = await supabase.from("budgets").upsert(rows, { onConflict: "user_id,categoria" })
        if (error) throw error
      }
      setEditBudgetsState(newBudgets)
    },
    [supabase, requireUserId, editBudgets]
  )

  const deleteBudgetCat = useCallback(async (cat) => {
    const { error } = await supabase.from("budgets").delete().eq("user_id", requireUserId()).eq("categoria", cat)
    if (error) throw error
    setEditBudgetsState((prev) => {
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
  const { save: saveAccount, remove: deleteAccount } = useTableCrud({
    ...crud, table: "accounts", setList: setAccounts, toRow: accountToRow, fromRow: mapAccount,
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

  const value = useMemo(
    () => ({
      txs: flaggedTxs, addTx, updateTx, deleteTx,
      editBudgets, setEditBudgets, deleteBudgetCat,
      customCats, saveCustomCat, deleteCustomCat,
      goals, saveGoal, deleteGoal,
      accounts, saveAccount, deleteAccount,
      investments, saveInvestment, deleteInvestment,
      debts, saveDebt, deleteDebt,
      subscriptions, saveSubscription, deleteSubscription,
      loading, loadError,
    }),
    [
      flaggedTxs, addTx, updateTx, deleteTx,
      editBudgets, setEditBudgets, deleteBudgetCat,
      customCats, saveCustomCat, deleteCustomCat,
      goals, saveGoal, deleteGoal,
      accounts, saveAccount, deleteAccount,
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
