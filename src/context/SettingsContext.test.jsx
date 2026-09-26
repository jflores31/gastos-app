// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { SettingsProvider, useSettings } from "./SettingsContext.jsx"

const setup = () => renderHook(() => useSettings(), { wrapper: SettingsProvider })

describe("SettingsContext — fmt y modo privacidad", () => {
  afterEach(() => { cleanup(); localStorage.clear() })

  it("fmt formatea en la moneda elegida (los montos se guardan en PEN)", () => {
    const { result } = setup()
    expect(result.current.fmt(3500)).toBe("S/3,500")
    act(() => result.current.setCurrency("USD"))
    expect(result.current.fmt(3500)).toBe("$945")
    expect(result.current.fmt(3_700_000, true)).toBe("$999.0k")
  })

  it("en modo privacidad oculta el monto y deja solo el símbolo; se guarda en localStorage", () => {
    const { result } = setup()
    act(() => result.current.setPrivacy(true))
    expect(result.current.fmt(3500)).toBe("S/••••")
    expect(result.current.fmt(3500, true)).toBe("S/••••")
    act(() => result.current.setCurrency("EUR"))
    expect(result.current.fmt(1)).toBe("€••••")
    expect(localStorage.getItem("gastos-privacy")).toBe("true")
    act(() => result.current.setPrivacy(false))
    expect(result.current.fmt(3500)).toBe("€875")
  })
})
