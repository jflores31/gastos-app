import { Tabs, Tab, BottomNavigation, BottomNavigationAction } from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  AttachMoney as IncomeIcon,
  AccountBalanceWallet as BudgetIcon,
  Flag as GoalsIcon,
} from "@/theme/icons";
import { useSettings } from "@/contexts/SettingsContext";

type Props = {
  variant: "tabs" | "bottom"; // tabs in the top bar (desktop) or the fixed bottom bar (mobile)
  value: number;
  onChange: (tab: number) => void;
};

// The five tabs of the app: Resumen, Gastos, Ingresos, Presupuesto and Metas.
export function MainNav({ variant, value, onChange }: Props) {
  const { t } = useSettings();

  const TAB_LABELS = [
    { id: "overview", label: t.overview, icon: <DashboardIcon /> },
    { id: "expenses", label: t.expenses, icon: <ReceiptIcon /> },
    { id: "income", label: t.incomes, icon: <IncomeIcon /> },
    { id: "budget", label: t.budget, icon: <BudgetIcon /> },
    { id: "goals", label: t.goals, icon: <GoalsIcon /> },
  ];

  if (variant === "tabs") {
    return (
      <Tabs value={value} onChange={(_, v) => onChange(v)} sx={{ flex: 1 }}>
        {TAB_LABELS.map(({ id, label, icon }) => (
          <Tab key={id} icon={icon} iconPosition="start" label={label} sx={{ minHeight: 48 }} />
        ))}
      </Tabs>
    );
  }
  return (
    <BottomNavigation
      value={value}
      onChange={(_, v) => onChange(v)}
      showLabels
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1100, borderTop: 1, borderColor: "divider" }}
    >
      {TAB_LABELS.map(({ id, label, icon }) => (
        <BottomNavigationAction key={id} label={label} icon={icon} />
      ))}
    </BottomNavigation>
  );
}
