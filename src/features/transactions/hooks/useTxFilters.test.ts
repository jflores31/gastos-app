// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, renderHook } from "@testing-library/react"
import type { Transaction, TxType } from "@/types/domain"
import { useTxFilters } from "./useTxFilters"

// Minimal tx factory matching transactionFromRow()'s shape (features/transactions/data).
const tx = (id: string, tipo: TxType, categoria: string, valor: number, date: Date): Transaction => ({
  id, tipo, categoria, concepto: id.toUpperCase(), valor, date,
  dia: date.getDate(), mes: date.getMonth(), año: date.getFullYear(), anomaly: false,
})

// "Today" is 20-03-2026: the month period is March.
const txs = [
  tx("c", "EGRESO", "COMIDA", 30, new Date(2026, 1, 10, 12)),
  tx("e", "INGRESO", "OTROS", 50, new Date(2026, 1, 1, 12)),
  tx("d", "INGRESO", "SUELDO", 100, new Date(2026, 2, 1, 12)),
  tx("a", "EGRESO", "COMIDA", 10, new Date(2026, 2, 5, 9)),
  tx("b", "EGRESO", "TRANSPORTE", 20, new Date(2026, 2, 5, 18)),
]
const ids = (list: Transaction[]) => list.map((x) => x.id)
const february = { type: "month" as const, date: new Date(2026, 1, 1) }

describe("useTxFilters", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date(2026, 2, 20, 12))
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("sin filtros: los del tipo en el período, del más nuevo al más viejo, con su total", () => {
    const { result } = renderHook(() => useTxFilters(txs, "month", "EGRESO"))
    expect(ids(result.current.list)).toEqual(["b", "a"])
    expect(result.current.total).toBe(30)
    expect(ids(result.current.periodTxs)).toEqual(["d", "a", "b"])
  })

  it("la categoría sola filtra dentro del período", () => {
    const { result } = renderHook(() => useTxFilters(txs, "month", "EGRESO"))
    act(() => result.current.setActiveCat("COMIDA"))
    expect(ids(result.current.list)).toEqual(["a"])
    expect(result.current.total).toBe(10)
  })

  it("un mes del calendario reemplaza al período", () => {
    const { result } = renderHook(() => useTxFilters(txs, "month", "EGRESO"))
    act(() => result.current.setCalFilter(february))
    expect(ids(result.current.list)).toEqual(["c"])
  })

  it("calendario y categoría juntos: en Gastos la categoría también se aplica (antes se ignoraba)", () => {
    const { result } = renderHook(() => useTxFilters(txs, "month", "EGRESO"))
    act(() => {
      result.current.setCalFilter({ type: "day", date: new Date(2026, 2, 5) })
      result.current.setActiveCat("COMIDA")
    })
    expect(ids(result.current.list)).toEqual(["a"])
    expect(result.current.total).toBe(10)
    act(() => {
      result.current.setCalFilter(february)
      result.current.setActiveCat("TRANSPORTE")
    })
    expect(ids(result.current.list)).toEqual([])
    expect(result.current.total).toBe(0)
  })

  it("Ingresos usa la misma regla", () => {
    const { result } = renderHook(() => useTxFilters(txs, "month", "INGRESO"))
    expect(ids(result.current.list)).toEqual(["d"])
    act(() => result.current.setCalFilter(february))
    expect(ids(result.current.list)).toEqual(["e"])
    act(() => result.current.setActiveCat("SUELDO"))
    expect(ids(result.current.list)).toEqual([])
  })
})
