import { Box, Chip, Divider, FormControl, InputLabel, List, ListItem, ListItemText, MenuItem, Select } from "@mui/material";
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "../../theme/icons";
import { useSettings, PALETTES as PALETTES_MAP, IDLE_OPTIONS } from "../../context/SettingsContext";
import { CURRENCIES } from "../../data/index";

const PALETTES = Object.entries(PALETTES_MAP).map(([key, val]) => ({ key, ...val }));

// "Ajustes" tab of the settings panel: theme, density, accent colour, language, currency,
// inactivity timeout.
export function PreferencesTab() {
  const { t, theme, setTheme, density, setDensity, palette, setPalette, lang, setLang, currency, setCurrency, idleMinutes, setIdleMinutes } = useSettings();
  const sectionLabel = (text) => (
    <ListItemText primary={text} primaryTypographyProps={{ variant: "overline" }} />
  );

  return (
    <List disablePadding>
      <ListItem sx={{ pt: 2 }}>{sectionLabel(t.settingsPanel.theme)}</ListItem>
      <ListItem sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
          <Chip icon={<LightModeIcon />} label={t.settingsPanel.light} variant={theme === "light" ? "filled" : "outlined"} color={theme === "light" ? "primary" : "default"} onClick={() => setTheme("light")} sx={{ flex: 1 }} />
          <Chip icon={<DarkModeIcon />} label={t.settingsPanel.dark} variant={theme === "dark" ? "filled" : "outlined"} color={theme === "dark" ? "primary" : "default"} onClick={() => setTheme("dark")} sx={{ flex: 1 }} />
        </Box>
      </ListItem>

      <Divider variant="middle" />

      <ListItem>{sectionLabel(t.settingsPanel.density)}</ListItem>
      <ListItem sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
          <Chip label={t.settingsPanel.comfy} variant={density === "comfy" ? "filled" : "outlined"} color={density === "comfy" ? "primary" : "default"} onClick={() => setDensity("comfy")} sx={{ flex: 1 }} />
          <Chip label={t.settingsPanel.compact} variant={density === "compact" ? "filled" : "outlined"} color={density === "compact" ? "primary" : "default"} onClick={() => setDensity("compact")} sx={{ flex: 1 }} />
        </Box>
      </ListItem>

      <Divider variant="middle" />

      <ListItem>{sectionLabel(t.settingsPanel.accentColor)}</ListItem>
      <ListItem sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {PALETTES.map((p) => (
            <Box key={p.key} onClick={() => setPalette(p.key)} role="radio" aria-checked={palette === p.key} aria-label={t.palettes[p.key]} tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setPalette(p.key)}
              sx={{
                width: 40, height: 40, borderRadius: "50%", cursor: "pointer",
                background: `linear-gradient(135deg, ${p.grad[0]} 0%, ${p.grad[1]} 100%)`,
                boxShadow: palette === p.key ? "0 2px 8px rgba(0,0,0,0.25)" : "none",
                border: palette === p.key ? "3px solid" : "2px solid transparent",
                borderColor: palette === p.key ? "text.primary" : "transparent",
                transition: "transform 0.15s, border-color 0.15s",
                "&:hover": { transform: "scale(1.15)" },
              }} title={t.palettes[p.key]} />
          ))}
        </Box>
      </ListItem>

      <Divider variant="middle" />

      <ListItem>{sectionLabel(t.settingsPanel.language)}</ListItem>
      <ListItem sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
          {[["es", "🇵🇪 Español"], ["en", "🇺🇸 English"]].map(([code, label]) => (
            <Chip key={code} label={label} variant={lang === code ? "filled" : "outlined"} color={lang === code ? "primary" : "default"} onClick={() => setLang(code)} sx={{ flex: 1 }} />
          ))}
        </Box>
      </ListItem>

      <Divider variant="middle" />

      <ListItem>{sectionLabel(t.settingsPanel.currency)}</ListItem>
      <ListItem sx={{ pt: 0 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="currency-label">{t.settingsPanel.currency}</InputLabel>
          <Select labelId="currency-label" value={currency} label={t.settingsPanel.currency} onChange={(e) => setCurrency(e.target.value)}>
            {Object.entries(CURRENCIES).map(([k, c]) => (
              <MenuItem key={k} value={k}>{c.symbol} {k} · {c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </ListItem>

      <Divider variant="middle" />

      <ListItem>{sectionLabel(t.settingsPanel.autoLock)}</ListItem>
      <ListItem sx={{ pt: 0, pb: 3 }}>
        <Box role="radiogroup" aria-label={t.settingsPanel.autoLock} sx={{ display: "flex", gap: 1, width: "100%" }}>
          {IDLE_OPTIONS.map((m) => (
            <Chip key={m} role="radio" aria-checked={idleMinutes === m} label={t.settingsPanel.minutes(m)} variant={idleMinutes === m ? "filled" : "outlined"} color={idleMinutes === m ? "primary" : "default"} onClick={() => setIdleMinutes(m)} sx={{ flex: 1 }} />
          ))}
        </Box>
      </ListItem>
    </List>
  );
}
