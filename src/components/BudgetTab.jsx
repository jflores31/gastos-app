"use client"

import { useState, useMemo } from "react";
import { Grid, Stack } from "@mui/material";
import { txByCategory } from "../data/index";
import { filterByPeriod, healthScore, budgetFor } from "../data/helpers";
import { useData } from "../context/DataContext.jsx";
import { HealthSummaryCard } from "./budget/HealthSummaryCard.jsx";
import { BudgetCardsGrid } from "./budget/BudgetCardsGrid.jsx";
import { DistributionCard } from "./budget/DistributionCard.jsx";
import { PeriodComparisonCard } from "./budget/PeriodComparisonCard.jsx";
import { BudgetVsActualCard } from "./budget/BudgetVsActualCard.jsx";
import { RecurringCard } from "./budget/RecurringCard.jsx";
import { UpcomingPaymentsCard } from "./budget/UpcomingPaymentsCard.jsx";
import { ManageBudgetsDialog } from "./budget/ManageBudgetsDialog.jsx";
import { BudgetAlertsBanner } from "./budget/BudgetAlertsBanner.jsx";

// Budget tab: health summary, one card per budget, distribution, comparison with the
// previous period, budget vs actual, upcoming and recurring payments (src/components/budget/).
export default function BudgetTab({ period, openModal, showToast }) {
  const { txs, editBudgets, budgetPeriods } = useData();
  const [manageOpen, setManageOpen] = useState(false);

  const periodTxs = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const prevTxs = useMemo(() => filterByPeriod(txs, period, -1), [txs, period]);
  const cats = useMemo(() => txByCategory(periodTxs), [periodTxs]);
  const totalOut = periodTxs.filter((x) => x.tipo === "EGRESO").reduce((s, x) => s + x.valor, 0);
  const totalIn = periodTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0);
  const prevOut = prevTxs.filter((x) => x.tipo === "EGRESO").reduce((s, x) => s + x.valor, 0);
  const savingsRate = totalIn > 0 ? ((totalIn - totalOut) / totalIn) * 100 : 0;
  const dOut = prevOut ? ((totalOut - prevOut) / prevOut) * 100 : 0;
  const score = healthScore(savingsRate, dOut, periodTxs.filter((x) => x.anomaly).length);
  const totalBudget = Object.entries(editBudgets).reduce((s, [cat, v]) => s + budgetFor(v, budgetPeriods[cat], period), 0);
  const budgetUsed = totalBudget > 0 ? totalOut / totalBudget : 0;

  return (
    <Stack spacing={3}>
      <BudgetAlertsBanner />

      <HealthSummaryCard score={score} totalBudget={totalBudget} totalOut={totalOut} totalIn={totalIn} budgetUsed={budgetUsed} />

      <BudgetCardsGrid cats={cats} period={period} onManage={() => setManageOpen(true)} showToast={showToast} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <DistributionCard cats={cats} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <PeriodComparisonCard period={period} prevOut={prevOut} dOut={dOut} />
        </Grid>
      </Grid>

      {Object.keys(editBudgets).length > 0 && <BudgetVsActualCard cats={cats} period={period} totalBudget={totalBudget} />}

      <UpcomingPaymentsCard openModal={openModal} />

      <RecurringCard />

      <ManageBudgetsDialog open={manageOpen} onClose={() => setManageOpen(false)} showToast={showToast} />
    </Stack>
  );
}
