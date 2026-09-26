// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { SettingsProvider, useSettings } from "./SettingsContext"

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

  it("en inglés también formatea con el locale del idioma", () => {
    const { result } = setup()
    act(() => result.current.setLang("en"))
    expect(result.current.t.common.locale).toBe("en-US")
    expect(result.current.fmt(1234.5)).toBe("S/1,235")
  })
})

describe("SettingsContext — cierre por inactividad", () => {
  afterEach(() => { cleanup(); localStorage.clear() })

  it("por defecto 2 minutos; se guarda al cambiarlo", () => {
    const { result } = setup()
    expect(result.current.idleMinutes).toBe(2)
    act(() => result.current.setIdleMinutes(15))
    expect(result.current.idleMinutes).toBe(15)
    expect(localStorage.getItem("gastos-idle-minutes")).toBe("15")
  })

  it("un valor guardado que no es una opción vuelve a 2", () => {
    localStorage.setItem("gastos-idle-minutes", "0")
    const { result } = setup()
    expect(result.current.idleMinutes).toBe(2)
  })

  it("un cambio hecho en otra pestaña llega a esta", () => {
    const { result } = setup()
    localStorage.setItem("gastos-idle-minutes", "30")
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", {
        key: "gastos-idle-minutes", newValue: "30", storageArea: localStorage,
      }))
    })
    expect(result.current.idleMinutes).toBe(30)
  })
})
