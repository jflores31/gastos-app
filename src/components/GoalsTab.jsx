import { useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, Grid, Stack, LinearProgress, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Avatar, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import es from "dayjs/locale/es";
import en from "dayjs/locale/en";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AccountBalance as BankIcon, CreditCard as CardIcon, AttachMoney as CashIcon, Group as GroupIcon, Timeline as ForecastIcon, Savings as GoalIcon, ShowChart as InvestIcon, CreditScore as DebtIcon, History as HistoryIcon, Subscriptions as SubIcon } from "@mui/icons-material";
import { SAVINGS_GOALS, ACCOUNTS, FAMILY_MEMBERS, fmtMoney, txByMonth } from "../data/index.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";

const INVESTMENTS = [
  { id: "fonagro", name: "Fondo AFP", es: "Fondo AFP", en: "AFP Fund", value: 45000, return: 5.2, type: "retirement" },
  { id: "dpf", es: "DPF Scotiabank", en: "Scotiabank DPF", value: 15000, return: 4.8, type: "term" },
  { id: "buró", es: "Buró de crédito", en: "Credit bureau", value: 3200, return: 0, type: "savings" },
  { id: "crypto", es: "Crypto", en: "Crypto", value: 1800, return: -2.5, type: "crypto" },
];

const DEBTS = [
  { id: "auto", es: "Préstamoauto", en: "Car loan", balance: 18500, rate: 8.5, monthly: 450, remaining: 42 },
  { id: "personal", es: "Préstamo personal", en: "Personal loan", balance: 4200, rate: 15, monthly: 280, remaining: 15 },
];

const SUBSCRIPTIONS = [
  { id: "netflix", name: "Netflix", price: 29.90, cycle: "monthly", category: "entertainment" },
  { id: "spotify", name: "Spotify Family", price: 14.90, cycle: "monthly", category: "entertainment" },
  { id: "amazon", name: "Amazon Prime", price: 14.99, cycle: "monthly", category: "shopping" },
  { id: "office", name: "Microsoft 365", price: 12.99, cycle: "monthly", category: "work" },
  { id: "cloud", name: "Google One", price: 2.99, cycle: "monthly", category: "tech" },
];

