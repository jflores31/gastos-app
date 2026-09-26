import { Box, Chip, Divider, FormControl, InputLabel, List, ListItem, ListItemText, MenuItem, Select } from "@mui/material";
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "../../theme/icons";
import { useSettings, PALETTES as PALETTES_MAP } from "../../context/SettingsContext.jsx";
import { CURRENCIES } from "../../data/index.js";

const PALETTES = Object.entries(PALETTES_MAP).map(([key, val]) => ({ key, ...val }));

// "Ajustes" tab of the settings panel: theme, density, accent colour, language, currency.
export function PreferencesTab() {
  const { theme, setTheme, density, setDensity, palette, setPalette, lang, setLang, currency, setCurrency } = useSettings();
  const sectionLabel = (es, en) => (
    <ListItemText primary={lang === "es" ? es : en} primaryTypographyProps={{ variant: "overline" }} />
  );

  return (
    <List disablePadding>
      <ListItem sx={{ pt: 2 }}>{sectionLabel("Tema", "Theme")}</ListItem>
      <ListItem sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
          <Chip icon={<LightModeIcon />} label={lang === "es" ? "Claro" : "Light"} variant={theme === "light" ? "filled" : "outlined"} color={theme === "light" ? "primary" : "default"} onClick={() => setTheme("light")} sx={{ flex: 1 }} />
          <Chip icon={<DarkModeIcon />} label={lang === "es" ? "Oscuro" : "Dark"} variant={theme === "dark" ? "filled" : "outlined"} color={theme === "dark" ? "primary" : "default"} onClick={() => setTheme("dark")} sx={{ flex: 1 }} />
        </Box>
      </ListItem>

      <Divider variant="middle" />

      <ListItem>{sectionLabel("Densidad", "Density")}</ListItem>
      <ListItem sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
          <Chip label={lang === "es" ? "Cómoda" : "Comfy"} variant={density === "comfy" ? "filled" : "outlined"} color={density === "comfy" ? "primary" : "default"} onClick={() => setDensity("comfy")} sx={{ flex: 1 }} />
          <Chip label={lang === "es" ? "Compacta" : "Compact"} variant={density === "compact" ? "filled" : "outlined"} color={density === "compact" ? "primary" : "default"} onClick={() => setDensity("compact")} sx={{ flex: 1 }} />
        </Box>
      </ListItem>

      <Divider variant="middle" />

      <ListItem>{sectionLabel("Color de acento", "Accent color")}</ListItem>
      <ListItem sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {PALETTES.map((p) => (
            <Box key={p.key} onClick={() => setPalette(p.key)} role="radio" aria-checked={palette === p.key} aria-label={p.label} tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setPalette(p.key)}
              sx={{
                width: 40, height: 40, borderRadius: "50%", cursor: "pointer",
                background: `linear-gradient(135deg, ${p.grad[0]} 0%, ${p.grad[1]} 100%)`,
                boxShadow: palette === p.key ? "0 2px 8px rgba(0,0,0,0.25)" : "none",
                border: palette === p.key ? "3px solid" : "2px solid transparent",
                borderColor: palette === p.key ? "text.primary" : "transparent",
                transition: "transform 0.15s, border-color 0.15s",
                "&:hover": { transform: "scale(1.15)" },
              }} title={p.label} />
          ))}
        </Box>
      </ListItem>

      <Divider variant="middle" />

      <ListItem>{sectionLabel("Idioma", "Language")}</ListItem>
      <ListItem sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
          <Chip label="🇵🇪 Español" variant={lang === "es" ? "filled" : "outlined"} color={lang === "es" ? "primary" : "default"} onClick={() => setLang("es")} sx={{ flex: 1 }} />
          <Chip label="🇺🇸 English" variant={lang === "en" ? "filled" : "outlined"} color={lang === "en" ? "primary" : "default"} onClick={() => setLang("en")} sx={{ flex: 1 }} />
        </Box>
      </ListItem>

      <Divider variant="middle" />

      <ListItem>{sectionLabel("Moneda", "Currency")}</ListItem>
      <ListItem sx={{ pt: 0, pb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="currency-label">{lang === "es" ? "Moneda" : "Currency"}</InputLabel>
          <Select labelId="currency-label" value={currency} label={lang === "es" ? "Moneda" : "Currency"} onChange={(e) => setCurrency(e.target.value)}>
            {Object.entries(CURRENCIES).map(([k, c]) => (
              <MenuItem key={k} value={k}>{c.symbol} {k} · {c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </ListItem>
    </List>
  );
}
