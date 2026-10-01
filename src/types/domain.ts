// Domain types shared by src/data, src/i18n and the contexts. Amounts are in PEN (the
// base currency); the UI converts on display (fmtMoney) and on save (toBase).

export type TxType = "INGRESO" | "EGRESO"

// A transaction as the app uses it (transactionFromRow, in features/transactions/data, turns a
// DB row into this).
export type Transaction = {
  id: string
  tipo: TxType
  categoria: string
  concepto: string
  valor: number
  date: Date
  dia: number
  mes: number // 0-11, as Date.getMonth()
  año: number
  anomaly: boolean
  // The currency it was entered in, what was typed and that day's rate (units per 1 PEN).
  // PEN transactions, and those from before the column existed, have no original amount:
  // it is `valor`.
  moneda?: string
  montoOriginal?: number | null
  tasa?: number | null
  // The account it was paid from or received into (optional; see accountBalance).
  cuentaId?: string | null
  // Set while the transaction is in the trash (soft delete).
  deletedAt?: Date | null
}

export type Period = "week" | "month" | "quarter" | "year" | "all"

// Category key → limit for the budget's period (BudgetPeriod; "month" by default).
export type Budgets = Record<string, number>
export type BudgetPeriod = "week" | "month" | "year"

export type Goal = {
  id?: string
  es: string
  en: string
  target: number
  current: number
  deadline?: string | null
  color?: string | null
  icon?: string | null
}

export type Account = {
  id?: string
  name: string
  type: string
  balance: number // as typed, as of balanceAt: what moved later is added on top
  balanceAt?: Date
  current?: number // today's balance (accountBalance), filled in by DataContext
  color?: string | null
  limit?: number
}

// Money moved between two of the user's accounts: neither income nor expense. A side is
// null once its account is deleted (the other account's balance stays as it was).
export type Transfer = {
  id?: string
  origen: string | null
  destino: string | null
  monto: number // PEN, > 0
  date: Date
  nota?: string | null
}

export type Investment = {
  id?: string
  es: string
  en: string
  value: number
  return: number
  type: string
}

export type Debt = {
  id?: string
  es: string
  en: string
  balance: number
  rate: number
  monthly: number
  remaining: number
  original_months: number
}

export type Subscription = {
  id?: string
  name: string
  price: number
  cycle: string
  category: string
}

// Custom categories are kept as the raw DB row.
export type CustomCategory = {
  id?: string
  nombre: string
  tipo: TxType
  color: string
  icon?: string | null
}
