/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { I18N } from "../data/index.js";

const SettingsContext = createContext(null);

const PALETTES = {
  amber:  { label: "Amber",  color: "#c9874a" },
  indigo: { label: "Indigo", color: "#5e6ad2" },
  green:  { label: "Green",  color: "#3a8f5a" },
  mono:   { label: "Mono",   color: "#222" },
};

export { PALETTES };

export function SettingsProvider({ children }) {
  const [theme,    setTheme]    = useLocalStorage("gastos-theme", "light");
  const [density,  setDensity]  = useLocalStorage("gastos-density", "comfy");
  const [currency, setCurrency] = useLocalStorage("gastos-currency", "PEN");
  const [lang,     setLang]     = useLocalStorage("gastos-lang", "es");
  const [palette,  setPalette]  = useLocalStorage("gastos-palette", "amber");

  const value = useMemo(() => ({
    theme, setTheme,
    density, setDensity,
    currency, setCurrency,
    lang, setLang,
    palette, setPalette,
    t: I18N[lang],
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