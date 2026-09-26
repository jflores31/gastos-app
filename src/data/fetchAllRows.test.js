import { describe, it, expect, vi } from "vitest"
import { fetchAllRows } from "./fetchAllRows.js"

// Imita un query de supabase-js: cada llamada a buildQuery() devuelve un builder
// nuevo cuyo .range(from, to) resuelve con la porción pedida de `table`.
function fakeTable(total) {
  const table = Array.from({ length: total }, (_, i) => ({ id: i }))
  const range = vi.fn(async (from, to) => ({ data: table.slice(from, to + 1), error: null }))
  return { buildQuery: () => ({ range }), range }
}

describe("fetchAllRows", () => {
  it("junta todas las páginas (1000 + 1000 + 250) sin duplicados", async () => {
    const { buildQuery, range } = fakeTable(2250)
    const { data, error } = await fetchAllRows(buildQuery)
    expect(error).toBeNull()
    expect(data).toHaveLength(2250)
    expect(new Set(data.map((r) => r.id)).size).toBe(2250)
    expect(range.mock.calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
  })

  it("con un total múltiplo exacto del tamaño de página pide una página vacía final", async () => {
    const { buildQuery, range } = fakeTable(2000)
    const { data } = await fetchAllRows(buildQuery)
    expect(data).toHaveLength(2000)
    expect(range).toHaveBeenCalledTimes(3)
  })

  it("una tabla vacía devuelve []", async () => {
    const { buildQuery } = fakeTable(0)
    const { data, error } = await fetchAllRows(buildQuery)
    expect(data).toEqual([])
    expect(error).toBeNull()
  })

  it("respeta un pageSize custom", async () => {
    const { buildQuery, range } = fakeTable(25)
    const { data } = await fetchAllRows(buildQuery, 10)
    expect(data).toHaveLength(25)
    expect(range.mock.calls).toEqual([[0, 9], [10, 19], [20, 29]])
  })

  it("si una página falla devuelve el error y data null (todo o nada)", async () => {
    let call = 0
    const range = async (from, to) => {
      call++
      if (call === 2) return { data: null, error: { message: "boom" } }
      return { data: Array.from({ length: to - from + 1 }, (_, i) => ({ id: from + i })), error: null }
    }
    const { data, error } = await fetchAllRows(() => ({ range }))
    expect(data).toBeNull()
    expect(error).toEqual({ message: "boom" })
  })
})
