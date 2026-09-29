import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useSettings } from "@/contexts/SettingsContext";

// Frame shared by the dialogs of the Goals tab: title, fields, and Delete (when editing) /
// Cancel / Save. `dialog` is the object returned by useEntityDialog().
export function EntityDialog({ dialog, title, canSave, onSave, maxWidth = "sm", children }) {
  const { t } = useSettings();
  return (
    <Dialog open={dialog.open} onClose={dialog.close} maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: "divider", py: 2 }}>
        {title}
      </DialogTitle>
      {/* "&&": MUI zeroes padding-top of a DialogContent that follows a DialogTitle with a
          more specific selector; without it the first field's floating label is clipped. */}
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, "&&": { pt: 3 } }}>
        {children}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        {dialog.editing && (
          <Button color="error" disabled={dialog.saving} onClick={() => dialog.destroy(dialog.editing.id)}>
            {t.common.delete}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={dialog.close}>{t.cancel}</Button>
        <Button variant="contained" onClick={onSave} disabled={dialog.saving || !canSave}>
          {dialog.saving ? <CircularProgress size={18} /> : t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
