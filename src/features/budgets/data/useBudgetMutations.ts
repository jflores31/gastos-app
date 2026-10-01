import { useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Budgets } from "@/types/domain"
import type { BudgetPeriods } from "./budgets"

type Options = {
  supabase: SupabaseClient
  requireUserId: () => string
  editBudgets: Budgets
  budgetPeriods: BudgetPeriods
  setEditBudgetsState: Dispatch<SetStateAction<Budgets>>
  setBudgetPeriods: Dispatch<SetStateAction<BudgetPeriods>>
}

// Writes of DataContext's budgets: one row per category, stored as { categoria: monto } plus
// budgetPeriods { categoria: periodo } in state.
export function useBudgetMutations({ supabase, requireUserId, editBudgets, budgetPeriods, setEditBudgetsState, setBudgetPeriods }: Options) {
  // `periodUpdates` changes the period of some categories (new ones default to "month").
  const setEditBudgets = useCallback(
    async (updater: Budgets | ((prev: Budgets) => Budgets), periodUpdates: BudgetPeriods = {}) => {
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
    [supabase, requireUserId, editBudgets, budgetPeriods, setEditBudgetsState, setBudgetPeriods]
  )

  const deleteBudgetCat = useCallback(async (cat: string) => {
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
  }, [supabase, requireUserId, setEditBudgetsState, setBudgetPeriods])

  return { setEditBudgets, deleteBudgetCat }
}
