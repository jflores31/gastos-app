"use client"

import { useMemo } from "react";
import { Box, CircularProgress, Grid, Stack } from "@mui/material";
import { txByMonth } from "../data/index";
import { netWorthOf } from "@/domain/netWorth";
import { useData } from "../context/DataContext.jsx";
import { GoalsSection } from "./goals/GoalsSection.jsx";
import { AccountsCard } from "./goals/AccountsCard.jsx";
import { ForecastCard } from "./goals/ForecastCard.jsx";
import { InvestmentsSection } from "./goals/InvestmentsSection.jsx";
import { DebtsCard } from "./goals/DebtsCard.jsx";
import { SubscriptionsCard } from "./goals/SubscriptionsCard.jsx";
import { NetWorthEvolutionCard } from "./goals/NetWorthEvolutionCard.jsx";

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
