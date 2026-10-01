import { Alert, Button, Snackbar } from "@mui/material";
import type { Toast as ToastState } from "./useToast";

// The toast from useToast(): bottom center, above the bottom bar on mobile.
export function Toast({ toast, onClose }: { toast: ToastState | null; onClose: () => void }) {
  return (
    <Snackbar key={toast?.id} open={!!toast} autoHideDuration={toast?.duration ?? 3000} onClose={onClose} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={{ bottom: { xs: 72, sm: 24 } }}>
      {toast ? (
        <Alert severity={toast.severity} variant="filled" onClose={onClose}
          action={toast.action ? (
            <Button color="inherit" size="small" sx={{ fontWeight: 700 }} onClick={() => { onClose(); toast.action?.onClick(); }}>{toast.action.label}</Button>
          ) : undefined}>
          {toast.msg}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
}
