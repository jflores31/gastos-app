"use client"

import { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Grid, Chip, Stack, IconButton,
} from "@mui/material";
import { AccountBalanceWallet as WalletIcon, PieChart as PieIcon, ShowChart as ChartIcon, Add as AddIcon } from "@/theme/icons";
import AddTransactionModal from "./AddTransactionModal";
import { txByCategory, txByMonth } from "../domain/aggregations";
import { GradientIcon, CategoryAvatar } from "@/components/ui/GradientIcon";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { filterByPeriod, periodLabel } from "@/domain/period";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { useMoveToTrash } from "../hooks/useMoveToTrash";
import { useTxFilters } from "../hooks/useTxFilters";
import { Donut, SparkArea, StudioCashflow } from "@/components/charts/Charts";
import { TransactionList } from "./TransactionList";
import { CalendarFilter } from "./CalendarFilter";
import { donutCenterSx, donutRingSx } from "@/components/charts/Charts.styles";
import { listHeaderActionsSx, listHeaderSx, totalFooterSx } from "./transactions.styles";
import {
  barFillSx, heroAddButtonSx, heroCardSx, legendRowSx, percentChipSx, sideCardSx, sourceAddButtonSx,
  sourceRowSx, trendLegendSx,
} from "./IncomeTab.styles";
import { shadows } from "@/theme/tokens";


