import { describe, it, expect } from "vitest"
import {
  flagAnomalies,
  healthScore,
  healthLabel,
  healthTone,
  linearRegressionSlope,
  recurringList,
  filterByPeriod,
  periodLabel,
  monthCount,
  daysCount,
  fmtDate,
} from "./helpers.js"

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

describe("healthScore", () => {
  it("alcanza 100 con ahorro alto, gasto a la baja y sin anomalías", () => {
    expect(healthScore(50, -10, 0)).toBe(100) // 50 + 40(cap) + 10
  })

  it("nunca baja de 0", () => {
    expect(healthScore(0, 1000, 10)).toBe(0)
  })

  it("topa el bonus de ahorro en +40", () => {
    expect(healthScore(100, 0, 0)).toBe(90) // 50 + 40(cap), sin bonus de gasto
  })

  it("penaliza -5 por cada anomalía", () => {
    expect(healthScore(0, 0, 1)).toBe(45)
    expect(healthScore(0, 0, 2)).toBe(40)
  })

  it("topa la penalización por subida de gasto en -15", () => {
    expect(healthScore(0, 100, 0)).toBe(35)
    expect(healthScore(0, 1000, 0)).toBe(35)
  })
})

describe("healthLabel / healthTone", () => {
  it("usa los umbrales 75 / 50", () => {
    expect(healthLabel(80, "es")).toBe("Excelente")
    expect(healthLabel(80, "en")).toBe("Excellent")
    expect(healthLabel(60, "es")).toBe("Regular")
    expect(healthLabel(40, "en")).toBe("Critical")
    expect(healthTone(75)).toBe("success")
    expect(healthTone(50)).toBe("warning")
    expect(healthTone(49)).toBe("error")
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

describe("filterByPeriod", () => {
  const now = new Date()
  const here = tx({ date: now })

  it("'all' devuelve todas las transacciones", () => {
    const txs = [here, tx({ date: new Date(2000, 0, 1) })]
    expect(filterByPeriod(txs, "all")).toBe(txs)
  })

  it("'month' incluye hoy y excluye hace ~2 meses", () => {
    const old = tx({ date: new Date(now.getFullYear(), now.getMonth() - 2, 15) })
    const out = filterByPeriod([here, old], "month")
    expect(out).toContain(here)
    expect(out).not.toContain(old)
  })

  it("'year' filtra por año actual y respeta el offset", () => {
    const lastYear = tx({ date: new Date(now.getFullYear() - 1, 5, 15) })
    expect(filterByPeriod([here, lastYear], "year")).toEqual([here])
    expect(filterByPeriod([here, lastYear], "year", -1)).toEqual([lastYear])
  })
})

describe("helpers triviales", () => {
  it("periodLabel mapea cada período a su etiqueta i18n", () => {
    const t = { week: "S", month: "M", quarter: "Q", year: "Y", all: "A" }
    expect(periodLabel("week", t)).toBe("S")
    expect(periodLabel("quarter", t)).toBe("Q")
    expect(periodLabel("nope", t)).toBe("A")
  })

  it("monthCount y daysCount por período", () => {
    expect(monthCount("year")).toBe(12)
    expect(monthCount("week")).toBe(0.25)
    expect(daysCount("quarter")).toBe(90)
    expect(daysCount("week")).toBe(7)
  })

  it("fmtDate formatea dd/mm con padding", () => {
    expect(fmtDate(new Date(2026, 0, 5))).toBe("05/01")
    expect(fmtDate(new Date(2026, 11, 25))).toBe("25/12")
  })
})
