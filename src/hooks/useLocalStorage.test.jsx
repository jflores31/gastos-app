// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { useLocalStorage } from "./useLocalStorage.js"

describe("useLocalStorage", () => {
  beforeEach(() => localStorage.clear())
  afterEach(cleanup)

  it("el primer render usa el valor por defecto aunque haya uno guardado (igual que el HTML del servidor)", () => {
    localStorage.setItem("gastos-theme", JSON.stringify("dark"))
    const seen = []
    const { result } = renderHook(() => {
      const [value] = useLocalStorage("gastos-theme", "light")
      seen.push(value)
      return value
    })
    // Leer localStorage en el primer render causaba el desajuste de hidratación del tema oscuro.
    expect(seen[0]).toBe("light")
    expect(result.current).toBe("dark") // aplicado después de montar
  })

  it("el setter actualiza el estado y persiste en localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("gastos-lang", "es"))
    act(() => result.current[1]("en"))
    expect(result.current[0]).toBe("en")
    expect(JSON.parse(localStorage.getItem("gastos-lang"))).toBe("en")
  })

  it("acepta un updater funcional", () => {
    const { result } = renderHook(() => useLocalStorage("n", 1))
    act(() => result.current[1]((prev) => prev + 1))
    expect(result.current[0]).toBe(2)
  })

  it("un valor guardado inválido deja el valor por defecto", () => {
    localStorage.setItem("gastos-currency", "{no es json")
    const { result } = renderHook(() => useLocalStorage("gastos-currency", "PEN"))
    expect(result.current[0]).toBe("PEN")
  })
})
