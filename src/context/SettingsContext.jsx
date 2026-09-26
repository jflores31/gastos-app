"use client"

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { messagesFor } from "../i18n/index.js";
import { ACCENT_ALIASES } from "../theme/materialTheme.js";

const SettingsContext = createContext(null);

// Acentos alegres con gradiente (los swatches del selector usan `grad`). Nombres: t.palettes.
const PALETTES = {
  coral: { color: "#FF4D8D", grad: ["#FF7A59", "#FF4D8D"] },
  mint:  { color: "#14B8A6", grad: ["#34D399", "#14B8A6"] },
  ocean: { color: "#6366F1", grad: ["#38BDF8", "#6366F1"] },
  grape: { color: "#7C3AED", grad: ["#A78BFA", "#7C3AED"] },
  mono:  { color: "#71717A", grad: ["#71717A", "#3F3F46"] },
};

export { PALETTES };

export function SettingsProvider({ children }) {
  const [theme,    setTheme]    = useLocalStorage("gastos-theme", "light");
  const [density,  setDensity]  = useLocalStorage("gastos-density", "comfy");
  const [currency, setCurrency] = useLocalStorage("gastos-currency", "PEN");
  const [lang,     setLang]     = useLocalStorage("gastos-lang", "es");
  const [palette,  setPalette]  = useLocalStorage("gastos-palette", "ocean");

  // Migra acentos viejos (amber/indigo/green) al nuevo set una sola vez.
  useEffect(() => {
    if (ACCENT_ALIASES[palette]) setPalette(ACCENT_ALIASES[palette]);
  }, [palette, setPalette]);

  const value = useMemo(() => ({
    theme, setTheme,
    density, setDensity,
    currency, setCurrency,
    lang, setLang,
    palette, setPalette,
    t: messagesFor(lang),
    palettes: PALETTES,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme, density, currency, lang, palette]);

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