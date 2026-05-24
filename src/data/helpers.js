import { getToday } from "./index.js";

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
  score += Math.min(30, savingsRate * 1.5);
  if (spendingChange < 0) score += 10;
  else score -= Math.min(15, spendingChange * 0.3);
  score -= anomalyCount * 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function healthLabel(savingsRate, lang) {
  if (savingsRate >= 30) return lang === "es" ? "Excelente" : "Excellent";
  if (savingsRate >= 20) return lang === "es" ? "Buena" : "Good";
  if (savingsRate >= 10) return lang === "es" ? "Regular" : "Fair";
  return lang === "es" ? "Crítica" : "Critical";
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

export function insightsList(lang, totalOut, totalIn, savingsRate, dOut, anomalies, currency, fmtMoney) {
  const t = [];
  const higherLower = dOut > 0 ? (lang === "es" ? "más altos" : "higher") : (lang === "es" ? "más bajos" : "lower");
  t.push({
    icon: "trend", tone: dOut > 0 ? "warn" : "good",
    title: lang === "es" ? "Tendencia de gastos" : "Spending trend",
    desc: lang === "es"
      ? `Egresos ${Math.abs(dOut).toFixed(0)}% ${higherLower} que el período anterior.`
      : `Spending ${Math.abs(dOut).toFixed(0)}% ${higherLower} than last period.`
  });
  t.push({
    icon: "savings", tone: savingsRate >= 20 ? "good" : savingsRate >= 10 ? "info" : "warn",
    title: lang === "es" ? "Tasa de ahorro" : "Savings rate",
    desc: lang === "es"
      ? `Ahorrando ${savingsRate.toFixed(0)}% de ingresos. ${savingsRate >= 20 ? "¡Objetivo 20% cumplido!" : "Meta: 20%."}`
      : `Saving ${savingsRate.toFixed(0)}% of income. ${savingsRate >= 20 ? "Goal met!" : "Target: 20%."}`
  });
  if (anomalies.length > 0) {
    t.push({
      icon: "warning", tone: "warn",
      title: lang === "es" ? "Gastos inusuales" : "Unusual expenses",
      desc: lang === "es"
        ? `${anomalies.length} transacción(es) inusual(es) detectada(s) este período.`
        : `${anomalies.length} unusual transaction(s) flagged this period.`
    });
  }
  t.push({
    icon: "forecast", tone: "info",
    title: lang === "es" ? "Proyección fin de mes" : "Month-end forecast",
    desc: lang === "es"
      ? `Al ritmo actual: ${fmtMoney(totalOut * (30 / 7), currency, true)} proyectado.`
      : `At current pace: ${fmtMoney(totalOut * (30 / 7), currency, true)} projected.`
  });
  return t;
}
