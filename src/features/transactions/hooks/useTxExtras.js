import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";

// What a transaction row adds after its date: " · €50 · BCP" — the amount typed in
// another currency and the account, when there are.
export function useTxExtras() {
  const { txOriginal } = useSettings();
  const { accounts } = useData();
  return (tx) => [txOriginal(tx), accounts.find((a) => a.id === tx.cuentaId)?.name]
    .filter(Boolean)
    .map((x) => ` · ${x}`)
    .join("");
}
