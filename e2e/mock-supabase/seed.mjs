// Starting data for each mock user: four months of transactions (with a recurring bill
// and one anomaly this month) plus one row in every other table. Dates are relative to
// today so the "this month" views always have data.
import { randomUUID } from "node:crypto"

const at = (monthsAgo, day) => {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1, 12))
  // Current month: never in the future.
  const maxDay = monthsAgo === 0 ? now.getUTCDate() : 28
  d.setUTCDate(Math.min(day, maxDay))
  return d.toISOString()
}

export function seedFor(userId, schema) {
  const row = (table, values) => {
    const out = { id: randomUUID(), user_id: userId }
    for (const [name, col] of Object.entries(schema[table])) {
      if (name in out) continue
      if (name in values) out[name] = values[name]
      else if (col.default !== undefined) out[name] = typeof col.default === "function" ? col.default() : col.default
      else out[name] = null
    }
    return out
  }
  const tx = (tipo, categoria, concepto, valor, fecha) => row("transactions", { tipo, categoria, concepto, valor, fecha, created_at: fecha })

  const transactions = []
  for (let m = 3; m >= 0; m--) {
    transactions.push(
      tx("INGRESO", "SUELDO", "SUELDO POR PLANILLA", 3500, at(m, 1)),
      tx("EGRESO", "VIVIENDA", "ALQUILER", 1200, at(m, 1)),
      tx("EGRESO", "STREAMING", "NETFLIX", 45, at(m, 1)),
      tx("EGRESO", "COMIDA", "MERCADO", 150 + m * 10, at(m, 1)),
    )
    if (m > 0) transactions.push(tx("EGRESO", "TRANSPORTE", "BUS", 60, at(m, 15)))
  }
  // 900 > 3 × the COMIDA median: flagged as unusual.
  transactions.push(tx("EGRESO", "COMIDA", "SUPERMERCADO", 900, at(0, 1)))

  const seeded = {
    transactions,
    budgets: [row("budgets", { categoria: "COMIDA", monto: 600 }), row("budgets", { categoria: "TRANSPORTE", monto: 200 })],
    goals: [row("goals", { label_es: "Fondo de emergencia", label_en: "Emergency fund", target: 5000, current_amount: 1500, color: "#38BDF8", icon: "Savings" })],
    accounts: [row("accounts", { name: "BCP", type: "bank", balance: 2500, color: "#1d4ed8" })],
    investments: [row("investments", { label_es: "DPF", label_en: "Term deposit", value: 3000, return_rate: 6, type: "term" })],
    debts: [row("debts", { label_es: "Préstamo auto", label_en: "Car loan", balance: 8000, rate: 12, monthly: 450, remaining: 20, original_months: 36 })],
    subscriptions: [row("subscriptions", { name: "Netflix", price: 45, cycle: "monthly", category: "STREAMING" })],
    custom_categories: [row("custom_categories", { nombre: "Gatos", tipo: "EGRESO", color: "#8B5CF6", icon: "Pets" })],
  }
  // Tables without starting data (e.g. transfers) start empty.
  for (const table of Object.keys(schema)) seeded[table] ??= []
  return seeded
}
