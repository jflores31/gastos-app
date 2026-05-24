"use client"

import {
  Drawer, Box, Typography, Divider, Avatar,
  Chip, Select, MenuItem, FormControl, InputLabel, IconButton, List, ListItem, ListItemText,
} from "@mui/material";
import { Close as CloseIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, Person as PersonIcon } from "@mui/icons-material";
import { useSettings } from "../context/SettingsContext.jsx";
import { useSupabaseUser } from "../context/UserContext";
import { CURRENCIES } from "../data/index.js";

const PALETTES = [
  { key: "amber", label: "Amber", color: "#c9874a" },
  { key: "indigo", label: "Indigo", color: "#5e6ad2" },
  { key: "green", label: "Green", color: "#3a8f5a" },
  { key: "mono", label: "Mono", color: "#9e9e9e" },
];

export default function SettingsPanel({ open, onClose }) {
  const { theme, setTheme, density, setDensity, palette, setPalette, lang, setLang, currency, setCurrency } = useSettings();
  const user = useSupabaseUser();

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const email = user?.email || "";
  const avatarSrc = user?.user_metadata?.avatar_url || undefined;
  const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 360 }, p: 0 } }}>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={700}>{lang === "es" ? "Perfil y Ajustes" : "Profile & Settings"}</Typography>
        <IconButton onClick={onClose} aria-label="Close"><CloseIcon /></IconButton>
      </Box>
      <Divider />

      {user && (
        <>
          <Box sx={{ px: 3, py: 2.5, display: "flex", alignItems: "center", gap: 2, bgcolor: "primary.main", color: "primary.contrastText" }}>
            <Avatar
              src={avatarSrc}
              sx={{ width: 56, height: 56, bgcolor: "primary.light", color: "primary.dark", fontWeight: 700, fontSize: 20 }}
            >
              {initials || <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>{fullName}</Typography>
              <Typography variant="caption" noWrap sx={{ opacity: 0.85 }}>{email}</Typography>
            </Box>
          </Box>
          <Divider />
        </>
      )}


      <List disablePadding>
        <ListItem>
          <ListItemText primary={lang === "es" ? "Tema" : "Theme"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <Chip
              icon={<LightModeIcon />}
              label={lang === "es" ? "Claro" : "Light"}
              variant={theme === "light" ? "filled" : "outlined"}
              color={theme === "light" ? "primary" : "default"}
              onClick={() => setTheme("light")}
              sx={{ flex: 1 }}
            />
            <Chip
              icon={<DarkModeIcon />}
              label={lang === "es" ? "Oscuro" : "Dark"}
              variant={theme === "dark" ? "filled" : "outlined"}
              color={theme === "dark" ? "primary" : "default"}
              onClick={() => setTheme("dark")}
              sx={{ flex: 1 }}
            />
          </Box>
        </ListItem>

        <Divider variant="middle" />

        <ListItem>
          <ListItemText primary={lang === "es" ? "Densidad" : "Density"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <Chip label={lang === "es" ? "Cómoda" : "Comfy"} variant={density === "comfy" ? "filled" : "outlined"} color={density === "comfy" ? "primary" : "default"} onClick={() => setDensity("comfy")} sx={{ flex: 1 }} />
            <Chip label={lang === "es" ? "Compacta" : "Compact"} variant={density === "compact" ? "filled" : "outlined"} color={density === "compact" ? "primary" : "default"} onClick={() => setDensity("compact")} sx={{ flex: 1 }} />
          </Box>
        </ListItem>

        <Divider variant="middle" />

        <ListItem>
          <ListItemText primary={lang === "es" ? "Color de acento" : "Accent color"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {PALETTES.map((p) => (
              <Box key={p.key} onClick={() => setPalette(p.key)} sx={{
                width: 36, height: 36, borderRadius: "50%", bgcolor: p.color, cursor: "pointer",
                border: palette === p.key ? "3px solid" : "2px solid transparent",
                borderColor: palette === p.key ? "text.primary" : "transparent",
                transition: "transform 0.15s, border-color 0.15s",
                "&:hover": { transform: "scale(1.15)" },
              }} title={p.label} />
            ))}
          </Box>
        </ListItem>

        <Divider variant="middle" />

        <ListItem>
          <ListItemText primary={lang === "es" ? "Idioma" : "Language"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <Chip label="🇵🇪 Español" variant={lang === "es" ? "filled" : "outlined"} color={lang === "es" ? "primary" : "default"} onClick={() => setLang("es")} sx={{ flex: 1 }} />
            <Chip label="🇺🇸 English" variant={lang === "en" ? "filled" : "outlined"} color={lang === "en" ? "primary" : "default"} onClick={() => setLang("en")} sx={{ flex: 1 }} />
          </Box>
        </ListItem>

        <Divider variant="middle" />

        <ListItem>
          <ListItemText primary={lang === "es" ? "Moneda" : "Currency"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{lang === "es" ? "Moneda" : "Currency"}</InputLabel>
            <Select value={currency} label={lang === "es" ? "Moneda" : "Currency"} onChange={(e) => setCurrency(e.target.value)}>
              {Object.entries(CURRENCIES).map(([k, c]) => (
                <MenuItem key={k} value={k}>{c.symbol} {k} · {c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListItem>
      </List>
    </Drawer>
  );
}