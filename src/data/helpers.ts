import { messagesFor } from "../i18n/index";
import { normalizeConcept } from "@/domain/categories/suggest";
import { daysCount, filterByPeriod, monthCount } from "@/domain/period";
import type { BudgetPeriod, Budgets, Period, Subscription, Transaction } from "@/types/domain";

export type Recurring = { concepto: string; categoria: string; day: number; avg: number };

export function recurringList(txs: Transaction[] = []): Recurring[] {
  if (!txs.length) return [];

  type Group = { categoria: string; concepto: string; months: Set<string>; amounts: number[]; days: number[] };
  const groups = new Map<string, Group>();
  for (const tx of txs) {
    if (tx.tipo !== "EGRESO") continue;
    const key = `${tx.categoria}|${tx.concepto}`;
    if (!groups.has(key)) groups.set(key, { categoria: tx.categoria, concepto: tx.concepto, months: new Set(), amounts: [], days: [] });
    const g = groups.get(key)!;
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

// Ordinary least-squares slope for an evenly-spaced series [y0, y1, …, yn-1].
// More stable than (last - first) / (n - 1) because it uses all points.
export function linearRegressionSlope(values: number[]) {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  const num = values.reduce((s, v, i) => s + (i - meanX) * (v - meanY), 0);
  const den = values.reduce((s, _, i) => s + (i - meanX) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

export type Insight = { icon: "trend" | "savings" | "warning" | "forecast"; tone: "good" | "warn" | "info"; title: string; desc: string };

export function insightsList(
  lang: string, totalOut: number, _totalIn: number, savingsRate: number, dOut: number,
  anomalies: unknown[], currency: string,
  fmtMoney: (v: number, currency: string, compact: boolean) => string,
  period: Period = "month",
): Insight[] {
  const m = messagesFor(lang).insightTexts;
  const t: Insight[] = [];
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


// Upcoming payments, from today until the same day next month: every monthly payment
// shows up exactly once in that window.
// - Detected recurring expenses (recurringList): due on their usual day. Paid this month
//   → next month; not paid and the day already passed → overdue (still this month).
// - Subscriptions: one that matches a recurring concept by name ("Netflix" / NETFLIX) is
//   merged into it with the subscription's price. Otherwise the date comes from its last
//   payment + 1 month or + 1 year; a monthly one never paid is listed without a date.
export type UpcomingPayment = {
  concepto: string
  categoria: string
  amount: number
  due: Date | null // null: monthly subscription with no payment to date it from
  overdue: boolean
  source: "recurring" | "subscription"
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
// Same day `n` months later, clamped to the month's length (Jan 31 + 1 → Feb 28).
const addMonths = (d: Date, n: number, day = d.getDate()) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate()
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(day, last))
}
const sameWords = (a: string, b: string) => ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `)

export function upcomingPayments(txs: Transaction[], subscriptions: Subscription[], today: Date = new Date()): UpcomingPayment[] {
  const start = startOfDay(today)
  const end = addMonths(start, 1)
  const out: UpcomingPayment[] = []
  const subs = subscriptions.map((sub) => ({ sub, key: normalizeConcept(sub.name) }))
  const merged = new Set<Subscription>()

  for (const r of recurringList(txs)) {
    const key = normalizeConcept(r.concepto)
    const match = subs.find((s) => s.key && sameWords(key, s.key) && !merged.has(s.sub))
    if (match) merged.add(match.sub)
    const paid = txs.some((tx) => tx.tipo === "EGRESO" && tx.categoria === r.categoria && tx.concepto === r.concepto
      && tx.año === start.getFullYear() && tx.mes === start.getMonth())
    const thisMonth = addMonths(start, 0, r.day)
    const due = paid ? addMonths(start, 1, r.day) : thisMonth
    if (due > end) continue
    out.push({
      concepto: r.concepto, categoria: r.categoria, amount: match ? match.sub.price : r.avg,
      due, overdue: !paid && thisMonth < start, source: "recurring",
    })
  }

  for (const { sub, key } of subs) {
    if (merged.has(sub) || !key) continue
    const payments = txs.filter((tx) => tx.tipo === "EGRESO" && sameWords(normalizeConcept(tx.concepto), key))
    const last = payments.reduce<Date | null>((acc, tx) => (!acc || tx.date > acc ? tx.date : acc), null)
    const step = sub.cycle === "yearly" ? 12 : 1
    if (!last) {
      if (step === 1) out.push({ concepto: sub.name, categoria: sub.category, amount: sub.price, due: null, overdue: false, source: "subscription" })
      continue
    }
    let due = addMonths(startOfDay(last), step)
    while (due < start) due = addMonths(due, step, last.getDate())
    if (due <= end) out.push({ concepto: sub.name, categoria: sub.category, amount: sub.price, due, overdue: false, source: "subscription" })
  }

  return out.sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity))
}

// A budget of `amount` per `budgetPeriod`, expressed for the period being viewed. Uses
// monthCount's month units (week = 0.25, quarter = 3, year = 12, "all" = 1 month), so a
// monthly budget shows exactly what it always did.
export function budgetFor(amount: number, budgetPeriod: BudgetPeriod = "month", viewPeriod: Period = "month") {
  return (amount * monthCount(viewPeriod)) / monthCount(budgetPeriod)
}

export type BudgetAlert = { categoria: string; periodo: BudgetPeriod; spent: number; limit: number; pct: number; level: "warn" | "over" }

// Budgets at 80 % or more of what was spent in their own current period (this week,
// month or year), highest first.
export function budgetAlerts(txs: Transaction[], budgets: Budgets, periods: Record<string, BudgetPeriod> = {}): BudgetAlert[] {
  const out: BudgetAlert[] = []
  const spentByPeriod = new Map<BudgetPeriod, Map<string, number>>()
  for (const [categoria, limit] of Object.entries(budgets)) {
    if (!(limit > 0)) continue
    const periodo = periods[categoria] ?? "month"
    if (!spentByPeriod.has(periodo)) {
      const m = new Map<string, number>()
      for (const tx of filterByPeriod(txs, periodo)) if (tx.tipo === "EGRESO") m.set(tx.categoria, (m.get(tx.categoria) ?? 0) + tx.valor)
      spentByPeriod.set(periodo, m)
    }
    const spent = spentByPeriod.get(periodo)!.get(categoria) ?? 0
    const pct = spent / limit
    if (pct >= 0.8) out.push({ categoria, periodo, spent, limit, pct, level: pct >= 1 ? "over" : "warn" })
  }
  return out.sort((a, b) => b.pct - a.pct)
}
