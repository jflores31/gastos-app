import { Box, Button, Card, CardContent, Chip, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Add as AddIcon, ShowChart as InvestIcon } from "../../theme/icons";
import { fmtMoney, toBase, fromBase } from "../../data/index.js";
import { GradientIcon } from "../../theme/GradientIcon.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useEntityDialog } from "./useEntityDialog.js";
import { EntityDialog } from "./EntityDialog.jsx";
import { EmptySection } from "./EmptySection.jsx";

const EMPTY_INVESTMENT = { es: "", en: "", value: "", return: "", type: "savings" };
const TYPE_CHIP = { retirement: "AFP", term: "DPF", crypto: "Crypto" };

export function InvestmentsSection({ showToast }) {
  const { lang, currency } = useSettings();
  const { investments, saveInvestment, deleteInvestment } = useData();
  const dialog = useEntityDialog({
    empty: EMPTY_INVESTMENT,
    toForm: (inv) => ({ ...inv, value: String(fromBase(inv.value, currency)), return: String(inv.return) }),
    save: saveInvestment,
    remove: deleteInvestment,
    showToast,
    messages: lang === "es"
      ? { saved: "Inversión guardada", saveError: "Error al guardar inversión", deleted: "Inversión eliminada", deleteError: "Error al eliminar inversión" }
      : { saved: "Investment saved", saveError: "Error saving investment", deleted: "Investment deleted", deleteError: "Error deleting investment" },
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
              <Typography variant="h6" fontWeight={700}>{lang === "es" ? "Inversiones" : "Investments"}</Typography>
              <Typography variant="caption" color="text.secondary">{investments.length} {lang === "es" ? "activos" : "assets"}{investments.length > 0 ? ` · ${fmtMoney(totalVal, currency)}` : ""}</Typography>
            </Box>
          </Box>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={dialog.openNew}>{lang === "es" ? "Agregar" : "Add"}</Button>
        </Box>
        {investments.length === 0 ? (
          <EmptySection label={lang === "es" ? "Sin inversiones registradas." : "No investments yet."} onAdd={dialog.openNew} lang={lang} />
        ) : (
          <>
            <Grid container spacing={3}>
              {investments.map((inv) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={inv.id}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2, cursor: "pointer", "&:hover": { boxShadow: 1 } }} onClick={() => dialog.openEdit(inv)}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Typography variant="body1" fontWeight={600}>{inv[lang]}</Typography>
                      <Chip size="small" label={TYPE_CHIP[inv.type] ?? "Ahorro"} color={inv.type === "crypto" ? "error" : "default"} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{fmtMoney(inv.value, currency, true)}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip size="small" label={`${inv.return > 0 ? "+" : ""}${inv.return}%`} color={inv.return >= 0 ? "success" : "error"} variant="outlined" />
                      <Typography variant="caption" color="text.secondary">{lang === "es" ? "rendimiento" : "return"}</Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", bgcolor: "warning.light", p: 2, borderRadius: 2 }}>
              <Box>
                <Typography variant="caption" color="warning.dark">{lang === "es" ? "Total invertido" : "Total invested"}</Typography>
                <Typography variant="h6" fontWeight={700} color="warning.dark">{fmtMoney(totalVal, currency)}</Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="warning.dark">{lang === "es" ? "Promedio rendimiento" : "Avg return"}</Typography>
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
        title={dialog.editing ? (lang === "es" ? "Editar inversión" : "Edit investment") : (lang === "es" ? "Nueva inversión" : "New investment")}
        canSave={form.es && form.value && parseFloat(form.value) > 0}
        onSave={() => dialog.submit({ ...form, value: toBase(parseFloat(form.value), currency), return: parseFloat(form.return) || 0 })}
      >
        <TextField label={lang === "es" ? "Nombre" : "Name"} value={form.es} inputProps={{ maxLength: 60 }} onChange={(e) => update({ es: e.target.value, en: e.target.value })} fullWidth />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <TextField label={lang === "es" ? "Valor" : "Value"} type="number" inputProps={{ min: 0 }} value={form.value} onChange={(e) => update({ value: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField label={lang === "es" ? "Rendimiento %" : "Return %"} type="number" value={form.return} onChange={(e) => update({ return: e.target.value })} fullWidth />
          </Grid>
        </Grid>
        <FormControl fullWidth>
          <InputLabel id="investment-type-label">{lang === "es" ? "Tipo" : "Type"}</InputLabel>
          <Select labelId="investment-type-label" value={form.type} onChange={(e) => update({ type: e.target.value })} label={lang === "es" ? "Tipo" : "Type"}>
            <MenuItem value="retirement">{lang === "es" ? "Jubilación (AFP)" : "Retirement (AFP)"}</MenuItem>
            <MenuItem value="term">{lang === "es" ? "Plazo fijo (DPF)" : "Fixed term (DPF)"}</MenuItem>
            <MenuItem value="savings">{lang === "es" ? "Ahorro" : "Savings"}</MenuItem>
            <MenuItem value="crypto">Crypto</MenuItem>
            <MenuItem value="stocks">{lang === "es" ? "Acciones" : "Stocks"}</MenuItem>
          </Select>
        </FormControl>
      </EntityDialog>
    </Card>
  );
}
