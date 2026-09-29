import { CURRENCIES, type CurrencyCode } from "@/domain/money"

// Today's exchange rates for the app's currencies, as units of each currency per 1 PEN
// (the base the amounts are stored in). Fetched server-side from open.er-api.com (free,
// no key, updated daily) and cached for 12 h; the browser only talks to this route, so
// the CSP stays 'self' and the provider never sees who is asking. If the provider fails
// or answers something unexpected, the fixed rates in CURRENCIES are returned instead
// (source: "fixed"). RATES_API_URL points it elsewhere (the e2e tests use the mock).

const DEFAULT_URL = "https://open.er-api.com/v6/latest/PEN"
const TIMEOUT_MS = 4000
const CODES = Object.keys(CURRENCIES) as CurrencyCode[]

export type RatesBody = { base: "PEN"; date: string; source: "live" | "fixed"; rates: Record<CurrencyCode, number> }

const fixed = (): RatesBody => ({
  base: "PEN",
  date: new Date().toISOString().slice(0, 10),
  source: "fixed",
  rates: Object.fromEntries(CODES.map((c) => [c, CURRENCIES[c].rate])) as Record<CurrencyCode, number>,
})

export async function fetchRates(url = process.env.RATES_API_URL ?? DEFAULT_URL): Promise<RatesBody> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 43200 } })
    if (!res.ok) return fixed()
    const data = await res.json()
    if (data?.result !== "success" || data?.base_code !== "PEN" || typeof data?.rates !== "object") return fixed()
    const rates = {} as Record<CurrencyCode, number>
    for (const code of CODES) {
      const r = Number(data.rates[code])
      // A missing or absurd rate (0, negative, NaN) makes the whole answer suspect.
      if (!Number.isFinite(r) || r <= 0) return fixed()
      rates[code] = r
    }
    const updated = new Date(Number(data.time_last_update_unix) * 1000)
    const date = Number.isNaN(updated.getTime()) ? fixed().date : updated.toISOString().slice(0, 10)
    return { base: "PEN", date, source: "live", rates }
  } catch {
    return fixed()
  }
}
