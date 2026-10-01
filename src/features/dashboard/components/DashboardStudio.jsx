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
  Visibility as ShowAmountsIcon,
  VisibilityOff as HideAmountsIcon,
} from "@/theme/icons";
import { accentGradient } from "@/theme/materialTheme";
import { useSettings } from "@/contexts/SettingsContext";
import { useSupabaseUser } from "@/contexts/UserContext";
import { useData } from "@/contexts/DataContext";
import { createClient } from "@/lib/supabase/client";
import { useBudgetAlertToasts } from "@/features/budgets/hooks/useBudgetAlertToasts";
import OverviewTab from "./OverviewTab";
import ExpensesTab from "@/features/transactions/components/ExpensesTab";
import IncomeTab from "@/features/transactions/components/IncomeTab";
import BudgetTab from "@/features/budgets/components/BudgetTab";
import GoalsTab from "./GoalsTab";
import AddTransactionModal from "@/features/transactions/components/AddTransactionModal";
import SettingsPanel from "@/features/settings/components/SettingsPanel";
import LoginModal from "@/features/auth/components/LoginModal";

const SESSION_ALIVE_KEY = "gastos_session_alive";
const LAST_ACTIVE_KEY = "gastos_last_active";
const SESSION_CHANNEL = "gastos-session";

export default function DashboardStudio() {
  const { t, privacy, setPrivacy, idleMinutes } = useSettings();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const user = useSupabaseUser();
  const router = useRouter();
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
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [period, setPeriod] = useState("month");

  // `prefill` ({ concepto, valor } with valor in PEN) comes from "Registrar" on an upcoming payment.
  const openModal = useCallback((cat = "", mode = "all", prefill = null) => { setModalCat(cat); setModalMode(mode); setModalPrefill(prefill); setShowModal(true); }, []);
  // `action` ({ label, onClick }) adds a button to the toast, e.g. "Deshacer".
  const showToast = useCallback((msg, severity = "success", duration = 3000, action = null) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, severity, duration, action, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), duration);
  }, []);

  useBudgetAlertToasts(showToast);

  const handleAddTx = useCallback(() => {
    showToast(t.dashboard.transactionSaved, "success");
  }, [showToast, t]);

  const handleSignOut = useCallback(async () => {
    localStorage.removeItem(LAST_ACTIVE_KEY);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  // Automatic logouts (inactivity, 8h max age, reopened browser) only end the session
  // in this browser. signOut()'s default scope is "global", which would also revoke the
  // user's sessions on every other device.
  const autoSignOut = useCallback(async () => {
    localStorage.removeItem(LAST_ACTIVE_KEY);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login");
  }, [router]);

  // Redirect unauthenticated users (belt-and-suspenders backup to middleware)
  useEffect(() => {
    if (user === null) {
      router.replace("/login");
    }
  }, [user, router]);

  // Inactivity auto-logout after `idleMinutes` (Ajustes, 2 by default) with a 30s warning.
  // LAST_ACTIVE_KEY lives in localStorage, shared by every tab: before warning or
  // logging out, re-read it so an idle tab doesn't end a session the user is
  // actively using in another tab.
  useEffect(() => {
    if (!user) return;

    const TIMEOUT = idleMinutes * 60_000;
    const WARN_BEFORE = 30_000;

    let logoutTimer;
    let warnTimer;

    const msLeft = () => {
      const last = Number(localStorage.getItem(LAST_ACTIVE_KEY)) || Date.now();
      return TIMEOUT - (Date.now() - last);
    };

    const schedule = () => {
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);
      const left = msLeft();
      if (left <= 0) {
        autoSignOut();
        return;
      }
      if (left > WARN_BEFORE) warnTimer = setTimeout(warn, left - WARN_BEFORE);
      logoutTimer = setTimeout(schedule, left);
    };

    const warn = () => {
      // Activity in another tab pushed the deadline back: reschedule instead.
      if (msLeft() > WARN_BEFORE + 1000) {
        schedule();
        return;
      }
      showToast(t.dashboard.sessionClosingSoon, "warning", WARN_BEFORE);
    };

    const resetTimers = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
      schedule();
    };

    const EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    EVENTS.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();

    return () => {
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [user, showToast, t, autoSignOut, idleMinutes]);

  // Session security: force login on browser close (sessionStorage flag) + 8h max-age for open tabs.
  // sessionStorage is per tab, so a tab opened by hand (bookmark, typed URL) starts without
  // the flag even while other tabs are open. Before treating that as a reopened browser,
  // ask the other tabs over a BroadcastChannel; if one answers, inherit its flag.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let channel = null;
    try {
      channel = new BroadcastChannel(SESSION_CHANNEL);
      channel.onmessage = (e) => {
        if (e.data === "ping" && sessionStorage.getItem(SESSION_ALIVE_KEY)) channel.postMessage("pong");
      };
    } catch {
      channel = null; // BroadcastChannel unsupported: fall back to per-tab behaviour
    }

    const askOtherTabs = () => new Promise((resolve) => {
      if (!channel) return resolve(false);
      const onPong = (e) => {
        if (e.data !== "pong") return;
        clearTimeout(timer);
        channel.removeEventListener("message", onPong);
        resolve(true);
      };
      const timer = setTimeout(() => {
        channel.removeEventListener("message", onPong);
        resolve(false);
      }, 300);
      channel.addEventListener("message", onPong);
      channel.postMessage("ping");
    });

    const MAX_AGE = 8 * 60 * 60 * 1000;

    const checkSessionAge = async () => {
      const raw = localStorage.getItem(LAST_ACTIVE_KEY);
      if (raw && Date.now() - Number(raw) > MAX_AGE) {
        await autoSignOut();
      }
    };

    const start = async () => {
      if (!sessionStorage.getItem(SESSION_ALIVE_KEY)) {
        const alive = await askOtherTabs();
        if (cancelled) return;
        if (!alive) {
          // No other tab of this browser session answered: the browser was reopened.
          await autoSignOut();
          return;
        }
        sessionStorage.setItem(SESSION_ALIVE_KEY, "1");
      }
      await checkSessionAge();
    };

    start().catch(() => {});

    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkSessionAge().catch(() => {});
    };
    const handlePageShow = (e) => {
      if (e.persisted) checkSessionAge().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      cancelled = true;
      channel?.close();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [user, autoSignOut]);

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

      <Snackbar key={toast?.id} open={!!toast} autoHideDuration={toast?.duration ?? 3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={{ bottom: { xs: 72, sm: 24 } }}>
        {toast && (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}
            action={toast.action ? (
              <Button color="inherit" size="small" sx={{ fontWeight: 700 }} onClick={() => { setToast(null); toast.action.onClick(); }}>{toast.action.label}</Button>
            ) : undefined}>
            {toast.msg}
          </Alert>
        )}
      </Snackbar>

      {showModal && <AddTransactionModal initialCategory={modalCat} mode={modalMode} initialConcept={modalPrefill?.concepto} initialAmount={modalPrefill?.valor} onAdd={handleAddTx} onClose={() => setShowModal(false)} showToast={showToast} />}
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} initialTab={settingsTab} />
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </Box>
  );
}
