// Export of the user's data: transactions as CSV (for a spreadsheet) and everything as a
// JSON backup. Pure functions; the download itself happens in the settings panel.
// Amounts are exported in PEN, the currency they're stored in.

// Excel runs a cell that starts with one of these as a formula ("CSV injection").
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value) {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  let s = String(value);
  if (FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const pad = (n) => String(n).padStart(2, "0");
// Local date and time, the way the app shows it (not UTC).
export const localDateTime = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

// `categoryName(key, tipo)` gives the category's label in the user's language.
export function transactionsToCsv(txs, categoryName) {
  const header = ["fecha", "tipo", "categoria", "categoria_nombre", "concepto", "monto_pen"];
  const rows = [...txs]
    .sort((a, b) => a.date - b.date)
    .map((tx) => [localDateTime(tx.date), tx.tipo, tx.categoria, categoryName(tx.categoria, tx.tipo), tx.concepto, tx.valor]);
  // BOM: Excel otherwise reads the UTF-8 file as Latin-1 and mangles accents.
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function backupToJson({ txs, editBudgets, goals, accounts, investments, debts, subscriptions, customCats }, now = new Date()) {
  return JSON.stringify({
    app: "gastos-app",
    version: 1,
    exported_at: now.toISOString(),
    currency: "PEN",
    transactions: txs.map((tx) => ({ id: tx.id, fecha: tx.date.toISOString(), tipo: tx.tipo, categoria: tx.categoria, concepto: tx.concepto, valor: tx.valor })),
    budgets: Object.entries(editBudgets).map(([categoria, monto]) => ({ categoria, monto })),
    goals,
    accounts,
    investments,
    debts,
    subscriptions,
    custom_categories: customCats,
  }, null, 2);
}

export const exportFileName = (kind, ext, now = new Date()) =>
  `finanzas-${kind}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.${ext}`;

// Browser-only: saves `text` as a file through a temporary object URL.
export function downloadText(text, fileName, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
