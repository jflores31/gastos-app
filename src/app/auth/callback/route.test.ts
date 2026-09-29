import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const exchange = vi.fn()
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ auth: { exchangeCodeForSession: exchange } }),
}))
const { GET } = await import("./route")

const get = (query: string, headers: Record<string, string> = {}) =>
  GET(new NextRequest(`https://jeshu.cfd/auth/callback${query}`, { headers }))

describe("GET /auth/callback", () => {
  beforeEach(() => exchange.mockReset().mockResolvedValue({ error: null }))

  it("canjea el código y vuelve a la ruta interna pedida, en el host del proxy", async () => {
    const res = await get("?code=abc&next=/ajustes", { "x-forwarded-host": "www.jeshu.cfd" })
    expect(exchange).toHaveBeenCalledWith("abc")
    expect(res.headers.get("location")).toBe("https://www.jeshu.cfd/ajustes")
  })

  it("nunca redirige fuera del sitio: next absoluto o protocol-relative vuelve a /", async () => {
    for (const next of ["https://evil.test", "//evil.test"]) {
      const res = await get(`?code=abc&next=${encodeURIComponent(next)}`, { "x-forwarded-host": "www.jeshu.cfd" })
      expect(res.headers.get("location")).toBe("https://www.jeshu.cfd/")
    }
  })

  it("sin código, o si el canje falla, vuelve al login con el error", async () => {
    expect((await get("")).headers.get("location")).toBe("https://jeshu.cfd/login?error=oauth")
    exchange.mockResolvedValue({ error: new Error("bad code") })
    expect((await get("?code=abc")).headers.get("location")).toBe("https://jeshu.cfd/login?error=oauth")
  })
})
