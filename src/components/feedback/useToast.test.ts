// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, renderHook } from "@testing-library/react"
import { useToast } from "./useToast"

describe("useToast", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("muestra un aviso con los valores por defecto y lo oculta a los 3 s", () => {
    const { result } = renderHook(() => useToast())
    act(() => result.current.showToast("Guardado"))
    expect(result.current.toast).toMatchObject({ msg: "Guardado", severity: "success", duration: 3000, action: null })
    act(() => vi.advanceTimersByTime(2999))
    expect(result.current.toast).not.toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.toast).toBeNull()
  })

  it("un aviso nuevo reemplaza al anterior y reinicia el tiempo", () => {
    const { result } = renderHook(() => useToast())
    const undo = { label: "Deshacer", onClick: vi.fn() }
    act(() => result.current.showToast("Primero", "success", 1000))
    act(() => vi.advanceTimersByTime(900))
    act(() => result.current.showToast("Segundo", "warning", 6000, undo))
    act(() => vi.advanceTimersByTime(200))
    expect(result.current.toast).toMatchObject({ msg: "Segundo", severity: "warning", duration: 6000, action: undo })
    act(() => vi.advanceTimersByTime(5800))
    expect(result.current.toast).toBeNull()
  })

  it("hideToast lo cierra; showToast es la misma función entre renders", () => {
    const { result, rerender } = renderHook(() => useToast())
    const first = result.current.showToast
    act(() => result.current.showToast("Hola"))
    act(() => result.current.hideToast())
    expect(result.current.toast).toBeNull()
    rerender()
    expect(result.current.showToast).toBe(first)
  })
})
