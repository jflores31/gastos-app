import { Receipt as ReceiptIcon, AttachMoney as MoneyIcon } from "@/theme/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSettings } from "@/contexts/SettingsContext";

export function NoTransactions({ type = "expense" }) {
  const { t } = useSettings();
  const isExpense = type === "expense";
  return (
    <EmptyState 
      icon={isExpense ? <ReceiptIcon sx={{ fontSize: 32 }} /> : <MoneyIcon sx={{ fontSize: 32 }} />}
      title={isExpense ? t.sharedUi.noExpenses : t.sharedUi.noIncome}
      subtitle={t.sharedUi.addYourFirstTransaction}
    />
  );
}
