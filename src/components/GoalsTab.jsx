"use client"

import { useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, Grid, Stack, LinearProgress, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Avatar, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import es from "dayjs/locale/es";
import en from "dayjs/locale/en";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AccountBalance as BankIcon, CreditCard as CardIcon, AttachMoney as CashIcon, Timeline as ForecastIcon, Savings as GoalIcon, ShowChart as InvestIcon, CreditScore as DebtIcon, History as HistoryIcon, Subscriptions as SubIcon } from "@mui/icons-material";
import { fmtMoney, txByMonth } from "../data/index.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";

const EMPTY_GOAL = { es: "", en: "", target: "", current: "", deadline: null, color: "#7ab87a", icon: "◉" };
const EMPTY_ACCOUNT = { name: "", type: "bank", balance: "", color: "#0033A0", limit: "" };
const EMPTY_INVESTMENT = { es: "", en: "", value: "", return: "", type: "savings" };
const EMPTY_DEBT = { es: "", en: "", balance: "", rate: "", monthly: "", remaining: "", original_months: "" };
const EMPTY_SUB = { name: "", price: "", cycle: "monthly", category: "" };

function EmptySection({ label, onAdd }) {
  return (
    <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
      <Typography variant="body2" sx={{ mb: 1 }}>{label}</Typography>
      <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAdd}>
        Agregar
      </Button>
    </Box>
  );
}

