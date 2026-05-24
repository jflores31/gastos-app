"use client"

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "../lib/supabase"
import { BUDGETS } from "../data/index.js"

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
    anomaly: row.anomaly ?? false,
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
    remaining: row.remaining,
    original_months: row.original_months,
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

export function DataProvider({ children }) {
  const [txs, setTxs] = useState([])
  const [editBudgets, setEditBudgetsState] = useState({ ...BUDGETS })
  const [goals, setGoals] = useState([])
  const [accounts, setAccounts] = useState([])
  const [investments, setInvestments] = useState([])
  const [debts, setDebts] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [customCats, setCustomCats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [
        { data: txData },
        { data: budgetData },
        { data: goalsData },
        { data: accountsData },
        { data: investmentsData },
        { data: debtsData },
        { data: subsData },
        { data: customCatsData },
      ] = await Promise.all([
        supabase.from("transactions").select("*").order("fecha", { ascending: true }),
        supabase.from("budgets").select("*"),
        supabase.from("goals").select("*").order("created_at"),
        supabase.from("accounts").select("*").order("created_at"),
        supabase.from("investments").select("*").order("created_at"),
        supabase.from("debts").select("*").order("created_at"),
        supabase.from("subscriptions").select("*").order("created_at"),
        supabase.from("custom_categories").select("*").order("created_at"),
      ])

      if (txData) setTxs(txData.map(mapRow))
      if (budgetData?.length) {
        const bm = Object.fromEntries(budgetData.map((b) => [b.categoria, Number(b.monto)]))
        setEditBudgetsState((prev) => ({ ...prev, ...bm }))
      }
      if (goalsData) setGoals(goalsData.map(mapGoal))
      if (accountsData) setAccounts(accountsData.map(mapAccount))
      if (investmentsData) setInvestments(investmentsData.map(mapInvestment))
      if (debtsData) setDebts(debtsData.map(mapDebt))
      if (subsData) setSubscriptions(subsData.map(mapSubscription))
      if (customCatsData) setCustomCats(customCatsData)

      setLoading(false)
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setTxs([])
        setEditBudgetsState({ ...BUDGETS })
        setGoals([])
        setAccounts([])
        setInvestments([])
        setDebts([])
        setSubscriptions([])
        setCustomCats([])
      }
      if (event === "SIGNED_IN") load()
    })

    return () => subscription.unsubscribe()
  }, [])

  const addTx = useCallback(async (tx) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        tipo: tx.tipo,
        categoria: tx.categoria,
        concepto: tx.concepto,
        valor: tx.valor,
        fecha: tx.date.toISOString(),
        anomaly: false,
      })
      .select()
      .single()

    if (!error && data) {
      setTxs((prev) => [...prev, mapRow(data)].sort((a, b) => a.date - b.date))
    }
  }, [])

  const updateTx = useCallback(async (tx) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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
      .select()
      .single()

    if (!error && data) {
      setTxs((prev) => prev.map((x) => x.id === tx.id ? mapRow(data) : x).sort((a, b) => a.date - b.date))
    }
  }, [])

  const deleteTx = useCallback(async (id) => {
    const supabase = createClient()
    await supabase.from("transactions").delete().eq("id", id)
    setTxs((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const saveCustomCat = useCallback(async (cat) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const row = { user_id: user.id, nombre: cat.nombre, tipo: cat.tipo, color: cat.color }

    if (cat.id) {
      const { data, error } = await supabase.from("custom_categories").update(row).eq("id", cat.id).select().single()
      if (!error && data) setCustomCats((prev) => prev.map((x) => x.id === cat.id ? data : x))
    } else {
      const { data, error } = await supabase.from("custom_categories").insert(row).select().single()
      if (!error && data) setCustomCats((prev) => [...prev, data])
    }
  }, [])

  const deleteCustomCat = useCallback(async (id) => {
    const supabase = createClient()
    await supabase.from("custom_categories").delete().eq("id", id)
    setCustomCats((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const setEditBudgets = useCallback(
    async (updater) => {
      const supabase = createClient()
      const newBudgets = typeof updater === "function" ? updater(editBudgets) : updater
      setEditBudgetsState(newBudgets)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const rows = Object.entries(newBudgets).map(([categoria, monto]) => ({
        user_id: user.id,
        categoria,
        monto: Number(monto),
      }))
      await supabase.from("budgets").upsert(rows, { onConflict: "user_id,categoria" })
    },
    [editBudgets]
  )

  // Goals CRUD
  const saveGoal = useCallback(async (goal) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const row = {
      user_id: user.id,
      label_es: goal.es,
      label_en: goal.en,
      target: goal.target,
      current_amount: goal.current,
      deadline: goal.deadline || null,
      color: goal.color,
      icon: goal.icon,
    }

    if (goal.id) {
      const { data, error } = await supabase.from("goals").update(row).eq("id", goal.id).select().single()
      if (!error && data) setGoals((prev) => prev.map((x) => x.id === goal.id ? mapGoal(data) : x))
    } else {
      const { data, error } = await supabase.from("goals").insert(row).select().single()
      if (!error && data) setGoals((prev) => [...prev, mapGoal(data)])
    }
  }, [])

  const deleteGoal = useCallback(async (id) => {
    const supabase = createClient()
    await supabase.from("goals").delete().eq("id", id)
    setGoals((prev) => prev.filter((x) => x.id !== id))
  }, [])

  // Accounts CRUD
  const saveAccount = useCallback(async (account) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const row = {
      user_id: user.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      color: account.color,
      account_limit: account.limit ?? null,
    }

    if (account.id) {
      const { data, error } = await supabase.from("accounts").update(row).eq("id", account.id).select().single()
      if (!error && data) setAccounts((prev) => prev.map((x) => x.id === account.id ? mapAccount(data) : x))
    } else {
      const { data, error } = await supabase.from("accounts").insert(row).select().single()
      if (!error && data) setAccounts((prev) => [...prev, mapAccount(data)])
    }
  }, [])

  const deleteAccount = useCallback(async (id) => {
    const supabase = createClient()
    await supabase.from("accounts").delete().eq("id", id)
    setAccounts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  // Investments CRUD
  const saveInvestment = useCallback(async (inv) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const row = {
      user_id: user.id,
      label_es: inv.es,
      label_en: inv.en,
      value: inv.value,
      return_rate: inv.return,
      type: inv.type,
    }

    if (inv.id) {
      const { data, error } = await supabase.from("investments").update(row).eq("id", inv.id).select().single()
      if (!error && data) setInvestments((prev) => prev.map((x) => x.id === inv.id ? mapInvestment(data) : x))
    } else {
      const { data, error } = await supabase.from("investments").insert(row).select().single()
      if (!error && data) setInvestments((prev) => [...prev, mapInvestment(data)])
    }
  }, [])

  const deleteInvestment = useCallback(async (id) => {
    const supabase = createClient()
    await supabase.from("investments").delete().eq("id", id)
    setInvestments((prev) => prev.filter((x) => x.id !== id))
  }, [])

  // Debts CRUD
  const saveDebt = useCallback(async (debt) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const row = {
      user_id: user.id,
      label_es: debt.es,
      label_en: debt.en,
      balance: debt.balance,
      rate: debt.rate,
      monthly: debt.monthly,
      remaining: debt.remaining,
      original_months: debt.original_months,
    }

    if (debt.id) {
      const { data, error } = await supabase.from("debts").update(row).eq("id", debt.id).select().single()
      if (!error && data) setDebts((prev) => prev.map((x) => x.id === debt.id ? mapDebt(data) : x))
    } else {
      const { data, error } = await supabase.from("debts").insert(row).select().single()
      if (!error && data) setDebts((prev) => [...prev, mapDebt(data)])
    }
  }, [])

  const deleteDebt = useCallback(async (id) => {
    const supabase = createClient()
    await supabase.from("debts").delete().eq("id", id)
    setDebts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  // Subscriptions CRUD
  const saveSubscription = useCallback(async (sub) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const row = {
      user_id: user.id,
      name: sub.name,
      price: sub.price,
      cycle: sub.cycle,
      category: sub.category,
    }

    if (sub.id) {
      const { data, error } = await supabase.from("subscriptions").update(row).eq("id", sub.id).select().single()
      if (!error && data) setSubscriptions((prev) => prev.map((x) => x.id === sub.id ? mapSubscription(data) : x))
    } else {
      const { data, error } = await supabase.from("subscriptions").insert(row).select().single()
      if (!error && data) setSubscriptions((prev) => [...prev, mapSubscription(data)])
    }
  }, [])

  const deleteSubscription = useCallback(async (id) => {
    const supabase = createClient()
    await supabase.from("subscriptions").delete().eq("id", id)
    setSubscriptions((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      txs, addTx, updateTx, deleteTx,
      editBudgets, setEditBudgets,
      customCats, saveCustomCat, deleteCustomCat,
      goals, saveGoal, deleteGoal,
      accounts, saveAccount, deleteAccount,
      investments, saveInvestment, deleteInvestment,
      debts, saveDebt, deleteDebt,
      subscriptions, saveSubscription, deleteSubscription,
      loading,
    }),
    [
      txs, addTx, updateTx, deleteTx,
      editBudgets, setEditBudgets,
      customCats, saveCustomCat, deleteCustomCat,
      goals, saveGoal, deleteGoal,
      accounts, saveAccount, deleteAccount,
      investments, saveInvestment, deleteInvestment,
      debts, saveDebt, deleteDebt,
      subscriptions, saveSubscription, deleteSubscription,
      loading,
    ]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
