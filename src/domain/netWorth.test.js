import { describe, it, expect } from "vitest"
import { netWorthOf } from "./netWorth"

describe("netWorthOf", () => {
  it("activos = saldos positivos de cuentas + inversiones; deuda = saldos negativos + préstamos", () => {
    const accounts = [{ balance: 2500 }, { balance: -300 }, { balance: 0 }]
    const debts = [{ balance: 8000 }, { balance: null }]
    const investments = [{ value: 3000 }, { value: 1200 }]
    expect(netWorthOf(accounts, debts, investments)).toEqual({ assets: 6700, debt: 8300, net: -1600 })
  })

  it("las inversiones cuentan como activo (antes quedaban fuera del patrimonio)", () => {
    expect(netWorthOf([], [], [{ value: 500 }])).toEqual({ assets: 500, debt: 0, net: 500 })
  })

  it("sin datos: todo en cero", () => {
    expect(netWorthOf()).toEqual({ assets: 0, debt: 0, net: 0 })
  })

  it("usa el saldo de hoy de cada cuenta (current) cuando está calculado", () => {
    expect(netWorthOf([{ balance: 1000, current: 700 }, { balance: 0, current: -50 }])).toEqual({ assets: 700, debt: 50, net: 650 })
  })
})
