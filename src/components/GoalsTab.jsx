"use client"

import { useMemo } from "react";
import { Box, CircularProgress, Grid, Stack } from "@mui/material";
import { txByMonth } from "@/features/transactions/domain/aggregations";
import { netWorthOf } from "@/domain/netWorth";
import { useData } from "@/contexts/DataContext";
import { GoalsSection } from "@/features/goals/components/GoalsSection";
import { AccountsCard } from "@/features/accounts/components/AccountsCard";
import { ForecastCard } from "@/features/goals/components/ForecastCard";
import { InvestmentsSection } from "@/features/investments/components/InvestmentsSection";
import { DebtsCard } from "@/features/debts/components/DebtsCard";
import { SubscriptionsCard } from "./goals/SubscriptionsCard.jsx";
import { NetWorthEvolutionCard } from "@/features/goals/components/NetWorthEvolutionCard";

// Goals tab: savings goals, net worth (accounts), forecast, investments, debts,
// subscriptions and net worth evolution. Each section owns its dialog (src/components/goals/).
export default function GoalsTab({ showToast }) {
  const { txs, loading, accounts, debts, investments } = useData();
  const months = useMemo(() => txByMonth(txs).slice(-12), [txs]);
  const worth = useMemo(() => netWorthOf(accounts, debts, investments), [accounts, debts, investments]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Stack spacing={3}>
      <GoalsSection showToast={showToast} />

      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <AccountsCard worth={worth} showToast={showToast} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <ForecastCard months={months} />
        </Grid>
      </Grid>

      <InvestmentsSection showToast={showToast} />

      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
          <DebtsCard showToast={showToast} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
          <SubscriptionsCard showToast={showToast} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
          <NetWorthEvolutionCard months={months} netWorth={worth.net} />
        </Grid>
      </Grid>
    </Stack>
  );
}
