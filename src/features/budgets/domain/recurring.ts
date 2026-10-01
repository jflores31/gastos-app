import { normalizeConcept } from "@/domain/categories/suggest";
import type { Subscription, Transaction } from "@/types/domain";

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
