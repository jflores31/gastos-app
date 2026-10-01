import { useEffect, useMemo, useRef } from "react";
import { budgetAlerts } from "../domain/budgets";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import type { ShowToast } from "@/components/feedback/useToast";

const RANK: Record<string, number> = { warn: 1, over: 2 };

// Shows a toast when a budget crosses 80 % or 100 % of its own period (a new expense,
// an edit, an import). Budgets already over the line when the data loads don't toast:
// the Presupuesto tab lists them (BudgetAlertsBanner).
export function useBudgetAlertToasts(showToast: ShowToast) {
  const { t, lang } = useSettings();
  const { txs, editBudgets, budgetPeriods, customCats, loading } = useData();
  const alerts = useMemo(() => budgetAlerts(txs, editBudgets, budgetPeriods), [txs, editBudgets, budgetPeriods]);
  const previous = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    if (loading) return;
    const levels = Object.fromEntries(alerts.map((a) => [a.categoria, a.level]));
    const before = previous.current;
    previous.current = levels;
    if (!before) return;
    const risen = alerts.find((a) => RANK[a.level] > (RANK[before[a.categoria]] ?? 0));
    if (!risen) return;
    const label = resolveCategoryMeta(risen.categoria, customCats, lang, "EGRESO").label;
    showToast(
      risen.level === "over" ? t.budgetTab.alertToastOver(label) : t.budgetTab.alertToastWarn(label, Math.round(risen.pct * 100)),
      risen.level === "over" ? "error" : "warning",
      6000,
    );
  }, [alerts, loading, customCats, lang, t, showToast]);
}
