"use client"

import { useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Chip, Avatar, Stack,
} from "@mui/material";
import {
  TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon,
  Savings as SavingsIcon, Warning as WarningIcon,
  AccountBalanceWallet as WalletIcon, PieChart as PieIcon, Insights as InsightsIcon,
  CalendarMonth as CalendarIcon, ShowChart as ChartIcon, Timeline as ForecastIcon,
} from "@mui/icons-material";

const INSIGHT_ICONS = {
  trend: <ChartIcon />,
  savings: <SavingsIcon />,
  warning: <WarningIcon />,
  forecast: <ForecastIcon />,
};
const INSIGHT_COLORS = { good: "success", warn: "warning", info: "info" };
import { CATEGORIES, fmtMoney, txByMonth, txByCategory } from "../data/index.js";
import { filterByPeriod, periodLabel, healthScore, insightsList } from "../data/helpers.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { useSupabaseUser } from "../context/UserContext";
import { Donut, SparkArea, StudioCashflow, HeatCalendar } from "./Charts.jsx";

export default function OverviewTab({ period, setPeriod }) {
  const { t, lang, currency } = useSettings();
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
  const dOut = prevOut ? ((totalOut - prevOut) / prevOut) * 100 : 0;
  const dIn = prevIn ? ((totalIn - prevIn) / prevIn) * 100 : 0;
  const score = healthScore(savingsRate, dOut, anomalies.length);
  const donut = useMemo(() => cats.slice(0, 6).map((c) => {
    const isCustom = c.categoria?.startsWith("custom_");
    const customCat = isCustom ? customCats.find((cc) => cc.id === c.categoria.slice("custom_".length)) : null;
    return {
      id: c.categoria,
      label: customCat?.nombre || CATEGORIES.expense[c.categoria]?.[lang] || c.categoria,
      value: c.total,
      color: customCat?.color || CATEGORIES.expense[c.categoria]?.color || "#9e9e9e",
    };
  }), [cats, customCats, lang]);
  const insights = insightsList(lang, totalOut, totalIn, savingsRate, dOut, anomalies, currency, fmtMoney);

  const heatVals = useMemo(() => {
    const m = new Map();
    for (const x of periodTxs) if (x.tipo === "EGRESO") { const k = x.date.toDateString(); m.set(k, (m.get(k) || 0) + x.valor); }
    return [...m.entries()].map(([k, v]) => ({ date: new Date(k), value: v }));
  }, [periodTxs]);

  const miniCards = [
    { label: t.income, value: fmtMoney(totalIn, currency), delta: dIn, icon: <TrendUpIcon />, color: "success", sub: `${periodTxs.filter((x) => x.tipo === "INGRESO").length} tx` },
    { label: t.expense, value: fmtMoney(totalOut, currency), delta: dOut, icon: <TrendDownIcon />, color: "error", sub: `${periodTxs.filter((x) => x.tipo === "EGRESO").length} tx`, invert: true },
    { label: t.savings, value: savingsRate.toFixed(1) + "%", icon: <SavingsIcon />, color: "primary", sub: savingsRate >= 20 ? (lang === "es" ? "Meta cumplida" : "Goal met") : "20% meta" },
    { label: t.anomalies, value: anomalies.length, icon: <WarningIcon />, color: "warning", sub: lang === "es" ? "requieren revisión" : "flagged" },
  ];

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2, fontWeight: 600 }}>
            {(() => {
              const h = new Date().getHours();
              const name = firstName ? ` ${firstName}` : "";
              if (lang === "es") return h < 12 ? `Buenos días${name},` : h < 19 ? `Buenas tardes${name},` : `Buenas noches${name},`;
              return h < 12 ? `Good morning${name},` : h < 19 ? `Good afternoon${name},` : `Good evening${name},`;
            })()}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: "1.6rem", sm: "3rem" } }}>
              {net >= 0
                ? (lang === "es" ? `Ahorrando ${fmtMoney(net, currency, true)}` : `Saving ${fmtMoney(net, currency, true)}`)
                : (lang === "es" ? `Sobregiro ${fmtMoney(Math.abs(net), currency, true)}` : `Overdrawn ${fmtMoney(Math.abs(net), currency, true)}`)}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {["week", "month", "quarter", "year"].map((p) => (
            <Chip key={p} label={t[p]} variant={period === p ? "filled" : "outlined"} color={period === p ? "primary" : "default"} onClick={() => setPeriod(p)} sx={{ fontWeight: 600, px: 1 }} />
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 1fr 1fr 1fr" }, gap: 2, alignItems: "stretch" }}>
        <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, transition: "all 0.3s", "&:hover": { transform: "translateY(-2px)" }, borderTop: "4px solid", borderTopColor: net >= 0 ? "success.main" : "error.main" }}>
          <CardContent sx={{ p: 2.5, color: "text.primary", "&:last-child": { pb: 2.5 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 600, color: "text.secondary" }}>{t.balance.toUpperCase()} · {periodLabel(period, t).toUpperCase()}</Typography>
                <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 1, color: net >= 0 ? "success.main" : "error.main", fontSize: { xs: "1.6rem", sm: "3rem" } }}>{fmtMoney(net, currency)}</Typography>
              </Box>
              <Avatar sx={{ width: 48, height: 48, bgcolor: net >= 0 ? "success.light" : "error.light", color: net >= 0 ? "success.dark" : "error.dark" }}>
                <WalletIcon sx={{ fontSize: 24 }} />
              </Avatar>
            </Box>
            <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: "success.light", borderRadius: 2, border: "1px solid", borderColor: "success.main" }}>
                <Typography variant="caption" sx={{ color: "success.dark", display: "block", fontWeight: 600, letterSpacing: 0.5 }}>{t.savings}</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: "success.dark" }}>{savingsRate.toFixed(1)}%</Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: "primary.light", borderRadius: 2, border: "1px solid", borderColor: "primary.main" }}>
                <Typography variant="caption" sx={{ color: "primary.dark", display: "block", fontWeight: 600, letterSpacing: 0.5 }}>{t.healthScore}</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: "primary.dark" }}>{score}/100</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}><SparkArea data={months.map((m) => m.ingreso - m.egreso)} /></Box>
          </CardContent>
        </Card>
        {miniCards.map((card, idx) => (
          <Card key={idx} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)" }, borderTop: "4px solid", borderTopColor: ["success.main", "error.main", "primary.main", "warning.main"][idx], bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, display: "flex", flexDirection: "column", height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: `${card.color}.light`, color: `${card.color}.dark`, fontSize: 16 }}>{card.icon}</Avatar>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontWeight: 500 }}>{card.label}</Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{card.value}</Typography>
              {card.delta != null && (
                <Chip 
                  size="small" 
                  label={`${card.delta > 0 ? "+" : ""}${card.delta.toFixed(1)}%`} 
                  color={card.invert ? (card.delta < 0 ? "success" : "error") : (card.delta > 0 ? "success" : "error")} 
                  variant="filled" 
                  sx={{ fontWeight: 600, fontSize: 11, alignSelf: "flex-start", mb: 1 }} 
                />
              )}
              {card.sub && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{card.sub}</Typography>}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" }, gap: 2.5 }}>
        <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)" }, borderTop: "3px solid", borderTopColor: "info.main" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: "info.light", color: "info.dark" }}><ChartIcon /></Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{t.cashflow}</Typography>
                <Typography variant="body2" color="text.secondary">{t.months_full}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 2, py: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
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

        <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)" }, borderTop: "3px solid", borderTopColor: "warning.main" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: "warning.light", color: "warning.dark" }}><PieIcon /></Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{t.breakdown}</Typography>
                <Typography variant="body2" color="text.secondary">{t.expense} · {periodLabel(period, t)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1 }}>
              <Box sx={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover", borderRadius: "50%" }}>
                <Donut slices={donut} size={160} thickness={20} />
                <Box sx={{ position: "absolute", textAlign: "center", bgcolor: "background.paper", borderRadius: "50%", width: 90, height: 90, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Typography variant="h6" fontWeight={700} color="error.main">{fmtMoney(totalOut, currency, true)}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.expense}</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                {donut.map((s) => (
                  <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, p: 1, bgcolor: "action.hover", borderRadius: 2, transition: "all 0.2s", "&:hover": { bgcolor: "action.selected" } }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: s.color, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontWeight: 500 }}>{s.label}</Typography>
                    <Typography variant="body2" fontWeight={700} color="error.main">{totalOut > 0 ? Math.round((s.value / totalOut) * 100) : 0}%</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)" }, borderTop: "3px solid", borderTopColor: "success.main" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "success.light", color: "success.dark" }}><InsightsIcon /></Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{t.insights}</Typography>
                  <Typography variant="body2" color="text.secondary">{lang === "es" ? "Análisis automático" : "Auto analysis"}</Typography>
                </Box>
              </Box>
              <Chip size="small" label="AI" color="success" variant="filled" sx={{ fontWeight: 700 }} />
            </Box>
            <Stack spacing={1.5}>
              {insights.map((ins, idx) => (
                <Box key={ins.title} sx={{ display: "flex", gap: 2, p: 2, bgcolor: idx % 2 === 0 ? "success.light" : "action.hover", borderRadius: 3, border: "1px solid", borderColor: idx % 2 === 0 ? "success.main" : "divider", transition: "all 0.2s", "&:hover": { transform: "translateX(4px)" } }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: `${INSIGHT_COLORS[ins.tone]}.light`, color: `${INSIGHT_COLORS[ins.tone]}.dark`, flexShrink: 0 }}>
                    {INSIGHT_ICONS[ins.icon]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>{ins.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{ins.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)" }, borderTop: "3px solid", borderTopColor: "error.main" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: "error.light", color: "error.dark" }}><CalendarIcon /></Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{t.heatmap}</Typography>
                <Typography variant="body2" color="text.secondary">{lang === "es" ? "Gastos diarios · 12 semanas" : "Daily spending · 12 weeks"}</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 3 }}>
              <HeatCalendar values={heatVals} days={84} color="currentColor" cellSize={10} gap={2} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, justifyContent: "center" }}>
                <Typography variant="caption" color="text.secondary">{t.lower}</Typography>
                <Box sx={{ width: 100, height: 10, borderRadius: 2, background: (theme) => `linear-gradient(to right, transparent, ${theme.palette.error.main})` }} />
                <Typography variant="caption" color="text.secondary">{t.higher}</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: "primary.main" }}>{lang === "es" ? "vs mes anterior" : "vs previous month"}</Typography>
              {[
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
                      <Typography variant="body2" fontWeight={600}>{m.label}</Typography>
                      <Chip size="small" label={`${change >= 0 ? "+" : ""}${m.isPercent ? change.toFixed(1) + "pp" : change.toFixed(1) + "%"}`} color={isPositive ? "success" : "error"} variant="filled" sx={{ fontWeight: 600, fontSize: 10, height: 22 }} />
                    </Box>
                    <Box sx={{ height: 10, borderRadius: 2, bgcolor: "action.hover", position: "relative", overflow: "hidden" }}>
                      <Box sx={{ position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 2, bgcolor: m.color, opacity: 0.2, width: `${prevPct}%`, transition: "width 0.5s" }} />
                      <Box sx={{ position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 2, bgcolor: m.color, width: `${currentPct}%`, transition: "width 0.5s", boxShadow: `0 0 8px ${m.color}` }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}