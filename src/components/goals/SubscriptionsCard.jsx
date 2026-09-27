import { Box, Card, CardContent, FormControl, FormHelperText, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { Add as AddIcon, Subscriptions as SubIcon } from "../../theme/icons";
import { CATEGORIES, toBase, fromBase } from "../../data/index";
import { GradientIcon, CategoryAvatar } from "../../theme/GradientIcon.jsx";
import { resolveCategoryMeta } from "../../theme/categoryIcons.js";
import { suggestCategory } from "../../data/suggest";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext.jsx";
import { useEntityDialog } from "./useEntityDialog.js";
import { EntityDialog } from "./EntityDialog.jsx";
import { EmptySection } from "./EmptySection.jsx";

const EMPTY_SUB = { name: "", price: "", cycle: "monthly", category: "" };

// Yearly subscriptions count as price / 12.
const monthlyTotal = (subs) => subs.reduce((s, sub) => s + (sub.cycle === "yearly" ? sub.price / 12 : sub.price), 0);

export function SubscriptionsCard({ showToast }) {
  const { t, lang, currency, fmt } = useSettings();
  const { txs, subscriptions, saveSubscription, deleteSubscription, customCats } = useData();
  const dialog = useEntityDialog({
    empty: EMPTY_SUB,
    toForm: (s) => ({ ...s, price: String(fromBase(s.price, currency)) }),
    save: saveSubscription,
    remove: deleteSubscription,
    showToast,
    messages: t.goalsTab.subscriptionToasts,
  });
  const { form, update } = dialog;
  const expenseCategories = [...Object.keys(CATEGORIES.expense), ...customCats.filter((cc) => cc.tipo === "EGRESO").map((cc) => `custom_${cc.id}`)];

  // The name fills in the category, as in a transaction: "Netflix" → Streaming (from the
  // catalog, or the category most used with that concept). A category picked by hand stays.
  const changeName = (name) => {
    if (form.category && !form.categorySuggested) return update({ name });
    const s = suggestCategory(name, txs, "EGRESO");
    const category = s && expenseCategories.includes(s.categoria) ? s.categoria : "";
    update({ name, category, categorySuggested: !!category });
  };

  return (
    <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "secondary.main" }}>
      <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <GradientIcon icon={SubIcon} tone="goals" bubble bubbleSize={40} size={22} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{t.goalsTab.subscriptions}</Typography>
              <Typography variant="caption" color="text.secondary">{subscriptions.length} {t.goalsTab.active}{subscriptions.length > 0 ? ` · ${fmt(monthlyTotal(subscriptions))}${t.common.perMonth}` : ""}</Typography>
            </Box>
          </Box>
          <IconButton size="small" aria-label={t.goalsTab.addSubscription} onClick={dialog.openNew} sx={{ bgcolor: "secondary.light", "&:hover": { bgcolor: "secondary.main", color: "common.white" } }}><AddIcon fontSize="small" /></IconButton>
        </Box>
        {subscriptions.length === 0 ? (
          <EmptySection label={t.goalsTab.noSubscriptionsYet} onAdd={dialog.openNew} />
        ) : (
          <>
            <Box sx={{ flex: 1 }}>
              <Stack spacing={1.5}>
                {subscriptions.map((sub) => (
                  <Box key={sub.id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 2, cursor: "pointer" }} role="button" tabIndex={0} onClick={() => dialog.openEdit(sub)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && dialog.openEdit(sub)}>
                    <SubscriptionAvatar sub={sub} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{sub.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{sub.category ? resolveCategoryMeta(sub.category, customCats, lang, "EGRESO").label : "—"}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>{fmt(sub.price, true)}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
            <Box sx={{ mt: 2, p: 2, bgcolor: "secondary.light", borderRadius: 2 }}>
              <Typography variant="body2" color="secondary.dark" fontWeight={600}>
                {t.goalsTab.monthlyTotal} {fmt(monthlyTotal(subscriptions))}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>

      <EntityDialog
        dialog={dialog}
        maxWidth="xs"
        title={dialog.editing ? (t.goalsTab.editSubscription) : (t.goalsTab.newSubscription)}
        canSave={form.name && form.price && parseFloat(form.price) > 0}
        onSave={() => dialog.submit({ ...form, price: toBase(parseFloat(form.price), currency) })}
      >
        <TextField label={t.common.name} value={form.name} inputProps={{ maxLength: 60 }} onChange={(e) => changeName(e.target.value)} fullWidth />
        <TextField
          label={t.goalsTab.price}
          type="number"
          inputProps={{ min: 0 }}
          value={form.price}
          onChange={(e) => update({ price: e.target.value })}
          fullWidth
          helperText={form.cycle === "yearly" && form.price > 0
            ? (t.goalsTab.approxPerMonth((parseFloat(form.price) / 12).toFixed(2)))
            : undefined}
        />
        <FormControl fullWidth>
          <InputLabel id="subscription-cycle-label">{t.goalsTab.cycle}</InputLabel>
          <Select labelId="subscription-cycle-label" value={form.cycle} onChange={(e) => update({ cycle: e.target.value })} label={t.goalsTab.cycle}>
            <MenuItem value="monthly">{t.goalsTab.monthlyCycle}</MenuItem>
            <MenuItem value="yearly">{t.goalsTab.yearly}</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="subscription-category-label">{t.common.category}</InputLabel>
          <Select labelId="subscription-category-label" value={form.category} onChange={(e) => update({ category: e.target.value, categorySuggested: false })} label={t.common.category}>
            {expenseCategories.map((cat) => {
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
          {form.categorySuggested && <FormHelperText>{t.txModal.suggestedFromConcept}</FormHelperText>}
        </FormControl>
      </EntityDialog>
    </Card>
  );
}

// Instead of a logo (which would tell a third-party service what the user pays for), the
// icon and colour of its category; the initial when it has none.
function SubscriptionAvatar({ sub }) {
  const { lang } = useSettings();
  const { customCats } = useData();
  if (sub.category) {
    const { color, Icon } = resolveCategoryMeta(sub.category, customCats, lang, "EGRESO");
    return <CategoryAvatar icon={Icon} color={color} size={40} />;
  }
  return (
    <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: 2, flexShrink: 0, bgcolor: "secondary.light", color: "secondary.dark", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
      {sub.name.charAt(0).toUpperCase()}
    </Box>
  );
}
