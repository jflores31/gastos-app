import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AlertColor } from "@mui/material";

export type ToastAction = { label: string; onClick: () => void };
export type Toast = { msg: ReactNode; severity: AlertColor; duration: number; action: ToastAction | null; id: number };
export type ShowToast = (msg: ReactNode, severity?: AlertColor, duration?: number, action?: ToastAction | null) => void;

// One toast at a time: showing a new one replaces the current one. The screens get
// `showToast` as a prop; <Toast> renders what this hook holds.
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // `action` ({ label, onClick }) adds a button to the toast, e.g. "Deshacer".
  const showToast = useCallback<ShowToast>((msg, severity = "success", duration = 3000, action = null) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, severity, duration, action, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), duration);
  }, []);
  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
}
