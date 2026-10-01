export type CurrencyCode = "PEN" | "USD" | "EUR" | "MXN" | "COP" | "ARS" | "CLP" | "BRL";
export type Currency = { symbol: string; code: CurrencyCode; name: string; rate: number };

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  PEN: { symbol: "S/", code: "PEN", name: "Sol Peruano", rate: 1 },
  USD: { symbol: "$",  code: "USD", name: "US Dollar",   rate: 0.27 },
  EUR: { symbol: "€",  code: "EUR", name: "Euro",        rate: 0.25 },
  MXN: { symbol: "$",  code: "MXN", name: "Peso MXN",   rate: 5.0 },
  COP: { symbol: "$",  code: "COP", name: "Peso COP",   rate: 1100 },
  ARS: { symbol: "$",  code: "ARS", name: "Peso ARS",   rate: 320 },
  CLP: { symbol: "$",  code: "CLP", name: "Peso CLP",   rate: 250 },
  BRL: { symbol: "R$", code: "BRL", name: "Real BRL",   rate: 1.5 },
};

// Los montos se guardan siempre en la moneda base (PEN, rate 1); `fmtMoney` los
// multiplica por `rate` al mostrar. Los formularios trabajan en la moneda elegida,
// así que convierten con toBase() al guardar y con fromBase() al precargar una edición.
const round2 = (n: number) => Math.round(n * 100) / 100;

// Today's rates (units of each currency per 1 PEN), loaded from /api/rates after sign-in
// by SettingsContext. Until then, and for any code they lack, the fixed `rate` above
// is used; server rendering always uses the fixed ones, so hydration matches.
let liveRates: Partial<Record<CurrencyCode, number>> = {};
export function setLiveRates(rates: Partial<Record<string, number>>) {
  liveRates = {};
  for (const code of Object.keys(CURRENCIES) as CurrencyCode[]) {
    const r = rates[code];
    if (typeof r === "number" && Number.isFinite(r) && r > 0) liveRates[code] = r;
  }
}

// Unknown codes (e.g. an old value in localStorage) fall back to PEN.
export const currencyOf = (code: string): Currency => {
  const c = CURRENCIES[code as CurrencyCode] || CURRENCIES.PEN;
  return { ...c, rate: liveRates[c.code] ?? c.rate };
};

// `rate` defaults to today's; editing a transaction passes the one it was saved with.
export function toBase(v: number | string, curr = "PEN", rate = currencyOf(curr).rate) {
  return round2(Number(v) / rate);
}

export function fromBase(v: number | string, curr = "PEN") {
  return round2(Number(v) * currencyOf(curr).rate);
}

// `locale` fixes the digit grouping (t.common.locale). Without it, toLocaleString used
// the browser's locale: a German browser showed "S/3.500" in an app set to Spanish,
// and the server (Node's default locale) could render different text than the client.
export function fmtMoney(v: number, curr = "PEN", compact = false, locale = "es-PE") {
  return fmtAmount(v * currencyOf(curr).rate, curr, compact, locale);
}

// An amount already in `curr` (e.g. what was typed for a transaction in that currency).
export function fmtAmount(n: number, curr = "PEN", compact = false, locale = "es-PE") {
  const c = currencyOf(curr);
  if (compact) {
    const short = (x: number) => x.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (Math.abs(n) >= 1e6) return c.symbol + short(n / 1e6) + "M";
    if (Math.abs(n) >= 1e3) return c.symbol + short(n / 1e3) + "k";
  }
  return c.symbol + n.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 2 });
}

// Today's rate as it is usually quoted, with the stronger currency as the unit:
// "1 USD = S/3.85", "S/1 = 1,100 COP". Empty for PEN.
export function rateLabel(curr: string, locale = "es-PE") {
  const c = currencyOf(curr);
  if (c.code === "PEN") return "";
  const num = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: n >= 100 ? 0 : n >= 1 ? 2 : 4 });
  return c.rate < 1 ? `1 ${c.code} = S/${num(1 / c.rate)}` : `S/1 = ${num(c.rate)} ${c.code}`;
}
