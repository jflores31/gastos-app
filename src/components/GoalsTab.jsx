import { useMemo } from "react";
import { Box, Card, CardContent, Typography, Grid, Stack, LinearProgress, Chip } from "@mui/material";
import { SAVINGS_GOALS, ACCOUNTS, FAMILY_MEMBERS, fmtMoney, txByMonth } from "../data/index.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";

export default function GoalsTab() {
  const { t, lang, currency } = useSettings();
  const { txs } = useData();
  const months = useMemo(() => txByMonth(txs).slice(-12), [txs]);

  return (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>{t.goals} · {lang === "es" ? "Ahorro" : "Savings"}</Typography>
              <Typography variant="caption" color="text.secondary">{SAVINGS_GOALS.length} {lang === "es" ? "metas activas" : "active goals"}</Typography>
            </Box>
            <Chip label={`+ ${lang === "es" ? "Nueva meta" : "New goal"}`} variant="outlined" clickable />
          </Box>
          <Grid container spacing={2}>
            {SAVINGS_GOALS.map((g) => {
              const pct = g.current / g.target;
              const left = g.target - g.current;
              const today = new Date();
              const days = Math.max(0, Math.ceil((new Date(g.deadline) - today) / 86400000));
              const pace = g.current > 0 ? Math.ceil(left / (g.current / 12)) : "—";
              return (
                <Grid item xs={12} sm={6} lg={3} key={g.id}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${g.color}20`, color: g.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>{g.icon}</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{g[lang]}</Typography>
                          <Typography variant="caption" color="text.secondary">{days} {lang === "es" ? "días" : "days"} · {fmtMoney(left, currency, true)} {lang === "es" ? "faltan" : "to go"}</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={700}>{Math.round(pct * 100)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={Math.min(100, pct * 100)} sx={{ height: 6, borderRadius: 3, mb: 1, "& .MuiLinearProgress-bar": { bgcolor: g.color } }} />
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" color="text.secondary"><strong>{fmtMoney(g.current, currency, true)}</strong> / {fmtMoney(g.target, currency, true)}</Typography>
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">{lang === "es" ? "al ritmo:" : "at pace:"} {pace} {lang === "es" ? "mo." : "mo."}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>{t.networth}</Typography>
              <Typography variant="caption" color="text.secondary">{ACCOUNTS.length} {lang === "es" ? "cuentas" : "accounts"}</Typography>
              {(() => {
                const totalAssets = ACCOUNTS.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0);
                const totalDebt = Math.abs(ACCOUNTS.filter((a) => a.balance < 0).reduce((s, a) => s + a.balance, 0));
                const netWorth = totalAssets - totalDebt;
                return (
                  <>
                    <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 2, p: 2, mb: 2, mt: 1 }}>
                      <Typography variant="overline" sx={{ opacity: 0.8 }}>{lang === "es" ? "PATRIMONIO NETO" : "NET WORTH"}</Typography>
                      <Typography variant="h5" fontWeight={700}>{fmtMoney(netWorth, currency)}</Typography>
                      <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
                        <Box><Typography variant="caption" sx={{ opacity: 0.8 }}>{lang === "es" ? "Activos" : "Assets"}</Typography><Typography variant="body2" fontWeight={700}>+{fmtMoney(totalAssets, currency, true)}</Typography></Box>
                        <Box><Typography variant="caption" sx={{ opacity: 0.8 }}>{lang === "es" ? "Deudas" : "Debts"}</Typography><Typography variant="body2" fontWeight={700}>−{fmtMoney(totalDebt, currency, true)}</Typography></Box>
                      </Box>
                    </Box>
                    <Stack spacing={0.5}>
                      {ACCOUNTS.map((a) => {
                        const isDebt = a.balance < 0;
                        const utilPct = isDebt && a.limit ? Math.abs(a.balance) / a.limit : 0;
                        return (
                          <Box key={a.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: a.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                              {a.type === "bank" ? "⌑" : a.type === "card" ? "▭" : "$"}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{a.type === "bank" ? (lang === "es" ? "Banco" : "Bank") : a.type === "card" ? (lang === "es" ? "Tarjeta" : "Card") : (lang === "es" ? "Efectivo" : "Cash")}{isDebt && a.limit ? ` · ${Math.round(utilPct * 100)}%` : ""}</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700} color={isDebt ? "error.main" : "success.main"}>{isDebt ? "−" : "+"}{fmtMoney(Math.abs(a.balance), currency, true)}</Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>{t.family} · {lang === "es" ? "Reparto" : "Split"}</Typography>
              <Typography variant="caption" color="text.secondary">{FAMILY_MEMBERS.length} {lang === "es" ? "miembros" : "members"}</Typography>
              {(() => {
                const total = txs.filter((x) => x.tipo === "EGRESO").reduce((s, x) => s + x.valor, 0);
                return (
                  <>
                    <Box sx={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", my: 2, bgcolor: "action.hover" }}>
                      {FAMILY_MEMBERS.map((m) => <Box key={m.id} sx={{ width: `${m.share * 100}%`, bgcolor: m.color, height: "100%" }} title={`${m[lang]} ${Math.round(m.share * 100)}%`} />)}
                    </Box>
                    <Stack spacing={0.5}>
                      {FAMILY_MEMBERS.map((m) => (
                        <Box key={m.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: m.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{m.avatar}</Box>
                          <Box sx={{ flex: 1 }}><Typography variant="body2" fontWeight={600}>{m[lang]}</Typography><Typography variant="caption" color="text.secondary">{Math.round(m.share * 100)}% {lang === "es" ? "del gasto" : "of spend"}</Typography></Box>
                          <Typography variant="body2" fontWeight={700}>{fmtMoney(total * m.share, currency, true)}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box><Typography variant="subtitle1" fontWeight={600}>{t.forecast} · {lang === "es" ? "3 meses" : "3 months"}</Typography><Typography variant="caption" color="text.secondary">{lang === "es" ? "Basado en tendencia" : "Based on trend"}</Typography></Box>
                <Chip size="small" label="ML" color="primary" />
              </Box>
              {(() => {
                const recent = months.slice(-6);
                const avgIn = recent.reduce((s, m) => s + m.ingreso, 0) / Math.max(1, recent.length);
                const avgOut = recent.reduce((s, m) => s + m.egreso, 0) / Math.max(1, recent.length);
                const netAvg = avgIn - avgOut;
                const next = [1, 2, 3].map((i) => ({ i, label: t.months[(new Date().getMonth() + i) % 12], net: netAvg * (0.95 + Math.sin(i * 1.3) * 0.08) }));
                return (
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {next.map((n) => (
                      <Box key={n.i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="caption" sx={{ width: 40, fontFamily: "monospace", letterSpacing: 1 }}>{n.label}</Typography>
                        <Box sx={{ flex: 1, height: 8, borderRadius: 1, bgcolor: "action.hover", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${Math.min(100, Math.abs(n.net / avgIn) * 100)}%`, borderRadius: 1, bgcolor: n.net >= 0 ? "success.main" : "error.main" }} />
                        </Box>
                        <Typography variant="body2" fontWeight={700} color={n.net >= 0 ? "success.main" : "error.main"}>{n.net >= 0 ? "+" : "−"}{fmtMoney(Math.abs(n.net), currency, true)}</Typography>
                      </Box>
                    ))}
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: "primary.light", borderRadius: 2, borderLeft: 3, borderColor: "primary.main" }}>
                      <Typography variant="body2">{lang === "es" ? `Proyección de ahorro a 3 meses: ${fmtMoney(netAvg * 3, currency, true)}` : `3-month savings projection: ${fmtMoney(netAvg * 3, currency, true)}`}</Typography>
                    </Box>
                  </Stack>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}