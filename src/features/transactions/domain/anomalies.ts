import type { Transaction } from "@/types/domain";

// Flags EGRESO transactions whose amount is a strong outlier for their category.
// Conservative: a category needs >= MIN_SAMPLES expenses to be scored, and a tx is
// anomalous only if it exceeds OUTLIER_FACTOR x the category median (median is robust
// to the very outliers we're hunting). Returns a new array; each tx's `anomaly` is
// recomputed (the DB column is always false — detection lives here, client-side).
export function flagAnomalies(txs: Transaction[]): Transaction[] {
  const MIN_SAMPLES = 4;
  const OUTLIER_FACTOR = 3;
  const byCat = new Map<string, number[]>();
  for (const tx of txs) {
    if (tx.tipo !== "EGRESO") continue;
    if (!byCat.has(tx.categoria)) byCat.set(tx.categoria, []);
    byCat.get(tx.categoria)!.push(tx.valor);
  }
  const thresholds = new Map<string, number>();
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