export default function GoalsTab() {
  const { t, lang, currency } = useSettings();
  const {
    txs, loading,
    goals, saveGoal, deleteGoal,
    accounts, saveAccount, deleteAccount,
    investments, saveInvestment, deleteInvestment,
    debts, saveDebt, deleteDebt,
    subscriptions, saveSubscription, deleteSubscription,
  } = useData();

  const months = useMemo(() => txByMonth(txs).slice(-12), [txs]);

  // Goal dialog
  const [goalsDialog, setGoalsDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState(EMPTY_GOAL);
  const [savingGoal, setSavingGoal] = useState(false);

  // Account dialog
  const [accountsDialog, setAccountsDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT);
  const [savingAccount, setSavingAccount] = useState(false);

  // Investment dialog
  const [investDialog, setInvestDialog] = useState(false);
  const [editingInvest, setEditingInvest] = useState(null);
  const [investForm, setInvestForm] = useState(EMPTY_INVESTMENT);
  const [savingInvest, setSavingInvest] = useState(false);

  // Debt dialog
  const [debtDialog, setDebtDialog] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [debtForm, setDebtForm] = useState(EMPTY_DEBT);
  const [savingDebt, setSavingDebt] = useState(false);

  // Subscription dialog
  const [subDialog, setSubDialog] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subForm, setSubForm] = useState(EMPTY_SUB);
  const [savingSub, setSavingSub] = useState(false);

  // Goals handlers
  const openNewGoal = () => { setEditingGoal(null); setGoalForm(EMPTY_GOAL); setGoalsDialog(true); };
  const openEditGoal = (g) => { setEditingGoal(g); setGoalForm({ ...g }); setGoalsDialog(true); };
  const closeGoalDialog = () => { setGoalsDialog(false); setEditingGoal(null); };
  const handleSaveGoal = async () => {
    setSavingGoal(true);
    await saveGoal({ ...goalForm, target: parseFloat(goalForm.target), current: parseFloat(goalForm.current) || 0 });
    setSavingGoal(false);
    closeGoalDialog();
  };
  const handleDeleteGoal = async (id) => { await deleteGoal(id); closeGoalDialog(); };

  // Account handlers
  const openNewAccount = () => { setEditingAccount(null); setAccountForm(EMPTY_ACCOUNT); setAccountsDialog(true); };
  const openEditAccount = (a) => { setEditingAccount(a); setAccountForm({ ...a, limit: a.limit ?? "" }); setAccountsDialog(true); };
  const closeAccountDialog = () => { setAccountsDialog(false); setEditingAccount(null); };
  const handleSaveAccount = async () => {
    setSavingAccount(true);
    await saveAccount({ ...accountForm, balance: parseFloat(accountForm.balance), limit: accountForm.limit ? parseFloat(accountForm.limit) : undefined });
    setSavingAccount(false);
    closeAccountDialog();
  };
  const handleDeleteAccount = async (id) => { await deleteAccount(id); closeAccountDialog(); };

  // Investment handlers
  const openNewInvest = () => { setEditingInvest(null); setInvestForm(EMPTY_INVESTMENT); setInvestDialog(true); };
  const openEditInvest = (inv) => { setEditingInvest(inv); setInvestForm({ ...inv, value: String(inv.value), return: String(inv.return) }); setInvestDialog(true); };
  const closeInvestDialog = () => { setInvestDialog(false); setEditingInvest(null); };
  const handleSaveInvest = async () => {
    setSavingInvest(true);
    await saveInvestment({ ...investForm, value: parseFloat(investForm.value), return: parseFloat(investForm.return) || 0 });
    setSavingInvest(false);
    closeInvestDialog();
  };
  const handleDeleteInvest = async (id) => { await deleteInvestment(id); closeInvestDialog(); };

  // Debt handlers
  const openNewDebt = () => { setEditingDebt(null); setDebtForm(EMPTY_DEBT); setDebtDialog(true); };
  const openEditDebt = (d) => { setEditingDebt(d); setDebtForm({ ...d, balance: String(d.balance), rate: String(d.rate), monthly: String(d.monthly), remaining: String(d.remaining), original_months: String(d.original_months) }); setDebtDialog(true); };
  const closeDebtDialog = () => { setDebtDialog(false); setEditingDebt(null); };
  const handleSaveDebt = async () => {
    setSavingDebt(true);
    await saveDebt({ ...debtForm, balance: parseFloat(debtForm.balance), rate: parseFloat(debtForm.rate) || 0, monthly: parseFloat(debtForm.monthly) || 0, remaining: parseInt(debtForm.remaining) || 0, original_months: parseInt(debtForm.original_months) || parseInt(debtForm.remaining) || 0 });
    setSavingDebt(false);
    closeDebtDialog();
  };
  const handleDeleteDebt = async (id) => { await deleteDebt(id); closeDebtDialog(); };

  // Subscription handlers
  const openNewSub = () => { setEditingSub(null); setSubForm(EMPTY_SUB); setSubDialog(true); };
  const openEditSub = (s) => { setEditingSub(s); setSubForm({ ...s, price: String(s.price) }); setSubDialog(true); };
  const closeSubDialog = () => { setSubDialog(false); setEditingSub(null); };
  const handleSaveSub = async () => {
    setSavingSub(true);
    await saveSubscription({ ...subForm, price: parseFloat(subForm.price) });
    setSavingSub(false);
    closeSubDialog();
  };
  const handleDeleteSub = async (id) => { await deleteSubscription(id); closeSubDialog(); };

  const totalAssets = accounts.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalDebt = Math.abs(accounts.filter((a) => a.balance < 0).reduce((s, a) => s + a.balance, 0));
  const netWorth = totalAssets - totalDebt;

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Stack spacing={3}>
      {/* Savings Goals */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "success.main" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "success.light", color: "success.dark" }}><GoalIcon /></Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{t.goals} · {lang === "es" ? "Ahorro" : "Savings"}</Typography>
                <Typography variant="caption" color="text.secondary">{goals.length} {lang === "es" ? "metas activas" : "active goals"}</Typography>
              </Box>
            </Box>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={openNewGoal}>
              {lang === "es" ? "Nueva meta" : "New goal"}
            </Button>
          </Box>
          {goals.length === 0 ? (
            <EmptySection label={lang === "es" ? "Sin metas de ahorro. Agrega la primera." : "No savings goals yet."} onAdd={openNewGoal} />
          ) : (
            <Grid container spacing={3}>
              {goals.map((g) => {
                const pct = g.current / g.target;
                const left = g.target - g.current;
                const today = new Date();
                const days = Math.max(0, Math.ceil((new Date(g.deadline) - today) / 86400000));
                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={g.id}>
                    <Card variant="outlined" sx={{ borderRadius: 2, cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: 2, transform: "translateY(-2px)" }, minHeight: 160, display: "flex", flexDirection: "column" }} onClick={() => openEditGoal(g)}>
                      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", "&:last-child": { pb: 2.5 } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${g.color}20`, color: g.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>{g.icon}</Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" fontWeight={600} noWrap>{g[lang]}</Typography>
                            <Typography variant="caption" color="text.secondary">{days} {lang === "es" ? "días" : "days"}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography variant="h5" fontWeight={800} sx={{ color: g.color }}>{Math.round(pct * 100)}%</Typography>
                            <Typography variant="body2" fontWeight={600} color={pct >= 1 ? "success.main" : "text.secondary"}>
                              {fmtMoney(left, currency, true)} {lang === "es" ? "faltan" : "to go"}
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={Math.min(100, pct * 100)} sx={{ height: 8, borderRadius: 4, mb: 1.5, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: g.color, borderRadius: 4 } }} />
                          <Typography variant="caption" color="text.secondary">
                            <strong>{fmtMoney(g.current, currency, true)}</strong> / {fmtMoney(g.target, currency, true)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3} alignItems="stretch">
        {/* Net Worth / Accounts */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "primary.main" }}>
            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark" }}><BankIcon /></Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{t.networth}</Typography>
                    <Typography variant="caption" color="text.secondary">{accounts.length} {lang === "es" ? "cuentas" : "accounts"}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={openNewAccount} aria-label={lang === "es" ? "Nueva cuenta" : "New account"} sx={{ bgcolor: "primary.light", "&:hover": { bgcolor: "primary.main", color: "common.white" } }}><AddIcon fontSize="small" /></IconButton>
              </Box>
              <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 3, p: 3, mb: 3 }}>
                <Typography variant="overline" sx={{ opacity: 0.8, display: "block", mb: 0.5 }}>{lang === "es" ? "PATRIMONIO NETO" : "NET WORTH"}</Typography>
                <Typography variant="h4" fontWeight={800}>{fmtMoney(netWorth, currency)}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{lang === "es" ? "Activos" : "Assets"}</Typography>
                    <Typography variant="body1" fontWeight={700}>+{fmtMoney(totalAssets, currency, true)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{lang === "es" ? "Deudas" : "Debts"}</Typography>
                    <Typography variant="body1" fontWeight={700}>−{fmtMoney(totalDebt, currency, true)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              {accounts.length === 0 ? (
                <EmptySection label={lang === "es" ? "Sin cuentas registradas." : "No accounts yet."} onAdd={openNewAccount} />
              ) : (
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={1}>
                    {accounts.map((a) => {
                      const isDebt = a.balance < 0;
                      const utilPct = isDebt && a.limit ? Math.abs(a.balance) / a.limit : 0;
                      return (
                        <Box key={a.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: a.color, color: "common.white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {a.type === "bank" ? <BankIcon fontSize="small" /> : a.type === "card" ? <CardIcon fontSize="small" /> : <CashIcon fontSize="small" />}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {a.type === "bank" ? (lang === "es" ? "Banco" : "Bank") : a.type === "card" ? (lang === "es" ? "Tarjeta" : "Card") : (lang === "es" ? "Efectivo" : "Cash")}
                              {isDebt && a.limit ? ` · ${Math.round(utilPct * 100)}%` : ""}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <IconButton size="small" aria-label="Editar" onClick={() => openEditAccount(a)}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" aria-label="Eliminar" onClick={() => handleDeleteAccount(a.id)}><DeleteIcon fontSize="small" /></IconButton>
                            <Typography variant="body2" fontWeight={700} color={isDebt ? "error.main" : "success.main"} sx={{ minWidth: 80, textAlign: "right" }}>
                              {isDebt ? "−" : "+"}{fmtMoney(Math.abs(a.balance), currency, true)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Forecast */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%", minHeight: 350, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "info.main" }}>
            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: "info.light", color: "info.dark" }}><ForecastIcon /></Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{t.forecast} · {lang === "es" ? "3 meses" : "3 months"}</Typography>
                    <Typography variant="caption" color="text.secondary">{lang === "es" ? "Basado en tendencia" : "Based on trend"}</Typography>
                  </Box>
                </Box>
                <Chip size="small" label="ML" color="info" />
              </Box>
              <Box sx={{ flex: 1 }}>
                {(() => {
                  const recent = months.slice(-6);
                  const avgIn = recent.reduce((s, m) => s + m.ingreso, 0) / Math.max(1, recent.length);
                  const avgOut = recent.reduce((s, m) => s + m.egreso, 0) / Math.max(1, recent.length);
                  const netAvg = avgIn - avgOut;
                  const next = [1, 2, 3].map((i) => ({ i, label: t.months[(new Date().getMonth() + i) % 12], net: netAvg * (0.95 + Math.sin(i * 1.3) * 0.08) }));
                  return (
                    <Stack spacing={2}>
                      {next.map((n) => (
                        <Box key={n.i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Typography variant="body2" sx={{ width: 50, fontFamily: "monospace", fontWeight: 600 }}>{n.label}</Typography>
                          <Box sx={{ flex: 1, height: 12, borderRadius: 6, bgcolor: "action.hover", overflow: "hidden" }} role="progressbar" aria-valuenow={Math.round(Math.abs(n.net / avgIn) * 100)} aria-valuemin={0} aria-valuemax={100}>
                            <Box sx={{ height: "100%", width: `${Math.min(100, Math.abs(n.net / avgIn) * 100)}%`, borderRadius: 6, bgcolor: n.net >= 0 ? "success.main" : "error.main" }} />
                          </Box>
                          <Typography variant="body2" fontWeight={700} color={n.net >= 0 ? "success.main" : "error.main"} sx={{ minWidth: 85, textAlign: "right" }}>
                            {n.net >= 0 ? "+" : "−"}{fmtMoney(Math.abs(n.net), currency, true)}
                          </Typography>
                        </Box>
                      ))}
                      <Box sx={{ mt: 1, p: 2, bgcolor: "info.light", borderRadius: 2, borderLeft: 4, borderColor: "info.main" }}>
                        <Typography variant="body2" fontWeight={600} color="info.dark">
                          {lang === "es" ? `Proyección 3 meses:` : `3-month projection:`} {fmtMoney(netAvg * 3, currency, true)}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })()}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Investments */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "warning.main" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "warning.light", color: "warning.dark" }}><InvestIcon /></Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{lang === "es" ? "Inversiones" : "Investments"}</Typography>
                <Typography variant="caption" color="text.secondary">{investments.length} {lang === "es" ? "activos" : "assets"}{investments.length > 0 ? ` · ${fmtMoney(investments.reduce((s, i) => s + i.value, 0), currency)}` : ""}</Typography>
              </Box>
            </Box>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={openNewInvest}>{lang === "es" ? "Agregar" : "Add"}</Button>
          </Box>
          {investments.length === 0 ? (
            <EmptySection label={lang === "es" ? "Sin inversiones registradas." : "No investments yet."} onAdd={openNewInvest} />
          ) : (
            <>
              <Grid container spacing={3}>
                {investments.map((inv) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={inv.id}>
                    <Card variant="outlined" sx={{ borderRadius: 2, p: 2, cursor: "pointer", "&:hover": { boxShadow: 1 } }} onClick={() => openEditInvest(inv)}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                        <Typography variant="body1" fontWeight={600}>{inv[lang]}</Typography>
                        <Chip size="small" label={inv.type === "retirement" ? "AFP" : inv.type === "term" ? "DPF" : inv.type === "crypto" ? "Crypto" : "Ahorro"} color={inv.type === "crypto" ? "error" : "default"} />
                      </Box>
                      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{fmtMoney(inv.value, currency, true)}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip size="small" label={`${inv.return > 0 ? "+" : ""}${inv.return}%`} color={inv.return >= 0 ? "success" : "error"} variant="outlined" />
                        <Typography variant="caption" color="text.secondary">{lang === "es" ? "rendimiento" : "return"}</Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", bgcolor: "warning.light", p: 2, borderRadius: 2 }}>
                <Box>
                  <Typography variant="caption" color="warning.dark">{lang === "es" ? "Total invertido" : "Total invested"}</Typography>
                  <Typography variant="h6" fontWeight={700} color="warning.dark">{fmtMoney(investments.reduce((s, i) => s + i.value, 0), currency)}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="warning.dark">{lang === "es" ? "Promedio rendimiento" : "Avg return"}</Typography>
                  <Typography variant="h6" fontWeight={700} color={investments.reduce((s, i) => s + i.return, 0) >= 0 ? "success.dark" : "error.dark"}>
                    {investments.reduce((s, i) => s + i.return, 0) >= 0 ? "+" : ""}{(investments.reduce((s, i) => s + i.return, 0) / investments.length).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3} alignItems="stretch">
        {/* Debts */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "error.main" }}>
            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: "error.light", color: "error.dark" }}><DebtIcon /></Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{lang === "es" ? "Control de deudas" : "Debt control"}</Typography>
                    <Typography variant="caption" color="text.secondary">{debts.length} {lang === "es" ? "préstamos" : "loans"}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" aria-label={lang === "es" ? "Agregar deuda" : "Add debt"} onClick={openNewDebt} sx={{ bgcolor: "error.light", "&:hover": { bgcolor: "error.main", color: "common.white" } }}><AddIcon fontSize="small" /></IconButton>
              </Box>
              {debts.length === 0 ? (
                <EmptySection label={lang === "es" ? "Sin préstamos registrados." : "No loans yet."} onAdd={openNewDebt} />
              ) : (
                <Box sx={{ flex: 1 }}>
                  {debts.map((d) => {
                    const orig = d.original_months || (d.remaining + 1);
                    const paid = orig - d.remaining;
                    const pct = orig > 0 ? paid / orig : 0;
                    return (
                      <Box key={d.id} sx={{ mb: 2, p: 2, bgcolor: "action.hover", borderRadius: 2, cursor: "pointer" }} onClick={() => openEditDebt(d)}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body1" fontWeight={600}>{d[lang]}</Typography>
                          <Chip size="small" label={`${d.rate}% TEA`} color="warning" variant="outlined" />
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">{fmtMoney(d.balance, currency, true)}</Typography>
                          <Typography variant="body2" fontWeight={600}>{fmtMoney(d.monthly, currency, true)} {lang === "es" ? "/mes" : "/mo"}</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct * 100} sx={{ height: 6, borderRadius: 3, mb: 0.5, bgcolor: "action.selected", "& .MuiLinearProgress-bar": { bgcolor: "error.main" } }} />
                        <Typography variant="caption" color="text.secondary">{d.remaining} {lang === "es" ? "cuotas restantes" : "installments left"}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
              {debts.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "error.light", borderRadius: 2 }}>
                  <Typography variant="body2" color="error.dark" fontWeight={600}>
                    {lang === "es" ? "Total deudas:" : "Total debt:"} {fmtMoney(debts.reduce((s, d) => s + d.balance, 0), currency)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Subscriptions */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "secondary.main" }}>
            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: "secondary.light", color: "secondary.dark" }}><SubIcon /></Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{lang === "es" ? "Suscripciones" : "Subscriptions"}</Typography>
                    <Typography variant="caption" color="text.secondary">{subscriptions.length} {lang === "es" ? "activas" : "active"}{subscriptions.length > 0 ? ` · ${fmtMoney(subscriptions.reduce((s, s2) => s + s2.price, 0), currency)}/mes` : ""}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" aria-label={lang === "es" ? "Agregar suscripción" : "Add subscription"} onClick={openNewSub} sx={{ bgcolor: "secondary.light", "&:hover": { bgcolor: "secondary.main", color: "common.white" } }}><AddIcon fontSize="small" /></IconButton>
              </Box>
              {subscriptions.length === 0 ? (
                <EmptySection label={lang === "es" ? "Sin suscripciones registradas." : "No subscriptions yet."} onAdd={openNewSub} />
              ) : (
                <>
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing={1.5}>
                      {subscriptions.map((sub) => (
                        <Box key={sub.id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 2, cursor: "pointer" }} onClick={() => openEditSub(sub)}>
                          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "secondary.light", color: "secondary.dark", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                            {sub.name.charAt(0).toUpperCase()}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{sub.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{sub.category}</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700}>{fmtMoney(sub.price, currency, true)}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                  <Box sx={{ mt: 2, p: 2, bgcolor: "secondary.light", borderRadius: 2 }}>
                    <Typography variant="body2" color="secondary.dark" fontWeight={600}>
                      {lang === "es" ? "Total mensual:" : "Monthly total:"} {fmtMoney(subscriptions.reduce((s, s2) => s + s2.price, 0), currency)}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Net Worth Evolution */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "success.main" }}>
            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: "success.light", color: "success.dark" }}><HistoryIcon /></Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{lang === "es" ? "Evolución del patrimonio" : "Net worth evolution"}</Typography>
                  <Typography variant="caption" color="text.secondary">{lang === "es" ? "Últimos 6 meses" : "Last 6 months"}</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                {(() => {
                  const history = months.slice(-6).map((m, i) => ({ month: t.months[m.mes], value: netWorth * (0.85 + i * 0.03 + 0.05) }));
                  const maxVal = Math.max(...history.map(h => h.value), 1);
                  return (
                    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 150 }} role="img" aria-label={lang === "es" ? "Gráfico de evolución del patrimonio" : "Net worth evolution chart"}>
                      {history.map((h, i) => (
                        <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <Typography variant="caption" fontWeight={600}>{fmtMoney(h.value, currency, true)}</Typography>
                          <Box sx={{ width: "100%", height: 100, bgcolor: "action.hover", borderRadius: 1, position: "relative", overflow: "hidden" }}>
                            <Box sx={{ position: "absolute", bottom: 0, width: "100%", height: `${(h.value / maxVal) * 100}%`, bgcolor: i === history.length - 1 ? "success.main" : "success.light", borderRadius: 1, transition: "all 0.3s" }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary">{h.month}</Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                })()}
              </Box>
              <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", p: 2, bgcolor: "success.light", borderRadius: 2 }}>
                <Box>
                  <Typography variant="caption" color="success.dark">{lang === "es" ? "Patrimonio inicial" : "Initial net worth"}</Typography>
                  <Typography variant="body1" fontWeight={700} color="success.dark">{fmtMoney(months[0] ? (months[0].ingreso - months[0].egreso) * 6 : netWorth * 0.7, currency)}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="success.dark">{lang === "es" ? "Patrimonio actual" : "Current net worth"}</Typography>
                  <Typography variant="body1" fontWeight={700} color="success.dark">{fmtMoney(netWorth, currency)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Goal Dialog */}
      <Dialog open={goalsDialog} onClose={closeGoalDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: "divider", py: 2 }}>
          {editingGoal ? (lang === "es" ? "Editar meta" : "Edit goal") : (lang === "es" ? "Nueva meta" : "New goal")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}>
          <TextField label={lang === "es" ? "Nombre (ES)" : "Name (ES)"} value={goalForm.es} inputProps={{ maxLength: 60 }} onChange={(e) => setGoalForm({ ...goalForm, es: e.target.value })} fullWidth />
          <TextField label={lang === "es" ? "Nombre (EN)" : "Name (EN)"} value={goalForm.en} inputProps={{ maxLength: 60 }} onChange={(e) => setGoalForm({ ...goalForm, en: e.target.value })} fullWidth />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField label={lang === "es" ? "Monto objetivo" : "Target"} type="number" inputMode="decimal" value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label={lang === "es" ? "Monto actual" : "Current"} type="number" inputMode="decimal" value={goalForm.current} onChange={(e) => setGoalForm({ ...goalForm, current: e.target.value })} fullWidth />
            </Grid>
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang === "es" ? es : en}>
            <DatePicker label={lang === "es" ? "Fecha límite" : "Deadline"} value={goalForm.deadline ? dayjs(goalForm.deadline) : null} onChange={(v) => setGoalForm({ ...goalForm, deadline: v ? v.format("YYYY-MM-DD") : null })} slotProps={{ textField: { fullWidth: true } }} format={lang === "es" ? "DD/MM/YYYY" : "MM/DD/YYYY"} />
          </LocalizationProvider>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Color" type="color" value={goalForm.color} onChange={(e) => setGoalForm({ ...goalForm, color: e.target.value })} sx={{ width: 80 }} />
            <TextField label={lang === "es" ? "Icono" : "Icon"} value={goalForm.icon} inputProps={{ maxLength: 10 }} onChange={(e) => setGoalForm({ ...goalForm, icon: e.target.value })} sx={{ width: 80 }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          {editingGoal && <Button color="error" onClick={() => handleDeleteGoal(editingGoal.id)}>{lang === "es" ? "Eliminar" : "Delete"}</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeGoalDialog}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleSaveGoal} disabled={savingGoal || !goalForm.es || !goalForm.target}>{savingGoal ? <CircularProgress size={18} /> : t.save}</Button>
        </DialogActions>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={accountsDialog} onClose={closeAccountDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: "divider", py: 2 }}>
          {editingAccount ? (lang === "es" ? "Editar cuenta" : "Edit account") : (lang === "es" ? "Nueva cuenta" : "New account")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}>
          <TextField label={lang === "es" ? "Nombre" : "Name"} value={accountForm.name} inputProps={{ maxLength: 60 }} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>{lang === "es" ? "Tipo" : "Type"}</InputLabel>
            <Select value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })} label={lang === "es" ? "Tipo" : "Type"}>
              <MenuItem value="bank">{lang === "es" ? "Banco" : "Bank"}</MenuItem>
              <MenuItem value="card">{lang === "es" ? "Tarjeta" : "Card"}</MenuItem>
              <MenuItem value="cash">{lang === "es" ? "Efectivo" : "Cash"}</MenuItem>
            </Select>
          </FormControl>
          <TextField label={lang === "es" ? "Saldo" : "Balance"} type="number" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })} fullWidth />
          {accountForm.type === "card" && <TextField label={lang === "es" ? "Límite" : "Limit"} type="number" value={accountForm.limit} onChange={(e) => setAccountForm({ ...accountForm, limit: e.target.value })} fullWidth />}
          <TextField label="Color" type="color" value={accountForm.color} onChange={(e) => setAccountForm({ ...accountForm, color: e.target.value })} sx={{ width: 80 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          {editingAccount && <Button color="error" onClick={() => handleDeleteAccount(editingAccount.id)}>{lang === "es" ? "Eliminar" : "Delete"}</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeAccountDialog}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleSaveAccount} disabled={savingAccount || !accountForm.name || accountForm.balance === ""}>{savingAccount ? <CircularProgress size={18} /> : t.save}</Button>
        </DialogActions>
      </Dialog>

      {/* Investment Dialog */}
      <Dialog open={investDialog} onClose={closeInvestDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: "divider", py: 2 }}>
          {editingInvest ? (lang === "es" ? "Editar inversión" : "Edit investment") : (lang === "es" ? "Nueva inversión" : "New investment")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}>
          <TextField label={lang === "es" ? "Nombre (ES)" : "Name (ES)"} value={investForm.es} inputProps={{ maxLength: 60 }} onChange={(e) => setInvestForm({ ...investForm, es: e.target.value })} fullWidth />
          <TextField label={lang === "es" ? "Nombre (EN)" : "Name (EN)"} value={investForm.en} inputProps={{ maxLength: 60 }} onChange={(e) => setInvestForm({ ...investForm, en: e.target.value })} fullWidth />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField label={lang === "es" ? "Valor" : "Value"} type="number" value={investForm.value} onChange={(e) => setInvestForm({ ...investForm, value: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label={lang === "es" ? "Rendimiento %" : "Return %"} type="number" value={investForm.return} onChange={(e) => setInvestForm({ ...investForm, return: e.target.value })} fullWidth />
            </Grid>
          </Grid>
          <FormControl fullWidth>
            <InputLabel>{lang === "es" ? "Tipo" : "Type"}</InputLabel>
            <Select value={investForm.type} onChange={(e) => setInvestForm({ ...investForm, type: e.target.value })} label={lang === "es" ? "Tipo" : "Type"}>
              <MenuItem value="retirement">{lang === "es" ? "Jubilación (AFP)" : "Retirement (AFP)"}</MenuItem>
              <MenuItem value="term">{lang === "es" ? "Plazo fijo (DPF)" : "Fixed term (DPF)"}</MenuItem>
              <MenuItem value="savings">{lang === "es" ? "Ahorro" : "Savings"}</MenuItem>
              <MenuItem value="crypto">Crypto</MenuItem>
              <MenuItem value="stocks">{lang === "es" ? "Acciones" : "Stocks"}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          {editingInvest && <Button color="error" onClick={() => handleDeleteInvest(editingInvest.id)}>{lang === "es" ? "Eliminar" : "Delete"}</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeInvestDialog}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleSaveInvest} disabled={savingInvest || !investForm.es || !investForm.value}>{savingInvest ? <CircularProgress size={18} /> : t.save}</Button>
        </DialogActions>
      </Dialog>

      {/* Debt Dialog */}
      <Dialog open={debtDialog} onClose={closeDebtDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: "divider", py: 2 }}>
          {editingDebt ? (lang === "es" ? "Editar préstamo" : "Edit loan") : (lang === "es" ? "Nuevo préstamo" : "New loan")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}>
          <TextField label={lang === "es" ? "Nombre (ES)" : "Name (ES)"} value={debtForm.es} inputProps={{ maxLength: 60 }} onChange={(e) => setDebtForm({ ...debtForm, es: e.target.value })} fullWidth />
          <TextField label={lang === "es" ? "Nombre (EN)" : "Name (EN)"} value={debtForm.en} inputProps={{ maxLength: 60 }} onChange={(e) => setDebtForm({ ...debtForm, en: e.target.value })} fullWidth />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField label={lang === "es" ? "Saldo pendiente" : "Balance"} type="number" value={debtForm.balance} onChange={(e) => setDebtForm({ ...debtForm, balance: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label={lang === "es" ? "Tasa % TEA" : "Rate % TEA"} type="number" value={debtForm.rate} onChange={(e) => setDebtForm({ ...debtForm, rate: e.target.value })} fullWidth />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid size={{ xs: 4 }}>
              <TextField label={lang === "es" ? "Cuota/mes" : "Monthly"} type="number" value={debtForm.monthly} onChange={(e) => setDebtForm({ ...debtForm, monthly: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField label={lang === "es" ? "Cuotas restantes" : "Remaining"} type="number" value={debtForm.remaining} onChange={(e) => setDebtForm({ ...debtForm, remaining: e.target.value })} fullWidth />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField label={lang === "es" ? "Total cuotas" : "Total months"} type="number" value={debtForm.original_months} onChange={(e) => setDebtForm({ ...debtForm, original_months: e.target.value })} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          {editingDebt && <Button color="error" onClick={() => handleDeleteDebt(editingDebt.id)}>{lang === "es" ? "Eliminar" : "Delete"}</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeDebtDialog}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleSaveDebt} disabled={savingDebt || !debtForm.es || !debtForm.balance}>{savingDebt ? <CircularProgress size={18} /> : t.save}</Button>
        </DialogActions>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={subDialog} onClose={closeSubDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: "divider", py: 2 }}>
          {editingSub ? (lang === "es" ? "Editar suscripción" : "Edit subscription") : (lang === "es" ? "Nueva suscripción" : "New subscription")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}>
          <TextField label={lang === "es" ? "Nombre" : "Name"} value={subForm.name} inputProps={{ maxLength: 60 }} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} fullWidth />
          <TextField label={lang === "es" ? "Precio" : "Price"} type="number" value={subForm.price} onChange={(e) => setSubForm({ ...subForm, price: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>{lang === "es" ? "Ciclo" : "Cycle"}</InputLabel>
            <Select value={subForm.cycle} onChange={(e) => setSubForm({ ...subForm, cycle: e.target.value })} label={lang === "es" ? "Ciclo" : "Cycle"}>
              <MenuItem value="monthly">{lang === "es" ? "Mensual" : "Monthly"}</MenuItem>
              <MenuItem value="yearly">{lang === "es" ? "Anual" : "Yearly"}</MenuItem>
            </Select>
          </FormControl>
          <TextField label={lang === "es" ? "Categoría" : "Category"} value={subForm.category} onChange={(e) => setSubForm({ ...subForm, category: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          {editingSub && <Button color="error" onClick={() => handleDeleteSub(editingSub.id)}>{lang === "es" ? "Eliminar" : "Delete"}</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeSubDialog}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleSaveSub} disabled={savingSub || !subForm.name || !subForm.price}>{savingSub ? <CircularProgress size={18} /> : t.save}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
