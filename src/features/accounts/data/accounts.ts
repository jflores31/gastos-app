import type { Account } from "@/types/domain"
import type { AccountRow, TableSpec } from "@/types/database"

export function accountFromRow(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    // As typed, as of balanceAt; the current balance adds what moved later (accountBalance).
    balance: Number(row.balance),
    balanceAt: row.balance_at ? new Date(row.balance_at) : undefined,
    color: row.color,
    limit: row.account_limit != null ? Number(row.account_limit) : undefined,
  }
}

// Row sent to Supabase (the inverse of accountFromRow); user_id is added by useTableCrud.
const accountToRow = (a: Account) => ({
  name: a.name,
  type: a.type,
  balance: a.balance,
  // Set by the browser, like the dates of the transactions it is compared with.
  balance_at: a.balanceAt?.toISOString(),
  color: a.color,
  account_limit: a.limit ?? null,
})

export const accountsTable: TableSpec<Account, AccountRow> = { table: "accounts", fromRow: accountFromRow, toRow: accountToRow }
