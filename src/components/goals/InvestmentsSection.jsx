import { Box, Button, Card, CardContent, Chip, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Add as AddIcon, ShowChart as InvestIcon } from "@/theme/icons";
import { toBase, fromBase } from "@/domain/money";
import { GradientIcon } from "../ui/GradientIcon";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext.jsx";
import { useEntityDialog } from "../forms/useEntityDialog";
import { EntityDialog } from "../forms/EntityDialog";
import { EmptySection } from "../ui/EmptySection";

const EMPTY_INVESTMENT = { es: "", en: "", value: "", return: "", type: "savings" };
const typeChip = (type, t) =>
  ({ retirement: "AFP", term: "DPF", crypto: "Crypto", stocks: t.goalsTab.stocks })[type]
  ?? t.goalsTab.savings;

export function InvestmentsSection({ showToast }) {
  const { t, lang, currency, fmt } = useSettings();
  const { investments, saveInvestment, deleteInvestment } = useData();
  const dialog = useEntityDialog({
    empty: EMPTY_INVESTMENT,
    toForm: (inv) => ({ ...inv, value: String(fromBase(inv.value, currency)), return: String(inv.return) }),
    save: saveInvestment,
    remove: deleteInvestment,
    showToast,
    messages: t.goalsTab.investmentToasts,
  });
  const { form, update } = dialog;
  const totalVal = investments.reduce((s, i) => s + i.value, 0);
  const weightedReturn = totalVal > 0 ? investments.reduce((s, i) => s + i.value * i.return, 0) / totalVal : 0;

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "warning.main" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <GradientIcon icon={InvestIcon} tone="budget" bubble bubbleSize={40} size={22} />
            <Box>
              <Typography variant="h6" fontWeight={700}>{t.goalsTab.investments}</Typography>
              <Typography variant="caption" color="text.secondary">{investments.length} {t.goalsTab.assetsCount}{investments.length > 0 ? ` · ${fmt(totalVal)}` : ""}</Typography>
            </Box>
          </Box>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={dialog.openNew}>{t.common.add}</Button>
        </Box>
        {investments.length === 0 ? (
          <EmptySection label={t.goalsTab.noInvestmentsYet} onAdd={dialog.openNew} />
        ) : (
          <>
            <Grid container spacing={3}>
              {investments.map((inv) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={inv.id}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2, cursor: "pointer", "&:hover": { boxShadow: 1 } }} onClick={() => dialog.openEdit(inv)}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Typography variant="body1" fontWeight={600}>{inv[lang]}</Typography>
                      <Chip size="small" label={typeChip(inv.type, t)} color={inv.type === "crypto" ? "error" : "default"} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{fmt(inv.value, true)}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip size="small" label={`${inv.return > 0 ? "+" : ""}${inv.return}%`} color={inv.return >= 0 ? "success" : "error"} variant="outlined" />
                      <Typography variant="caption" color="text.secondary">{t.goalsTab.returnLabel}</Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", bgcolor: "warning.light", p: 2, borderRadius: 2 }}>
              <Box>
                <Typography variant="caption" color="warning.dark">{t.goalsTab.totalInvested}</Typography>
                <Typography variant="h6" fontWeight={700} color="warning.dark">{fmt(totalVal)}</Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="warning.dark">{t.goalsTab.avgReturn}</Typography>
                <Typography variant="h6" fontWeight={700} color={weightedReturn >= 0 ? "success.dark" : "error.dark"}>
                  {weightedReturn >= 0 ? "+" : ""}{weightedReturn.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>

      <EntityDialog
        dialog={dialog}
        title={dialog.editing ? (t.goalsTab.editInvestment) : (t.goalsTab.newInvestment)}
        canSave={form.es && form.value && parseFloat(form.value) > 0}
        onSave={() => dialog.submit({ ...form, value: toBase(parseFloat(form.value), currency), return: parseFloat(form.return) || 0 })}
      >
        <TextField label={t.common.name} value={form.es} inputProps={{ maxLength: 60 }} onChange={(e) => update({ es: e.target.value, en: e.target.value })} fullWidth />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <TextField label={t.goalsTab.value} type="number" inputProps={{ min: 0 }} value={form.value} onChange={(e) => update({ value: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField label={t.goalsTab.returnPct} type="number" value={form.return} onChange={(e) => update({ return: e.target.value })} fullWidth />
          </Grid>
        </Grid>
        <FormControl fullWidth>
          <InputLabel id="investment-type-label">{t.common.type}</InputLabel>
          <Select labelId="investment-type-label" value={form.type} onChange={(e) => update({ type: e.target.value })} label={t.common.type}>
            <MenuItem value="retirement">{t.goalsTab.retirementAfp}</MenuItem>
            <MenuItem value="term">{t.goalsTab.fixedTermDpf}</MenuItem>
            <MenuItem value="savings">{t.goalsTab.savings}</MenuItem>
            <MenuItem value="crypto">Crypto</MenuItem>
            <MenuItem value="stocks">{t.goalsTab.stocks}</MenuItem>
          </Select>
        </FormControl>
      </EntityDialog>
    </Card>
  );
}
