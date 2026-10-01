"use client"

import { useState } from "react";
import { Alert, Box, Drawer, IconButton, Snackbar, Tab, Tabs, Typography } from "@mui/material";
import { Close as CloseIcon, Person as PersonIcon, Settings as SettingsIcon } from "@/theme/icons";
import { useSettings } from "@/contexts/SettingsContext";
import { useSupabaseUser } from "@/contexts/UserContext";
import { ProfileTab } from "./ProfileTab";
import { PreferencesTab } from "./PreferencesTab";
import { drawerSx, panelHeaderSx, panelTabsSx } from "./settings.styles";

// Side panel with two tabs: "Perfil" (name, favourite and custom categories) and
// "Ajustes" (theme, density, accent, language, currency): ProfileTab and PreferencesTab.
export default function SettingsPanel({ open, onClose, initialTab = "perfil" }) {
  const { t } = useSettings();
  const user = useSupabaseUser();

  // Canonical name from metadata. Fallback splits full_name for accounts created
  // before first_name/last_name were stored separately (register only wrote full_name).
  const metaFull = user?.user_metadata?.full_name || "";
  const metaFirst = user?.user_metadata?.first_name ?? (metaFull.split(" ")[0] || "");
  const metaLast = user?.user_metadata?.last_name ?? metaFull.split(" ").slice(1).join(" ");

  const [tab, setTab] = useState(initialTab);
  const [wasOpen, setWasOpen] = useState(open);
  const [firstName, setFirstName] = useState(metaFirst);
  const [lastName, setLastName] = useState(metaLast);
  const [snack, setSnack] = useState(null);
  // A new id per notification remounts the Snackbar, so each one gets its full 3 s even
  // when the previous one is still showing (MUI only restarts the timer on open).
  const notify = (msg, severity) => setSnack({ msg, severity, id: Date.now() });

  // Jump to the tab requested by whoever opened the panel (avatar → perfil, gear → ajustes).
  // Adjust during render on the closed→open transition — no effect needed.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTab(initialTab);
      setFirstName(metaFirst);
      setLastName(metaLast);
    }
  }

  const name = { first: firstName, last: lastName, setFirst: setFirstName, setLast: setLastName, metaFirst, metaLast };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={drawerSx}>
      {/* Header */}
      <Box sx={panelHeaderSx}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {tab === "perfil" ? (t.settingsPanel.profile) : (t.settingsPanel.settings)}
        </Typography>
        <IconButton onClick={onClose} aria-label={t.common.close}><CloseIcon /></IconButton>
      </Box>

      {/* Tabs: separa Perfil de Ajustes */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={panelTabsSx}
      >
        <Tab value="perfil" icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start"
          label={t.settingsPanel.profile} sx={{ minHeight: 48, textTransform: "none", fontWeight: 600 }} />
        <Tab value="ajustes" icon={<SettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start"
          label={t.settingsPanel.settings} sx={{ minHeight: 48, textTransform: "none", fontWeight: 600 }} />
      </Tabs>

      {tab === "perfil" && <ProfileTab user={user} name={name} notify={notify} />}
      {tab === "ajustes" && <PreferencesTab />}

      <Snackbar key={snack?.id} open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack?.severity ?? "success"} onClose={() => setSnack(null)} sx={{ width: "100%" }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Drawer>
  );
}
