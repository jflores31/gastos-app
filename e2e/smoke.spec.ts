import { test, expect, type Page } from "@playwright/test"
import { watchConsole } from "./helpers"

const setTheme = (page: Page, theme: "light" | "dark") =>
  page.addInitScript((t) => localStorage.setItem("gastos-theme", JSON.stringify(t)), theme)

test("sin sesión, el dashboard redirige a /login", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/login$/)
})

for (const theme of ["light", "dark"] as const) {
  test(`login en tema ${theme}: CSP con nonce, interactivo, sin errores de consola`, async ({ page }) => {
    await setTheme(page, theme)
    const problems = watchConsole(page)
    const res = await page.goto("/login", { waitUntil: "networkidle" })

    const csp = res!.headers()["content-security-policy"]
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/)
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)

    // Every <script> carries the per-request nonce; strict-dynamic would block any that doesn't.
    const withoutNonce = await page.$$eval("script", (els) => els.filter((s) => !(s as HTMLScriptElement).nonce).length)
    expect(withoutNonce).toBe(0)

    // Styles: <style> elements need the same nonce (emotion gets it from the layout);
    // only style="" attributes stay inline. 'unsafe-inline' in style-src is the fallback
    // for browsers without style-src-elem, which ignore the two directives below.
    const nonce = csp.match(/script-src 'self' 'nonce-([^']+)'/)![1]
    expect(csp).toContain(`style-src-elem 'self' 'nonce-${nonce}'`)
    expect(csp).toContain("style-src-attr 'unsafe-inline'")
    expect(csp).toMatch(/report-uri \/api\/csp-report/)
    expect(csp).not.toContain("report-to")
    const styles = await page.$$eval("style", (els) => els.map((s) => (s as HTMLStyleElement).nonce))
    expect(styles.length).toBeGreaterThan(0)
    expect(styles.every((n) => n === nonce)).toBe(true)

    // Hydrated: the form is interactive.
    const email = page.getByLabel(/correo|email/i).first()
    await email.fill("alguien@example.com")
    await expect(email).toHaveValue("alguien@example.com")

    // The stored theme is applied. (Production React doesn't log attribute hydration
    // mismatches; that regression is covered by src/hooks/useLocalStorage.test.jsx.)
    const [r, g, b] = (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).match(/\d+/g)!.map(Number)
    if (theme === "dark") expect(r + g + b).toBeLessThan(200)
    else expect(r + g + b).toBeGreaterThan(600)
    expect(problems).toEqual([])
  })
}

test("CSP: un <style> inyectado sin nonce se bloquea y el reporte llega a /api/csp-report", async ({ page, request }) => {
  await page.goto("/login", { waitUntil: "networkidle" })
  const report = page.waitForResponse((r) => r.url().endsWith("/api/csp-report"))
  const result = await page.evaluate(() => new Promise<{ directive: string; applied: string }>((resolve) => {
    document.addEventListener("securitypolicyviolation", (e) => {
      resolve({ directive: e.effectiveDirective, applied: getComputedStyle(document.body).outlineStyle })
    }, { once: true })
    setTimeout(() => resolve({ directive: "none", applied: getComputedStyle(document.body).outlineStyle }), 2000)
    const s = document.createElement("style")
    s.textContent = "body { outline: 9px dotted red }"
    document.head.appendChild(s)
  }))
  expect(result).toEqual({ directive: "style-src-elem", applied: "none" })
  // The browser sends the report on its own (report-uri) and the route accepts it.
  const sent = await report
  expect(sent.status()).toBe(204)
  expect(sent.request().headers()["content-type"]).toBe("application/csp-report")
  expect(JSON.parse(sent.request().postData()!)["csp-report"]).toMatchObject({ "effective-directive": "style-src-elem", "blocked-uri": "inline" })

  // Also the Reporting API format (report-to), in case the CSP adds it later; no session needed.
  const modern = await request.post("/api/csp-report", {
    headers: { "content-type": "application/reports+json" },
    data: JSON.stringify([{ type: "csp-violation", body: { documentURL: "http://x/", effectiveDirective: "style-src-elem", blockedURL: "inline" } }]),
    maxRedirects: 0,
  })
  expect(modern.status()).toBe(204)
})

