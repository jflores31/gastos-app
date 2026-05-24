"use client"

import { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar, Stack, List, ListItem, ListItemAvatar, ListItemText,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from "@mui/material";
import { TrendingUp as TrendUpIcon, AccountBalanceWallet as WalletIcon, PieChart as PieIcon, ShowChart as ChartIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import AddTransactionModal from "./AddTransactionModal.jsx";
import { CATEGORIES, fmtMoney, txByCategory, txByMonth } from "../data/index.js";
import { filterByPeriod, periodLabel } from "../data/helpers.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { Donut, SparkArea, StudioCashflow } from "./Charts.jsx";
import { NoTransactions } from "./shared.jsx";

const INCOME_COLORS = { SUELDO: "#5a9bc9", BONO: "#c9a55a", NEGOCIO: "#7ab87a", ALQUILER: "#a87cc4", MUSICA: "#c97a9b", ADELANTO: "#9e9e9e" };

export default function IncomeTab({ period, openModal, showToast }) {
  const { t, lang, currency } = useSettings();
  const { txs, deleteTx } = useData();
  const [editingTx, setEditingTx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const periodTxs = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const months = useMemo(() => txByMonth(txs).slice(-12), [txs]);
  const incomeCats = useMemo(() => txByCategory(periodTxs, "INGRESO"), [periodTxs]);
  const totalIn = useMemo(() => periodTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0), [periodTxs]);
  const prevTxs = useMemo(() => filterByPeriod(txs, period, -1), [txs, period]);
  const prevIn = useMemo(() => prevTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0), [prevTxs]);
  const dIn = prevIn ? ((totalIn - prevIn) / prevIn) * 100 : 0;
  const incomeTxs = useMemo(() => periodTxs.filter((x) => x.tipo === "INGRESO").slice().reverse(), [periodTxs]);
  const incomeDonut = useMemo(() => incomeCats.map((c) => ({ label: c.categoria, value: c.total, color: INCOME_COLORS[c.categoria] || "#9e9e9e" })), [incomeCats]);

  return (
    <>
    <Stack spacing={3}>
      <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, transition: "all 0.3s", "&:hover": { transform: "translateY(-2px)" }, borderTop: "4px solid", borderTopColor: "success.main" }}>
        <CardContent sx={{ p: 2.5, color: "text.primary" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 600, color: "text.secondary" }}>{t.income.toUpperCase()} · {periodLabel(period, t).toUpperCase()}</Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 1, color: "success.main" }}>{fmtMoney(totalIn, currency)}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconButton size="medium" onClick={() => openModal("", "income")} sx={{ bgcolor: "success.light", color: "success.dark", transition: "all 0.2s", "&:hover": { bgcolor: "success.main", color: "success.contrastText", transform: "scale(1.05)" } }}>
                <AddIcon />
              </IconButton>
              <Avatar sx={{ width: 48, height: 48, bgcolor: "success.light", color: "success.dark" }}>
                <WalletIcon sx={{ fontSize: 24 }} />
              </Avatar>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
            <Chip size="small" label={`${dIn > 0 ? "+" : ""}${dIn.toFixed(1)}%`} color={dIn > 0 ? "success" : "error"} variant="filled" sx={{ fontWeight: 600 }} />
            <Typography variant="body2" color="text.secondary">{incomeTxs.length} {lang === "es" ? "ingresos" : "income records"}</Typography>
          </Box>
          <Box sx={{ mt: 1 }}><SparkArea data={months.map((m) => m.ingreso)} /></Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {Object.keys(CATEGORIES.income).slice(0, 7).map((cat, idx) => {
          const catData = incomeCats.find((c) => c.categoria === cat);
          const total = catData?.total || 0;
          const count = catData?.count || 0;
          const color = CATEGORIES.income[cat]?.color || ["#5a9bc9", "#e91e63", "#7ab87a", "#a87cc4", "#ff6f61", "#e74c3c", "#2ecc71"][idx];
          return (
          <Grid size={{ xs: 6, sm: 3, md: 2.4 }} key={cat}>
            <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "all 0.3s", "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.12)", transform: "translateY(-4px)" }, borderTop: "4px solid", borderTopColor: color, bgcolor: "background.paper" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: color, fontSize: 11, fontWeight: 700, color: "#fff" }}>{(CATEGORIES.income[cat]?.[lang] || cat)[0]}</Avatar>
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontWeight: 500 }}>{CATEGORIES.income[cat]?.[lang] || cat}</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700} color="success.main">{fmtMoney(total, currency, true)}</Typography>
                <Typography variant="caption" color="text.secondary">{count} tx · {totalIn > 0 ? Math.round((total / totalIn) * 100) : 0}%</Typography>
              </CardContent>
            </Card>
          </Grid>);
        })}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transition: "all 0.3s", "&:hover": { boxShadow: "0 8px 32px rgba(0,0,0,0.12)", transform: "translateY(-4px)" }, borderTop: "3px solid", borderTopColor: "warning.main" }}>
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
                    <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, p: 1, bgcolor: "action.hover", borderRadius: 2, transition: "all 0.2s", "&:hover": { bgcolor: "action.selected" } }}>
                      <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: s.color }} />
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontWeight: 500 }}>{CATEGORIES.income[s.label]?.[lang] || s.label}</Typography>
                      <Typography variant="body2" fontWeight={700} color="success.main">{totalIn > 0 ? Math.round((s.value / totalIn) * 100) : 0}%</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transition: "all 0.3s", "&:hover": { boxShadow: "0 8px 32px rgba(0,0,0,0.12)", transform: "translateY(-4px)" }, borderTop: "3px solid", borderTopColor: "info.main" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: "info.light", color: "info.dark" }}><ChartIcon /></Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{t.trend}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.months_full}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 2, py: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: "success.main" }} />
                  <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>{t.income}</Typography>
                </Box>
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, pb: 2, borderBottom: "2px solid", borderColor: "success.main" }}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="success.main">{t.incomes}</Typography>
              <Typography variant="body2" color="text.secondary">{incomeTxs.length} {lang === "es" ? "registros" : "records"}</Typography>
            </Box>
          </Box>
          {incomeTxs.length === 0 ? (
            <NoTransactions lang={lang} type="income" />
          ) : (
            <List disablePadding sx={{ maxHeight: 400, overflowY: "auto" }}>
              {incomeTxs.map((x) => {
              const color = INCOME_COLORS[x.categoria] || "#9e9e9e";
              const catName = CATEGORIES.income[x.categoria]?.[lang] || x.categoria;
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
                        {catName} · {x.dia}/{x.mes + 1}/{x.año}
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
            <Typography variant="body1" fontWeight={600}>{lang === "es" ? "TOTAL INGRESOS" : "TOTAL INCOME"}</Typography>
            <Typography variant="h5" fontWeight={700}>+{fmtMoney(totalIn, currency, true)}</Typography>
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
          onClick={() => { deleteTx(deleteTarget.id); showToast?.(lang === "es" ? "Transacción eliminada" : "Transaction deleted", "success"); setDeleteTarget(null); }}
        >
          {lang === "es" ? "Eliminar" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}