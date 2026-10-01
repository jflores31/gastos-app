import type { ReactNode } from "react";
import { AppBar, Toolbar, Typography, Box, Fab, Avatar, Button, Tooltip } from "@mui/material";
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Visibility as ShowAmountsIcon,
  VisibilityOff as HideAmountsIcon,
} from "@/theme/icons";
import { useSettings } from "@/contexts/SettingsContext";
import { addFabSx, avatarSx, logoMarkSx, settingsFabSx } from "./AppHeader.styles";
import { useSupabaseUser } from "@/contexts/UserContext";

type Props = {
  isMobile: boolean;
  nav: ReactNode; // the desktop tabs, between the brand and the actions
  onAdd: () => void;
  onOpenSettings: (tab: "perfil" | "ajustes") => void;
  onSignOut: () => void;
  onSignIn: () => void;
};

// Top bar of the app: brand, navigation slot, add / hide amounts / settings, and the
// user (avatar, name, sign out) or the sign-in button.
export function AppHeader({ isMobile, nav, onAdd, onOpenSettings, onSignOut, onSignIn }: Props) {
  const { t, privacy, setPrivacy } = useSettings();
  const user = useSupabaseUser();

  const displayName = user?.user_metadata?.full_name || user?.email || "Usuario";
  const avatarSrc = user?.user_metadata?.avatar_url || undefined;

  return (
    <AppBar position="sticky" elevation={1} sx={{ bgcolor: "background.paper", color: "text.primary" }}>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 2 }}>
          <Box sx={logoMarkSx}>◈</Box>
          <Typography variant="h6" sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}>{t.dashboard.finances}</Typography>
        </Box>
        {nav}
        <Box sx={{ flex: 1, display: { xs: "block", sm: "none" } }} />
        <Fab size="small" color="primary" aria-label={t.addTx} onClick={onAdd} sx={addFabSx}>
          <AddIcon />
        </Fab>
        <Tooltip title={privacy ? t.dashboard.showAmounts : t.dashboard.hideAmounts}>
          <Fab size="small" color="default" aria-label={t.dashboard.hideAmounts} aria-pressed={privacy} onClick={() => setPrivacy(!privacy)} sx={{ boxShadow: 1, minWidth: 44, minHeight: 44 }}>
            {privacy ? <HideAmountsIcon fontSize="small" /> : <ShowAmountsIcon fontSize="small" />}
          </Fab>
        </Tooltip>
        <Fab size="small" color="default" aria-label={t.settingsPanel.settings} onClick={() => onOpenSettings("ajustes")} sx={settingsFabSx}>
          <SettingsIcon fontSize="small" />
        </Fab>
        {user === undefined ? null : user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={t.dashboard.viewProfile}>
              <Avatar
                src={avatarSrc}
                onClick={() => onOpenSettings("perfil")}
                role="button"
                tabIndex={0}
                aria-label={t.dashboard.viewProfile}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenSettings("perfil"); } }}
                sx={avatarSx}
              >
                {displayName?.[0]?.toUpperCase() || "?"}
              </Avatar>
            </Tooltip>
            {!isMobile && (
              <Typography variant="body2" noWrap sx={{ fontWeight: 600, maxWidth: 120 }}>
                {displayName}
              </Typography>
            )}
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={onSignOut}
              aria-label={t.dashboard.signOutLabel}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {isMobile ? null : (t.dashboard.signOut)}
            </Button>
          </Box>
        ) : (
          <Button
            size="small"
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={onSignIn}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {isMobile ? (t.dashboard.signIn) : (t.common.signIn)}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
