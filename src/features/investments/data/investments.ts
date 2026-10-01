import type { Investment } from "@/types/domain"
import type { InvestmentRow, TableSpec } from "@/types/database"

export function investmentFromRow(row: InvestmentRow): Investment {
  return {
    id: row.id,
    es: row.label_es,
    en: row.label_en,
    value: Number(row.value),
    return: Number(row.return_rate),
    type: row.type,
  }
}

// Row sent to Supabase (the inverse of investmentFromRow); user_id is added by useTableCrud.
const investmentToRow = (inv: Investment) => ({
  label_es: inv.es,
  label_en: inv.en,
  value: inv.value,
  return_rate: inv.return,
  type: inv.type,
})

export const investmentsTable: TableSpec<Investment, InvestmentRow> = { table: "investments", fromRow: investmentFromRow, toRow: investmentToRow }
