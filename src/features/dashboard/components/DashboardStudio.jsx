"use client"

import { useState, useCallback } from "react";
import { Box, Alert, Button, useMediaQuery, useTheme } from "@mui/material";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/feedback/useToast";
import { Toast } from "@/components/feedback/Toast";
import { useBudgetAlertToasts } from "@/features/budgets/hooks/useBudgetAlertToasts";
import { useSessionGuard } from "@/features/auth/hooks/useSessionGuard";
import { useTransactionModal } from "../hooks/useTransactionModal";
import { AppHeader } from "./AppHeader";
import { MainNav } from "./MainNav";
import OverviewTab from "./OverviewTab";
import ExpensesTab from "@/features/transactions/components/ExpensesTab";
import IncomeTab from "@/features/transactions/components/IncomeTab";
import BudgetTab from "@/features/budgets/components/BudgetTab";
import GoalsTab from "./GoalsTab";
import AddTransactionModal from "@/features/transactions/components/AddTransactionModal";
import SettingsPanel from "@/features/settings/components/SettingsPanel";
import LoginModal from "@/features/auth/components/LoginModal";

// App shell: composes the header, the navigation and the five tabs. Session security,
// the toast and the transaction modal live in their own hooks.
export default function DashboardStudio() {
  const { t } = useSettings();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const { loadError } = useData();

  const [activeTab, setActiveTab] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("perfil");
  const openSettings = (tab) => { setSettingsTab(tab); setShowSettings(true); };
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [period, setPeriod] = useState("month");

  const { modal, openModal, closeModal } = useTransactionModal();
  const { toast, showToast, hideToast } = useToast();

  useBudgetAlertToasts(showToast);

  const handleAddTx = useCallback(() => {
    showToast(t.dashboard.transactionSaved, "success");
  }, [showToast, t]);

  const handleSignOut = useSessionGuard(showToast);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppHeader
        isMobile={isMobile}
        nav={!isMobile && <MainNav variant="tabs" value={activeTab} onChange={setActiveTab} />}
        onAdd={() => openModal()}
        onOpenSettings={openSettings}
        onSignOut={handleSignOut}
        onSignIn={() => setShowLoginModal(true)}
      />

      {isMobile && <MainNav variant="bottom" value={activeTab} onChange={setActiveTab} />}

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

      {modal.open && <AddTransactionModal initialCategory={modal.category} mode={modal.mode} initialConcept={modal.prefill?.concepto} initialAmount={modal.prefill?.valor} onAdd={handleAddTx} onClose={closeModal} showToast={showToast} />}
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} initialTab={settingsTab} />
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </Box>
  );
}
