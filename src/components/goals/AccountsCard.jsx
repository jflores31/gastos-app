import { Box, Card, CardContent, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AccountBalance as BankIcon, CreditCard as CardIcon, AttachMoney as CashIcon } from "../../theme/icons";
import { fmtMoney, toBase, fromBase } from "../../data/index.js";
import { GradientIcon, CategoryAvatar } from "../../theme/GradientIcon.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useEntityDialog } from "./useEntityDialog.js";
import { EntityDialog } from "./EntityDialog.jsx";
import { EmptySection } from "./EmptySection.jsx";

const EMPTY_ACCOUNT = { name: "", type: "bank", balance: "", color: "#0033A0", limit: "" };

// Net worth summary + the list of accounts. `worth` comes from netWorthOf().
export function AccountsCard({ worth, showToast }) {
  const { t, currency } = useSettings();
  const { accounts, saveAccount, deleteAccount } = useData();
  const dialog = useEntityDialog({
    empty: EMPTY_ACCOUNT,
    toForm: (a) => ({ ...a, balance: String(fromBase(a.balance, currency)), limit: a.limit != null ? String(fromBase(a.limit, currency)) : "" }),
    save: saveAccount,
    remove: deleteAccount,
    showToast,
    messages: t.goalsTab.accountToasts,
  });
  const { form, update } = dialog;

  return (
    <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "primary.main" }}>
      <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <GradientIcon icon={BankIcon} tone="networth" bubble bubbleSize={40} size={22} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{t.networth}</Typography>
              <Typography variant="caption" color="text.secondary">{accounts.length} {t.goalsTab.accounts}</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={dialog.openNew} aria-label={t.goalsTab.newAccount} sx={{ bgcolor: "primary.light", "&:hover": { bgcolor: "primary.main", color: "common.white" } }}><AddIcon fontSize="small" /></IconButton>
        </Box>
        <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 3, p: 3, mb: 3 }}>
          <Typography variant="overline" sx={{ opacity: 0.8, display: "block", mb: 0.5 }}>{t.goalsTab.netWorth}</Typography>
          <Typography variant="h4" fontWeight={800}>{fmtMoney(worth.net, currency)}</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{t.goalsTab.assets}</Typography>
              <Typography variant="body1" fontWeight={700}>+{fmtMoney(worth.assets, currency, true)}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{t.goalsTab.debts}</Typography>
              <Typography variant="body1" fontWeight={700}>−{fmtMoney(worth.debt, currency, true)}</Typography>
            </Grid>
          </Grid>
        </Box>
        {accounts.length === 0 ? (
          <EmptySection label={t.goalsTab.noAccountsYet} onAdd={dialog.openNew} />
        ) : (
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1}>
              {accounts.map((a) => (
                <AccountRow key={a.id} account={a} onEdit={() => dialog.openEdit(a)} onDelete={() => dialog.destroy(a.id)} />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>

      <EntityDialog
        dialog={dialog}
        title={dialog.editing ? (t.goalsTab.editAccount) : (t.goalsTab.newAccount)}
        canSave={form.name && form.balance !== ""}
        onSave={() => dialog.submit({ ...form, balance: toBase(parseFloat(form.balance), currency), limit: form.limit ? toBase(parseFloat(form.limit), currency) : undefined })}
      >
        <TextField label={t.common.name} value={form.name} inputProps={{ maxLength: 60 }} onChange={(e) => update({ name: e.target.value })} fullWidth />
        <FormControl fullWidth>
          <InputLabel id="account-type-label">{t.common.type}</InputLabel>
          <Select labelId="account-type-label" value={form.type} onChange={(e) => update({ type: e.target.value })} label={t.common.type}>
            <MenuItem value="bank">{t.goalsTab.bank}</MenuItem>
            <MenuItem value="card">{t.goalsTab.card}</MenuItem>
            <MenuItem value="cash">{t.goalsTab.cash}</MenuItem>
          </Select>
        </FormControl>
        <TextField label={t.goalsTab.balance} type="number" value={form.balance} onChange={(e) => update({ balance: e.target.value })} fullWidth />
        {form.type === "card" && <TextField label={t.goalsTab.limit} type="number" value={form.limit} onChange={(e) => update({ limit: e.target.value })} fullWidth />}
        <TextField label="Color" type="color" value={form.color} onChange={(e) => update({ color: e.target.value })} sx={{ width: 80 }} />
      </EntityDialog>
    </Card>
  );
}

function AccountRow({ account: a, onEdit, onDelete }) {
  const { t, currency } = useSettings();
  const isDebt = a.balance < 0;
  const utilPct = isDebt && a.limit ? Math.abs(a.balance) / a.limit : 0;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
      <CategoryAvatar icon={a.type === "bank" ? BankIcon : a.type === "card" ? CardIcon : CashIcon} color={a.color} size={36} />
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {a.type === "bank" ? (t.goalsTab.bank) : a.type === "card" ? (t.goalsTab.card) : (t.goalsTab.cash)}
          {isDebt && a.limit ? ` · ${Math.round(utilPct * 100)}%` : ""}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton size="small" aria-label={t.common.edit} onClick={onEdit}><EditIcon fontSize="small" /></IconButton>
        <IconButton size="small" color="error" aria-label={t.common.delete} onClick={onDelete}><DeleteIcon fontSize="small" /></IconButton>
        <Typography variant="body2" fontWeight={700} color={isDebt ? "error.main" : "success.main"} sx={{ minWidth: 80, textAlign: "right" }}>
          {isDebt ? "−" : "+"}{fmtMoney(Math.abs(a.balance), currency, true)}
        </Typography>
      </Box>
    </Box>
  );
}
