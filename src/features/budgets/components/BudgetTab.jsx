"use client"

import { useState, useMemo } from "react";
import { Grid, Stack } from "@mui/material";
import { txByCategory } from "@/features/transactions/domain/aggregations";
import { filterByPeriod } from "@/domain/period";
import { healthScore } from "@/domain/health";
import { budgetFor } from "../domain/budgets";
import { useData } from "@/contexts/DataContext";
import { HealthSummaryCard } from "./HealthSummaryCard";
import { BudgetCardsGrid } from "./BudgetCardsGrid";
import { DistributionCard } from "./DistributionCard";
import { PeriodComparisonCard } from "./PeriodComparisonCard";
import { BudgetVsActualCard } from "./BudgetVsActualCard";
import { RecurringCard } from "./RecurringCard";
import { UpcomingPaymentsCard } from "./UpcomingPaymentsCard";
import { ManageBudgetsDialog } from "./ManageBudgetsDialog";
import { BudgetAlertsBanner } from "./BudgetAlertsBanner";

// Budget tab: health summary, one card per budget, distribution, comparison with the
// previous period, budget vs actual, upcoming and recurring payments (one component each, in this folder).
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
