import type { Budgets, BudgetPeriod } from "@/types/domain"
import type { BudgetRow } from "@/types/database"

export type BudgetPeriods = Record<string, BudgetPeriod>

// One row per category → { categoria: monto } and { categoria: periodo } ("month" by default).
export function budgetsFromRows(rows: BudgetRow[]) {
  return {
    amounts: Object.fromEntries(rows.map((b) => [b.categoria, Number(b.monto)])) as Budgets,
    periods: Object.fromEntries(rows.map((b) => [b.categoria, b.periodo ?? "month"])) as BudgetPeriods,
  }
}
