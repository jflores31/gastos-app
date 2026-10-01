import { describe, it, expect } from "vitest"
import { linearRegressionSlope, recurringList, insightsList } from "./helpers"

// Minimal tx factory matching mapRow()'s shape (DataContext.jsx).
function tx({ tipo = "EGRESO", categoria = "comida", concepto = "x", valor = 10, date = new Date() } = {}) {
  const d = date instanceof Date ? date : new Date(date)
  return { tipo, categoria, concepto, valor, date: d, dia: d.getDate(), mes: d.getMonth(), año: d.getFullYear() }
}

describe("linearRegressionSlope", () => {
  it("recupera una pendiente conocida", () => {
    expect(linearRegressionSlope([1, 2, 3, 4])).toBeCloseTo(1)
    expect(linearRegressionSlope([4, 3, 2, 1])).toBeCloseTo(-1)
  })
  it("es 0 para serie plana o con menos de 2 puntos", () => {
    expect(linearRegressionSlope([5, 5, 5])).toBe(0)
    expect(linearRegressionSlope([10])).toBe(0)
    expect(linearRegressionSlope([])).toBe(0)
  })
})

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

describe("insightsList", () => {
  const fmt = (v) => `S/${Math.round(v)}`

  it("arma los textos en español con los datos del período", () => {
    const list = insightsList("es", 300, 1000, 25, 12.4, [{ id: 1 }], "PEN", fmt, "month")
    expect(list.map((i) => i.title)).toEqual(["Tendencia de gastos", "Tasa de ahorro", "Gastos inusuales", "Proyección fin de mes"])
    expect(list[0].desc).toBe("Egresos 12% más altos que el período anterior.")
    expect(list[1].desc).toBe("Ahorrando 25% de ingresos. ¡Objetivo 20% cumplido!")
    expect(list[2].desc).toBe("1 transacción(es) inusual(es) detectada(s) este período.")
    expect(list[3].desc).toMatch(/^Al ritmo actual: S\/\d+ proyectado al mes\.$/)
  })

  it("en inglés, y sin anomalías no agrega ese aviso", () => {
    const list = insightsList("en", 300, 1000, 5, -8, [], "PEN", fmt, "month")
    expect(list.map((i) => i.title)).toEqual(["Spending trend", "Savings rate", "Month-end forecast"])
    expect(list[0].desc).toBe("Spending 8% lower than last period.")
    expect(list[1].desc).toBe("Saving 5% of income. Target: 20%.")
  })
})
