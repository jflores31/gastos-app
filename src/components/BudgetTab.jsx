"use client"

import { useState, useMemo } from "react";
import { Box, Card, CardContent, Typography, Grid, Stack, LinearProgress, IconButton, TextField, Avatar, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText, ListItemSecondaryAction, Tooltip } from "@mui/material";
import { Check as CheckIcon, AccountBalanceWallet as WalletIcon, TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon, CheckCircle as HealthIcon, Warning as WarningIcon, PieChart as PieIcon, CompareArrows as CompareIcon, Event as EventIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { CATEGORIES, fmtMoney, txByCategory } from "../data/index.js";
import { filterByPeriod, monthCount, healthScore, recurringList, periodLabel } from "../data/helpers.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { Donut } from "./Charts.jsx";

export default function BudgetTab({ period }) {
  const { t, lang, currency } = useSettings();
  const { txs, editBudgets, setEditBudgets, deleteBudgetCat, customCats } = useData();
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [addDialog, setAddDialog] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [editExisting, setEditExisting] = useState(null);
  const [editExistingVal, setEditExistingVal] = useState("");

  const periodTxs = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const prevTxs = useMemo(() => filterByPeriod(txs, period, -1), [txs, period]);
  const cats = useMemo(() => txByCategory(periodTxs), [periodTxs]);
  const totalOut = periodTxs.filter((x) => x.tipo === "EGRESO").reduce((s, x) => s + x.valor, 0);
  const totalIn = periodTxs.filter((x) => x.tipo === "INGRESO").reduce((s, x) => s + x.valor, 0);
  const prevOut = prevTxs.filter((x) => x.tipo === "EGRESO").reduce((s, x) => s + x.valor, 0);
  const net = totalIn - totalOut;
  const savingsRate = totalIn > 0 ? (net / totalIn) * 100 : 0;
  const dOut = prevOut ? ((totalOut - prevOut) / prevOut) * 100 : 0;
  const anomalies = periodTxs.filter((x) => x.anomaly);
  const score = healthScore(savingsRate, dOut, anomalies.length);
  const recurring = useMemo(() => recurringList(txs), [txs]);

  const totalBudget = Object.values(editBudgets).reduce((s, v) => s + v, 0) * monthCount(period);
  const budgetUsed = totalBudget > 0 ? totalOut / totalBudget : 0;
  const gaugeColor = score >= 75 ? "success" : score >= 50 ? "warning" : "error";
  const gaugeIcon = score >= 75 ? <HealthIcon /> : <WarningIcon />;

  const donutData = useMemo(() => {
    return Object.keys(editBudgets).map((cat) => {
      const spent = cats.find((c) => c.categoria === cat)?.total || 0;
      const color = CATEGORIES.expense[cat]?.color || "#9e9e9e";
      const catName = CATEGORIES.expense[cat]?.[lang] || cat;
      return { label: catName, value: spent, color };
    }).filter(d => d.value > 0);
  }, [editBudgets, cats, lang]);

  const startEdit = (cat) => { setEditing(cat); setEditVal(String(editBudgets[cat])); };
  const saveEdit = () => {
    const v = parseFloat(editVal);
    if (v > 0) setEditBudgets((b) => ({ ...b, [editing]: v }));
    setEditing(null);
  };

  const handleAddBudget = () => {
    if (newCat && newBudget > 0) {
      setEditBudgets((b) => ({ ...b, [newCat]: parseFloat(newBudget) }));
      setNewCat("");
      setNewBudget("");
    }
  };

  const startEditExisting = (cat) => {
    setEditExisting(cat);
    setEditExistingVal(String(editBudgets[cat]));
  };

  const saveEditExisting = () => {
    const v = parseFloat(editExistingVal);
    if (v > 0) setEditBudgets((b) => ({ ...b, [editExisting]: v }));
    setEditExisting(null);
  };

  const deleteBudget = (cat) => {
    deleteBudgetCat(cat);
  };

  const healthLabel = score >= 75 ? (lang === "es" ? "Excelente" : "Excellent") : score >= 50 ? (lang === "es" ? "Regular" : "Fair") : (lang === "es" ? "Crítico" : "Critical");

  const availableCats = Object.keys(CATEGORIES.expense).filter(cat => !editBudgets[cat]);

  return (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: gaugeColor + ".main" }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 2, bgcolor: "action.hover", borderRadius: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: gaugeColor + ".light", color: gaugeColor + ".dark", mb: 1 }}>{gaugeIcon}</Avatar>
                <Box sx={{ position: "relative", width: 120, height: 72 }}>
                  <svg viewBox="0 0 120 72" style={{ width: "100%", height: "100%" }}>
                    <path d="M10,66 A55,55,0,0,1,110,66" fill="none" stroke="currentColor" opacity={0.15} strokeWidth="10" strokeLinecap="round" />
                    <path d="M10,66 A55,55,0,0,1,110,66" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * 172.8} 200`} style={{ color: gaugeColor === "success" ? "var(--income)" : gaugeColor === "warning" ? "#F9A825" : "var(--expense)" }} />
                  </svg>
                  <Typography variant="h4" fontWeight={800} sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, 20%)", color: gaugeColor + ".main" }}>{score}</Typography>
                </Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>{t.healthScore}</Typography>
                <Chip label={healthLabel} color={gaugeColor} size="small" sx={{ fontWeight: 600, mt: 1 }} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={2}>
                {[
                  { lbl: lang === "es" ? "Presupuesto" : "Budget", val: fmtMoney(totalBudget, currency, true), c: "primary.main", icon: <WalletIcon fontSize="small" /> },
                  { lbl: t.spent, val: fmtMoney(totalOut, currency, true), c: budgetUsed > 1 ? "error.main" : "success.main", icon: <TrendDownIcon fontSize="small" /> },
                  { lbl: lang === "es" ? "Uso" : "Usage", val: Math.round(budgetUsed * 100) + "%", c: budgetUsed > 1 ? "error.main" : "primary.main", icon: null },
                  { lbl: t.income, val: fmtMoney(totalIn, currency, true), c: "success.main", icon: <TrendUpIcon fontSize="small" /> },
                ].map(({ lbl, val, c, icon }) => (
                  <Grid size={{ xs: 6, md: 3 }} key={lbl}>
                    <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        {icon}
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{lbl}</Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={700} sx={{ color: c }}>{val}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>{lang === "es" ? "Presupuestos" : "Budgets"}</Typography>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setAddDialog(true)} size="small">
          {lang === "es" ? "Gestionar" : "Manage"}
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {Object.keys(editBudgets).map((cat) => {
          const spent = cats.find((c) => c.categoria === cat)?.total || 0;
          const limit = editBudgets[cat] * monthCount(period);
          const pct = limit ? spent / limit : 0;
          const color = CATEGORIES.expense[cat]?.color || "#9e9e9e";
          const catName = CATEGORIES.expense[cat]?.[lang] || cat;
          const isEd = editing === cat;
          const isOver = pct > 1;
          const isWarning = pct >= 0.8 && pct <= 1;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat}>
              <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: isOver ? "error.main" : isWarning ? "warning.main" : "divider", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "all 0.3s", "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.12)", transform: "translateY(-4px)" }, borderTop: "4px solid", borderTopColor: color, bgcolor: isOver ? "error.light" : isWarning ? "warning.light" : "background.paper", height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: color, fontSize: 14, fontWeight: 700, color: "common.white" }}>{catName[0]}</Avatar>
                      <Typography variant="body1" fontWeight={600} noWrap sx={{ color: isOver ? "error.dark" : isWarning ? "warning.dark" : "text.primary" }}>{catName}</Typography>
                    </Box>
                    {isWarning && !isOver && <Chip size="small" label="80%" color="warning" sx={{ height: 20, fontSize: 10 }} />}
                    {isOver && <Chip size="small" label="!" color="error" sx={{ height: 20, fontWeight: 700 }} />}
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, pct * 100)} 
                    color={isOver ? "error" : isWarning ? "warning" : "primary"} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5, 
                      mb: 1.5, 
                      bgcolor: "action.hover",
                      "& .MuiLinearProgress-bar": {
                        transition: "transform 0.8s ease-in-out",
                      }
                    }} 
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h6" fontWeight={700} color={isOver ? "error.main" : "text.primary"}>{fmtMoney(spent, currency, true)}</Typography>
                    {isEd ? (
                      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                        <TextField size="small" type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} onBlur={saveEdit} sx={{ width: 80, "& input": { fontSize: 12, py: 0.5 } }} autoFocus />
                        <IconButton size="small" onClick={saveEdit} color="success"><CheckIcon fontSize="small" /></IconButton>
                      </Box>
                    ) : (
                      <Chip size="small" variant="outlined" label={fmtMoney(limit, currency, true)} onClick={() => startEdit(cat)} sx={{ cursor: "pointer", fontWeight: 600 }} />
                    )}
                  </Box>
                  <Box sx={{ p: 1, bgcolor: isOver ? "error.main" : isWarning ? "warning.main" : "action.hover", borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: isOver || isWarning ? "#fff" : "text.secondary", fontWeight: 500 }}>
                      {isOver ? `+${fmtMoney(spent - limit, currency, true)} ${t.overspent.toLowerCase()}` : `${fmtMoney(limit - spent, currency, true)} ${t.remaining.toLowerCase()}`}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card onClick={() => setAddDialog(true)} sx={{ borderRadius: 2, border: "2px dashed", borderColor: "primary.main", bgcolor: "primary.light", height: "100%", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", "&:hover": { bgcolor: "primary.main", color: "primary.contrastText" } }}>
            <Box sx={{ textAlign: "center", p: 2 }}>
              <AddIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" fontWeight={600}>{lang === "es" ? "Agregar presupuesto" : "Add budget"}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderTop: "3px solid", borderTopColor: "warning.main", height: "100%", minHeight: 280, display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: "warning.light", color: "warning.dark" }}><PieIcon /></Avatar>
                <Typography variant="h6" fontWeight={700}>{lang === "es" ? "Distribución" : "Distribution"}</Typography>
              </Box>
              <Box sx={{ display: "flex", flex: 1, gap: 3, alignItems: "center" }}>
                <Box sx={{ position: "relative", width: 180, height: 180, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Donut slices={donutData} size={160} thickness={16} />
                  <Box sx={{ position: "absolute", textAlign: "center", bgcolor: "background.paper", borderRadius: "50%", width: 80, height: 80, display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    <Typography variant="body1" fontWeight={700}>{fmtMoney(totalOut, currency, true)}</Typography>
                    <Typography variant="caption" color="text.secondary">{t.spent}</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1, maxHeight: 200, overflowY: "auto" }}>
                  {donutData.slice(0, 5).map((s) => (
                    <Tooltip key={s.label} title={s.label} arrow placement="top">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, p: 1, borderRadius: 1.5, bgcolor: "action.hover", cursor: "default" }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: s.color }} />
                        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</Typography>
                        <Typography variant="body2" fontWeight={700}>{totalOut > 0 ? Math.round((s.value / totalOut) * 100) : 0}%</Typography>
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderTop: "3px solid", borderTopColor: "info.main", height: "100%", minHeight: 280, display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: "info.light", color: "info.dark" }}><CompareIcon /></Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{lang === "es" ? "vs mes anterior" : "vs previous month"}</Typography>
                  <Typography variant="body2" color="text.secondary">{periodLabel(period, t)}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", flex: 1, gap: 2, alignItems: "center" }}>
                <Box sx={{ flex: 1, p: 2.5, bgcolor: "action.hover", borderRadius: 2, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Typography variant="caption" color="text.secondary">{lang === "es" ? "Gasto anterior" : "Previous"}</Typography>
                  <Typography variant="h5" fontWeight={700}>{fmtMoney(prevOut, currency, true)}</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2.5, bgcolor: "action.hover", borderRadius: 2, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Typography variant="caption" color="text.secondary">{lang === "es" ? "Cambio" : "Change"}</Typography>
                  <Chip label={`${dOut > 0 ? "+" : ""}${dOut.toFixed(1)}%`} color={dOut > 0 ? "error" : "success"} size="medium" sx={{ fontWeight: 600, mt: 0.5 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {Object.keys(editBudgets).length > 0 && (
        <Card sx={{ borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderTop: "3px solid", borderTopColor: "primary.main" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark" }}><CompareIcon /></Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{lang === "es" ? "Presupuesto vs Gasto real" : "Budget vs Actual"}</Typography>
                <Typography variant="body2" color="text.secondary">{periodLabel(period, t)}</Typography>
              </Box>
            </Box>
            <Stack spacing={2}>
              {Object.keys(editBudgets).map((cat) => {
                const spent = cats.find((c) => c.categoria === cat)?.total || 0;
                const limit = editBudgets[cat] * monthCount(period);
                const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
                const rawPct = limit > 0 ? (spent / limit) * 100 : 0;
                const color = CATEGORIES.expense[cat]?.color || "#9e9e9e";
                const catName = CATEGORIES.expense[cat]?.[lang] || cat;
                const isOver = rawPct > 100;
                const isWarn = rawPct >= 80 && rawPct <= 100;
                const barColor = isOver ? "error.main" : isWarn ? "warning.main" : "success.main";
                return (
                  <Box key={cat}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: { xs: 120, sm: 200 } }}>{catName}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {fmtMoney(spent, currency, true)} / {fmtMoney(limit, currency, true)}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${rawPct.toFixed(0)}%`}
                          color={isOver ? "error" : isWarn ? "warning" : "success"}
                          variant="filled"
                          sx={{ fontWeight: 700, height: 20, fontSize: 11, minWidth: 46 }}
                        />
                      </Box>
                    </Box>
                    {/* Budget track (background) + Spent bar */}
                    <Box sx={{ position: "relative", height: 12, borderRadius: 6, bgcolor: "action.hover", overflow: "hidden" }}>
                      {/* Limit marker at 100% — visual reference */}
                      <Box
                        sx={{
                          position: "absolute", left: 0, top: 0, height: "100%",
                          width: `${pct * 100}%`,
                          bgcolor: barColor,
                          borderRadius: 6,
                          transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                          backgroundImage: isOver
                            ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 4px, transparent 4px, transparent 8px)"
                            : "none",
                        }}
                      />
                    </Box>
                    {/* Spent amount and remaining */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: barColor, fontWeight: 600 }}>
                        {isOver
                          ? `${lang === "es" ? "Excedido" : "Over"} +${fmtMoney(spent - limit, currency, true)}`
                          : `${lang === "es" ? "Disponible" : "Left"} ${fmtMoney(limit - spent, currency, true)}`}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                        {lang === "es" ? "límite" : "limit"} {fmtMoney(limit, currency, true)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
            {/* Summary footer */}
            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {lang === "es" ? "Total gastado" : "Total spent"}: <strong>{fmtMoney(totalOut, currency, true)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {lang === "es" ? "Total presupuestado" : "Total budget"}: <strong>{fmtMoney(totalBudget, currency, true)}</strong>
              </Typography>
              <Chip
                size="small"
                label={`${Math.round(budgetUsed * 100)}% ${lang === "es" ? "usado" : "used"}`}
                color={budgetUsed > 1 ? "error" : budgetUsed >= 0.8 ? "warning" : "success"}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderTop: "3px solid", borderTopColor: "success.main" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Avatar sx={{ bgcolor: "success.light", color: "success.dark" }}><EventIcon /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{t.recurring}</Typography>
              <Typography variant="body2" color="text.secondary">{recurring.length} {lang === "es" ? "pagos" : "payments"}</Typography>
            </Box>
          </Box>
          <Stack spacing={1}>
            {recurring.slice(0, 5).map((r) => {
              const isCustom = r.categoria?.startsWith("custom_");
              const customCat = isCustom ? customCats.find((cc) => cc.id === r.categoria.slice("custom_".length)) : null;
              const color = customCat?.color || CATEGORIES.expense[r.categoria]?.color || "#9e9e9e";
              const catName = customCat?.nombre || CATEGORIES.expense[r.categoria]?.[lang] || r.categoria;
              return (
                <Box key={r.concepto} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: color, color: "common.white", fontSize: 13, fontWeight: 700 }}>{r.day}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={600} noWrap>{r.concepto}</Typography>
                    <Typography variant="caption" sx={{ color, fontWeight: 500 }}>{catName}</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={700}>{fmtMoney(r.avg, currency, true)}</Typography>
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={addDialog} onClose={() => { setAddDialog(false); setEditExisting(null); }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{lang === "es" ? "Gestionar Presupuestos" : "Manage Budgets"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2, minWidth: { xs: "80vw", sm: 360 } }}>
          {Object.keys(editBudgets).length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary">{lang === "es" ? "Presupuestos existentes" : "Existing budgets"}</Typography>
              <List dense sx={{ bgcolor: "action.hover", borderRadius: 1 }}>
                {Object.entries(editBudgets).map(([cat, amount]) => (
                  <ListItem key={cat} sx={{ py: 0.5 }}>
                    {editExisting === cat ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                        <TextField size="small" type="number" value={editExistingVal} onChange={(e) => setEditExistingVal(e.target.value)} sx={{ flex: 1 }} autoFocus />
                        <IconButton size="small" color="success" onClick={saveEditExisting}><CheckIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => setEditExisting(null)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    ) : (
                      <>
                        <ListItemText primary={CATEGORIES.expense[cat]?.[lang] || cat} secondary={fmtMoney(amount * monthCount(period), currency, true) + (lang === "es" ? "/mes" : "/month")} />
                        <ListItemSecondaryAction>
                          <IconButton size="small" onClick={() => startEditExisting(cat)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteBudget(cat)}><DeleteIcon fontSize="small" /></IconButton>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            </>
          )}
          <Typography variant="subtitle2" color="text.secondary">{lang === "es" ? "Agregar nuevo" : "Add new"}</Typography>
          <FormControl fullWidth>
            <InputLabel>{lang === "es" ? "Categoría" : "Category"}</InputLabel>
            <Select value={newCat} onChange={(e) => setNewCat(e.target.value)} label={lang === "es" ? "Categoría" : "Category"}>
              {availableCats.map((cat) => (
                <MenuItem key={cat} value={cat}>{CATEGORIES.expense[cat]?.[lang] || cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label={lang === "es" ? "Monto mensual" : "Monthly amount"} type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} fullWidth />
          <Button variant="outlined" onClick={handleAddBudget} disabled={!newCat || !newBudget} startIcon={<AddIcon />}>
            {lang === "es" ? "Agregar" : "Add"}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDialog(false); setEditExisting(null); }}>{lang === "es" ? "Cerrar" : "Close"}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}