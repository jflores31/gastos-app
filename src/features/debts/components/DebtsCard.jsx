import { Box, Card, CardContent, Chip, Grid, IconButton, LinearProgress, TextField, Typography } from "@mui/material";
import { Add as AddIcon, CreditScore as DebtIcon } from "@/theme/icons";
import { toBase, fromBase } from "@/domain/money";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { useEntityDialog } from "@/components/forms/useEntityDialog";
import { EntityDialog } from "@/components/forms/EntityDialog";
import { EmptySection } from "@/components/ui/EmptySection";
import { accentCardSx } from "@/theme/tokens";
import { tintedIconButtonSx } from "@/theme/tokens";
import { debtProgressSx, debtRowSx } from "./DebtsCard.styles";

const EMPTY_DEBT = { es: "", en: "", balance: "", rate: "", monthly: "", remaining: "", original_months: "" };

export function DebtsCard({ showToast }) {
  const { t, currency, fmt } = useSettings();
  const { debts, saveDebt, deleteDebt } = useData();
  const dialog = useEntityDialog({
    empty: EMPTY_DEBT,
    toForm: (d) => ({ ...d, balance: String(fromBase(d.balance, currency)), rate: String(d.rate), monthly: String(fromBase(d.monthly, currency)), remaining: String(d.remaining), original_months: String(d.original_months) }),
    save: saveDebt,
    remove: deleteDebt,
    showToast,
    messages: t.goalsTab.debtToasts,
  });
  const { form, update } = dialog;
  const tooManyRemaining = form.remaining && form.original_months && parseInt(form.remaining) > parseInt(form.original_months);

  return (
    <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, ...accentCardSx("error.main", "section") }}>
      <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <GradientIcon icon={DebtIcon} tone="expense" bubble bubbleSize={40} size={22} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{t.goalsTab.debtControl}</Typography>
              <Typography variant="caption" color="text.secondary">{debts.length} {t.goalsTab.loans}</Typography>
            </Box>
          </Box>
          <IconButton size="small" aria-label={t.goalsTab.addDebt} onClick={dialog.openNew} sx={tintedIconButtonSx("error")}><AddIcon fontSize="small" /></IconButton>
        </Box>
        {debts.length === 0 ? (
          <EmptySection label={t.goalsTab.noLoansYet} onAdd={dialog.openNew} />
        ) : (
          <Box sx={{ flex: 1 }}>
            {debts.map((d) => <DebtRow key={d.id} debt={d} onOpen={() => dialog.openEdit(d)} />)}
          </Box>
        )}
        {debts.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "error.light", borderRadius: 2 }}>
            <Typography variant="body2" color="error.dark" sx={{ fontWeight: 600 }}>
              {t.goalsTab.totalDebt} {fmt(debts.reduce((s, d) => s + d.balance, 0))}
            </Typography>
          </Box>
        )}
      </CardContent>

      <EntityDialog
        dialog={dialog}
        title={dialog.editing ? (t.goalsTab.editLoan) : (t.goalsTab.newLoan)}
        canSave={form.es && form.balance && !tooManyRemaining}
        onSave={() => dialog.submit({ ...form, balance: toBase(parseFloat(form.balance), currency), rate: parseFloat(form.rate) || 0, monthly: toBase(parseFloat(form.monthly) || 0, currency), remaining: parseInt(form.remaining) || 0, original_months: parseInt(form.original_months) || parseInt(form.remaining) || 0 })}
      >
        <TextField label={t.common.name} value={form.es} slotProps={{ htmlInput: { maxLength: 60 } }} onChange={(e) => update({ es: e.target.value, en: e.target.value })} fullWidth />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <TextField label={t.goalsTab.outstandingBalance} type="number" value={form.balance} onChange={(e) => update({ balance: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField label={t.goalsTab.rateTea} type="number" value={form.rate} onChange={(e) => update({ rate: e.target.value })} fullWidth helperText={t.goalsTab.annualEffectiveRate} />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <TextField label={t.goalsTab.monthlyPayment} type="number" value={form.monthly} onChange={(e) => update({ monthly: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField label={t.goalsTab.remaining} type="number" value={form.remaining} onChange={(e) => update({ remaining: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField label={t.goalsTab.totalMonths} type="number" value={form.original_months} onChange={(e) => update({ original_months: e.target.value })} fullWidth />
          </Grid>
        </Grid>
      </EntityDialog>
    </Card>
  );
}

function DebtRow({ debt: d, onOpen }) {
  const { t, lang, fmt } = useSettings();
  const orig = d.original_months || d.remaining || 1;
  const paid = Math.max(0, orig - d.remaining);
  const pct = orig > 0 ? paid / orig : 0;
  return (
    <Box sx={debtRowSx} role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>{d[lang]}</Typography>
        <Chip size="small" label={`${d.rate}% TEA`} color="warning" variant="outlined" />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" color="text.secondary">{fmt(d.balance, true)}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(d.monthly, true)} {t.common.perMonth}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct * 100} sx={debtProgressSx} />
      <Typography variant="caption" color="text.secondary">{d.remaining} {t.goalsTab.installmentsLeft}</Typography>
    </Box>
  );
}
