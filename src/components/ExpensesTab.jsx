"use client"

import { useState, useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Grid, Stack, Chip, Avatar, LinearProgress,
  List, ListItem, ListItemAvatar, ListItemText, IconButton, Collapse,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { CATEGORIES, fmtMoney, txByCategory, txByCategoryToday, getTodayExpenses } from "../data/index.js";
import { filterByPeriod, periodLabel, monthCount } from "../data/helpers.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { NoTransactions } from "./shared.jsx";

export default function ExpensesTab({ period, openModal }) {
  const { t, lang, currency } = useSettings();
  const { txs, editBudgets } = useData();
  const [activeCat, setActiveCat] = useState(null);
  const [expandedSection, setExpandedSection] = useState("today");

  const periodTxs = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const cats = useMemo(() => txByCategory(periodTxs), [periodTxs]);
  const catsToday = useMemo(() => txByCategoryToday(txs), [txs]);
  const todayExpenses = useMemo(() => getTodayExpenses(txs), [txs]);
  const totalOut = useMemo(() => periodTxs.filter((x) => x.tipo === "EGRESO").reduce((s, x) => s + x.valor, 0), [periodTxs]);
  const totalToday = useMemo(() => todayExpenses.reduce((s, x) => s + x.valor, 0), [todayExpenses]);

  const filtered = useMemo(() => {
    let list = periodTxs;
    if (activeCat) list = list.filter((x) => x.categoria === activeCat);
    return list.slice().reverse();
  }, [periodTxs, activeCat]);

  const expenseTxs = useMemo(() => filtered.filter((x) => x.tipo === "EGRESO"), [filtered]);

  const toggleSection = (section) => setExpandedSection(expandedSection === section ? null : section);

  const cardStyles = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid",
    borderColor: "divider",
  };

  const cardContentStyles = {
    py: 2,
    px: 2.5,
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  const sectionTitleStyles = {
    mb: 2,
    pb: 1.5,
    borderBottom: "2px solid",
    borderColor: "primary.main",
  };

  const itemCardStyles = (color, isActive) => ({
    borderRadius: 2,
    p: 1.5,
    mb: 1,
    bgcolor: isActive ? "primary.light" : "background.default",
    border: isActive ? "2px solid" : "1px solid",
    borderColor: isActive ? "primary.main" : "divider",
    transition: "all 0.2s ease",
    cursor: "pointer",
    "&:hover": {
      bgcolor: isActive ? "primary.light" : "action.hover",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
  });

  return (
    <Stack spacing={2.5}>
      <Card sx={{ borderRadius: 3, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
        <Box sx={{ px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText" }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{t.dailyTitle}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>{t.dailySubtitle}</Typography>
          </Box>
          <IconButton size="medium" onClick={() => openModal("", "expense")} sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "inherit", transition: "all 0.2s", "&:hover": { bgcolor: "rgba(255,255,255,0.25)", transform: "scale(1.05)" } }}>
            <AddIcon />
          </IconButton>
        </Box>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, cursor: "pointer" }} onClick={() => toggleSection("today")}>
            <Typography variant="body2" fontWeight={600}>{t.todaysExpenses}</Typography>
            {expandedSection === "today" ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </Box>
          <Collapse in={expandedSection === "today"}>
            {todayExpenses.length > 0 ? (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, p: 1.5, bgcolor: "primary.light", borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={600}>{lang === "es" ? "Total hoy" : "Total today"}</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">−{fmtMoney(totalToday, currency)}</Typography>
                </Box>
                <Stack spacing={0.5}>
                  {todayExpenses.map((tx) => {
                    const color = CATEGORIES.expense[tx.categoria]?.color || "#9e9e9e";
                    const catName = CATEGORIES.expense[tx.categoria]?.[lang] || tx.categoria;
                    const hour = tx.date.toLocaleTimeString(lang === "es" ? "es-PE" : "en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                    return (
                      <Box key={tx.id} sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>{tx.concepto}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", px: 1 }}>{catName}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>{hour}</Typography>
                        <Typography variant="body1" fontWeight={700} color="error.main" sx={{ textAlign: "right", minWidth: 70 }}>−{fmtMoney(tx.valor, currency)}</Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center", fontStyle: "italic" }}>
                {lang === "es" ? "No hay gastos registrados hoy" : "No expenses recorded today"}
              </Typography>
            )}
          </Collapse>
        </CardContent>
      </Card>

      <Grid container spacing={2.5} sx={{ height: 420 }}>
        <Grid item xs={12} lg={4} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Card sx={{ ...cardStyles, flex: 1, borderTop: "3px solid", borderTopColor: "primary.main" }}>
            <CardContent sx={cardContentStyles}>
              <Box sx={{ mb: 2, pb: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "primary.main", mb: 0.5 }}>{t.topCategories}</Typography>
                <Typography variant="caption" color="text.secondary">{cats.length} {t.category.toLowerCase()}s · {fmtMoney(totalOut, currency, true)}</Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Chip size="small" label={lang === "es" ? "Todos" : "All"} variant={!activeCat ? "filled" : "outlined"} onClick={() => setActiveCat(null)} sx={{ fontWeight: 600 }} />
                {cats.slice(0, 4).map((c) => (
                  <Chip key={c.categoria} size="small" label={CATEGORIES.expense[c.categoria]?.[lang] || c.categoria} variant={activeCat === c.categoria ? "filled" : "outlined"} onClick={() => setActiveCat(c.categoria === activeCat ? null : c.categoria)} sx={{ fontWeight: 500 }} />
                ))}
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                {cats.length === 0 ? (
                  <Stack spacing={1}>
                    {Object.entries(CATEGORIES.expense).slice(0, 6).map(([key, val]) => (
                      <Box key={key} sx={{ borderRadius: 2, p: 1.5, bgcolor: "background.default", border: "1px solid", borderColor: "divider", opacity: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: val.color, display: "flex", alignItems: "center", justifyContent: "center", color: "common.white", fontSize: 12, fontWeight: 700 }}>-</Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{val[lang]}</Typography>
                            <Typography variant="caption" color="text.secondary">{lang === "es" ? "Sin gastos aún" : "No expenses yet"}</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700} color="text.disabled">{fmtMoney(0, currency, true)}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    {cats.map((c, idx) => {
                      const pct = totalOut > 0 ? (c.total / totalOut) * 100 : 0;
                      const color = CATEGORIES.expense[c.categoria]?.color || "#9e9e9e";
                      const catName = CATEGORIES.expense[c.categoria]?.[lang] || c.categoria;
                      return (
                        <Box key={c.categoria} sx={{ borderRadius: 2, p: 1.5, bgcolor: "background.default", border: "1px solid", borderColor: "divider", transition: "all 0.2s", "&:hover": { bgcolor: "action.hover", transform: "translateX(4px)" } }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.75 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: color, display: "flex", alignItems: "center", justifyContent: "center", color: "common.white", fontSize: 12, fontWeight: 700 }}>{idx + 1}</Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>{catName}</Typography>
                              <Typography variant="caption" color="text.secondary">{c.count} {lang === "es" ? "tx" : "tx"} · {pct.toFixed(1)}%</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="error.main">{fmtMoney(c.total, currency, true)}</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={Math.min(100, (c.total / (cats[0]?.total || 1)) * 100)} sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Card sx={{ ...cardStyles, flex: 1, borderTop: "3px solid", borderTopColor: "warning.main" }}>
            <CardContent sx={cardContentStyles}>
              <Box sx={{ mb: 2, pb: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "warning.dark", mb: 0.5 }}>{t.budgetVsActual}</Typography>
                <Typography variant="caption" color="text.secondary">{periodLabel(period, t)} · {Object.keys(CATEGORIES.expense).length} {lang === "es" ? "categorías" : "categories"}</Typography>
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                <Stack spacing={1}>
                  {Object.keys(CATEGORIES.expense).slice(0, 8).map((cat, idx) => {
                    const spent = cats.find((c) => c.categoria === cat)?.total || 0;
                    const limit = (editBudgets[cat] || 0) * monthCount(period);
                    const pct = limit ? spent / limit : 0;
                    const color = CATEGORIES.expense[cat]?.color || "#9e9e9e";
                    const catName = CATEGORIES.expense[cat]?.[lang] || cat;
                    const isOver = pct > 1;
                    return (
                      <Box key={cat} sx={{ borderRadius: 2, p: 1.5, border: isOver ? "2px solid" : "1px solid", borderColor: isOver ? "error.main" : "divider", bgcolor: isOver ? "error.light" : "background.default", transition: "all 0.2s" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.75 }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: color, display: "flex", alignItems: "center", justifyContent: "center", color: "common.white", fontSize: 12, fontWeight: 700 }}>{idx + 1}</Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{catName}</Typography>
                            <Typography variant="caption" color={isOver ? "error.main" : "text.secondary"} fontWeight={isOver ? 600 : 400}>{Math.round(pct * 100)}% {isOver && (lang === "es" ? "(sobre)" : "(over)")}</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700} color={isOver ? "error.main" : "text.primary"}>{fmtMoney(spent, currency, true)}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LinearProgress variant="determinate" value={Math.min(100, pct * 100)} color={isOver ? "error" : "success"} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45, textAlign: "right" }}>{fmtMoney(limit, currency, true)}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Card sx={{ ...cardStyles, flex: 1, borderTop: "3px solid", borderTopColor: "success.main" }}>
            <CardContent sx={cardContentStyles}>
              <Box sx={{ mb: 2, pb: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "success.dark", mb: 0.5 }}>{lang === "es" ? "Resumen del periodo" : "Period Summary"}</Typography>
                <Typography variant="caption" color="text.secondary">{periodLabel(period, t)}</Typography>
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                <Stack spacing={1.5}>
                  {[
                    { label: t.spent, value: totalOut, color: "error.main", bg: "error.light" },
                    { label: lang === "es" ? "Transacciones" : "Transactions", value: expenseTxs.length, color: "info.main", bg: "info.light" },
                    { label: lang === "es" ? "Promedio diario" : "Daily avg", value: totalOut / 30, color: "warning.main", bg: "warning.light" },
                    { label: lang === "es" ? "Mayor gasto" : "Top expense", value: cats[0]?.total || 0, color: "error.dark", bg: "error.light" },
                  ].map((item, idx) => (
                    <Box key={idx} sx={{ borderRadius: 2, p: 2, bgcolor: item.bg, border: "1px solid", borderColor: "divider", transition: "all 0.2s", "&:hover": { transform: "scale(1.01)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: item.color, display: "flex", alignItems: "center", justifyContent: "center", color: "common.white", fontSize: 14, fontWeight: 700 }}>{idx + 1}</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={700} color={item.color}>
                          {typeof item.value === "number" && item.value < 1000 ? item.value : fmtMoney(item.value, currency, true)}
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={idx === 0 ? Math.min(100, (totalOut / (Object.values(editBudgets).reduce((s, v) => s + v, 0) * monthCount(period))) * 100) : Math.min(100, (expenseTxs.length / 50) * 100)} color={idx === 0 ? "error" : idx === 1 ? "info" : idx === 2 ? "warning" : "error"} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, pb: 2, borderBottom: "2px solid", borderColor: "primary.main" }}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="primary.main">{t.transactions}</Typography>
              <Typography variant="body2" color="text.secondary">{expenseTxs.length} {lang === "es" ? "gastos registrados" : "recorded expenses"}</Typography>
            </Box>
            {activeCat && <Chip size="medium" label={CATEGORIES.expense[activeCat]?.[lang] || activeCat} onDelete={() => setActiveCat(null)} color="primary" variant="filled" sx={{ fontWeight: 600 }} />}
          </Box>
          {expenseTxs.length === 0 ? (
            <NoTransactions lang={lang} type="expense" />
          ) : (
            <List disablePadding sx={{ maxHeight: 400, overflowY: "auto" }}>
              {expenseTxs.slice(0, 30).map((x) => {
                const expColor = CATEGORIES.expense[x.categoria]?.color;
                const catName = CATEGORIES.expense[x.categoria]?.[lang] || CATEGORIES.income[x.categoria]?.[lang] || x.categoria;
                return (
                  <ListItem key={x.id} disablePadding sx={{ py: 1.5, borderBottom: 1, borderColor: "divider", transition: "all 0.2s", "&:hover": { bgcolor: "action.hover" } }}>
                    <ListItemAvatar sx={{ minWidth: 52 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: expColor || "primary.light", color: expColor ? "#fff" : "primary.dark", fontSize: 16, fontWeight: 700 }}>{catName[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Typography variant="body1" fontWeight={600}>{x.concepto}</Typography>} 
                      secondary={<Typography variant="caption" color="text.secondary">{catName} · {x.dia}/{x.mes + 1}/{x.año}</Typography>} 
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="h6" fontWeight={700} color="error.main">−{fmtMoney(x.valor, currency, true)}</Typography>
                  </ListItem>
                );
              })}
            </List>
          )}
          <Box sx={{ mt: 2, pt: 2, borderTop: "2px solid", borderColor: "primary.main", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 2, px: 3, py: 2 }}>
            <Typography variant="body1" fontWeight={600}>{lang === "es" ? "TOTAL GASTOS" : "TOTAL EXPENSES"}</Typography>
            <Typography variant="h5" fontWeight={700}>−{fmtMoney(totalOut, currency, true)}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}