import { describe, it, expect, afterEach, vi } from "vitest"
import { budgetFor, budgetAlerts } from "./helpers"

const tx = (categoria, valor, date, tipo = "EGRESO") => ({
  id: `${categoria}-${date.toISOString()}-${valor}`, tipo, categoria, concepto: "X", valor, date,
  dia: date.getDate(), mes: date.getMonth(), año: date.getFullYear(), anomaly: false,
})

describe("budgetFor", () => {
  it("un presupuesto mensual se ve igual que antes (monthCount)", () => {
    expect(budgetFor(600, "month", "month")).toBe(600)
    expect(budgetFor(600, "month", "year")).toBe(7200)
    expect(budgetFor(600, "month", "week")).toBe(150)
    expect(budgetFor(600, undefined, "quarter")).toBe(1800)
  })

  it("semanal y anual se escalan al período que se ve", () => {
    expect(budgetFor(100, "week", "week")).toBe(100)
    expect(budgetFor(100, "week", "month")).toBe(400)
    expect(budgetFor(1200, "year", "month")).toBe(100)
    expect(budgetFor(1200, "year", "year")).toBe(1200)
  })
})

describe("budgetAlerts", () => {
  afterEach(() => vi.useRealTimers())

  it("avisa al 80 % y al 100 % de lo gastado en el período del propio presupuesto", () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 17, 12), toFake: ["Date"] }) // jueves 17 sep
    const txs = [
      tx("COMIDA", 85, new Date(2026, 8, 15)),      // esta semana
      tx("COMIDA", 500, new Date(2026, 8, 2)),      // este mes, semana anterior
      tx("TRANSPORTE", 210, new Date(2026, 8, 3)),  // este mes
      tx("VIAJES", 700, new Date(2026, 1, 3)),      // este año
      tx("SALUD", 10, new Date(2026, 8, 16)),
      tx("SUELDO", 5000, new Date(2026, 8, 16), "INGRESO"),
    ]
    const alerts = budgetAlerts(txs, { COMIDA: 100, TRANSPORTE: 200, VIAJES: 1000, SALUD: 100, SUELDO: 10 }, { COMIDA: "week", VIAJES: "year" })
    expect(alerts.map((a) => [a.categoria, a.periodo, a.level, Math.round(a.pct * 100)])).toEqual([
      ["TRANSPORTE", "month", "over", 105],
      ["COMIDA", "week", "warn", 85],
    ])
  })

  it("la semana empieza el lunes: lo del domingo anterior ya no cuenta", () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 14, 9), toFake: ["Date"] }) // lunes 14 sep
    const txs = [tx("COMIDA", 90, new Date(2026, 8, 13, 20))] // domingo 13
    expect(budgetAlerts(txs, { COMIDA: 100 }, { COMIDA: "week" })).toEqual([])
    expect(budgetAlerts(txs, { COMIDA: 100 }, { COMIDA: "month" })).toEqual([expect.objectContaining({ level: "warn" })])
  })

  it("un año nuevo empieza de cero", () => {
    vi.useFakeTimers({ now: new Date(2027, 0, 2, 9), toFake: ["Date"] })
    const txs = [tx("VIAJES", 1500, new Date(2026, 11, 28))]
    expect(budgetAlerts(txs, { VIAJES: 1000 }, { VIAJES: "year" })).toEqual([])
  })
})
