import { useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  List, ListItem, Snackbar, Tooltip, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import { RestoreFromTrash as RestoreIcon, DeleteForever as DeleteForeverIcon, DeleteSweep as EmptyIcon } from "@/theme/icons";
import { CategoryAvatar } from "../../theme/GradientIcon.jsx";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { useSettings } from "../../context/SettingsContext";
import { useData, TRASH_DAYS } from "../../context/DataContext.jsx";

const DAY = 24 * 60 * 60 * 1000;

// Deleted transactions: restore one, delete one for good, or empty the trash (both with
// a confirmation, since those can't be undone). Items older than TRASH_DAYS are removed
// by DataContext when it loads. Mounted only while open, so "now" is when it opened.
// Feedback goes to a snackbar inside the dialog: while a modal is open, the page behind
// it (and the settings panel's snackbar) is hidden from screen readers.
export function TrashDialog({ onClose }) {
  const { t, lang, fmtTx, txOriginal } = useSettings();
  const { trash, restoreTx, purgeTx, emptyTrash, customCats } = useData();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [confirm, setConfirm] = useState(null); // { tx } for one item, { all: true } for everything
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const [snack, setSnack] = useState(null);
  // A new id per message restarts the snackbar's timer (see its `key`).
  const notify = (msg, severity) => setSnack((prev) => ({ msg, severity, id: (prev?.id ?? 0) + 1 }));

  const daysLeft = (tx) => Math.max(1, TRASH_DAYS - Math.floor((now - tx.deletedAt.getTime()) / DAY));
  const run = async (action, okMsg, errMsg) => {
    setBusy(true);
    try {
      await action();
      notify(okMsg, "success");
    } catch {
      notify(errMsg, "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <>
      <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen} slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 3 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t.settingsPanel.trashTitle}</DialogTitle>
        <DialogContent sx={{ "&&": { pt: 0 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{t.settingsPanel.trashHint(TRASH_DAYS)}</Typography>
          {trash.length === 0 ? (
            <Typography variant="body2" sx={{ py: 3, textAlign: "center" }} color="text.secondary">{t.settingsPanel.trashEmpty}</Typography>
          ) : (
            <List disablePadding>
              {trash.map((tx) => {
                const { label, color, Icon } = resolveCategoryMeta(tx.categoria, customCats, lang, tx.tipo);
                return (
                  <ListItem key={tx.id} disableGutters sx={{ gap: 1.5, borderBottom: 1, borderColor: "divider" }}>
                    <CategoryAvatar icon={Icon} color={color} size={36} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{tx.concepto}</Typography>
                      <Typography variant="caption" color="text.secondary" component="div" noWrap>
                        {label} · {tx.date.toLocaleDateString(t.common.locale)}{txOriginal(tx) && ` · ${txOriginal(tx)}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div" noWrap>
                        {t.settingsPanel.deletedOn(tx.deletedAt.toLocaleDateString(t.common.locale, { day: "numeric", month: "short" }))} · {t.settingsPanel.purgeIn(daysLeft(tx))}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: "nowrap", color: tx.tipo === "INGRESO" ? "success.main" : "error.main" }}>
                      {tx.tipo === "INGRESO" ? "+" : "−"}{fmtTx(tx)}
                    </Typography>
                    <Tooltip title={t.settingsPanel.restore}>
                      <IconButton size="small" color="primary" disabled={busy} aria-label={t.settingsPanel.restoreItem(tx.concepto)}
                        onClick={() => run(() => restoreTx(tx.id), t.common.transactionRestored, t.common.errorRestoring)}>
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.settingsPanel.deleteForever}>
                      <IconButton size="small" color="error" disabled={busy} aria-label={t.settingsPanel.deleteForeverItem(tx.concepto)} onClick={() => setConfirm({ tx })}>
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="error" startIcon={<EmptyIcon />} disabled={busy || trash.length === 0} onClick={() => setConfirm({ all: true })} sx={{ mr: "auto" }}>
            {t.settingsPanel.emptyTrash}
          </Button>
          <Button onClick={onClose} color="inherit">{t.common.close}</Button>
        </DialogActions>
        <Snackbar key={snack?.id} open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          {snack ? <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(null)}>{snack.msg}</Alert> : undefined}
        </Snackbar>
      </Dialog>

      <Dialog open={!!confirm} onClose={() => !busy && setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{confirm?.all ? t.settingsPanel.emptyTrash : t.settingsPanel.deleteForever}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirm?.all ? t.settingsPanel.confirmEmptyTrash(trash.length) : confirm ? t.settingsPanel.confirmDeleteForever(confirm.tx.concepto) : ""}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)} color="inherit" disabled={busy}>{t.cancel}</Button>
          <Button variant="contained" color="error" disabled={busy}
            onClick={() => confirm?.all
              ? run(emptyTrash, t.settingsPanel.trashEmptied, t.common.errorDeleting)
              : run(() => purgeTx(confirm.tx.id), t.settingsPanel.deletedForever, t.common.errorDeleting)}>
            {busy ? <CircularProgress size={20} color="inherit" /> : t.settingsPanel.deleteForever}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