export default function IncomeTab({ period, openModal, showToast }) {
  const { t, lang, fmt } = useSettings();
  const { txs, customCats } = useData();
  const [editingTx, setEditingTx] = useState(null);
  const moveToTrash = useMoveToTrash(showToast);
  const { periodTxs, calFilter, setCalFilter, activeCat, setActiveCat, list: incomeTxs, total: filteredTotal } = useTxFilters(txs, period, "INGRESO");

  const months = useMemo(() => txByMonth(txs).slice(-12), [txs]);
  const incomeCats = useMemo(() => txByCategory(periodTxs, "INGRESO"), [periodTxs]);
  const totalIn = useMemo(() => periodTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0), [periodTxs]);
  const prevTxs = useMemo(() => filterByPeriod(txs, period, -1), [txs, period]);
  const prevIn = useMemo(() => prevTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0), [prevTxs]);
  const dIn = prevIn ? ((totalIn - prevIn) / prevIn) * 100 : null;
  const catMeta = (categoria) => resolveCategoryMeta(categoria, customCats, lang, "INGRESO");
  const incomeDonut = useMemo(() => incomeCats.map((c) => {
    const { label, color, Icon } = resolveCategoryMeta(c.categoria, customCats, lang, "INGRESO");
    return { label, value: c.total, color, Icon };
  }), [incomeCats, customCats, lang]);

  return (
    <>
    <Stack spacing={3}>
      <Card sx={heroCardSx}>
        <CardContent sx={{ p: 2.5, color: "text.primary" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 600, color: "text.secondary" }}>{t.income.toUpperCase()} · {periodLabel(period, t).toUpperCase()}</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 1, color: "success.main" }}>{fmt(totalIn)}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconButton size="medium" onClick={() => openModal("", "income")} sx={heroAddButtonSx}>
                <AddIcon />
              </IconButton>
              <GradientIcon icon={WalletIcon} tone="income" bubble bubbleSize={48} size={26} />
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
            {dIn != null && (
              <Chip size="small" label={`${dIn > 0 ? "+" : ""}${dIn.toFixed(1)}% ${t.common.vsPrev}`} color={dIn > 0 ? "success" : "error"} variant="filled" sx={{ fontWeight: 600 }} />
            )}
            <Typography variant="body2" color="text.secondary">{incomeTxs.length} {t.incomeTab.incomeRecords}</Typography>
          </Box>
          <Box sx={{ mt: 1 }}><SparkArea data={months.map((m) => m.ingreso)} /></Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: shadows.card }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.incomeTab.incomeSources}</Typography>
              <Typography variant="body2" color="text.secondary">{periodLabel(period, t)} · {incomeCats.length} {t.common.categories}</Typography>
            </Box>
            <GradientIcon icon={PieIcon} tone="income" bubble />
          </Box>
          {incomeCats.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3, fontStyle: "italic" }}>
              {t.incomeTab.noIncomeInThisPeriod}
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[...incomeCats].sort((a, b) => b.total - a.total).map((c) => {
                const { label: catLabel, color: resolvedColor, Icon } = catMeta(c.categoria);
                const pct = totalIn > 0 ? (c.total / totalIn) * 100 : 0;
                const isActive = activeCat === c.categoria;
                return (
                  <Box
                    key={c.categoria}
                    onClick={() => setActiveCat(isActive ? null : c.categoria)}
                    sx={sourceRowSx(isActive, resolvedColor)}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <CategoryAvatar icon={Icon} color={resolvedColor} size={28} />
                      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }} noWrap>{catLabel}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main", whiteSpace: "nowrap" }}>{fmt(c.total, true)}</Typography>
                      <Chip size="small" label={`${Math.round(pct)}%`} sx={percentChipSx(resolvedColor)} />
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); openModal(c.categoria, "income"); }}
                        aria-label={t.incomeTab.registerCategory(catLabel)}
                        sx={sourceAddButtonSx(resolvedColor)}
                      >
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ height: 7, borderRadius: 4, bgcolor: "background.paper", overflow: "hidden" }}>
                      <Box sx={barFillSx(resolvedColor, pct)} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      {c.count} {t.common.transactions}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card sx={sideCardSx("warning.main")}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <GradientIcon icon={PieIcon} tone="warning" bubble />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.breakdown}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.income} · {periodLabel(period, t)}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1 }}>
                <Box sx={donutRingSx(160)}>
                  <Donut slices={incomeDonut} size={160} thickness={20} />
                  <Box sx={donutCenterSx(90)}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} color="success.main">{fmt(totalIn, true)}</Typography>
                    <Typography variant="caption" color="text.secondary">{t.income}</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  {incomeDonut.map((s) => (
                    <Box key={s.label} sx={legendRowSx}>
                      <CategoryAvatar icon={s.Icon} color={s.color} size={22} />
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontWeight: 500 }}>{s.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} color="success.main">{totalIn > 0 ? Math.round((s.value / totalIn) * 100) : 0}%</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card sx={sideCardSx("info.main")}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <GradientIcon icon={ChartIcon} tone="goals" bubble />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.trend}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.months_full}</Typography>
                </Box>
              </Box>
              <Box sx={trendLegendSx}>
                {[{ color: "success.main", label: t.income }, { color: "error.main", label: t.expense }, { color: "primary.main", label: t.net }].map(({ color, label }) => (
                  <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: color }} />
                    <Typography variant="body2" sx={{ color, fontWeight: 600, fontSize: 12 }}>{label}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mt: 1 }}>
                <StudioCashflow months={months} t={t} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, boxShadow: shadows.card }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={listHeaderSx("success")}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }} color="success.main">{t.incomes}</Typography>
              <Typography variant="body2" color="text.secondary">
                {incomeTxs.length} {t.incomeTab.records}
              </Typography>
            </Box>
            <Box sx={listHeaderActionsSx}>
              <CalendarFilter txs={txs} tipo="INGRESO" onFilter={setCalFilter} />
            </Box>
          </Box>
          {incomeCats.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              <Chip
                size="small"
                label={t.common.all}
                variant={!activeCat ? "filled" : "outlined"}
                color={!activeCat ? "success" : "default"}
                onClick={() => setActiveCat(null)}
                sx={{ fontWeight: 600 }}
              />
              {incomeCats.map((c) => {
                const { label, Icon } = catMeta(c.categoria);
                return (
                  <Chip
                    key={c.categoria}
                    size="small"
                    icon={<Icon />}
                    label={label}
                    variant={activeCat === c.categoria ? "filled" : "outlined"}
                    color={activeCat === c.categoria ? "success" : "default"}
                    onClick={() => setActiveCat(activeCat === c.categoria ? null : c.categoria)}
                    sx={{ fontWeight: 500 }}
                  />
                );
              })}
            </Box>
          )}
          <TransactionList type="income" txs={incomeTxs} catMeta={catMeta} onEdit={setEditingTx} onDelete={moveToTrash} />
          <Box sx={totalFooterSx("success", 3)}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{t.incomeTab.totalIncome}{(calFilter || activeCat) ? ` (${t.common.filtered})` : ""}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>+{fmt(filteredTotal, true)}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Stack>
    {editingTx && (
      <AddTransactionModal
        editTx={editingTx}
        mode="income"
        onAdd={() => showToast?.(t.common.transactionUpdated, "success")}
        onClose={() => setEditingTx(null)}
        showToast={showToast}
      />
    )}
    </>
  );
}