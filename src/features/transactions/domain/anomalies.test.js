import { describe, it, expect } from "vitest"
import { flagAnomalies } from "./anomalies"

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
