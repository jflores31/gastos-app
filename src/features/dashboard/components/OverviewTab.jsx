"use client"

import { useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Chip, Stack,
} from "@mui/material";
import {
  TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon,
  Savings as SavingsIcon, Warning as WarningIcon,
  AccountBalanceWallet as WalletIcon, PieChart as PieIcon, Insights as InsightsIcon,
  CalendarMonth as CalendarIcon, ShowChart as ChartIcon, Timeline as ForecastIcon,
} from "@/theme/icons";

const INSIGHT_ICONS = {
  trend: <ChartIcon />,
  savings: <SavingsIcon />,
  warning: <WarningIcon />,
  forecast: <ForecastIcon />,
};
const INSIGHT_COLORS = { good: "success", warn: "warning", info: "info" };
import { txByMonth, txByCategory } from "@/features/transactions/domain/aggregations";
import { filterByPeriod, periodLabel } from "@/domain/period";
import { healthScore, healthTone } from "@/domain/health";
import { insightsList } from "../domain/insights";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { useSupabaseUser } from "@/contexts/UserContext";
import { Donut, SparkArea, StudioCashflow, HeatCalendar } from "@/components/charts/Charts";
import { GradientIcon, CategoryAvatar } from "@/components/ui/GradientIcon";
import { TONE_BY_PALETTE } from "@/theme/iconTones";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { liftCardSx } from "@/theme/tokens";
import { donutCenterSx, donutRingSx } from "@/components/charts/Charts.styles";
import {
  cashflowLegendSx, categoryBarSx, categoryDotSx, compareCurrentSx, comparePreviousSx, compareTrackSx, headerRowSx, heatLegendSx,
  heroAmountSx, heroContentSx, insightRowSx, miniContentSx, pillSx, sliceRowSx,
} from "./OverviewTab.styles";

