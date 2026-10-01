import { useCallback, useState } from "react";

export type TxModalMode = "all" | "expense" | "income";
// From "Registrar" on an upcoming payment: valor is in PEN.
export type TxPrefill = { concepto?: string; valor?: number } | null;

// The "add transaction" modal that every tab can open, with the category, the mode
// (both types, only expense or only income) and the prefill it opens with.
export function useTransactionModal() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState<TxModalMode>("all");
  const [prefill, setPrefill] = useState<TxPrefill>(null);

  const openModal = useCallback((cat = "", nextMode: TxModalMode = "all", nextPrefill: TxPrefill = null) => {
    setCategory(cat); setMode(nextMode); setPrefill(nextPrefill); setOpen(true);
  }, []);
  const closeModal = useCallback(() => setOpen(false), []);

  return { modal: { open, category, mode, prefill }, openModal, closeModal };
}
