"use client"

import { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar, Stack, List, ListItem, ListItemAvatar, ListItemText,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from "@mui/material";
import { AccountBalanceWallet as WalletIcon, PieChart as PieIcon, ShowChart as ChartIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "../theme/icons";
import AddTransactionModal from "./AddTransactionModal.jsx";
import { CATEGORIES, fmtMoney, txByCategory, txByMonth } from "../data/index.js";
import { filterByPeriod, periodLabel } from "../data/helpers.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { Donut, SparkArea, StudioCashflow } from "./Charts.jsx";
import { NoTransactions, CalendarFilter } from "./shared.jsx";


export default function IncomeTab({ period, openModal, showToast }) {
  const { t, lang, currency } = useSettings();
  const { txs, deleteTx, customCats } = useData();
  const [editingTx, setEditingTx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [calFilter, setCalFilter] = useState(null);
  const [activeCat, setActiveCat] = useState(null);

  const periodTxs = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const months = useMemo(() => txByMonth(txs).slice(-12), [txs]);
  const incomeCats = useMemo(() => txByCategory(periodTxs, "INGRESO"), [periodTxs]);
  const totalIn = useMemo(() => periodTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0), [periodTxs]);
  const prevTxs = useMemo(() => filterByPeriod(txs, period, -1), [txs, period]);
  const prevIn = useMemo(() => prevTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0), [prevTxs]);
  const dIn = prevIn ? ((totalIn - prevIn) / prevIn) * 100 : null;
  const allIncomeTxs = useMemo(() => txs.filter((x) => x.tipo === "INGRESO").slice().reverse(), [txs]);

  const incomeTxs = useMemo(() => {
    let base;
    if (calFilter) {
      base = allIncomeTxs.filter((x) => {
        if (calFilter.type === "day") {
          const d = calFilter.date;
          return x.date.getFullYear() === d.getFullYear() && x.date.getMonth() === d.getMonth() && x.date.getDate() === d.getDate();
        }
        return x.date.getFullYear() === calFilter.date.getFullYear() && x.date.getMonth() === calFilter.date.getMonth();
      });
    } else {
      base = periodTxs.filter((x) => x.tipo === "INGRESO").slice().reverse();
    }
    if (activeCat) base = base.filter((x) => x.categoria === activeCat);
    return base;
  }, [periodTxs, allIncomeTxs, calFilter, activeCat]);
  const filteredTotal = useMemo(() => incomeTxs.reduce((s, x) => s + x.valor, 0), [incomeTxs]);
  const incomeDonut = useMemo(() => incomeCats.map((c) => {
    const isCustom = c.categoria?.startsWith("custom_");
    const color = isCustom
      ? (customCats.find((cc) => cc.id === c.categoria.slice("custom_".length))?.color || "#9e9e9e")
      : (CATEGORIES.income[c.categoria]?.color || "#9e9e9e");
    const label = isCustom
      ? (customCats.find((cc) => cc.id === c.categoria.slice("custom_".length))?.nombre || c.categoria)
      : (CATEGORIES.income[c.categoria]?.[lang] || c.categoria);
    return { label, value: c.total, color };
  }), [incomeCats, customCats, lang]);

  return (
    <>
    <Stack spacing={3}>
      <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, transition: "transform 0.3s, box-shadow 0.3s", "&:hover": { transform: "translateY(-2px)" }, borderTop: "4px solid", borderTopColor: "success.main" }}>
        <CardContent sx={{ p: 2.5, color: "text.primary" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 600, color: "text.secondary" }}>{t.income.toUpperCase()} · {periodLabel(period, t).toUpperCase()}</Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 1, color: "success.main" }}>{fmtMoney(totalIn, currency)}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconButton size="medium" onClick={() => openModal("", "income")} sx={{ bgcolor: "success.light", color: "success.dark", transition: "transform 0.2s, background-color 0.2s, box-shadow 0.2s", "&:hover": { bgcolor: "success.main", color: "success.contrastText", transform: "scale(1.05)" } }}>
                <AddIcon />
              </IconButton>
              <Avatar sx={{ width: 48, height: 48, bgcolor: "success.light", color: "success.dark" }}>
                <WalletIcon sx={{ fontSize: 24 }} />
              </Avatar>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
            {dIn != null && (
              <Chip size="small" label={`${dIn > 0 ? "+" : ""}${dIn.toFixed(1)}% ${lang === "es" ? "vs ant." : "vs prev."}`} color={dIn > 0 ? "success" : "error"} variant="filled" sx={{ fontWeight: 600 }} />
            )}
            <Typography variant="body2" color="text.secondary">{incomeTxs.length} {lang === "es" ? "ingresos" : "income records"}</Typography>
          </Box>
          <Box sx={{ mt: 1 }}><SparkArea data={months.map((m) => m.ingreso)} /></Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{lang === "es" ? "Fuentes de ingreso" : "Income sources"}</Typography>
              <Typography variant="body2" color="text.secondary">{periodLabel(period, t)} · {incomeCats.length} {lang === "es" ? "categorías" : "categories"}</Typography>
            </Box>
            <Avatar sx={{ bgcolor: "success.light", color: "success.dark" }}><PieIcon /></Avatar>
          </Box>
          {incomeCats.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3, fontStyle: "italic" }}>
              {lang === "es" ? "Sin ingresos en este período" : "No income in this period"}
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[...incomeCats].sort((a, b) => b.total - a.total).map((c) => {
                const isCustom = c.categoria?.startsWith("custom_");
                const resolvedColor = (isCustom
                  ? customCats.find((cc) => cc.id === c.categoria.slice("custom_".length))?.color
                  : CATEGORIES.income[c.categoria]?.color) || "#9e9e9e";
                const catLabel = isCustom
                  ? (customCats.find((cc) => cc.id === c.categoria.slice("custom_".length))?.nombre || c.categoria)
                  : (CATEGORIES.income[c.categoria]?.[lang] || c.categoria);
                const pct = totalIn > 0 ? (c.total / totalIn) * 100 : 0;
                const isActive = activeCat === c.categoria;
                return (
                  <Box
                    key={c.categoria}
                    onClick={() => setActiveCat(isActive ? null : c.categoria)}
                    sx={{
                      p: 1.5, borderRadius: 2, border: "1px solid", cursor: "pointer",
                      borderColor: isActive ? resolvedColor : "divider",
                      bgcolor: isActive ? `${resolvedColor}12` : "action.hover",
                      transition: "transform 0.2s, background-color 0.2s, box-shadow 0.2s",
                      "&:hover": { bgcolor: `${resolvedColor}18`, borderColor: resolvedColor },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: resolvedColor, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }} noWrap>{catLabel}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main", whiteSpace: "nowrap" }}>{fmtMoney(c.total, currency, true)}</Typography>
                      <Chip size="small" label={`${Math.round(pct)}%`} sx={{ bgcolor: resolvedColor, color: "#fff", fontWeight: 700, fontSize: 10, height: 20 }} />
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); openModal(c.categoria, "income"); }}
                        aria-label={lang === "es" ? `Registrar ${catLabel}` : `Add ${catLabel}`}
                        sx={{ width: 28, height: 28, bgcolor: resolvedColor, color: "#fff", flexShrink: 0, "&:hover": { bgcolor: resolvedColor, opacity: 0.85 } }}
                      >
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ height: 7, borderRadius: 4, bgcolor: "background.paper", overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: resolvedColor, borderRadius: 4, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      {c.count} {lang === "es" ? "transacciones" : "transactions"}
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
          <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transition: "transform 0.3s, box-shadow 0.3s", "&:hover": { boxShadow: "0 8px 32px rgba(0,0,0,0.12)", transform: "translateY(-4px)" }, borderTop: "3px solid", borderTopColor: "warning.main" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: "warning.light", color: "warning.dark" }}><PieIcon /></Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{t.breakdown}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.income} · {periodLabel(period, t)}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1 }}>
                <Box sx={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover", borderRadius: "50%" }}>
                  <Donut slices={incomeDonut} size={160} thickness={20} />
                  <Box sx={{ position: "absolute", textAlign: "center", bgcolor: "background.paper", borderRadius: "50%", width: 90, height: 90, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <Typography variant="h6" fontWeight={700} color="success.main">{fmtMoney(totalIn, currency, true)}</Typography>
                    <Typography variant="caption" color="text.secondary">{t.income}</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  {incomeDonut.map((s) => (
                    <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, p: 1, bgcolor: "action.hover", borderRadius: 2, transition: "transform 0.2s, background-color 0.2s, box-shadow 0.2s", "&:hover": { bgcolor: "action.selected" } }}>
                      <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: s.color }} />
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontWeight: 500 }}>{s.label}</Typography>
                      <Typography variant="body2" fontWeight={700} color="success.main">{totalIn > 0 ? Math.round((s.value / totalIn) * 100) : 0}%</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transition: "transform 0.3s, box-shadow 0.3s", "&:hover": { boxShadow: "0 8px 32px rgba(0,0,0,0.12)", transform: "translateY(-4px)" }, borderTop: "3px solid", borderTopColor: "info.main" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: "info.light", color: "info.dark" }}><ChartIcon /></Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{t.trend}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.months_full}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2, py: 1.5, bgcolor: "action.hover", borderRadius: 2, flexWrap: "wrap" }}>
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

      <Card sx={{ borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, pb: 2, borderBottom: "2px solid", borderColor: "success.main" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }} color="success.main">{t.incomes}</Typography>
              <Typography variant="body2" color="text.secondary">
                {incomeTxs.length} {lang === "es" ? "registros" : "records"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
              <CalendarFilter txs={txs} tipo="INGRESO" onFilter={setCalFilter} lang={lang} currency={currency} />
            </Box>
          </Box>
          {incomeCats.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              <Chip
                size="small"
                label={lang === "es" ? "Todos" : "All"}
                variant={!activeCat ? "filled" : "outlined"}
                color={!activeCat ? "success" : "default"}
                onClick={() => setActiveCat(null)}
                sx={{ fontWeight: 600 }}
              />
              {incomeCats.map((c) => {
                const label = c.categoria?.startsWith("custom_")
                  ? (customCats.find((cc) => cc.id === c.categoria.slice("custom_".length))?.nombre || c.categoria)
                  : (CATEGORIES.income[c.categoria]?.[lang] || c.categoria);
                return (
                  <Chip
                    key={c.categoria}
                    size="small"
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
          {incomeTxs.length === 0 ? (
            <NoTransactions lang={lang} type="income" />
          ) : (
            <List disablePadding sx={{ maxHeight: 400, overflowY: "auto" }}>
              {incomeTxs.map((x) => {
              const color = (x.categoria?.startsWith("custom_")
                ? customCats.find((c) => c.id === x.categoria.slice("custom_".length))?.color
                : CATEGORIES.income[x.categoria]?.color) || "#9e9e9e";
              const catName = CATEGORIES.income[x.categoria]?.[lang] || (x.categoria?.startsWith("custom_") ? customCats.find((c) => c.id === x.categoria.slice("custom_".length))?.nombre : null) || x.categoria;
              return (
                <ListItem key={x.id} disablePadding sx={{ py: 1, borderBottom: 1, borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }}
                  secondaryAction={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1" fontWeight={700} color="success.main" sx={{ display: { xs: "none", sm: "block" } }}>
                        +{fmtMoney(x.valor, currency, true)}
                      </Typography>
                      <IconButton onClick={() => setEditingTx(x)} aria-label={lang === "es" ? "Editar" : "Edit"} sx={{ minWidth: 40, minHeight: 40 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => setDeleteTarget(x)} aria-label={lang === "es" ? "Eliminar" : "Delete"} sx={{ minWidth: 40, minHeight: 40 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar sx={{ minWidth: 52 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: color, color: "common.white", fontSize: 15, fontWeight: 700 }}>{catName[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600} noWrap>{x.concepto}</Typography>}
                    secondary={
                      <Typography variant="caption" color="text.secondary" component="span">
                        {catName} · {x.date.toLocaleString(lang === "es" ? "es-PE" : "en-US", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                        <Typography variant="caption" fontWeight={700} color="success.main" sx={{ display: { xs: "inline", sm: "none" }, ml: 1 }}>
                          +{fmtMoney(x.valor, currency, true)}
                        </Typography>
                      </Typography>
                    }
                    sx={{ mr: { xs: 12, sm: 18 } }}
                  />
                </ListItem>
              );
            })}
            </List>
          )}
          <Box sx={{ mt: 2, pt: 2, borderTop: "2px solid", borderColor: "success.main", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "success.main", color: "success.contrastText", borderRadius: 2, px: 3, py: 2 }}>
            <Typography variant="body1" fontWeight={600}>{lang === "es" ? "TOTAL INGRESOS" : "TOTAL INCOME"}{(calFilter || activeCat) ? ` (${lang === "es" ? "filtrado" : "filtered"})` : ""}</Typography>
            <Typography variant="h5" fontWeight={700}>+{fmtMoney(filteredTotal, currency, true)}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Stack>
    {editingTx && (
      <AddTransactionModal
        editTx={editingTx}
        mode="income"
        onAdd={() => showToast?.(lang === "es" ? "Transacción actualizada" : "Transaction updated", "success")}
        onClose={() => setEditingTx(null)}
        showToast={showToast}
      />
    )}
    <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{lang === "es" ? "¿Eliminar transacción?" : "Delete transaction?"}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {deleteTarget?.concepto} · {deleteTarget ? fmtMoney(deleteTarget.valor, currency) : ""}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {lang === "es" ? "Esta acción no se puede deshacer." : "This action cannot be undone."}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setDeleteTarget(null)} color="inherit">{lang === "es" ? "Cancelar" : "Cancel"}</Button>
        <Button
          variant="contained" color="error"
          onClick={async () => { try { await deleteTx(deleteTarget.id); showToast?.(lang === "es" ? "Transacción eliminada" : "Transaction deleted", "success"); } catch { showToast?.(lang === "es" ? "Error al eliminar" : "Error deleting", "error"); } finally { setDeleteTarget(null); } }}
        >
          {lang === "es" ? "Eliminar" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}