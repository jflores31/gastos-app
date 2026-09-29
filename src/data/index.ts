import type { Transaction, TxType } from "@/types/domain";
import { getToday } from "@/domain/period";

export type MonthSummary = { key: string; año: number; mes: number; ingreso: number; egreso: number; txs: Transaction[] };

export function txByMonth(txs: Transaction[]) {
  const m = new Map<string, MonthSummary>();
  for (const t of txs) {
    const k = `${t.año}-${String(t.mes).padStart(2, "0")}`;
    if (!m.has(k)) m.set(k, { key: k, año: t.año, mes: t.mes, ingreso: 0, egreso: 0, txs: [] });
    const e = m.get(k)!;
    if (t.tipo === "INGRESO") e.ingreso += t.valor;
    else e.egreso += t.valor;
    e.txs.push(t);
  }
  return [...m.values()].sort((a, b) => a.año - b.año || a.mes - b.mes);
}

export type CategorySummary = { categoria: string; total: number; count: number; txs: Transaction[] };

export function txByCategory(txs: Transaction[], tipo: TxType = "EGRESO") {
  const m = new Map<string, CategorySummary>();
  for (const t of txs) if (t.tipo === tipo) {
    if (!m.has(t.categoria)) m.set(t.categoria, { categoria: t.categoria, total: 0, count: 0, txs: [] });
    const e = m.get(t.categoria)!;
    e.total += t.valor; e.count++; e.txs.push(t);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

export function txByCategoryToday(txs: Transaction[]) {
  const today = getToday();
  const todayTx = txs.filter((t) => t.date.toDateString() === today.toDateString());
  type Concept = { concepto: string; total: number };
  const m = new Map<string, CategorySummary & { concepts: Map<string, Concept> }>();
  for (const t of todayTx) if (t.tipo === "EGRESO") {
    if (!m.has(t.categoria)) m.set(t.categoria, { categoria: t.categoria, total: 0, count: 0, concepts: new Map(), txs: [] });
    const cat = m.get(t.categoria)!;
    cat.total += t.valor; cat.count++; cat.txs.push(t);
    if (!cat.concepts.has(t.concepto)) cat.concepts.set(t.concepto, { concepto: t.concepto, total: 0 });
    cat.concepts.get(t.concepto)!.total += t.valor;
  }
  return [...m.values()].map((cat) => ({
    ...cat,
    concepts: [...cat.concepts.values()].sort((a, b) => b.total - a.total),
    txs: cat.txs.sort((a, b) => a.date.getTime() - b.date.getTime()),
  })).sort((a, b) => b.total - a.total);
}

export function getTodayExpenses(txs: Transaction[]) {
  const today = getToday();
  return txs.filter((t) => t.tipo === "EGRESO" && t.date.toDateString() === today.toDateString())
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