for (const path of ["/register", "/forgot-password", "/reset-password"]) {
  test(`${path} carga sin errores de consola`, async ({ page }) => {
    const problems = watchConsole(page)
    const res = await page.goto(path, { waitUntil: "networkidle" })
    expect(res!.status()).toBe(200)
    expect(problems).toEqual([])
  })
}

test("fuentes servidas desde la app, sin peticiones a otros dominios", async ({ page, baseURL }) => {
  const external: string[] = []
  page.on("request", (req) => { if (!req.url().startsWith(baseURL!) && !req.url().startsWith("data:")) external.push(req.url()) })
  await page.goto("/login", { waitUntil: "networkidle" })
  const loadedFonts = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].filter((f) => f.status === "loaded").length
  })
  expect(loadedFonts).toBeGreaterThan(0)
  expect(external).toEqual([])
})

test("el favicon de la app existe y está enlazado", async ({ page, request }) => {
  await page.goto("/login")
  await expect(page.locator('link[rel="icon"][href*="favicon.svg"]')).toHaveCount(1)
  const res = await request.get("/favicon.svg")
  expect(res.status()).toBe(200)
  expect(await res.text()).toContain("<svg")
})

test("la app es instalable: manifest público, iconos y sin errores de instalabilidad", async ({ page, request }) => {
  const res = await request.get("/manifest.webmanifest", { maxRedirects: 0 })
  expect(res.status()).toBe(200)
  const manifest = await res.json()
  expect(manifest).toMatchObject({ short_name: "Finanzas", start_url: "/", display: "standalone" })
  for (const icon of manifest.icons) {
    const img = await request.get(icon.src)
    expect(img.status(), icon.src).toBe(200)
    expect(img.headers()["content-type"], icon.src).toContain(icon.type)
  }
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true)

  await page.goto("/login", { waitUntil: "networkidle" })
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1)
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1)
  // Chromium's own verdict (what decides whether "Install app" is offered).
  const cdp = await page.context().newCDPSession(page)
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors")
  expect(installabilityErrors).toEqual([])
})

test("un error no capturado en el navegador llega a /api/client-error (sin la query)", async ({ page }) => {
  // Playwright doesn't expose sendBeacon bodies: wrap it to record the payload, then let the
  // real beacon go out so the route's response is checked too.
  await page.addInitScript(() => {
    const original = navigator.sendBeacon.bind(navigator)
    const w = window as unknown as { __beacons: Promise<string>[] }
    w.__beacons = []
    navigator.sendBeacon = (url, data) => {
      if (String(url).endsWith("/api/client-error") && data instanceof Blob) w.__beacons.push(data.text())
      return original(url, data)
    }
  })
  await page.goto("/login?code=secreto", { waitUntil: "networkidle" })
  const response = page.waitForResponse((res) => res.url().endsWith("/api/client-error"))
  await page.evaluate(() => { setTimeout(() => { throw new Error("e2e: error de prueba") }, 0) })
  expect((await response).status()).toBe(204)

  const sent = await page.evaluate(() => Promise.all((window as unknown as { __beacons: Promise<string>[] }).__beacons))
  expect(sent).toHaveLength(1)
  expect(JSON.parse(sent[0])).toMatchObject({ message: "e2e: error de prueba", path: "/login", context: { where: "window.onerror" } })
  expect(sent[0]).not.toContain("secreto")
})

test("/api/client-error rechaza cuerpos inválidos y otras rutas /api siguen protegidas", async ({ request }) => {
  expect((await request.post("/api/client-error", { data: "no es json", headers: { "content-type": "application/json" } })).status()).toBe(400)
  expect((await request.post("/api/client-error", { data: { message: "x".repeat(9000) } })).status()).toBe(413)
  const other = await request.post("/api/otra-cosa", { maxRedirects: 0 })
  expect(other.status()).toBe(307)
  expect(other.headers()["location"]).toMatch(/\/login$/)
  // Today's exchange rates too: only signed-in users ask for them.
  const rates = await request.get("/api/rates", { maxRedirects: 0 })
  expect(rates.status()).toBe(307)
  expect(rates.headers()["location"]).toMatch(/\/login$/)
})
