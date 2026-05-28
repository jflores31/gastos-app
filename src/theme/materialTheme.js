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
        root: { borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" },
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
    MuiFab: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500, fontSize: "0.875rem", minHeight: 40 },
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

export const paletteMap = {
  amber:   { light: { primary: "#c9874a" }, dark: { primary: "#e5a86b" } },
  indigo:  { light: { primary: "#5e6ad2" }, dark: { primary: "#8b93e0" } },
  green:   { light: { primary: "#3a8f5a" }, dark: { primary: "#5cb87a" } },
  mono:    { light: { primary: "#333" },    dark: { primary: "#e0e0e0" } },
};

export function getTheme(themeMode, palette) {
  const base = themeMode === "dark" ? darkTheme : lightTheme;
  const accent = paletteMap[palette]?.[themeMode]?.primary;
  if (!accent) return base;
  return createTheme({
    ...base,
    palette: {
      ...base.palette,
      primary: { ...base.palette.primary, main: accent },
    },
  });
}