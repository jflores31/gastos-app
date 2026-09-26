import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { buildReport, reportError, _resetReportedErrors } from "./reportError.js"

describe("buildReport", () => {
  it("toma mensaje, nombre, stack y digest del error", () => {
    const err = Object.assign(new TypeError("boom"), { digest: "abc123" })
    const r = buildReport(err, { where: "test" })
    expect(r).toMatchObject({ message: "boom", name: "TypeError", digest: "abc123", context: { where: "test" } })
    expect(r.stack).toContain("boom")
  })

  it("acepta valores que no son Error", () => {
    expect(buildReport("texto").message).toBe("texto")
    expect(buildReport(undefined).message).toBe("Unknown error")
  })

  it("recorta campos largos y convierte el contexto a strings", () => {
    const r = buildReport(new Error("x".repeat(2000)), { n: 5, long: "y".repeat(500) })
    expect(r.message).toHaveLength(500)
    expect(r.context).toEqual({ n: "5", long: "y".repeat(200) })
  })
})

describe("reportError", () => {
  let sendBeacon

  beforeEach(() => {
    _resetReportedErrors()
    sendBeacon = vi.fn(() => true)
    vi.stubGlobal("navigator", { sendBeacon })
    vi.stubGlobal("location", { pathname: "/reset-password", search: "?code=secreto" })
  })
  afterEach(() => vi.unstubAllGlobals())

  const sentBody = async (call = 0) => JSON.parse(await sendBeacon.mock.calls[call][1].text())

  it("envía el reporte a /api/client-error solo con el pathname (sin query)", async () => {
    reportError(new Error("falló"), { where: "DataContext.load" })
    expect(sendBeacon).toHaveBeenCalledTimes(1)
    expect(sendBeacon.mock.calls[0][0]).toBe("/api/client-error")
    const body = await sentBody()
    expect(body).toMatchObject({ message: "falló", path: "/reset-password", context: { where: "DataContext.load" } })
    expect(JSON.stringify(body)).not.toContain("secreto")
  })

  it("no repite el mismo error en la misma página", () => {
    reportError(new Error("igual"), { where: "a" })
    reportError(new Error("igual"), { where: "a" })
    expect(sendBeacon).toHaveBeenCalledTimes(1)
  })

  it("corta en 10 reportes distintos por carga de página", () => {
    for (let i = 0; i < 25; i++) reportError(new Error(`e${i}`))
    expect(sendBeacon).toHaveBeenCalledTimes(10)
  })

  it("usa fetch con keepalive si no hay sendBeacon", () => {
    const fetchMock = vi.fn(() => Promise.resolve())
    vi.stubGlobal("navigator", {})
    vi.stubGlobal("fetch", fetchMock)
    reportError(new Error("sin beacon"))
    expect(fetchMock).toHaveBeenCalledWith("/api/client-error", expect.objectContaining({ method: "POST", keepalive: true }))
  })

  it("nunca lanza, aunque falle el envío", () => {
    sendBeacon.mockImplementation(() => { throw new Error("sin red") })
    expect(() => reportError(new Error("x"))).not.toThrow()
  })
})
