import { useMemo } from "react";
import { Alert, AlertTitle, Box } from "@mui/material";
import { budgetAlerts } from "../../data/helpers";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext.jsx";

// Budgets at 80 % or more of their own current period (budgetAlerts), on top of the tab.
export function BudgetAlertsBanner() {
  const { t, lang } = useSettings();
  const { txs, editBudgets, budgetPeriods, customCats } = useData();
  const alerts = useMemo(() => budgetAlerts(txs, editBudgets, budgetPeriods), [txs, editBudgets, budgetPeriods]);
  if (alerts.length === 0) return null;

  return (
    <Alert severity={alerts.some((a) => a.level === "over") ? "error" : "warning"} variant="outlined" sx={{ borderRadius: 2 }}>
      <AlertTitle sx={{ fontWeight: 700 }}>{t.budgetTab.budgetAlertsTitle}</AlertTitle>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {alerts.map((a) => (
          <li key={a.categoria}>
            {t.budgetTab.budgetAlertLine(resolveCategoryMeta(a.categoria, customCats, lang, "EGRESO").label, Math.round(a.pct * 100), a.periodo)}
          </li>
        ))}
      </Box>
    </Alert>
  );
}
