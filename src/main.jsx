/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { SettingsProvider, useSettings } from "./context/SettingsContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import { getTheme } from "./theme/materialTheme.js";

function ThemedApp() {
  const { theme, palette } = useSettings();
  const muiTheme = getTheme(theme, palette);
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <App />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <DataProvider>
          <ThemedApp />
        </DataProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>
);