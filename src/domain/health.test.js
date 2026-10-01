import { describe, it, expect } from "vitest"
import { healthScore, healthLabel, healthTone } from "./health"

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
