import { useState } from "react";
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { currencyOf, toBase } from "@/domain/money";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext.jsx";

// Same cap as a transaction, in PEN.
const MAX_AMOUNT_BASE = 10_000_000;

// Moves money between two of the user's accounts. It is neither income nor expense: it
// only changes the two balances. Mounted while open, so every opening starts clean.
export function TransferDialog({ onClose, showToast }) {
  const { t, lang, currency, fmt } = useSettings();
  const { accounts, saveTransfer } = useData();
  const [origen, setOrigen] = useState(accounts[0]?.id ?? "");
  const [destino, setDestino] = useState(accounts[1]?.id ?? "");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => dayjs());
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);

  const amount = toBase(parseFloat(monto), currency); // NaN while empty
  const same = !!origen && origen === destino;
  const tooBig = amount > MAX_AMOUNT_BASE;
  const valid = !!origen && !!destino && !same && amount > 0 && !tooBig;

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await saveTransfer({ origen, destino, monto: amount, date: fecha.toDate(), nota: nota.trim() || null });
      showToast?.(t.goalsTab.transferToasts.saved, "success");
      onClose();
    } catch {
      showToast?.(t.goalsTab.transferToasts.saveError, "error");
      setSaving(false);
    }
  };

  const accountOptions = accounts.map((a) => (
    <MenuItem key={a.id} value={a.id}>{a.name} · {fmt(a.current ?? a.balance, true)}</MenuItem>
  ));

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t.goalsTab.newTransfer}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, "&&": { pt: 1 } }}>
        <TextField select label={t.goalsTab.fromAccount} value={origen} onChange={(e) => setOrigen(e.target.value)} fullWidth>
          {accountOptions}
        </TextField>
        <TextField select label={t.goalsTab.toAccount} value={destino} onChange={(e) => setDestino(e.target.value)} fullWidth
          error={same} helperText={same ? t.goalsTab.sameAccount : undefined}>
          {accountOptions}
        </TextField>
        <TextField label={t.amount} type="number" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} fullWidth
          error={tooBig} helperText={tooBig ? t.txModal.maximumAmountIs(fmt(MAX_AMOUNT_BASE)) : undefined}
          slotProps={{ input: { startAdornment: <InputAdornment position="start">{currencyOf(currency).symbol}</InputAdornment>, inputProps: { min: 0, step: "any" } } }} />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
          <DatePicker label={t.txModal.date} value={fecha}
            onChange={(v) => { if (v) setFecha(v.hour(fecha.hour()).minute(fecha.minute()).second(fecha.second())); }}
            slotProps={{ textField: { fullWidth: true } }} />
        </LocalizationProvider>
        <TextField label={t.goalsTab.note} value={nota} onChange={(e) => setNota(e.target.value)} fullWidth slotProps={{ htmlInput: { maxLength: 100 } }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>{t.cancel}</Button>
        <Button onClick={handleSave} variant="contained" disabled={!valid || saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : t.goalsTab.transfer}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
