"use client"

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar, Toolbar, Typography, Box, Tabs, Tab, Fab, Snackbar, Alert,
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
} from "@mui/icons-material";
import { useSettings } from "../context/SettingsContext.jsx";
import { useSupabaseUser } from "../context/UserContext";
import { useData } from "../context/DataContext.jsx";
import { createClient } from "../lib/supabase";
import OverviewTab from "./OverviewTab.jsx";
import ExpensesTab from "./ExpensesTab.jsx";
import IncomeTab from "./IncomeTab.jsx";
import BudgetTab from "./BudgetTab.jsx";
import GoalsTab from "./GoalsTab.jsx";
import AddTransactionModal from "./AddTransactionModal.jsx";
import SettingsPanel from "./SettingsPanel.jsx";
import LoginModal from "./LoginModal.jsx";

export default function DashboardStudio() {
  const { t, lang } = useSettings();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const user = useSupabaseUser();
  const router = useRouter();
  const { loadError } = useData();

  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalCat, setModalCat] = useState("");
  const [modalMode, setModalMode] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [period, setPeriod] = useState("month");

  const openModal = useCallback((cat = "", mode = "all") => { setModalCat(cat); setModalMode(mode); setShowModal(true); }, []);
  const showToast = useCallback((msg, severity = "success", duration = 3000) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, severity, duration });
    toastTimer.current = setTimeout(() => setToast(null), duration);
  }, []);

  const handleAddTx = useCallback(() => {
    showToast(lang === "es" ? "Transacción guardada" : "Transaction saved", "success");
  }, [showToast, lang]);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  // Redirect unauthenticated users (belt-and-suspenders backup to middleware)
  useEffect(() => {
    if (user === null) {
      router.replace("/login");
    }
  }, [user, router]);

  // Inactivity auto-logout: 2 minutes with 30s warning
  useEffect(() => {
    if (!user) return;

    const TIMEOUT = 120_000;
    const WARN_BEFORE = 30_000;

    let logoutTimer;
    let warnTimer;

    const resetTimers = () => {
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);

      warnTimer = setTimeout(() => {
        showToast(
          lang === "es"
            ? "La sesión se cerrará en 30 segundos por inactividad"
            : "Session will close in 30 seconds due to inactivity",
          "warning",
          WARN_BEFORE
        );
      }, TIMEOUT - WARN_BEFORE);

      logoutTimer = setTimeout(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace("/login");
      }, TIMEOUT);
    };

    const EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    EVENTS.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();

    return () => {
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [user, showToast, lang, router]);

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
            <Typography variant="h6" sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}>{lang === "es" ? "Finanzas" : "Finances"}</Typography>
          </Box>
          {!isMobile && (
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ flex: 1 }}>
              {TAB_LABELS.map(({ id, label, icon }) => (
                <Tab key={id} icon={icon} iconPosition="start" label={label} sx={{ minHeight: 48 }} />
              ))}
            </Tabs>
          )}
          <Box sx={{ flex: 1, display: { xs: "block", sm: "none" } }} />
          <Fab size="small" color="primary" aria-label={t.addTx} onClick={() => openModal()} sx={{ boxShadow: 2, minWidth: 44, minHeight: 44 }}>
            <AddIcon />
          </Fab>
          <Fab size="small" color="default" aria-label="Settings" onClick={() => setShowSettings(true)} sx={{ boxShadow: 1, minWidth: 44, minHeight: 44 }}>
            <SettingsIcon fontSize="small" />
          </Fab>
          {user === undefined ? null : user ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title={displayName}>
                <Avatar
                  src={avatarSrc}
                  sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
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
                aria-label={lang === "es" ? "Cerrar sesión" : "Sign out"}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                {isMobile ? null : (lang === "es" ? "Salir" : "Sign out")}
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
              {isMobile ? (lang === "es" ? "Entrar" : "Sign in") : (lang === "es" ? "Iniciar sesión" : "Sign in")}
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
        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>{lang === "es" ? "Reintentar" : "Retry"}</Button>
          }>
            {lang === "es" ? "Error al cargar datos" : "Error loading data"}: {loadError}
          </Alert>
        )}
        {activeTab === 0 && <OverviewTab period={period} setPeriod={setPeriod} />}
        {activeTab === 1 && <ExpensesTab period={period} openModal={openModal} showToast={showToast} />}
        {activeTab === 2 && <IncomeTab period={period} openModal={openModal} showToast={showToast} />}
        {activeTab === 3 && <BudgetTab period={period} showToast={showToast} />}
        {activeTab === 4 && <GoalsTab showToast={showToast} />}
      </Box>

      <Snackbar open={!!toast} autoHideDuration={toast?.duration ?? 3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={{ bottom: { xs: 72, sm: 24 } }}>
        {toast && <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.msg}</Alert>}
      </Snackbar>

      {showModal && <AddTransactionModal initialCategory={modalCat} mode={modalMode} onAdd={handleAddTx} onClose={() => setShowModal(false)} showToast={showToast} />}
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </Box>
  );
}
