import { describe, it, expect } from "vitest"
import { linearRegressionSlope, insightsList } from "./helpers"

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
