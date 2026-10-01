"use client"

import { useState, useCallback } from "react";
import {
  AppBar, Toolbar, Typography, Box, Tabs, Tab, Fab, Alert,
  useMediaQuery, useTheme, BottomNavigation, BottomNavigationAction,
  Avatar, Button, Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  AttachMoney as IncomeIcon,
  AccountBalanceWallet as BudgetIcon,
  Flag as GoalsIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Visibility as ShowAmountsIcon,
  VisibilityOff as HideAmountsIcon,
} from "@/theme/icons";
import { accentGradient } from "@/theme/materialTheme";
import { useSettings } from "@/contexts/SettingsContext";
import { useSupabaseUser } from "@/contexts/UserContext";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/feedback/useToast";
import { Toast } from "@/components/feedback/Toast";
import { useBudgetAlertToasts } from "@/features/budgets/hooks/useBudgetAlertToasts";
import { useSessionGuard } from "@/features/auth/hooks/useSessionGuard";
import OverviewTab from "./OverviewTab";
import ExpensesTab from "@/features/transactions/components/ExpensesTab";
import IncomeTab from "@/features/transactions/components/IncomeTab";
import BudgetTab from "@/features/budgets/components/BudgetTab";
import GoalsTab from "./GoalsTab";
import AddTransactionModal from "@/features/transactions/components/AddTransactionModal";
import SettingsPanel from "@/features/settings/components/SettingsPanel";
import LoginModal from "@/features/auth/components/LoginModal";

export default function DashboardStudio() {
  const { t, privacy, setPrivacy } = useSettings();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const user = useSupabaseUser();
  const { loadError } = useData();

  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalCat, setModalCat] = useState("");
  const [modalMode, setModalMode] = useState("all");
  const [modalPrefill, setModalPrefill] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("perfil");
  const openSettings = (tab) => { setSettingsTab(tab); setShowSettings(true); };
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [period, setPeriod] = useState("month");

  // `prefill` ({ concepto, valor } with valor in PEN) comes from "Registrar" on an upcoming payment.
  const openModal = useCallback((cat = "", mode = "all", prefill = null) => { setModalCat(cat); setModalMode(mode); setModalPrefill(prefill); setShowModal(true); }, []);
  const { toast, showToast, hideToast } = useToast();

  useBudgetAlertToasts(showToast);

  const handleAddTx = useCallback(() => {
    showToast(t.dashboard.transactionSaved, "success");
  }, [showToast, t]);

  const handleSignOut = useSessionGuard(showToast);

  const TAB_LABELS = [
    { id: "overview", label: t.overview, icon: <DashboardIcon /> },
    { id: "expenses", label: t.expenses, icon: <ReceiptIcon /> },
    { id: "income", label: t.incomes, icon: <IncomeIcon /> },
    { id: "budget", label: t.budget, icon: <BudgetIcon /> },
    { id: "goals", label: t.goals, icon: <GoalsIcon /> },
  ];

  const displayName = user?.user_metadata?.full_name || user?.email || "Usuario";
  const avatarSrc = user?.user_metadata?.avatar_url || undefined;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: "background.paper", color: "text.primary" }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 2 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>◈</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}>{t.dashboard.finances}</Typography>
          </Box>
          {!isMobile && (
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ flex: 1 }}>
              {TAB_LABELS.map(({ id, label, icon }) => (
                <Tab key={id} icon={icon} iconPosition="start" label={label} sx={{ minHeight: 48 }} />
              ))}
            </Tabs>
          )}
          <Box sx={{ flex: 1, display: { xs: "block", sm: "none" } }} />
          <Fab size="small" color="primary" aria-label={t.addTx} onClick={() => openModal()} sx={{ boxShadow: 2, minWidth: 44, minHeight: 44, background: (th) => accentGradient(th), color: "#fff", "&:hover": { background: (th) => accentGradient(th, 145), filter: "brightness(1.05)" }, "&:hover .MuiSvgIcon-root": { transform: "rotate(90deg)" } }}>
            <AddIcon />
          </Fab>
          <Tooltip title={privacy ? t.dashboard.showAmounts : t.dashboard.hideAmounts}>
            <Fab size="small" color="default" aria-label={t.dashboard.hideAmounts} aria-pressed={privacy} onClick={() => setPrivacy(!privacy)} sx={{ boxShadow: 1, minWidth: 44, minHeight: 44 }}>
              {privacy ? <HideAmountsIcon fontSize="small" /> : <ShowAmountsIcon fontSize="small" />}
            </Fab>
          </Tooltip>
          <Fab size="small" color="default" aria-label={t.settingsPanel.settings} onClick={() => openSettings("ajustes")} sx={{ boxShadow: 1, minWidth: 44, minHeight: 44, "&:hover .MuiSvgIcon-root": { transform: "rotate(90deg)" } }}>
            <SettingsIcon fontSize="small" />
          </Fab>
          {user === undefined ? null : user ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title={t.dashboard.viewProfile}>
                <Avatar
                  src={avatarSrc}
                  onClick={() => openSettings("perfil")}
                  role="button"
                  tabIndex={0}
                  aria-label={t.dashboard.viewProfile}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSettings("perfil"); } }}
                  sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14, fontWeight: 700, cursor: "pointer", "&:hover": { boxShadow: "0 0 0 2px var(--accent)" }, transition: "box-shadow 0.15s" }}
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
                onClick={handleSignOut}
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
              onClick={() => setShowLoginModal(true)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {isMobile ? (t.dashboard.signIn) : (t.common.signIn)}
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {isMobile && (
        <BottomNavigation
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          showLabels
          sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1100, borderTop: 1, borderColor: "divider" }}
        >
          {TAB_LABELS.map(({ id, label, icon }) => (
            <BottomNavigationAction key={id} label={label} icon={icon} />
          ))}
        </BottomNavigation>
      )}

      <Box component="main" sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
        {loadError && (() => {
          const isClockSkew = loadError.toLowerCase().includes("jwt") && loadError.toLowerCase().includes("future");
          return (
            <Alert severity="error" sx={{ mb: 2 }} action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>{t.dashboard.retry}</Button>
            }>
              {isClockSkew
                ? t.dashboard.clockAhead
                : `${t.dashboard.errorLoadingData}: ${loadError}`
              }
            </Alert>
          );
        })()}
        {activeTab === 0 && <OverviewTab period={period} setPeriod={setPeriod} />}
        {activeTab === 1 && <ExpensesTab period={period} openModal={openModal} showToast={showToast} />}
        {activeTab === 2 && <IncomeTab period={period} openModal={openModal} showToast={showToast} />}
        {activeTab === 3 && <BudgetTab period={period} openModal={openModal} showToast={showToast} />}
        {activeTab === 4 && <GoalsTab showToast={showToast} />}
      </Box>

      <Toast toast={toast} onClose={hideToast} />

      {showModal && <AddTransactionModal initialCategory={modalCat} mode={modalMode} initialConcept={modalPrefill?.concepto} initialAmount={modalPrefill?.valor} onAdd={handleAddTx} onClose={() => setShowModal(false)} showToast={showToast} />}
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} initialTab={settingsTab} />
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </Box>
  );
}
