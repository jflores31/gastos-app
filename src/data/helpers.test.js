import { describe, it, expect } from "vitest"
import { flagAnomalies, linearRegressionSlope, recurringList, fmtDate, accountBalance, insightsList } from "./helpers"

// Minimal tx factory matching mapRow()'s shape (DataContext.jsx).
function tx({ tipo = "EGRESO", categoria = "comida", concepto = "x", valor = 10, date = new Date() } = {}) {
  const d = date instanceof Date ? date : new Date(date)
  return { tipo, categoria, concepto, valor, date: d, dia: d.getDate(), mes: d.getMonth(), año: d.getFullYear() }
}

describe("flagAnomalies", () => {
  it("marca un EGRESO > 3x la mediana de su categoría", () => {
    const txs = [tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 100 })]
    const out = flagAnomalies(txs)
    expect(out.filter((t) => t.anomaly)).toHaveLength(1)
    expect(out[4].anomaly).toBe(true) // 100 > mediana(10) * 3
    expect(out.slice(0, 4).every((t) => t.anomaly === false)).toBe(true)
  })

  it("no marca en la frontera exacta (3x) — solo estrictamente mayor", () => {
    const base = [tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 10 })]
    // mediana = 10 → umbral = 30
    expect(flagAnomalies([...base, tx({ valor: 30 })])[4].anomaly).toBe(false)
    expect(flagAnomalies([...base, tx({ valor: 31 })])[4].anomaly).toBe(true)
  })

  it("calcula la mediana con conteo par e impar (el outlier cuenta como muestra)", () => {
    // 6 muestras (par): [10,20,30,40,50,200] → mediana (30+40)/2 = 35 → umbral 105
    const par = flagAnomalies([10, 20, 30, 40, 50, 200].map((valor) => tx({ valor })))
    expect(par[5].anomaly).toBe(true) // 200 > 105
    expect(par[4].anomaly).toBe(false) // 50 < 105
    // 5 muestras (impar): [10,20,30,40,200] → mediana 30 → umbral 90
    const impar = flagAnomalies([10, 20, 30, 40, 200].map((valor) => tx({ valor })))
    expect(impar[4].anomaly).toBe(true) // 200 > 90
    expect(impar[3].anomaly).toBe(false) // 40 < 90
  })

  it("ignora categorías con menos de MIN_SAMPLES (4) muestras", () => {
    const txs = [tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 1000 })] // solo 3 muestras
    expect(flagAnomalies(txs).some((t) => t.anomaly)).toBe(false)
  })

  it("solo evalúa EGRESO, nunca INGRESO", () => {
    const txs = [
      tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 10 }),
      tx({ tipo: "INGRESO", valor: 100000 }),
    ]
    expect(flagAnomalies(txs).find((t) => t.tipo === "INGRESO").anomaly).toBe(false)
  })

  it("aísla los umbrales por categoría", () => {
    const txs = [
      ...Array.from({ length: 4 }, () => tx({ categoria: "comida", valor: 10 })),
      ...Array.from({ length: 4 }, () => tx({ categoria: "viajes", valor: 1000 })),
      tx({ categoria: "comida", valor: 50 }), // outlier en comida (umbral 30)
      tx({ categoria: "viajes", valor: 1500 }), // normal en viajes (umbral 3000)
    ]
    const out = flagAnomalies(txs)
    expect(out[8].anomaly).toBe(true)
    expect(out[9].anomaly).toBe(false)
  })

  it("devuelve un array nuevo sin mutar la entrada", () => {
    const input = [tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 10 }), tx({ valor: 100 })]
    const out = flagAnomalies(input)
    expect(out).not.toBe(input)
    expect(out[4]).not.toBe(input[4])
    expect(input[4]).not.toHaveProperty("anomaly", true) // la entrada no se toca
  })
})

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
describe("fmtDate", () => {
  it("fmtDate formatea dd/mm con padding", () => {
    expect(fmtDate(new Date(2026, 0, 5))).toBe("05/01")
    expect(fmtDate(new Date(2026, 11, 25))).toBe("25/12")
  })
})

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
