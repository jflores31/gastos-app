import { getToday } from "./index.js";
import { messagesFor } from "../i18n/index.js";

export function filterByPeriod(txs, period, offset = 0) {
  const today = getToday();
  if (period === "all") return txs;

  let start, end;
  if (period === "week") {
    const dow = (today.getDay() + 6) % 7;
    start = new Date(today); start.setDate(today.getDate() - dow + offset * 7);
    end = new Date(start); end.setDate(start.getDate() + 6);
  } else if (period === "month") {
    const raw = today.getMonth() + offset;
    const y = today.getFullYear() + Math.floor(raw / 12);
    const mo = ((raw % 12) + 12) % 12;
    start = new Date(y, mo, 1);
    end = new Date(y, mo + 1, 0);
  } else if (period === "quarter") {
    const rawQ = Math.floor(today.getMonth() / 3) + offset;
    const y = today.getFullYear() + Math.floor(rawQ / 4);
    const q = ((rawQ % 4) + 4) % 4;
    start = new Date(y, q * 3, 1);
    end = new Date(y, q * 3 + 3, 0);
  } else if (period === "year") {
    start = new Date(today.getFullYear() + offset, 0, 1);
    end = new Date(today.getFullYear() + offset, 11, 31);
  }

  return txs.filter((t) => t.date >= start && t.date <= end);
}

export function periodLabel(period, t) {
  if (period === "week") return t.week;
  if (period === "month") return t.month;
  if (period === "quarter") return t.quarter;
  if (period === "year") return t.year;
  return t.all;
}

export function monthCount(period) {
  if (period === "year") return 12;
  if (period === "quarter") return 3;
  if (period === "month") return 1;
  if (period === "week") return 0.25;
  return 1;
}

export function daysCount(period) {
  if (period === "year") return 365;
  if (period === "quarter") return 90;
  if (period === "month") return 30;
  if (period === "week") return 7;
  return 30;
}

export function healthScore(savingsRate, spendingChange, anomalyCount) {
  let score = 50;
  // Savings: up to +40, reaching the cap at a 20% savings rate.
  score += Math.min(40, savingsRate * 2);
  // Spending trend vs previous period: flat bonus if down, graduated penalty if up.
  if (spendingChange < 0) score += 10;
  else score -= Math.min(15, spendingChange * 0.3);
  // Unusual expenses flagged by flagAnomalies().
  score -= anomalyCount * 5;
  // Max reachable = 50 + 40 + 10 = 100.
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Label/colour for a health score. Single source of truth shared by the tabs;
// thresholds match (>=75 good, >=50 fair, else critical).
export function healthLabel(score, lang) {
  const m = messagesFor(lang).healthLevels;
  if (score >= 75) return m.excellent;
  if (score >= 50) return m.fair;
  return m.critical;
}

export function healthTone(score) {
  return score >= 75 ? "success" : score >= 50 ? "warning" : "error";
}

// Flags EGRESO transactions whose amount is a strong outlier for their category.
// Conservative: a category needs >= MIN_SAMPLES expenses to be scored, and a tx is
// anomalous only if it exceeds OUTLIER_FACTOR x the category median (median is robust
// to the very outliers we're hunting). Returns a new array; each tx's `anomaly` is
// recomputed (the DB column is always false — detection lives here, client-side).
export function flagAnomalies(txs) {
  const MIN_SAMPLES = 4;
  const OUTLIER_FACTOR = 3;
  const byCat = new Map();
  for (const tx of txs) {
    if (tx.tipo !== "EGRESO") continue;
    if (!byCat.has(tx.categoria)) byCat.set(tx.categoria, []);
    byCat.get(tx.categoria).push(tx.valor);
  }
  const thresholds = new Map();
  for (const [cat, values] of byCat) {
    if (values.length < MIN_SAMPLES) continue;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    if (median > 0) thresholds.set(cat, median * OUTLIER_FACTOR);
  }
  return txs.map((tx) => {
    const threshold = tx.tipo === "EGRESO" ? thresholds.get(tx.categoria) : undefined;
    return { ...tx, anomaly: threshold != null && tx.valor > threshold };
  });
}

export function recurringList(txs = []) {
  if (!txs.length) return [];

  const groups = new Map();
  for (const tx of txs) {
    if (tx.tipo !== "EGRESO") continue;
    const key = `${tx.categoria}|${tx.concepto}`;
    if (!groups.has(key)) groups.set(key, { categoria: tx.categoria, concepto: tx.concepto, months: new Set(), amounts: [], days: [] });
    const g = groups.get(key);
    g.months.add(`${tx.año}-${tx.mes}`);
    g.amounts.push(tx.valor);
    g.days.push(tx.dia);
  }

  return [...groups.values()]
    .filter((g) => g.months.size >= 3)
    .map((g) => ({
      concepto: g.concepto,
      categoria: g.categoria,
      day: Math.round(g.days.reduce((s, d) => s + d, 0) / g.days.length),
      avg: Math.round(g.amounts.reduce((s, a) => s + a, 0) / g.amounts.length),
    }))
    .sort((a, b) => a.day - b.day);
}

export function fmtDate(date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Ordinary least-squares slope for an evenly-spaced series [y0, y1, …, yn-1].
// More stable than (last - first) / (n - 1) because it uses all points.
export function linearRegressionSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  const num = values.reduce((s, v, i) => s + (i - meanX) * (v - meanY), 0);
  const den = values.reduce((s, _, i) => s + (i - meanX) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

export function insightsList(lang, totalOut, totalIn, savingsRate, dOut, anomalies, currency, fmtMoney, period = "month") {
  const m = messagesFor(lang).insightTexts;
  const t = [];
  t.push({
    icon: "trend", tone: dOut > 0 ? "warn" : "good",
    title: m.spendingTrend,
    desc: m.spendingTrendDesc(Math.abs(dOut).toFixed(0), dOut > 0),
  });
  t.push({
    icon: "savings", tone: savingsRate >= 20 ? "good" : savingsRate >= 10 ? "info" : "warn",
    title: m.savingsRate,
    desc: m.savingsRateDesc(savingsRate.toFixed(0), savingsRate >= 20),
  });
  if (anomalies.length > 0) {
    t.push({
      icon: "warning", tone: "warn",
      title: m.unusualExpenses,
      desc: m.unusualExpensesDesc(anomalies.length),
    });
  }
  t.push({
    icon: "forecast", tone: "info",
    title: m.monthEndForecast,
    desc: m.monthEndForecastDesc(fmtMoney((totalOut / daysCount(period)) * 30, currency, true)),
  });
  return t;
}

// Net worth for the Goals tab. Assets: positive account balances plus the value of every
// investment. Debt: negative account balances (e.g. a used credit card) plus the
// outstanding balance of every loan.
export function netWorthOf(accounts = [], debts = [], investments = []) {
  const assets = accounts.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0)
    + investments.reduce((s, i) => s + (i.value || 0), 0);
  const debt = Math.abs(accounts.filter((a) => a.balance < 0).reduce((s, a) => s + a.balance, 0))
    + debts.reduce((s, d) => s + (d.balance || 0), 0);
  return { assets, debt, net: assets - debt };
}
