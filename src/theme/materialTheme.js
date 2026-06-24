import { createTheme } from "@mui/material/styles";

const common = {
  typography: {
    fontFamily: '"IBM Plex Sans", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    body2: { fontSize: "0.8125rem" },
    caption: { fontSize: "0.75rem" },
    overline: { fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
          // Header icon avatars gently pop when their card is hovered.
          "& .MuiAvatar-root": { transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" },
          "&:hover .MuiAvatar-root": { transform: "scale(1.08)" },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    // Smooth transform/color changes on every icon (snaps instantly under
    // prefers-reduced-motion via the global guard in globals.css).
    MuiSvgIcon: {
      styleOverrides: {
        root: { transition: "transform 0.2s cubic-bezier(0.4,0,0.2,1), color 0.2s ease" },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background-color 0.2s ease",
          "&:hover": { transform: "scale(1.12)" },
          "&:active": { transform: "scale(0.92)" },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
          "&:hover": { transform: "translateY(-2px) scale(1.06)" },
          "&:active": { transform: "scale(0.94)" },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none", fontWeight: 500, fontSize: "0.875rem", minHeight: 40,
          "& .MuiSvgIcon-root": { transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)" },
          "&:hover .MuiSvgIcon-root": { transform: "scale(1.18)" },
          "&.Mui-selected .MuiSvgIcon-root": { animation: "iconPop 0.4s ease-out" },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          "& .MuiSvgIcon-root": { transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)" },
          "&.Mui-selected .MuiSvgIcon-root": { transform: "scale(1.18)", animation: "iconPop 0.4s ease-out" },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...common,
  palette: {
    mode: "light",
    primary: { main: "#6750A4", light: "#EADDFF", dark: "#381E72", contrastText: "#FFFFFF" },
    secondary: { main: "#625B71", light: "#E8DEF8", dark: "#332D41" },
    success: { main: "#4CAF50", light: "#C8E6C9", dark: "#2E7D32" },
    error: { main: "#B3261E", light: "#F9DEDC", dark: "#8C1D18" },
    warning: { main: "#F9A825", light: "#FFF9C4" },
    info: { main: "#2196F3", light: "#E3F2FD" },
    background: { default: "#FFFBFE", paper: "#FFFFFF" },
    text: { primary: "#1C1B1F", secondary: "#49454F" },
    divider: "#CAC4D0",
    action: { hover: "rgba(103,80,164,0.08)", selected: "rgba(103,80,164,0.12)" },
  },
});

export const darkTheme = createTheme({
  ...common,
  palette: {
    mode: "dark",
    primary: { main: "#D0BCFF", light: "#4F378B", dark: "#EADDFF", contrastText: "#381E72" },
    secondary: { main: "#CCC2DC", light: "#4A4458", dark: "#E8DEF8" },
    success: { main: "#81C784", light: "#1B5E20", dark: "#A5D6A7" },
    error: { main: "#F2B8B5", light: "#601410", dark: "#F9DEDC" },
    warning: { main: "#FFD54F", light: "#F57F17" },
    info: { main: "#90CAF9", light: "#1565C0" },
    background: { default: "#1C1B1F", paper: "#2B2930" },
    text: { primary: "#E6E1E5", secondary: "#CAC4D0" },
    divider: "#49454F",
    action: { hover: "rgba(208,188,255,0.08)", selected: "rgba(208,188,255,0.12)" },
  },
});

// Set de acentos alegre. Cada uno con main/light/dark por modo + 2 stops de gradiente.
export const ACCENTS = {
  coral: {
    light: { main: "#E94668", light: "#FFD9E1", dark: "#B11E47" },
    dark:  { main: "#FF8FA8", light: "#5A1730", dark: "#FFC2D0" },
    grad:  ["#FF7A59", "#FF4D8D"],
  },
  mint: {
    light: { main: "#0E9E8C", light: "#C6F2EB", dark: "#0A6B60" },
    dark:  { main: "#56DAC6", light: "#0C524A", dark: "#9FEFE3" },
    grad:  ["#34D399", "#14B8A6"],
  },
  ocean: {
    light: { main: "#3E6FE0", light: "#D6E2FF", dark: "#1E47A8" },
    dark:  { main: "#86A8FF", light: "#172B66", dark: "#BCD0FF" },
    grad:  ["#38BDF8", "#6366F1"],
  },
  grape: {
    light: { main: "#7C3AED", light: "#E7DAFF", dark: "#5B21B6" },
    dark:  { main: "#B39BFB", light: "#3A1D74", dark: "#D2C2FF" },
    grad:  ["#A78BFA", "#7C3AED"],
  },
  mono: {
    light: { main: "#3F3F46", light: "#E4E4E7", dark: "#18181B" },
    dark:  { main: "#D4D4D8", light: "#3F3F46", dark: "#F4F4F5" },
    grad:  ["#71717A", "#3F3F46"],
  },
};

// Acentos viejos (v1.6.0 y antes) → nuevos, para no resetear `gastos-palette` guardado.
export const ACCENT_ALIASES = { amber: "coral", indigo: "ocean", green: "mint" };

export function getTheme(themeMode, palette) {
  const base = themeMode === "dark" ? darkTheme : lightTheme;
  const key = ACCENT_ALIASES[palette] || palette;
  const accent = ACCENTS[key]?.[themeMode];
  if (!accent) return base;
  const grad = ACCENTS[key].grad;
  return createTheme({
    ...base,
    palette: {
      ...base.palette,
      primary: {
        ...base.palette.primary,
        main: accent.main,
        light: accent.light,
        dark: accent.dark,
        gradient: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
        gradientStops: grad,
      },
    },
  });
}

// Gradiente del acento activo (cae a main→dark si no hay stops guardados).
export function accentGradient(theme, angle = 135) {
  const p = theme.palette.primary;
  const [from, to] = p.gradientStops || [p.main, p.dark];
  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
}