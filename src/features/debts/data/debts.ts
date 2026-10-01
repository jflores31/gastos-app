import type { Debt } from "@/types/domain"
import type { DebtRow, TableSpec } from "@/types/database"

export function debtFromRow(row: DebtRow): Debt {
  return {
    id: row.id,
    es: row.label_es,
    en: row.label_en,
    balance: Number(row.balance),
    rate: Number(row.rate),
    monthly: Number(row.monthly),
    remaining: Number(row.remaining) || 0,
    original_months: Number(row.original_months) || 0,
  }
}

// Row sent to Supabase (the inverse of debtFromRow); user_id is added by useTableCrud.
const debtToRow = (d: Debt) => ({
  label_es: d.es,
  label_en: d.en,
  balance: d.balance,
  rate: d.rate,
  monthly: d.monthly,
  remaining: d.remaining,
  original_months: d.original_months,
})

export const debtsTable: TableSpec<Debt, DebtRow> = { table: "debts", fromRow: debtFromRow, toRow: debtToRow }
