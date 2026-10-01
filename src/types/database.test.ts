import { describe, expect, it } from "vitest"
// The same reader the e2e mock uses, so this checks against supabase/schema.sql itself.
import { loadSchema } from "../../e2e/mock-supabase/schema.mjs"
import { transactionFromRow, transactionToRow } from "@/features/transactions/data/transactions"
import { budgetsFromRows } from "@/features/budgets/data/budgets"
import { goalsTable } from "@/features/goals/data/goals"
import { accountsTable } from "@/features/accounts/data/accounts"
import { transfersTable } from "@/features/accounts/data/transfers"
import { investmentsTable } from "@/features/investments/data/investments"
import { debtsTable } from "@/features/debts/data/debts"
import { subscriptionsTable } from "@/features/subscriptions/data/subscriptions"
import { customCategoriesTable } from "@/features/categories/data/customCategories"

const schema = loadSchema() as Record<string, Record<string, unknown>>
const columns = (table: string) => Object.keys(schema[table] ?? {}).sort()

// A row that records which columns a mapper reads (every value is a valid date string).
function recordingRow() {
  const read = new Set<string>()
  const row = new Proxy({}, {
    get: (_, key) => {
      if (typeof key === "string") read.add(key)
      return "2026-01-15T12:00:00.000Z"
    },
  })
  return { row, read }
}

// Whatever the mapper reads or writes must be a column of its table.
function expectColumns(table: string, used: Iterable<string>) {
  const missing = [...used].filter((c) => !columns(table).includes(c))
  expect(missing, `${table}: columns not in supabase/schema.sql`).toEqual([])
}

const day = new Date("2026-01-15T12:00:00Z")
const specs = [
  { spec: goalsTable, sample: { es: "a", en: "a", target: 1, current: 0, deadline: "2026-12-31", color: "#000", icon: "Flag" } },
  { spec: accountsTable, sample: { name: "a", type: "bank", balance: 1, balanceAt: day, color: "#000", limit: 5 } },
  { spec: transfersTable, sample: { origen: "x", destino: "y", monto: 1, date: day, nota: "n" } },
  { spec: investmentsTable, sample: { es: "a", en: "a", value: 1, return: 2, type: "x" } },
  { spec: debtsTable, sample: { es: "a", en: "a", balance: 1, rate: 2, monthly: 3, remaining: 4, original_months: 5 } },
  { spec: subscriptionsTable, sample: { name: "a", price: 1, cycle: "monthly", category: "x" } },
  { spec: customCategoriesTable, sample: { nombre: "a", tipo: "EGRESO", color: "#000", icon: "Flag" } },
] as const

describe("database.ts y los mappers contra supabase/schema.sql", () => {
  it.each(specs.map(({ spec, sample }) => [spec.table, spec, sample] as const))("%s: lo que se lee y se escribe existe", (table, spec, sample) => {
    expect(columns(table).length, `${table} is not in supabase/schema.sql`).toBeGreaterThan(0)
    const { row, read } = recordingRow()
    ;(spec.fromRow as (r: unknown) => unknown)(row)
    expectColumns(table, read)
    expectColumns(table, ["user_id", ...Object.keys((spec.toRow as (i: unknown) => object)(sample))])
    expectColumns(table, spec.optionalColumns ?? [])
  })

  it("transactions: lo que se lee y se escribe existe (también deleted_at de la papelera)", () => {
    const { row, read } = recordingRow()
    transactionFromRow(row as never)
    expectColumns("transactions", read)
    const sample = { tipo: "EGRESO", categoria: "COMIDA", concepto: "a", valor: 10, date: day, moneda: "USD", montoOriginal: 2.7, tasa: 0.27, cuentaId: "x" } as const
    expectColumns("transactions", ["user_id", "deleted_at", ...Object.keys(transactionToRow(sample))])
  })

  it("budgets: lo que se lee existe, y el upsert escribe categoria, monto y periodo", () => {
    const { row, read } = recordingRow()
    budgetsFromRows([row as never])
    expectColumns("budgets", read)
    expectColumns("budgets", ["user_id", "categoria", "monto", "periodo"])
  })
})
