"use client"

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useEffect, type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { messagesFor, type Lang, type Messages } from "../i18n/index";
import { currencyOf, fmtMoney } from "../data/index";
import { ACCENT_ALIASES } from "../theme/materialTheme.js";

type Setter<T> = (value: T | ((prev: T) => T)) => void;
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

  // Migra acentos viejos (amber/indigo/green) al nuevo set una sola vez.
  useEffect(() => {
    const alias = (ACCENT_ALIASES as Record<string, string>)[palette];
    if (alias) setPalette(alias);
  }, [palette, setPalette]);

  const value = useMemo<Settings>(() => ({
    theme, setTheme,
    density, setDensity,
    currency, setCurrency,
    lang, setLang,
    palette, setPalette,
    privacy, setPrivacy,
    idleMinutes, setIdleMinutes,
    t: messagesFor(lang),
    // Money in the chosen currency and the language's number format; in privacy
    // mode only the symbol is shown.
    fmt: privacy
      ? () => `${currencyOf(currency).symbol}••••`
      : (v: number, compact = false) => fmtMoney(v, currency, compact, messagesFor(lang).common.locale),
    palettes: PALETTES,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme, density, currency, lang, palette, privacy, idleMinutes]);

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