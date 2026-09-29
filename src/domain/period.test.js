import { describe, it, expect, vi, afterEach } from "vitest"
import { filterByPeriod, periodLabel, monthCount, daysCount } from "./period"

// Minimal tx factory matching mapRow()'s shape (DataContext.jsx).
function tx({ tipo = "EGRESO", categoria = "comida", concepto = "x", valor = 10, date = new Date() } = {}) {
  const d = date instanceof Date ? date : new Date(date)
  return { tipo, categoria, concepto, valor, date: d, dia: d.getDate(), mes: d.getMonth(), año: d.getFullYear() }
}

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

  describe("los límites del período son días completos", () => {
    afterEach(() => vi.useRealTimers())
    const at = (...args) => tx({ date: new Date(...args) })

    it("la semana va del lunes 00:00 al domingo 23:59, sea la hora que sea ahora", () => {
      vi.useFakeTimers({ now: new Date(2026, 8, 17, 12, 0), toFake: ["Date"] }) // jueves 17 sep, 12:00
      const mondayMorning = at(2026, 8, 14, 9, 0)
      const sundayNight = at(2026, 8, 20, 22, 0)
      const lastSunday = at(2026, 8, 13, 23, 0)
      expect(filterByPeriod([mondayMorning, sundayNight, lastSunday], "week")).toEqual([mondayMorning, sundayNight])
    })

    it("el último día del mes, del trimestre y del año cuenta entero", () => {
      vi.useFakeTimers({ now: new Date(2026, 8, 10, 8, 0), toFake: ["Date"] })
      const sep30 = at(2026, 8, 30, 18, 30)
      const oct1 = at(2026, 9, 1, 0, 0)
      expect(filterByPeriod([sep30, oct1], "month")).toEqual([sep30])
      expect(filterByPeriod([sep30, oct1], "quarter")).toEqual([sep30])
      const dec31 = at(2026, 11, 31, 21, 0)
      expect(filterByPeriod([dec31], "year")).toEqual([dec31])
    })
  })
})

describe("periodLabel, monthCount y daysCount", () => {
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
})
