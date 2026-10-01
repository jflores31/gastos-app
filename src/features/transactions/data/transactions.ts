import type { Transaction } from "@/types/domain"
import type { TransactionRow } from "@/types/database"

// Deleted transactions stay in the trash this long, then DataContext's load() removes them
// for good.
export const TRASH_DAYS = 30

// Rows per insert request in addTxs() (CSV import).
export const IMPORT_CHUNK = 500

export function transactionFromRow(row: TransactionRow): Transaction {
  const d = new Date(row.fecha)
  return {
    id: row.id,
    tipo: row.tipo,
    categoria: row.categoria,
    concepto: row.concepto,
    valor: Number(row.valor),
    // The currency it was entered in, what was typed and that day's rate (units per
    // 1 PEN). In PEN, and in rows from before the column existed, the original is `valor`.
    moneda: row.moneda ?? "PEN",
    montoOriginal: row.monto_original == null ? null : Number(row.monto_original),
    tasa: row.tasa == null ? null : Number(row.tasa),
    cuentaId: row.cuenta_id ?? null,
    date: d,
    dia: d.getDate(),
    mes: d.getMonth(),
    año: d.getFullYear(),
    // Detection lives client-side in flagAnomalies() (DataContext's flaggedTxs).
    anomaly: false,
    // Set while the transaction is in the trash (soft delete).
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  }
}

// What a write needs from a transaction (new or edited).
export type TxInput = Pick<Transaction, "tipo" | "categoria" | "concepto" | "valor" | "date" | "moneda" | "montoOriginal" | "tasa" | "cuentaId">

// The currency columns of a transaction being saved (see transactionFromRow). Sent on every
// write, so an edit back to PEN clears the original amount and the rate.
const currencyColumns = (tx: TxInput) => (tx.moneda && tx.moneda !== "PEN"
  ? { moneda: tx.moneda, monto_original: tx.montoOriginal, tasa: tx.tasa }
  : { moneda: "PEN", monto_original: null, tasa: null })

// Row sent on insert and update (without user_id, which the insert adds).
export const transactionToRow = (tx: TxInput) => ({
  tipo: tx.tipo,
  categoria: tx.categoria,
  concepto: tx.concepto,
  valor: tx.valor,
  ...currencyColumns(tx),
  cuenta_id: tx.cuentaId ?? null,
  fecha: tx.date.toISOString(),
})
