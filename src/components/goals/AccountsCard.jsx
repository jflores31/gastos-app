import { useState } from "react";
import { Box, Card, CardContent, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AccountBalance as BankIcon, CreditCard as CardIcon, AttachMoney as CashIcon, SwapHoriz as SwapIcon } from "@/theme/icons";
import { toBase, fromBase } from "@/domain/money";
import { GradientIcon, CategoryAvatar } from "../../theme/GradientIcon.jsx";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext.jsx";
import { useEntityDialog } from "./useEntityDialog.js";
import { EntityDialog } from "./EntityDialog.jsx";
import { EmptySection } from "./EmptySection.jsx";
import { TransferDialog } from "./TransferDialog.jsx";

const EMPTY_ACCOUNT = { name: "", type: "bank", balance: "", color: "#0033A0", limit: "" };

// What the balance field shows: today's balance, in the chosen currency.
const balanceField = (a, currency) => String(fromBase(a.current ?? a.balance, currency));

// Net worth summary, the list of accounts with today's balance, transfers between them.
// `worth` comes from netWorthOf().
export function AccountsCard({ worth, showToast }) {
  const { t, currency, fmt } = useSettings();
  const { accounts, saveAccount, deleteAccount } = useData();
  const [transferring, setTransferring] = useState(false);
  const dialog = useEntityDialog({
    empty: EMPTY_ACCOUNT,
    toForm: (a) => ({ ...a, balance: balanceField(a, currency), limit: a.limit != null ? String(fromBase(a.limit, currency)) : "" }),
    save: saveAccount,
    remove: deleteAccount,
    showToast,
    messages: t.goalsTab.accountToasts,
  });
  const { form, update } = dialog;

  // A balance typed in is today's: it replaces the stored one as of now, and later movements
  // add to it. Left as shown, the stored balance and its date stay as they were.
  const handleSave = () => {
    const edited = dialog.editing;
    const kept = edited && form.balance === balanceField(edited, currency);
    dialog.submit({
      ...form,
      balance: kept ? edited.balance : toBase(parseFloat(form.balance), currency),
      balanceAt: kept ? edited.balanceAt : new Date(),
      limit: form.limit ? toBase(parseFloat(form.limit), currency) : undefined,
    });
  };

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
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title={t.goalsTab.transfer}>
              {/* A disabled button fires no events: the span keeps the tooltip working. */}
              <span>
                <IconButton size="small" onClick={() => setTransferring(true)} disabled={accounts.length < 2} aria-label={t.goalsTab.newTransfer} sx={{ bgcolor: "primary.light", "&:hover": { bgcolor: "primary.main", color: "common.white" } }}><SwapIcon fontSize="small" /></IconButton>
              </span>
            </Tooltip>
            <IconButton size="small" onClick={dialog.openNew} aria-label={t.goalsTab.newAccount} sx={{ bgcolor: "primary.light", "&:hover": { bgcolor: "primary.main", color: "common.white" } }}><AddIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
        <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 3, p: 3, mb: 3 }}>
          <Typography variant="overline" sx={{ opacity: 0.8, display: "block", mb: 0.5 }}>{t.goalsTab.netWorth}</Typography>
          <Typography variant="h4" fontWeight={800}>{fmt(worth.net)}</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{t.goalsTab.assets}</Typography>
              <Typography variant="body1" fontWeight={700}>+{fmt(worth.assets, true)}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{t.goalsTab.debts}</Typography>
              <Typography variant="body1" fontWeight={700}>−{fmt(worth.debt, true)}</Typography>
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
            <RecentTransfers showToast={showToast} />
          </Box>
        )}
      </CardContent>

      {transferring && <TransferDialog onClose={() => setTransferring(false)} showToast={showToast} />}

      <EntityDialog
        dialog={dialog}
        title={dialog.editing ? (t.goalsTab.editAccount) : (t.goalsTab.newAccount)}
        canSave={form.name && form.balance !== ""}
        onSave={handleSave}
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
        <TextField label={t.goalsTab.balance} type="number" value={form.balance} onChange={(e) => update({ balance: e.target.value })} fullWidth
          helperText={t.goalsTab.balanceHint} />
        {form.type === "card" && <TextField label={t.goalsTab.limit} type="number" value={form.limit} onChange={(e) => update({ limit: e.target.value })} fullWidth />}
        <TextField label="Color" type="color" value={form.color} onChange={(e) => update({ color: e.target.value })} sx={{ width: 80 }} />
      </EntityDialog>
    </Card>
  );
}

function AccountRow({ account: a, onEdit, onDelete }) {
  const { t, fmt } = useSettings();
  const balance = a.current ?? a.balance;
  const isDebt = balance < 0;
  const utilPct = isDebt && a.limit ? Math.abs(balance) / a.limit : 0;
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
          {isDebt ? "−" : "+"}{fmt(Math.abs(balance), true)}
        </Typography>
      </Box>
    </Box>
  );
}

// The last transfers, newest first, each with its delete button.
const RECENT_TRANSFERS = 5;
function RecentTransfers({ showToast }) {
  const { t, fmt } = useSettings();
  const { transfers, accounts, deleteTransfer } = useData();
  if (transfers.length === 0) return null;
  const name = (id) => accounts.find((a) => a.id === id)?.name ?? t.goalsTab.removedAccount;
  const recent = [...transfers].sort((a, b) => b.date - a.date).slice(0, RECENT_TRANSFERS);
  const remove = async (id) => {
    try {
      await deleteTransfer(id);
      showToast?.(t.goalsTab.transferToasts.deleted, "success");
    } catch {
      showToast?.(t.goalsTab.transferToasts.deleteError, "error");
    }
  };
  return (
    <Box component="section" aria-label={t.goalsTab.transfers} sx={{ mt: 2 }}>
      <Typography variant="overline" color="text.secondary" component="h3">{t.goalsTab.transfers}</Typography>
      <Stack spacing={0.5}>
        {recent.map((tr) => (
          <Box key={tr.id} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, bgcolor: "action.hover", borderRadius: 2 }}>
            <SwapIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{name(tr.origen)} → {name(tr.destino)}</Typography>
              <Typography variant="caption" color="text.secondary" component="div" noWrap>
                {tr.date.toLocaleDateString(t.common.locale, { day: "numeric", month: "short", year: "numeric" })}{tr.nota ? ` · ${tr.nota}` : ""}
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>{fmt(tr.monto, true)}</Typography>
            <IconButton size="small" color="error" aria-label={t.goalsTab.deleteTransfer(name(tr.origen), name(tr.destino))} onClick={() => remove(tr.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