export default function GoalsTab() {
  const { t, lang, currency } = useSettings();
  const { txs } = useData();
  const months = useMemo(() => txByMonth(txs).slice(-12), [txs]);
  const [goals, setGoals] = useState(SAVINGS_GOALS);
  const [accounts, setAccounts] = useState(ACCOUNTS);
  const [goalsDialog, setGoalsDialog] = useState(false);
  const [accountsDialog, setAccountsDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [goalForm, setGoalForm] = useState({ es: "", en: "", target: "", current: "", deadline: null, color: "#7ab87a", icon: "◉" });
  const [accountForm, setAccountForm] = useState({ name: "", type: "bank", balance: "", color: "#0033A0", limit: "" });

  const handleSaveGoal = () => {
    const g = { ...goalForm, id: editingGoal?.id || `g${Date.now()}`, target: parseFloat(goalForm.target), current: parseFloat(goalForm.current) };
    if (editingGoal) setGoals(goals.map(x => x.id === editingGoal.id ? g : x));
    else setGoals([...goals, g]);
    closeGoalDialog();
  };

  const handleDeleteGoal = (id) => setGoals(goals.filter(g => g.id !== id));
  const openEditGoal = (g) => { setEditingGoal(g); setGoalForm({ ...g }); setGoalsDialog(true); };
  const openNewGoal = () => { setEditingGoal(null); setGoalForm({ es: "", en: "", target: "", current: "", deadline: null, color: "#7ab87a", icon: "◉" }); setGoalsDialog(true); };
  const closeGoalDialog = () => { setGoalsDialog(false); setEditingGoal(null); };

  const handleSaveAccount = () => {
    const a = { ...accountForm, id: editingAccount?.id || `a${Date.now()}`, balance: parseFloat(accountForm.balance), limit: accountForm.limit ? parseFloat(accountForm.limit) : undefined };
    if (editingAccount) setAccounts(accounts.map(x => x.id === editingAccount.id ? a : x));
    else setAccounts([...accounts, a]);
    closeAccountDialog();
  };

  const handleDeleteAccount = (id) => setAccounts(accounts.filter(a => a.id !== id));
  const openEditAccount = (a) => { setEditingAccount(a); setAccountForm({ ...a, limit: a.limit || "" }); setAccountsDialog(true); };
  const openNewAccount = () => { setEditingAccount(null); setAccountForm({ name: "", type: "bank", balance: "", color: "#0033A0", limit: "" }); setAccountsDialog(true); };
  const closeAccountDialog = () => { setAccountsDialog(false); setEditingAccount(null); };

  const totalAssets = accounts.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalDebt = Math.abs(accounts.filter((a) => a.balance < 0).reduce((s, a) => s + a.balance, 0));
  const netWorth = totalAssets - totalDebt;

  return (
    <Stack spacing={3}>
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
          <Grid container spacing={3}>
            {goals.map((g) => {
              const pct = g.current / g.target;
              const left = g.target - g.current;
              const today = new Date();
              const days = Math.max(0, Math.ceil((new Date(g.deadline) - today) / 86400000));
              return (
                <Grid item xs={12} sm={6} lg={3} key={g.id}>
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
                        <LinearProgress variant="determinate" value={Math.min(100, pct * 100)} sx={{ height: 8, borderRadius: 4, mb: 1.5, bgcolor: "grey.100", "& .MuiLinearProgress-bar": { bgcolor: g.color, borderRadius: 4 } }} />
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
        </CardContent>
      </Card>

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
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
                <IconButton size="small" onClick={openNewAccount} sx={{ bgcolor: "primary.light", "&:hover": { bgcolor: "primary.main", color: "#fff" } }}><AddIcon fontSize="small" /></IconButton>
              </Box>
              <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 3, p: 3, mb: 3 }}>
                <Typography variant="overline" sx={{ opacity: 0.8, display: "block", mb: 0.5 }}>{lang === "es" ? "PATRIMONIO NETO" : "NET WORTH"}</Typography>
                <Typography variant="h4" fontWeight={800}>{fmtMoney(netWorth, currency)}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{lang === "es" ? "Activos" : "Assets"}</Typography>
                    <Typography variant="body1" fontWeight={700}>+{fmtMoney(totalAssets, currency, true)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{lang === "es" ? "Deudas" : "Debts"}</Typography>
                    <Typography variant="body1" fontWeight={700}>−{fmtMoney(totalDebt, currency, true)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack spacing={1}>
                  {accounts.map((a) => {
                    const isDebt = a.balance < 0;
                    const utilPct = isDebt && a.limit ? Math.abs(a.balance) / a.limit : 0;
                    return (
                      <Box key={a.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: "grey.50", borderRadius: 2 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: a.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                          <IconButton size="small" onClick={() => openEditAccount(a)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteAccount(a.id)}><DeleteIcon fontSize="small" /></IconButton>
                          <Typography variant="body2" fontWeight={700} color={isDebt ? "error.main" : "success.main"} sx={{ minWidth: 80, textAlign: "right" }}>
                            {isDebt ? "−" : "+"}{fmtMoney(Math.abs(a.balance), currency, true)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%", minHeight: 350, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "secondary.main" }}>
            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: "secondary.light", color: "secondary.dark" }}><GroupIcon /></Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{t.family} · {lang === "es" ? "Reparto" : "Split"}</Typography>
                  <Typography variant="caption" color="text.secondary">{FAMILY_MEMBERS.length} {lang === "es" ? "miembros" : "members"}</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                {(() => {
                  const total = txs.filter((x) => x.tipo === "EGRESO").reduce((s, x) => s + x.valor, 0);
                  return (
                    <Box sx={{ bgcolor: "grey.50", borderRadius: 3, p: 2, mb: 2 }}>
                      <Box sx={{ display: "flex", height: 20, borderRadius: 10, overflow: "hidden", mb: 2 }}>
                        {FAMILY_MEMBERS.map((m) => <Box key={m.id} sx={{ width: `${m.share * 100}%`, bgcolor: m.color, height: "100%" }} title={`${m[lang]} ${Math.round(m.share * 100)}%`} />)}
                      </Box>
                      <Stack spacing={1.5}>
                        {FAMILY_MEMBERS.map((m) => (
                          <Box key={m.id} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ width: 40, height: 40, bgcolor: m.color, color: "#fff", fontWeight: 700 }}>{m.avatar}</Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>{m[lang]}</Typography>
                              <Typography variant="caption" color="text.secondary">{Math.round(m.share * 100)}% {lang === "es" ? "del gasto" : "of spend"}</Typography>
                            </Box>
                            <Typography variant="body1" fontWeight={700}>{fmtMoney(total * m.share, currency, true)}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  );
                })()}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
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
                          <Box sx={{ flex: 1, height: 12, borderRadius: 6, bgcolor: "grey.100", overflow: "hidden" }}>
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

      <Card sx={{ borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "warning.main" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: "warning.light", color: "warning.dark" }}><InvestIcon /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{lang === "es" ? "Inversiones" : "Investments"}</Typography>
              <Typography variant="caption" color="text.secondary">{INVESTMENTS.length} {lang === "es" ? "activos" : "assets"} · {fmtMoney(INVESTMENTS.reduce((s, i) => s + i.value, 0), currency)}</Typography>
            </Box>
          </Box>
          <Grid container spacing={3}>
            {INVESTMENTS.map((inv) => (
              <Grid item xs={12} sm={6} md={3} key={inv.id}>
                <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
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
              <Typography variant="h6" fontWeight={700} color="warning.dark">{fmtMoney(INVESTMENTS.reduce((s, i) => s + i.value, 0), currency)}</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="warning.dark">{lang === "es" ? "Promedio rendimiento" : "Avg return"}</Typography>
              <Typography variant="h6" fontWeight={700} color="success.dark">
                +{(INVESTMENTS.reduce((s, i) => s + i.return, 0) / INVESTMENTS.length).toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "error.main" }}>
            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: "error.light", color: "error.dark" }}><DebtIcon /></Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{lang === "es" ? "Control de deudas" : "Debt control"}</Typography>
                  <Typography variant="caption" color="text.secondary">{DEBTS.length} {lang === "es" ? "préstamos" : "loans"}</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                {DEBTS.map((d) => {
                  const totalPaid = d.monthly * (d.remaining > 0 ? (42 - d.remaining) : 42);
                  const pct = totalPaid / (totalPaid + d.balance);
                  return (
                    <Box key={d.id} sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body1" fontWeight={600}>{d[lang]}</Typography>
                        <Chip size="small" label={`${d.rate}% TEA`} color="warning" variant="outlined" />
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">{fmtMoney(d.balance, currency, true)}</Typography>
                        <Typography variant="body2" fontWeight={600}>{d.monthly} {lang === "es" ? "/mes" : "/mo"}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct * 100} sx={{ height: 6, borderRadius: 3, mb: 0.5, bgcolor: "grey.200", "& .MuiLinearProgress-bar": { bgcolor: "error.main" } }} />
                      <Typography variant="caption" color="text.secondary">{d.remaining} {lang === "es" ? "cuotas restantes" : "installments left"}</Typography>
                    </Box>
                  );
                })}
              </Box>
              <Box sx={{ mt: 2, p: 2, bgcolor: "error.light", borderRadius: 2 }}>
                <Typography variant="body2" color="error.dark" fontWeight={600}>
                  {lang === "es" ? "Total deudas:" : "Total debt:"} {fmtMoney(DEBTS.reduce((s, d) => s + d.balance, 0), currency)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "secondary.main" }}>
            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: "secondary.light", color: "secondary.dark" }}><SubIcon /></Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{lang === "es" ? "Suscripciones" : "Subscriptions"}</Typography>
                  <Typography variant="caption" color="text.secondary">{SUBSCRIPTIONS.length} {lang === "es" ? "activas" : "active"} · {fmtMoney(SUBSCRIPTIONS.reduce((s, s2) => s + s2.price, 0), currency)}/mes</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack spacing={1.5}>
                  {SUBSCRIPTIONS.map((sub) => (
                    <Box key={sub.id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 2 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "secondary.light", color: "secondary.dark", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                        {sub.name.charAt(0)}
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
                  {lang === "es" ? "Total mensual:" : "Monthly total:"} {fmtMoney(SUBSCRIPTIONS.reduce((s, s2) => s + s2.price, 0), currency)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: "flex" }}>
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
                  const history = months.slice(-6).map((m, i) => ({ month: t.months[m.month], value: netWorth * (0.85 + i * 0.05 + Math.random() * 0.1) }));
                  const maxVal = Math.max(...history.map(h => h.value));
                  return (
                    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 150 }}>
                      {history.map((h, i) => (
                        <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <Typography variant="caption" fontWeight={600}>{fmtMoney(h.value, currency, true)}</Typography>
                          <Box sx={{ width: "100%", height: 100, bgcolor: "grey.100", borderRadius: 1, position: "relative", overflow: "hidden" }}>
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

      <Dialog open={goalsDialog} onClose={closeGoalDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: "divider", py: 2 }}>
          {editingGoal ? (lang === "es" ? "Editar meta" : "Edit goal") : (lang === "es" ? "Nueva meta" : "New goal")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}>
          <TextField label={lang === "es" ? "Nombre (ES)" : "Name (ES)"} value={goalForm.es} onChange={(e) => setGoalForm({ ...goalForm, es: e.target.value })} fullWidth variant="outlined" />
          <TextField label={lang === "es" ? "Nombre (EN)" : "Name (EN)"} value={goalForm.en} onChange={(e) => setGoalForm({ ...goalForm, en: e.target.value })} fullWidth variant="outlined" />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label={lang === "es" ? "Monto objetivo" : "Target amount"} type="number" value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} fullWidth variant="outlined" />
            </Grid>
            <Grid item xs={6}>
              <TextField label={lang === "es" ? "Monto actual" : "Current amount"} type="number" value={goalForm.current} onChange={(e) => setGoalForm({ ...goalForm, current: e.target.value })} fullWidth variant="outlined" />
            </Grid>
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang === "es" ? es : en}>
            <DatePicker
              label={lang === "es" ? "Fecha límite" : "Deadline"}
              value={goalForm.deadline ? dayjs(goalForm.deadline) : null}
              onChange={(newValue) => setGoalForm({ ...goalForm, deadline: newValue ? newValue.format("YYYY-MM-DD") : null })}
              slotProps={{ textField: { fullWidth: true, variant: "outlined" } }}
              format={lang === "es" ? "DD/MM/YYYY" : "MM/DD/YYYY"}
            />
          </LocalizationProvider>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label={lang === "es" ? "Color" : "Color"} type="color" value={goalForm.color} onChange={(e) => setGoalForm({ ...goalForm, color: e.target.value })} sx={{ width: 80 }} />
            <TextField label={lang === "es" ? "Icono" : "Icon"} value={goalForm.icon} onChange={(e) => setGoalForm({ ...goalForm, icon: e.target.value })} sx={{ width: 80 }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          {editingGoal && <Button color="error" onClick={() => { handleDeleteGoal(editingGoal.id); closeGoalDialog(); }}>{lang === "es" ? "Eliminar" : "Delete"}</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeGoalDialog}>{lang === "es" ? "Cancelar" : "Cancel"}</Button>
          <Button variant="contained" onClick={handleSaveGoal} disabled={!goalForm.es || !goalForm.en || !goalForm.target}>{lang === "es" ? "Guardar" : "Save"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={accountsDialog} onClose={closeAccountDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: "divider", py: 2 }}>
          {editingAccount ? (lang === "es" ? "Editar cuenta" : "Edit account") : (lang === "es" ? "Nueva cuenta" : "New account")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}>
          <TextField label={lang === "es" ? "Nombre" : "Name"} value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} fullWidth variant="outlined" />
          <FormControl fullWidth>
            <InputLabel>{lang === "es" ? "Tipo" : "Type"}</InputLabel>
            <Select value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })} label={lang === "es" ? "Tipo" : "Type"}>
              <MenuItem value="bank">{lang === "es" ? "Banco" : "Bank"}</MenuItem>
              <MenuItem value="card">{lang === "es" ? "Tarjeta" : "Card"}</MenuItem>
              <MenuItem value="cash">{lang === "es" ? "Efectivo" : "Cash"}</MenuItem>
            </Select>
          </FormControl>
          <TextField label={lang === "es" ? "Saldo" : "Balance"} type="number" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })} fullWidth variant="outlined" />
          {accountForm.type === "card" && <TextField label={lang === "es" ? "Límite" : "Limit"} type="number" value={accountForm.limit} onChange={(e) => setAccountForm({ ...accountForm, limit: e.target.value })} fullWidth variant="outlined" />}
          <TextField label={lang === "es" ? "Color" : "Color"} type="color" value={accountForm.color} onChange={(e) => setAccountForm({ ...accountForm, color: e.target.value })} sx={{ width: 80 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          {editingAccount && <Button color="error" onClick={() => { handleDeleteAccount(editingAccount.id); closeAccountDialog(); }}>{lang === "es" ? "Eliminar" : "Delete"}</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeAccountDialog}>{lang === "es" ? "Cancelar" : "Cancel"}</Button>
          <Button variant="contained" onClick={handleSaveAccount} disabled={!accountForm.name || accountForm.balance === ""}>{lang === "es" ? "Guardar" : "Save"}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}