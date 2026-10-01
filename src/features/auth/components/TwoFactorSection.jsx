import { useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import { useSettings } from "@/contexts/SettingsContext";
import { createClient } from "@/lib/supabase/client";

// Two-step verification with TOTP (Supabase MFA). Turning it on shows a QR code (and the
// key, to type it in by hand) and asks for one code to confirm it. Once on, signing in asks
// for a code (login page), the proxy keeps the session on /login until then and the
// database only lets it through at aal2 (see src/lib/mfa.ts).
export function TwoFactorSection({ notify }) {
  const { t } = useSettings();
  const supabase = useMemo(() => createClient(), []);
  const [factorId, setFactorId] = useState(undefined); // undefined: loading; null: off
  const [enrolling, setEnrolling] = useState(null); // { id, qr, secret } while being set up
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.mfa.listFactors().then(({ data }) => {
      if (!cancelled) setFactorId(data?.totp?.[0]?.id ?? null);
    });
    return () => { cancelled = true; };
  }, [supabase]);

  const start = async () => {
    setBusy(true);
    try {
      // A setup left half-way leaves an unverified factor with the same name: remove it.
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of list?.all ?? []) {
        if (f.factor_type === "totp" && f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "gastos-app", issuer: "Finanzas" });
      if (enrollError) throw enrollError;
      setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch {
      notify(t.settingsPanel.twoFactorError, "error");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError("");
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrolling.id, code: code.trim() });
    setBusy(false);
    if (verifyError) return setError(t.settingsPanel.wrongCode);
    setFactorId(enrolling.id);
    setEnrolling(null);
    setCode("");
    notify(t.settingsPanel.twoFactorEnabled, "success");
  };

  const turnOff = async () => {
    setBusy(true);
    const { error: offError } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    setConfirmOff(false);
    if (offError) return notify(t.settingsPanel.twoFactorError, "error");
    setFactorId(null);
    notify(t.settingsPanel.twoFactorDisabled, "success");
  };

  return (
    <>
      <ListItem sx={{ pt: 2 }}>
        <ListItemText
          primary={t.settingsPanel.twoFactor}
          secondary={factorId ? t.settingsPanel.twoFactorOn : t.settingsPanel.twoFactorOff}
          primaryTypographyProps={{ variant: "overline" }}
          secondaryTypographyProps={{ variant: "caption" }}
        />
      </ListItem>
      <ListItem sx={{ pt: 0, pb: 3 }}>
        {factorId === undefined ? (
          <CircularProgress size={20} />
        ) : enrolling ? (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); verify(); }} sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            <Typography variant="body2" color="text.secondary">{t.settingsPanel.scanQr}</Typography>
            <Box component="img" src={enrolling.qr} alt={t.settingsPanel.qrAlt} sx={{ width: 180, height: 180, alignSelf: "center", bgcolor: "#fff", p: 1, borderRadius: 2 }} />
            <Typography data-testid="totp-secret" variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all", textAlign: "center", bgcolor: "action.hover", p: 1, borderRadius: 1 }}>
              {enrolling.secret}
            </Typography>
            <TextField size="small" label={t.settingsPanel.code6} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              error={!!error} helperText={error || undefined} autoComplete="one-time-code"
              slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }} />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button size="small" color="inherit" disabled={busy} onClick={() => { setEnrolling(null); setCode(""); setError(""); }}>{t.cancel}</Button>
              <Button size="small" type="submit" variant="contained" disabled={busy || code.length !== 6}>{t.settingsPanel.verify}</Button>
            </Box>
          </Box>
        ) : factorId ? (
          <Button size="small" variant="outlined" color="error" disabled={busy} onClick={() => setConfirmOff(true)} sx={{ borderRadius: 2, textTransform: "none" }}>
            {t.settingsPanel.disable2fa}
          </Button>
        ) : (
          <Button size="small" variant="outlined" disabled={busy} onClick={start} sx={{ borderRadius: 2, textTransform: "none" }}>
            {busy ? <CircularProgress size={18} /> : t.settingsPanel.enable2fa}
          </Button>
        )}
      </ListItem>

      <Dialog open={confirmOff} onClose={busy ? undefined : () => setConfirmOff(false)} maxWidth="xs" fullWidth>
        <DialogContent>
          <DialogContentText>{t.settingsPanel.confirmDisable2fa}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" disabled={busy} onClick={() => setConfirmOff(false)}>{t.cancel}</Button>
          <Button color="error" variant="contained" disabled={busy} onClick={turnOff}>{t.settingsPanel.disable2fa}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
