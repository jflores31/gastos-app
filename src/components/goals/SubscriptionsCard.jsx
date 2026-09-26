import { Box, Card, CardContent, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { Add as AddIcon, Subscriptions as SubIcon } from "../../theme/icons";
import { fmtMoney, CATEGORIES, toBase, fromBase } from "../../data/index.js";
import { GradientIcon } from "../../theme/GradientIcon.jsx";
import { resolveCategoryMeta } from "../../theme/categoryIcons.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useEntityDialog } from "./useEntityDialog.js";
import { EntityDialog } from "./EntityDialog.jsx";
import { EmptySection } from "./EmptySection.jsx";

const EMPTY_SUB = { name: "", price: "", cycle: "monthly", category: "" };

// Yearly subscriptions count as price / 12.
const monthlyTotal = (subs) => subs.reduce((s, sub) => s + (sub.cycle === "yearly" ? sub.price / 12 : sub.price), 0);

export function SubscriptionsCard({ showToast }) {
  const { lang, currency } = useSettings();
  const { subscriptions, saveSubscription, deleteSubscription, customCats } = useData();
  const dialog = useEntityDialog({
    empty: EMPTY_SUB,
    toForm: (s) => ({ ...s, price: String(fromBase(s.price, currency)) }),
    save: saveSubscription,
    remove: deleteSubscription,
    showToast,
    messages: lang === "es"
      ? { saved: "Suscripción guardada", saveError: "Error al guardar suscripción", deleted: "Suscripción eliminada", deleteError: "Error al eliminar suscripción" }
      : { saved: "Subscription saved", saveError: "Error saving subscription", deleted: "Subscription deleted", deleteError: "Error deleting subscription" },
  });
  const { form, update } = dialog;
  const categoryName = (cat) => cat?.startsWith("custom_")
    ? (customCats.find((c) => c.id === cat.slice("custom_".length))?.nombre || cat)
    : (CATEGORIES.expense[cat]?.[lang] || cat || "—");

  return (
    <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "secondary.main" }}>
      <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <GradientIcon icon={SubIcon} tone="goals" bubble bubbleSize={40} size={22} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{lang === "es" ? "Suscripciones" : "Subscriptions"}</Typography>
              <Typography variant="caption" color="text.secondary">{subscriptions.length} {lang === "es" ? "activas" : "active"}{subscriptions.length > 0 ? ` · ${fmtMoney(monthlyTotal(subscriptions), currency)}${lang === "es" ? "/mes" : "/month"}` : ""}</Typography>
            </Box>
          </Box>
          <IconButton size="small" aria-label={lang === "es" ? "Agregar suscripción" : "Add subscription"} onClick={dialog.openNew} sx={{ bgcolor: "secondary.light", "&:hover": { bgcolor: "secondary.main", color: "common.white" } }}><AddIcon fontSize="small" /></IconButton>
        </Box>
        {subscriptions.length === 0 ? (
          <EmptySection label={lang === "es" ? "Sin suscripciones registradas." : "No subscriptions yet."} onAdd={dialog.openNew} lang={lang} />
        ) : (
          <>
            <Box sx={{ flex: 1 }}>
              <Stack spacing={1.5}>
                {subscriptions.map((sub) => (
                  <Box key={sub.id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 2, cursor: "pointer" }} role="button" tabIndex={0} onClick={() => dialog.openEdit(sub)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && dialog.openEdit(sub)}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "secondary.light", color: "secondary.dark", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                      {sub.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{sub.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{categoryName(sub.category)}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>{fmtMoney(sub.price, currency, true)}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
            <Box sx={{ mt: 2, p: 2, bgcolor: "secondary.light", borderRadius: 2 }}>
              <Typography variant="body2" color="secondary.dark" fontWeight={600}>
                {lang === "es" ? "Total mensual:" : "Monthly total:"} {fmtMoney(monthlyTotal(subscriptions), currency)}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>

      <EntityDialog
        dialog={dialog}
        maxWidth="xs"
        title={dialog.editing ? (lang === "es" ? "Editar suscripción" : "Edit subscription") : (lang === "es" ? "Nueva suscripción" : "New subscription")}
        canSave={form.name && form.price && parseFloat(form.price) > 0}
        onSave={() => dialog.submit({ ...form, price: toBase(parseFloat(form.price), currency) })}
      >
        <TextField label={lang === "es" ? "Nombre" : "Name"} value={form.name} inputProps={{ maxLength: 60 }} onChange={(e) => update({ name: e.target.value })} fullWidth />
        <TextField
          label={lang === "es" ? "Precio" : "Price"}
          type="number"
          inputProps={{ min: 0 }}
          value={form.price}
          onChange={(e) => update({ price: e.target.value })}
          fullWidth
          helperText={form.cycle === "yearly" && form.price > 0
            ? (lang === "es" ? `≈ ${(parseFloat(form.price) / 12).toFixed(2)}/mes` : `≈ ${(parseFloat(form.price) / 12).toFixed(2)}/month`)
            : undefined}
        />
        <FormControl fullWidth>
          <InputLabel id="subscription-cycle-label">{lang === "es" ? "Ciclo" : "Cycle"}</InputLabel>
          <Select labelId="subscription-cycle-label" value={form.cycle} onChange={(e) => update({ cycle: e.target.value })} label={lang === "es" ? "Ciclo" : "Cycle"}>
            <MenuItem value="monthly">{lang === "es" ? "Mensual" : "Monthly"}</MenuItem>
            <MenuItem value="yearly">{lang === "es" ? "Anual" : "Yearly"}</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="subscription-category-label">{lang === "es" ? "Categoría" : "Category"}</InputLabel>
          <Select labelId="subscription-category-label" value={form.category} onChange={(e) => update({ category: e.target.value })} label={lang === "es" ? "Categoría" : "Category"}>
            {[...Object.keys(CATEGORIES.expense), ...customCats.filter((cc) => cc.tipo === "EGRESO").map((cc) => `custom_${cc.id}`)].map((cat) => {
              const { label, color, Icon } = resolveCategoryMeta(cat, customCats, lang, "EGRESO");
              return (
                <MenuItem key={cat} value={cat}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Icon fontSize="small" sx={{ color }} />
                    {label}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </EntityDialog>
    </Card>
  );
}
