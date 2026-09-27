// Domain types shared by src/data, src/i18n and the contexts. Amounts are in PEN (the
// base currency); the UI converts on display (fmtMoney) and on save (toBase).

export type TxType = "INGRESO" | "EGRESO"

// A transaction as the app uses it (DataContext's mapRow turns a DB row into this).
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
  color?: string
  icon?: string | null
}

export type Account = {
  id?: string
  name: string
  type: string
  balance: number
  color?: string
  limit?: number
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
