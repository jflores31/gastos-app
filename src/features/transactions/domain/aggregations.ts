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

export function getTodayExpenses(txs: Transaction[]) {
  const today = getToday();
  return txs.filter((t) => t.tipo === "EGRESO" && t.date.toDateString() === today.toDateString())
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

