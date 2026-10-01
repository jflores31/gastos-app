import { useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import type { ShowToast } from "@/components/feedback/useToast";
import type { Transaction } from "@/types/domain";

// Deleting a transaction moves it to the trash at once (no confirmation: it can be
// recovered) and shows a toast with "Deshacer" for a few seconds.
export function useMoveToTrash(showToast?: ShowToast) {
  const { t } = useSettings();
  const { deleteTx, restoreTx } = useData();

  return useCallback(async (tx: Transaction) => {
    try {
      await deleteTx(tx.id);
    } catch {
      showToast?.(t.common.errorDeleting, "error");
      return;
    }
    const undo = async () => {
      try {
        await restoreTx(tx.id);
        showToast?.(t.common.transactionRestored, "success");
      } catch {
        showToast?.(t.common.errorRestoring, "error");
      }
    };
    showToast?.(t.common.movedToTrash, "success", 6000, { label: t.common.undo, onClick: undo });
  }, [deleteTx, restoreTx, showToast, t]);
}
