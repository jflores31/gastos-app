import { describe, it, expect } from "vitest"
import { recurringList } from "./recurring"

// Minimal tx factory matching transactionFromRow()'s shape (features/transactions/data).
function tx({ tipo = "EGRESO", categoria = "comida", concepto = "x", valor = 10, date = new Date() } = {}) {
  const d = date instanceof Date ? date : new Date(date)
  return { tipo, categoria, concepto, valor, date: d, dia: d.getDate(), mes: d.getMonth(), año: d.getFullYear() }
}

describe("recurringList", () => {
  it("incluye conceptos presentes en >= 3 meses distintos y promedia día/monto", () => {
    const txs = [
      tx({ concepto: "renta", valor: 100, date: new Date(2026, 0, 1) }),
      tx({ concepto: "renta", valor: 200, date: new Date(2026, 1, 3) }),
      tx({ concepto: "renta", valor: 300, date: new Date(2026, 2, 5) }),
    ]
    const out = recurringList(txs)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ concepto: "renta", avg: 200, day: 3 })
  })

  it("excluye conceptos en menos de 3 meses", () => {
    const txs = [
      tx({ concepto: "ocio", date: new Date(2026, 0, 1) }),
      tx({ concepto: "ocio", date: new Date(2026, 1, 1) }),
    ]
    expect(recurringList(txs)).toHaveLength(0)
  })

  it("ignora INGRESO y la lista vacía", () => {
    expect(recurringList([])).toEqual([])
    const ingresos = [
      tx({ tipo: "INGRESO", concepto: "sueldo", date: new Date(2026, 0, 1) }),
      tx({ tipo: "INGRESO", concepto: "sueldo", date: new Date(2026, 1, 1) }),
      tx({ tipo: "INGRESO", concepto: "sueldo", date: new Date(2026, 2, 1) }),
    ]
    expect(recurringList(ingresos)).toHaveLength(0)
  })
})
