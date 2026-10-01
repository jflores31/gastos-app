// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest"
import { renderHook, act, cleanup, waitFor } from "@testing-library/react"
import { PALETTES, SettingsProvider, useSettings } from "./SettingsContext"
import { setLiveRates } from "@/domain/money"
import { ACCENTS } from "@/theme/materialTheme"

// Today's rates are fetched only once signed in: the tests choose whether there is a user.
const session = vi.hoisted(() => ({ user: null }))
vi.mock("./UserContext", () => ({ useSupabaseUser: () => session.user }))

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

describe("SettingsContext — acentos", () => {
  it("el selector ofrece los acentos del tema, en su orden y con su gradiente", () => {
    expect(Object.keys(PALETTES)).toEqual(Object.keys(ACCENTS))
    expect(PALETTES.ocean.grad).toEqual(ACCENTS.ocean.grad)
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

describe("SettingsContext — moneda de cada transacción", () => {
  afterEach(() => { cleanup(); localStorage.clear() })
  const usd = { valor: 100, moneda: "USD", montoOriginal: 26 }
  const pen = { valor: 100, moneda: "PEN", montoOriginal: null }

  it("en PEN muestra el valor en PEN y, aparte, lo escrito en la otra moneda", () => {
    const { result } = setup()
    expect(result.current.fmtTx(usd)).toBe("S/100")
    expect(result.current.txOriginal(usd)).toBe("$26")
    expect(result.current.txOriginal(pen)).toBeNull()
  })

  it("en la misma moneda en que se registró muestra exactamente lo escrito, no la conversión de hoy", () => {
    const { result } = setup()
    act(() => result.current.setCurrency("USD"))
    expect(result.current.fmtTx(usd)).toBe("$26") // 100 × 0.27 = $27
    expect(result.current.txOriginal(usd)).toBeNull()
    expect(result.current.fmtTx(pen)).toBe("$27")
    expect(result.current.txOriginal(pen)).toBeNull() // una en PEN no tiene original
  })

  it("en modo privacidad también oculta lo escrito", () => {
    const { result } = setup()
    act(() => result.current.setPrivacy(true))
    expect(result.current.fmtTx(usd)).toBe("S/••••")
    expect(result.current.txOriginal(usd)).toBe("$••••")
  })
})

describe("SettingsContext — tasas del día", () => {
  afterEach(() => { cleanup(); localStorage.clear(); setLiveRates({}); session.user = null; vi.restoreAllMocks() })
  const answer = (body, ok = true) => vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status: ok ? 200 : 500, headers: { "content-type": "application/json" } }),
  )

  it("sin sesión no las pide y usa las fijas", () => {
    const spy = answer({})
    const { result } = setup()
    expect(spy).not.toHaveBeenCalled()
    expect(result.current.rates).toEqual({ source: "fixed", date: null })
  })

  it("con sesión las pide a /api/rates y los montos se convierten con ellas", async () => {
    session.user = { id: "u1" }
    const spy = answer({ base: "PEN", date: "2026-09-27", source: "live", rates: { PEN: 1, USD: 0.26 } })
    const { result } = setup()
    act(() => result.current.setCurrency("USD"))
    await waitFor(() => expect(result.current.rates).toEqual({ source: "live", date: "2026-09-27" }))
    expect(spy).toHaveBeenCalledWith("/api/rates")
    expect(result.current.fmt(3500)).toBe("$910")
  })

  it("si la ruta falla se quedan las fijas", async () => {
    session.user = { id: "u1" }
    const spy = answer({ error: "boom" }, false)
    const { result } = setup()
    await waitFor(() => expect(spy).toHaveBeenCalled())
    act(() => result.current.setCurrency("USD"))
    expect(result.current.rates.source).toBe("fixed")
    expect(result.current.fmt(3500)).toBe("$945")
  })
})
