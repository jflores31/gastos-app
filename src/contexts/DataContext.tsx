"use client"

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchAllRows } from "@/lib/supabase/fetchAllRows"
import { reportError } from "@/lib/reportError"
import type { Account, Budgets, CustomCategory, Debt, Goal, Investment, Subscription, Transaction, Transfer } from "@/types/domain"
import { flagAnomalies } from "@/features/transactions/domain/anomalies"
import { accountBalance } from "@/features/accounts/domain/balance"
import { needsSecondStep } from "@/features/auth/domain/mfa"
import { transactionFromRow, TRASH_DAYS } from "@/features/transactions/data/transactions"
import { useTransactionMutations } from "@/features/transactions/data/useTransactionMutations"
import { budgetsFromRows } from "@/features/budgets/data/budgets"
import type { BudgetPeriods } from "@/features/budgets/data/budgets"
import { useBudgetMutations } from "@/features/budgets/data/useBudgetMutations"
import { goalsTable, goalFromRow } from "@/features/goals/data/goals"
import { accountsTable, accountFromRow } from "@/features/accounts/data/accounts"
import { transfersTable, transferFromRow } from "@/features/accounts/data/transfers"
import { investmentsTable, investmentFromRow } from "@/features/investments/data/investments"
import { debtsTable, debtFromRow } from "@/features/debts/data/debts"
import { subscriptionsTable, subscriptionFromRow } from "@/features/subscriptions/data/subscriptions"
import { customCategoriesTable } from "@/features/categories/data/customCategories"
import { useTableCrud } from "./useTableCrud"

// The only door to the database: state of the 9 tables for the signed-in user, loaded once
// per user, plus their writes. Each table's mapping and queries live in its feature's data/
// module; this provider holds the state, the auth subscription and the load.
function useDataValue() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [trash, setTrash] = useState<Transaction[]>([]) // deleted transactions, newest deletion first
  const [editBudgets, setEditBudgetsState] = useState<Budgets>({})
  const [budgetPeriods, setBudgetPeriods] = useState<BudgetPeriods>({}) // { categoria: "week" | "month" | "year" }
  const [goals, setGoals] = useState<Goal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [customCats, setCustomCats] = useState<CustomCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // One client for the provider (createBrowserClient is a singleton anyway).
  const supabase = useMemo(() => createClient(), [])

  // The signed-in user's id, taken from the auth events below. Mutations read it instead of
  // calling supabase.auth.getUser(), which made a request to the Auth server before every
  // write. RLS still checks the JWT on the server, so a stale id can't write another user's rows.
  const userIdRef = useRef<string | null>(null)
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
    let loadedForUser: string | null = null

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

        // PostgREST errors; fetchAllRows passes them through untyped.
        const errors = [e1, e2, e3, e4, e5, e6, e7, e8, e9, e10].filter((e) => !!e) as { message: string }[]
        errors.forEach((e, i) => console.error(`[DataContext] query error [${i}]:`, e.message))
        if (errors.length > 0) reportError(errors[0], { where: "DataContext.load", failedQueries: errors.length })
        if (errors.length > 0) {
          setLoadError(errors[0].message)
          loadedForUser = null // let the next auth event retry
        }

        if (txData) setTxs(txData.map(transactionFromRow))
        if (budgetData) {
          const { amounts, periods } = budgetsFromRows(budgetData)
          setEditBudgetsState(amounts)
          setBudgetPeriods(periods)
        }
        if (goalsData) setGoals(goalsData.map(goalFromRow))
        if (accountsData) setAccounts(accountsData.map(accountFromRow))
        if (investmentsData) setInvestments(investmentsData.map(investmentFromRow))
        if (debtsData) setDebts(debtsData.map(debtFromRow))
        if (subsData) setSubscriptions(subsData.map(subscriptionFromRow))
        if (customCatsData) setCustomCats(customCatsData)
        if (trashData) setTrash(trashData.map(transactionFromRow))
        if (transfersData) setTransfers(transfersData.map(transferFromRow))
      } catch (err) {
        console.error("[DataContext] load() uncaught error:", err)
        reportError(err, { where: "DataContext.load" })
        setLoadError((err as Error)?.message ?? "Error desconocido")
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
        if (needsSecondStep(sessionUser, session!.access_token)) return
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

  const crud = { supabase, requireUserId }
  // Transactions (kept sorted by date) and the trash.
  const { addTx, addTxs, updateTx, deleteTx, restoreTx, purgeTx, emptyTrash } = useTransactionMutations({ ...crud, setTxs, setTrash })
  const { setEditBudgets, deleteBudgetCat } = useBudgetMutations({ ...crud, editBudgets, budgetPeriods, setEditBudgetsState, setBudgetPeriods })

  // Everything else: generic save/delete.
  const { save: saveCustomCat, remove: deleteCustomCat } = useTableCrud({ ...crud, ...customCategoriesTable, setList: setCustomCats })
  const { save: saveGoal, remove: deleteGoal } = useTableCrud({ ...crud, ...goalsTable, setList: setGoals })
  const { save: saveAccount, remove: removeAccount } = useTableCrud({ ...crud, ...accountsTable, setList: setAccounts })
  // The database unlinks the deleted account's transactions and transfers (ON DELETE SET
  // NULL); mirror that, so the other accounts' balances stay as they were.
  const deleteAccount = useCallback(async (id: string) => {
    await removeAccount(id)
    const unlink = (list: Transaction[]) => list.map((t) => (t.cuentaId === id ? { ...t, cuentaId: null } : t))
    setTxs(unlink)
    setTrash(unlink)
    setTransfers((prev) => prev.map((tr) => (tr.origen === id || tr.destino === id
      ? { ...tr, origen: tr.origen === id ? null : tr.origen, destino: tr.destino === id ? null : tr.destino }
      : tr)))
  }, [removeAccount])
  const { save: saveTransfer, remove: deleteTransfer } = useTableCrud({ ...crud, ...transfersTable, setList: setTransfers })
  const { save: saveInvestment, remove: deleteInvestment } = useTableCrud({ ...crud, ...investmentsTable, setList: setInvestments })
  const { save: saveDebt, remove: deleteDebt } = useTableCrud({ ...crud, ...debtsTable, setList: setDebts })
  const { save: saveSubscription, remove: deleteSubscription } = useTableCrud({ ...crud, ...subscriptionsTable, setList: setSubscriptions })

  // Outlier detection lives client-side (the DB anomaly column is always false).
  // Recomputed whenever txs change so the score, insights and the ⚠ row flag agree.
  const flaggedTxs = useMemo(() => flagAnomalies(txs), [txs])
  // Each account with its balance today (`current`); `balance` stays the typed one.
  const accountsWithBalance = useMemo(
    () => accounts.map((a) => ({ ...a, current: accountBalance(a, txs, transfers) })),
    [accounts, txs, transfers],
  )

  return useMemo(
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
}

// What useData() returns: the lists of the signed-in user and their writes. Every write
// throws on error (the caller shows a toast) and updates the list only when it succeeded.
export type DataValue = ReturnType<typeof useDataValue>

const DataContext = createContext<DataValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const value = useDataValue()
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
