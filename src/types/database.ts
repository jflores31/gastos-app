// Rows of the 9 tables as Supabase returns them (supabase/schema.sql). The app's own
// shapes are in ./domain.ts; each feature's data/ module maps one to the other.
// database.test.ts checks that every column the mappers read or write exists here and
// in the schema.

import type { TxType, BudgetPeriod } from "./domain"

// numeric columns: PostgREST may send them as a string, so the mappers use Number().
type Numeric = number | string
type Uuid = string
type Timestamp = string // ISO 8601

type Owned = { id: Uuid; user_id: Uuid; created_at?: Timestamp; updated_at?: Timestamp }

export type TransactionRow = Owned & {
  tipo: TxType
  categoria: string
  concepto: string
  valor: Numeric // PEN
  moneda: string | null
  monto_original: Numeric | null
  tasa: Numeric | null
  cuenta_id: Uuid | null
  fecha: Timestamp
  deleted_at: Timestamp | null
}

export type BudgetRow = Omit<Owned, "created_at"> & {
  categoria: string
  monto: Numeric
  periodo: BudgetPeriod | null
}

export type GoalRow = Owned & {
  label_es: string
  label_en: string
  target: Numeric
  current_amount: Numeric
  deadline: string | null // date
  color: string | null
  icon: string | null
}

export type AccountRow = Owned & {
  name: string
  type: string
  balance: Numeric
  balance_at: Timestamp | null
  color: string | null
  account_limit: Numeric | null
}

export type TransferRow = Owned & {
  origen: Uuid | null
  destino: Uuid | null
  monto: Numeric
  fecha: Timestamp
  nota: string | null
}

export type InvestmentRow = Owned & {
  label_es: string
  label_en: string
  value: Numeric
  return_rate: Numeric
  type: string
}

export type DebtRow = Owned & {
  label_es: string
  label_en: string
  balance: Numeric
  rate: Numeric
  monthly: Numeric
  remaining: number | null
  original_months: number | null
}

export type SubscriptionRow = Owned & {
  name: string
  price: Numeric
  cycle: string
  category: string
}

export type CustomCategoryRow = Owned & {
  nombre: string
  tipo: TxType
  color: string
  icon: string | null
}

// How a table whose rows map 1:1 to a list in DataContext's state is read and written
// (contexts/useTableCrud.ts). Each feature's data/ module exports one, e.g. goalsTable.
// `optionalColumns` may be missing in a database that hasn't run supabase/schema.sql yet:
// a write that PostgREST rejects for an unknown column is retried without them.
export type TableSpec<Item, Row> = {
  table: string
  fromRow: (row: Row) => Item
  toRow: (item: Item) => Record<string, unknown>
  optionalColumns?: string[]
}
