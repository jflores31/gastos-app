import { describe, it, expect } from "vitest"
import { accountBalance } from "./balance"

// Minimal tx factory matching transactionFromRow()'s shape (features/transactions/data).
function tx({ tipo = "EGRESO", categoria = "comida", concepto = "x", valor = 10, date = new Date() } = {}) {
  const d = date instanceof Date ? date : new Date(date)
  return { tipo, categoria, concepto, valor, date: d, dia: d.getDate(), mes: d.getMonth(), año: d.getFullYear() }
}

describe("accountBalance", () => {
  const at = new Date(2026, 8, 10, 12, 0)
  const bcp = { id: "bcp", balance: 1000, balanceAt: at }
  const after = (h = 1) => new Date(at.getTime() + h * 3_600_000)
  const linked = (over) => ({ ...tx({ valor: 100, date: after(), ...over }), cuentaId: over?.cuentaId ?? "bcp" })

  it("suma los ingresos y resta los gastos asociados a la cuenta, posteriores a su saldo", () => {
    const txs = [linked({ tipo: "EGRESO", valor: 150 }), linked({ tipo: "INGRESO", valor: 3500 }), linked({ cuentaId: "otra" }), { ...tx({ valor: 80, date: after() }), cuentaId: null }]
    expect(accountBalance(bcp, txs)).toBe(4350)
  })

  it("lo anterior o igual a la fecha del saldo ya está incluido en él", () => {
    const txs = [linked({ date: at }), linked({ date: new Date(2026, 8, 1) }), linked({ valor: 20 })]
    expect(accountBalance(bcp, txs)).toBe(980)
  })

  it("las transferencias restan del origen y suman al destino; las anteriores no cuentan", () => {
    const transfers = [
      { origen: "bcp", destino: "cash", monto: 200, date: after() },
      { origen: "card", destino: "bcp", monto: 50.5, date: after(2) },
      { origen: "bcp", destino: "cash", monto: 999, date: at },
      { origen: null, destino: "bcp", monto: 10, date: after() }, // origen borrado
    ]
    expect(accountBalance(bcp, [], transfers)).toBe(860.5)
    expect(accountBalance({ id: "cash", balance: 0, balanceAt: at }, [], transfers)).toBe(200)
  })

  it("sin fecha de saldo cuenta todo; redondea a 2 decimales", () => {
    expect(accountBalance({ id: "bcp", balance: 0.1 }, [linked({ tipo: "INGRESO", valor: 0.2, date: new Date(2000, 0, 1) })])).toBe(0.3)
  })
})
