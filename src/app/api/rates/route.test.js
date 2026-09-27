import { describe, it, expect, vi, afterEach } from "vitest"
import { GET } from "./route.ts"
import { fetchRates } from "../../../lib/rates"
import { CURRENCIES } from "../../../data/index"

const provider = (body, init = {}) => vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status: 200, ...init }))
const good = {
  result: "success", base_code: "PEN", time_last_update_unix: 1790467201, // 2026-09-27
  rates: { PEN: 1, USD: 0.2667, EUR: 0.2451, MXN: 5.12, COP: 1102.3, ARS: 318.4, CLP: 251.9, BRL: 1.47, JPY: 39.1 },
}

describe("GET /api/rates", () => {
  afterEach(() => vi.restoreAllMocks())

  it("devuelve las tasas del proveedor solo para las monedas de la app, con su fecha", async () => {
    provider(good)
    const res = await GET()
    expect(res.headers.get("cache-control")).toBe("private, max-age=3600")
    const body = await res.json()
    expect(body).toEqual({ base: "PEN", date: "2026-09-27", source: "live", rates: { PEN: 1, USD: 0.2667, EUR: 0.2451, MXN: 5.12, COP: 1102.3, ARS: 318.4, CLP: 251.9, BRL: 1.47 } })
  })

  it("usa RATES_API_URL si está definida", async () => {
    const spy = provider(good)
    await fetchRates("http://127.0.0.1:54321/__mock/rates")
    expect(spy.mock.calls[0][0]).toBe("http://127.0.0.1:54321/__mock/rates")
  })

  it.each([
    ["error HTTP", () => provider({}, { status: 503 })],
    ["respuesta de error", () => provider({ result: "error", "error-type": "unsupported-code" })],
    ["otra base", () => provider({ ...good, base_code: "USD" })],
    ["una tasa que falta", () => provider({ ...good, rates: { ...good.rates, CLP: undefined } })],
    ["una tasa absurda", () => provider({ ...good, rates: { ...good.rates, USD: 0 } })],
    ["sin respuesta (timeout o red)", () => vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"))],
  ])("%s → tasas fijas", async (_, setup) => {
    setup()
    const body = await fetchRates()
    expect(body.source).toBe("fixed")
    expect(body.rates.USD).toBe(CURRENCIES.USD.rate)
    expect(Object.keys(body.rates)).toEqual(Object.keys(CURRENCIES))
  })
})
