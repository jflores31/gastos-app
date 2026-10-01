import type { Transfer } from "@/types/domain"
import type { TransferRow, TableSpec } from "@/types/database"

export function transferFromRow(row: TransferRow): Transfer {
  return {
    id: row.id,
    origen: row.origen ?? null,
    destino: row.destino ?? null,
    monto: Number(row.monto),
    date: new Date(row.fecha),
    nota: row.nota ?? null,
  }
}

// Row sent to Supabase (the inverse of transferFromRow); user_id is added by useTableCrud.
const transferToRow = (tr: Transfer) => ({
  origen: tr.origen,
  destino: tr.destino,
  monto: tr.monto,
  fecha: tr.date.toISOString(),
  nota: tr.nota || null,
})

export const transfersTable: TableSpec<Transfer, TransferRow> = { table: "transfers", fromRow: transferFromRow, toRow: transferToRow }
