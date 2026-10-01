import { filterByPeriod, monthCount } from "@/domain/period";
import type { BudgetPeriod, Budgets, Period, Transaction } from "@/types/domain";

// A budget of `amount` per `budgetPeriod`, expressed for the period being viewed. Uses
// monthCount's month units (week = 0.25, quarter = 3, year = 12, "all" = 1 month), so a
// monthly budget shows exactly what it always did.
export function budgetFor(amount: number, budgetPeriod: BudgetPeriod = "month", viewPeriod: Period = "month") {
  return (amount * monthCount(viewPeriod)) / monthCount(budgetPeriod)
}

export type BudgetAlert = { categoria: string; periodo: BudgetPeriod; spent: number; limit: number; pct: number; level: "warn" | "over" }

// Budgets at 80 % or more of what was spent in their own current period (this week,
// month or year), highest first.
export function budgetAlerts(txs: Transaction[], budgets: Budgets, periods: Record<string, BudgetPeriod> = {}): BudgetAlert[] {
  const out: BudgetAlert[] = []
  const spentByPeriod = new Map<BudgetPeriod, Map<string, number>>()
  for (const [categoria, limit] of Object.entries(budgets)) {
    if (!(limit > 0)) continue
    const periodo = periods[categoria] ?? "month"
    if (!spentByPeriod.has(periodo)) {
      const m = new Map<string, number>()
      for (const tx of filterByPeriod(txs, periodo)) if (tx.tipo === "EGRESO") m.set(tx.categoria, (m.get(tx.categoria) ?? 0) + tx.valor)
      spentByPeriod.set(periodo, m)
    }
    const spent = spentByPeriod.get(periodo)!.get(categoria) ?? 0
    const pct = spent / limit
    if (pct >= 0.8) out.push({ categoria, periodo, spent, limit, pct, level: pct >= 1 ? "over" : "warn" })
  }
  return out.sort((a, b) => b.pct - a.pct)
}
