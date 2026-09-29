"use client"

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useEffect, useState, type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { messagesFor, type Lang, type Messages } from "../i18n/index";
import { currencyOf, fmtAmount, fmtMoney, setLiveRates } from "@/domain/money";
import type { Transaction } from "@/types/domain";
import { useSupabaseUser } from "./UserContext";
import { ACCENT_ALIASES } from "../theme/materialTheme.js";

type Setter<T> = (value: T | ((prev: T) => T)) => void;
type TxMoney = Pick<Transaction, "valor" | "moneda" | "montoOriginal">;
export type { Lang };
export type ThemeMode = "light" | "dark";
export type Density = "comfy" | "compact";

export type Settings = {
  theme: ThemeMode; setTheme: Setter<ThemeMode>;
  density: Density; setDensity: Setter<Density>;
  currency: string; setCurrency: Setter<string>; // a CurrencyCode, or an unknown old value (→ PEN)
  lang: Lang; setLang: Setter<Lang>;
  palette: string; setPalette: Setter<string>;
  privacy: boolean; setPrivacy: Setter<boolean>;
  idleMinutes: number; setIdleMinutes: Setter<number>;
  t: Messages;
  fmt: (v: number, compact?: boolean) => string;
  // A transaction's amount in the display currency; one entered in that same currency
  // shows exactly what was typed (at its own rate, not today's).
  fmtTx: (tx: TxMoney, compact?: boolean) => string;
  // What was typed, in its own currency, when that isn't the display currency ("€25");
  // null for PEN transactions (their original is `valor`).
  txOriginal: (tx: TxMoney) => string | null;
  // Where the conversion rates come from: today's (from /api/rates) or the fixed ones.
  rates: { source: "live" | "fixed"; date: string | null };
  palettes: typeof PALETTES;
};

const SettingsContext = createContext<Settings | null>(null);

// Acentos alegres con gradiente (los swatches del selector usan `grad`). Nombres: t.palettes.
const PALETTES: Record<string, { color: string; grad: [string, string] }> = {
  coral: { color: "#FF4D8D", grad: ["#FF7A59", "#FF4D8D"] },
  mint:  { color: "#14B8A6", grad: ["#34D399", "#14B8A6"] },
  ocean: { color: "#6366F1", grad: ["#38BDF8", "#6366F1"] },
  grape: { color: "#7C3AED", grad: ["#A78BFA", "#7C3AED"] },
  mono:  { color: "#71717A", grad: ["#71717A", "#3F3F46"] },
};

export { PALETTES };

// Minutes of inactivity before DashboardStudio signs the user out (Ajustes).
export const IDLE_OPTIONS = [2, 5, 15, 30];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme,    setTheme]    = useLocalStorage<ThemeMode>("gastos-theme", "light");
  const [density,  setDensity]  = useLocalStorage<Density>("gastos-density", "comfy");
  const [currency, setCurrency] = useLocalStorage<string>("gastos-currency", "PEN");
  const [lang,     setLang]     = useLocalStorage<Lang>("gastos-lang", "es");
  const [palette,  setPalette]  = useLocalStorage<string>("gastos-palette", "ocean");
  const [privacy,  setPrivacy]  = useLocalStorage<boolean>("gastos-privacy", false);
  const [idleRaw,  setIdleMinutes] = useLocalStorage<number>("gastos-idle-minutes", IDLE_OPTIONS[0]);
  const idleMinutes = IDLE_OPTIONS.includes(idleRaw) ? idleRaw : IDLE_OPTIONS[0];

  // Today's exchange rates, once signed in (/api/rates is behind the login). Until they
  // arrive, and if the request fails, amounts use the fixed rates.
  const user = useSupabaseUser();
  const [rates, setRates] = useState<Settings["rates"]>({ source: "fixed", date: null });
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/rates")
      .then((res) => (res.ok && res.headers.get("content-type")?.includes("json") ? res.json() : null))
      .then((body) => {
        if (cancelled || !body?.rates) return;
        setLiveRates(body.rates);
        setRates({ source: body.source === "live" ? "live" : "fixed", date: body.date ?? null });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  // Migra acentos viejos (amber/indigo/green) al nuevo set una sola vez.
  useEffect(() => {
    const alias = (ACCENT_ALIASES as Record<string, string>)[palette];
    if (alias) setPalette(alias);
  }, [palette, setPalette]);

  const value = useMemo<Settings>(() => {
    const locale = messagesFor(lang).common.locale;
    const shown = currencyOf(currency).code;
    // Money in the chosen currency and the language's number format; in privacy
    // mode only the symbol is shown.
    const fmt = (v: number, compact = false) =>
      privacy ? `${currencyOf(currency).symbol}••••` : fmtMoney(v, currency, compact, locale);
    const fmtIn = (n: number, curr: string, compact = false) =>
      privacy ? `${currencyOf(curr).symbol}••••` : fmtAmount(n, curr, compact, locale);
    return {
      theme, setTheme,
      density, setDensity,
      currency, setCurrency,
      lang, setLang,
      palette, setPalette,
      privacy, setPrivacy,
      idleMinutes, setIdleMinutes,
      t: messagesFor(lang),
      fmt,
      fmtTx: (tx, compact = false) =>
        tx.moneda === shown && tx.montoOriginal != null ? fmtIn(tx.montoOriginal, shown, compact) : fmt(tx.valor, compact),
      txOriginal: (tx) =>
        tx.moneda && tx.moneda !== shown && tx.montoOriginal != null ? fmtIn(tx.montoOriginal, tx.moneda) : null,
      palettes: PALETTES,
      rates,
    };
  // `rates` changes when today's rates arrive: fmt must be rebuilt so amounts re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, density, currency, lang, palette, privacy, idleMinutes, rates]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}