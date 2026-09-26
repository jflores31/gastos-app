import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route.ts"

const post = (body, type = "application/csp-report") =>
  POST(new NextRequest("http://localhost/api/csp-report", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": type, "user-agent": "vitest" },
  }))

const logged = (spy) => spy.mock.calls.map(([tag, line]) => {
  expect(tag).toBe("[csp-report]")
  return JSON.parse(line)
})

describe("POST /api/csp-report", () => {
  let logSpy

  beforeEach(() => { logSpy = vi.spyOn(console, "error").mockImplementation(() => {}) })
  afterEach(() => logSpy.mockRestore())

  it("formato report-uri: escribe una línea JSON sin la query ni el hash de las URLs", async () => {
    const res = await post({ "csp-report": {
      "document-uri": "https://app.example/reset-password?code=secreto#x",
      "blocked-uri": "inline",
      "effective-directive": "style-src-elem",
      "source-file": "https://app.example/_next/static/chunks/a.js?v=1",
      "line-number": 12,
      "script-sample": "body { color: red }",
      "otro": "se descarta",
    } })
    expect(res.status).toBe(204)
    expect(logged(logSpy)).toEqual([expect.objectContaining({
      documentURL: "https://app.example/reset-password",
      blockedURL: "inline",
      directive: "style-src-elem",
      sourceFile: "https://app.example/_next/static/chunks/a.js",
      line: 12,
      sample: "body { color: red }",
      userAgent: "vitest",
    })])
    expect(logSpy.mock.calls[0][1]).not.toContain("secreto")
    expect(logSpy.mock.calls[0][1]).not.toContain("otro")
  })

  it("usa violated-directive si falta effective-directive (navegadores viejos)", async () => {
    await post({ "csp-report": { "document-uri": "https://app.example/", "violated-directive": "style-src" } })
    expect(logged(logSpy)[0].directive).toBe("style-src")
  })

  it("formato Reporting API: una línea por violación, ignora otros tipos, máximo 10", async () => {
    const item = (i) => ({ type: "csp-violation", body: { documentURL: `https://app.example/p${i}?t=1`, blockedURL: "https://evil.example/x.css?a", effectiveDirective: "style-src-elem", lineNumber: i } })
    const res = await post([{ type: "deprecation", body: {} }, ...Array.from({ length: 12 }, (_, i) => item(i))], "application/reports+json")
    expect(res.status).toBe(204)
    const lines = logged(logSpy)
    expect(lines).toHaveLength(10)
    expect(lines[0]).toMatchObject({ documentURL: "https://app.example/p0", blockedURL: "https://evil.example/x.css", directive: "style-src-elem", line: 0 })
  })

  it("rechaza JSON inválido o sin reporte con 400, y cuerpos de más de 8 KB con 413", async () => {
    expect((await post("no es json")).status).toBe(400)
    expect((await post({ message: "otra cosa" })).status).toBe(400)
    expect((await post({ "csp-report": { "script-sample": "x".repeat(9000) } })).status).toBe(413)
    expect(logSpy).not.toHaveBeenCalled()
  })
})