function CategoryBars({ data, max = 5 }) {
  const { fmt } = useSettings();
  if (!data || !data.length) return null;
  const items = data.slice(0, max);
  const peak = Math.max(...items.map((d) => d.value), 1);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((d) => (
        <Box key={d.id}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.4 }}>
            {d.Icon ? <d.Icon sx={{ fontSize: 14, color: d.color, flexShrink: 0 }} /> : <Box sx={categoryDotSx(d.color)} />}
            <Typography variant="caption" noWrap sx={{ flex: 1, fontWeight: 600, color: "text.secondary" }}>{d.label}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{fmt(d.value, true)}</Typography>
          </Box>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}>
            <Box sx={categoryBarSx(d.color, (d.value / peak) * 100)} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function OverviewTab({ period, setPeriod }) {
  const { t, lang, currency, fmt } = useSettings();
  const { txs, customCats } = useData();
  const user = useSupabaseUser();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "";

  const periodTxs = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const prevTxs = useMemo(() => filterByPeriod(txs, period, -1), [txs, period]);
  const months = useMemo(() => txByMonth(txs).slice(-12), [txs]);
  const cats = useMemo(() => txByCategory(periodTxs), [periodTxs]);
  const anomalies = useMemo(() => periodTxs.filter((x) => x.anomaly), [periodTxs]);

  const totalIn = useMemo(() => periodTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0), [periodTxs]);
  const totalOut = useMemo(() => periodTxs.filter((x) => x.tipo === "EGRESO").reduce((s, x) => s + x.valor, 0), [periodTxs]);
  const prevOut = useMemo(() => prevTxs.filter((x) => x.tipo === "EGRESO").reduce((s, x) => s + x.valor, 0), [prevTxs]);
  const prevIn = useMemo(() => prevTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0), [prevTxs]);
  const net = totalIn - totalOut;
  const savingsRate = totalIn > 0 ? (net / totalIn) * 100 : 0;
  const prevSavingsRate = prevIn > 0 ? ((prevIn - prevOut) / prevIn) * 100 : 0;
  const dOut = prevOut ? ((totalOut - prevOut) / prevOut) * 100 : null;
  const dIn = prevIn ? ((totalIn - prevIn) / prevIn) * 100 : null;
  const score = healthScore(savingsRate, dOut ?? 0, anomalies.length);
  const scoreTone = healthTone(score);
  const donut = useMemo(() => cats.slice(0, 6).map((c) => {
    const { label, color, Icon } = resolveCategoryMeta(c.categoria, customCats, lang, "EGRESO");
    return { id: c.categoria, label, value: c.total, color, Icon };
  }), [cats, customCats, lang]);
  const donutTotal = useMemo(() => donut.reduce((s, d) => s + d.value, 0), [donut]);
  const insights = insightsList(lang, totalOut, totalIn, savingsRate, dOut ?? 0, anomalies, currency, (v, _currency, compact) => fmt(v, compact), period);

  const incomeCats = useMemo(() => txByCategory(periodTxs, "INGRESO").slice(0, 6).map((c) => {
    const { label, color, Icon } = resolveCategoryMeta(c.categoria, customCats, lang, "INGRESO");
    return { id: c.categoria, label, value: c.total, color, Icon };
  }), [periodTxs, customCats, lang]);

  const heatVals = useMemo(() => {
    const m = new Map();
    for (const x of periodTxs) if (x.tipo === "EGRESO") { const k = x.date.toDateString(); m.set(k, (m.get(k) || 0) + x.valor); }
    return [...m.entries()].map(([k, v]) => ({ date: new Date(k), value: v }));
  }, [periodTxs]);

  const inCount = periodTxs.filter((x) => x.tipo === "INGRESO").length;
  const outCount = periodTxs.filter((x) => x.tipo === "EGRESO").length;
  const miniCards = [
    { label: t.income, value: fmt(totalIn), delta: dIn, icon: <TrendUpIcon />, color: "success", sub: t.overviewTab.incomeRecords(inCount), catData: incomeCats },
    { label: t.expense, value: fmt(totalOut), delta: dOut, icon: <TrendDownIcon />, color: "error", sub: t.overviewTab.expenseRecords(outCount), invert: true, catData: donut },
    { label: t.savings, value: savingsRate.toFixed(1) + "%", icon: <SavingsIcon />, color: "primary", sub: savingsRate >= 20 ? (t.overviewTab.goalMet) : "20% meta" },
    { label: t.anomalies, value: anomalies.length, icon: <WarningIcon />, color: "warning", sub: t.overviewTab.flagged },
  ];

  return (
    <Stack spacing={3}>
      <Box sx={headerRowSx}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2, fontWeight: 600 }}>
            {(() => {
              const h = new Date().getHours();
              const name = firstName ? ` ${firstName}` : "";
              return t.overviewTab.greeting(h, name);
            })()}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", sm: "3rem" } }}>
              {net >= 0
                ? (t.overviewTab.saving(fmt(net, true)))
                : (t.overviewTab.overdrawn(fmt(Math.abs(net), true)))}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {["week", "month", "quarter", "year"].map((p) => (
            <Chip key={p} label={t[p]} variant={period === p ? "filled" : "outlined"} color={period === p ? "primary" : "default"} onClick={() => setPeriod(p)} sx={{ fontWeight: 600, px: 1 }} />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 1fr 1fr 1fr" }, gap: 2, alignItems: "stretch" }}>
        <Card sx={liftCardSx(net >= 0 ? "success.main" : "error.main", { top: 4, lift: 2, paper: true })}>
          <CardContent sx={heroContentSx}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 600, color: "text.secondary" }}>{t.balance.toUpperCase()} · {periodLabel(period, t).toUpperCase()}</Typography>
                <Typography variant="h3" sx={heroAmountSx(net >= 0)}>{fmt(net)}</Typography>
              </Box>
              <GradientIcon icon={WalletIcon} tone={net >= 0 ? "income" : "expense"} bubble bubbleSize={48} size={26} />
            </Box>
            <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
              <Box sx={pillSx("success")}>
                <Typography variant="caption" sx={{ color: "success.dark", display: "block", fontWeight: 600, letterSpacing: 0.5 }}>{t.savings}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "success.dark" }}>{savingsRate.toFixed(1)}%</Typography>
              </Box>
              <Box sx={pillSx(scoreTone)}>
                <Typography variant="caption" sx={{ color: `${scoreTone}.dark`, display: "block", fontWeight: 600, letterSpacing: 0.5 }}>{t.healthScore}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: `${scoreTone}.dark` }}>{score}/100</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}><SparkArea data={months.map((m) => m.ingreso - m.egreso)} /></Box>
          </CardContent>
        </Card>
        {miniCards.map((card, idx) => (
          <Card key={idx} sx={liftCardSx(["success.main", "error.main", "primary.main", "warning.main"][idx], { top: 4, paper: true })}>
            <CardContent sx={miniContentSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <GradientIcon tone={TONE_BY_PALETTE[card.color] || "neutral"} bubble bubbleSize={36} size={20}>{card.icon}</GradientIcon>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontWeight: 500 }}>{card.label}</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{card.value}</Typography>
              {card.delta != null && (
                <Chip
                  size="small"
                  label={`${card.delta > 0 ? "+" : ""}${card.delta.toFixed(1)}% ${t.common.vsPrev}`}
                  color={card.invert ? (card.delta < 0 ? "success" : "error") : (card.delta > 0 ? "success" : "error")}
                  variant="filled"
                  sx={{ fontWeight: 600, fontSize: 11, alignSelf: "flex-start", mb: 1 }}
                />
              )}
              {card.sub && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{card.sub}</Typography>}
              {card.catData && card.catData.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <CategoryBars data={card.catData} />
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" }, gap: 2.5 }}>
        <Card sx={liftCardSx("info.main")}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <GradientIcon icon={ChartIcon} tone="goals" bubble />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.cashflow}</Typography>
                <Typography variant="body2" color="text.secondary">{t.months_full}</Typography>
              </Box>
            </Box>
            <Box sx={cashflowLegendSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: "success.main" }} />
                <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>{t.income}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: "error.main" }} />
                <Typography variant="body2" sx={{ color: "error.main", fontWeight: 600 }}>{t.expense}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: "primary.main" }} />
                <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600 }}>{t.net}</Typography>
              </Box>
            </Box>
            <StudioCashflow months={months} t={t} />
          </CardContent>
        </Card>

        <Card sx={liftCardSx("warning.main")}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <GradientIcon icon={PieIcon} tone="warning" bubble />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.breakdown}</Typography>
                <Typography variant="body2" color="text.secondary">{t.expense} · {periodLabel(period, t)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1 }}>
              <Box sx={donutRingSx(160)}>
                <Donut slices={donut} size={160} thickness={20} />
                <Box sx={donutCenterSx(90)}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>{fmt(donutTotal, true)}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.expense}</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                {donut.map((s) => (
                  <Box key={s.id} sx={sliceRowSx}>
                    <CategoryAvatar icon={s.Icon} color={s.color} size={22} />
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontWeight: 500 }}>{s.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>{donutTotal > 0 ? Math.round((s.value / donutTotal) * 100) : 0}%</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={liftCardSx("success.main")}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <GradientIcon icon={InsightsIcon} tone="income" bubble />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.insights}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.overviewTab.autoAnalysis}</Typography>
                </Box>
              </Box>
              <Chip size="small" label="AI" color="success" variant="filled" sx={{ fontWeight: 700 }} />
            </Box>
            <Stack spacing={1.5}>
              {insights.map((ins, idx) => (
                <Box key={ins.title} sx={insightRowSx(idx % 2 === 0)}>
                  <GradientIcon tone={TONE_BY_PALETTE[INSIGHT_COLORS[ins.tone]]} bubble bubbleSize={36} size={20}>
                    {INSIGHT_ICONS[ins.icon]}
                  </GradientIcon>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>{ins.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{ins.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={liftCardSx("error.main")}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <GradientIcon icon={CalendarIcon} tone="expense" bubble />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.heatmap}</Typography>
                <Typography variant="body2" color="text.secondary">{t.overviewTab.dailySpending12Weeks}</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 3 }}>
              <HeatCalendar values={heatVals} days={84} color="currentColor" cellSize={10} gap={2} />
              <Box sx={heatLegendSx}>
                <Typography variant="caption" color="text.secondary">{t.lower}</Typography>
                <Box sx={{ width: 100, height: 10, borderRadius: 2, background: (theme) => `linear-gradient(to right, transparent, ${theme.palette.error.main})` }} />
                <Typography variant="caption" color="text.secondary">{t.higher}</Typography>
              </Box>
            </Box>
            {period !== "all" && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: "primary.main", fontWeight: 700 }}>
                  {t.common.vsPreviousPeriod(period)}
                </Typography>
                {prevIn === 0 && prevOut === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", py: 1 }}>
                    {t.overviewTab.noDataForPreviousPeriod}
                  </Typography>
                ) : (
                  [
                    { label: t.income, current: totalIn, previous: prevIn, color: "success.main", positive: true },
                    { label: t.expense, current: totalOut, previous: prevOut, color: "error.main", positive: false },
                    { label: t.savings, current: savingsRate, previous: prevSavingsRate, color: "primary.main", positive: true, isPercent: true },
                  ].map((m) => {
                    const change = m.isPercent
                      ? m.current - m.previous
                      : (m.previous ? ((m.current - m.previous) / m.previous) * 100 : 0);
                    const max = Math.max(Math.abs(m.current), Math.abs(m.previous), 1);
                    const currentPct = Math.max(0, (Math.abs(m.current) / max) * 100);
                    const prevPct = Math.max(0, (Math.abs(m.previous) / max) * 100);
                    const isPositive = m.positive ? change >= 0 : change <= 0;
                    return (
                      <Box key={m.label} sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.label}</Typography>
                          <Chip size="small" label={`${change >= 0 ? "+" : ""}${m.isPercent ? change.toFixed(1) + "pp" : change.toFixed(1) + "%"}`} color={isPositive ? "success" : "error"} variant="filled" sx={{ fontWeight: 600, fontSize: 10, height: 22 }} />
                        </Box>
                        <Box sx={compareTrackSx}>
                          <Box sx={comparePreviousSx(m.color, prevPct)} />
                          <Box sx={compareCurrentSx(m.color, currentPct)} />
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}