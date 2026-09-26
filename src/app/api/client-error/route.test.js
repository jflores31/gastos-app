import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route.ts"

const post = (body) =>
  POST(new NextRequest("http://localhost/api/client-error", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", "user-agent": "vitest" },
  }))

describe("POST /api/client-error", () => {
  let logSpy

  beforeEach(() => { logSpy = vi.spyOn(console, "error").mockImplementation(() => {}) })
  afterEach(() => logSpy.mockRestore())

  it("escribe un reporte válido en el log como una sola línea JSON y responde 204", async () => {
    const res = await post({ message: "boom\nfalso log", path: "/", context: { where: "test" }, stack: "at x" })
    expect(res.status).toBe(204)
    expect(logSpy).toHaveBeenCalledTimes(1)
    const [tag, line] = logSpy.mock.calls[0]
    expect(tag).toBe("[client-error]")
    expect(line).not.toContain("\n") // el salto de línea del mensaje queda escapado
    expect(JSON.parse(line)).toMatchObject({ message: "boom\nfalso log", path: "/", context: { where: "test" }, userAgent: "vitest" })
  })

  it("descarta campos desconocidos y valores no string", async () => {
    await post({ message: "x", extra: "no", context: { ok: "sí", n: 5, obj: {} } })
    const logged = JSON.parse(logSpy.mock.calls[0][1])
    expect(logged).not.toHaveProperty("extra")
    expect(logged.context).toEqual({ ok: "sí" })
  })

  it("rechaza JSON inválido o sin mensaje con 400 y no escribe nada", async () => {
    expect((await post("no es json")).status).toBe(400)
    expect((await post({ path: "/" })).status).toBe(400)
    expect(logSpy).not.toHaveBeenCalled()
  })

  it("rechaza cuerpos de más de 8 KB con 413", async () => {
    const res = await post({ message: "x".repeat(9000) })
    expect(res.status).toBe(413)
    expect(logSpy).not.toHaveBeenCalled()
  })
})
