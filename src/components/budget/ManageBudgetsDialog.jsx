import { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  List, ListItem, ListItemSecondaryAction, ListItemText, MenuItem, Select, TextField, Typography,
} from "@mui/material";
import { Check as CheckIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from "../../theme/icons";
import { CATEGORIES, toBase, fromBase } from "../../data/index";
import { resolveCategoryMeta } from "../../theme/categoryIcons.js";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext.jsx";

// "Gestionar presupuestos": edit or delete existing budgets and add new ones (native or
// custom expense categories), each weekly, monthly or yearly. Deleting asks for confirmation.
const PERIODS = ["week", "month", "year"];
export function ManageBudgetsDialog({ open, onClose, showToast }) {
  const { t, lang, currency, fmt } = useSettings();
  const { editBudgets, budgetPeriods, setEditBudgets, deleteBudgetCat, customCats } = useData();
  const [newCat, setNewCat] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newPeriod, setNewPeriod] = useState("month");
  const [editExisting, setEditExisting] = useState(null);
  const [editExistingVal, setEditExistingVal] = useState("");
  const [editExistingPeriod, setEditExistingPeriod] = useState("month");
  const [deletingCat, setDeletingCat] = useState(null);

  const catMeta = (cat) => resolveCategoryMeta(cat, customCats, lang, "EGRESO");
  const getCatName = (cat) => catMeta(cat).label;
  const close = () => { onClose(); setEditExisting(null); };

  const handleAddBudget = async () => {
    const v = toBase(parseFloat(newBudget), currency);
    if (!newCat || !(v > 0)) return;
    try {
      await setEditBudgets((b) => ({ ...b, [newCat]: v }), { [newCat]: newPeriod });
      showToast?.(t.budgetTab.budgetAdded);
      setNewCat("");
      setNewBudget("");
      setNewPeriod("month");
    } catch {
      showToast?.(t.budgetTab.errorAddingBudget, "error");
    }
  };

  const startEditExisting = (cat) => {
    setEditExisting(cat);
    setEditExistingVal(String(fromBase(editBudgets[cat], currency)));
    setEditExistingPeriod(budgetPeriods[cat] ?? "month");
  };

  const saveEditExisting = async () => {
    const v = toBase(parseFloat(editExistingVal), currency);
    if (!(v > 0)) { setEditExisting(null); return; }
    try {
      await setEditBudgets((b) => ({ ...b, [editExisting]: v }), { [editExisting]: editExistingPeriod });
      showToast?.(t.budgetTab.budgetUpdated);
    } catch {
      showToast?.(t.budgetTab.errorUpdatingBudget, "error");
    } finally {
      setEditExisting(null);
    }
  };

  const deleteBudget = async (cat) => {
    try {
      await deleteBudgetCat(cat);
      showToast?.(t.budgetTab.budgetDeleted);
    } catch {
      showToast?.(t.budgetTab.errorDeletingBudget, "error");
    } finally {
      setDeletingCat(null);
      onClose();
    }
  };

  const availableCats = [
    ...Object.keys(CATEGORIES.expense).filter((cat) => !editBudgets[cat]),
    ...customCats.filter((cc) => cc.tipo === "EGRESO" && !editBudgets[`custom_${cc.id}`]).map((cc) => `custom_${cc.id}`),
  ];

  return (
    <>
      <Dialog open={open} onClose={close}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t.budgetTab.manageBudgets}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, "&&": { pt: 2 }, minWidth: { xs: "80vw", sm: 360 } }}>
          {Object.keys(editBudgets).length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary">{t.budgetTab.existingBudgets}</Typography>
              <List dense sx={{ bgcolor: "action.hover", borderRadius: 1 }}>
                {Object.entries(editBudgets).map(([cat, amount]) => (
                  <ListItem key={cat} sx={{ py: 0.5 }}>
                    {editExisting === cat ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                        <TextField size="small" type="number" value={editExistingVal} onChange={(e) => setEditExistingVal(e.target.value)} sx={{ flex: 1 }} autoFocus
                          slotProps={{ htmlInput: { "aria-label": t.budgetTab.budgetAmount } }} />
                        <Select size="small" value={editExistingPeriod} onChange={(e) => setEditExistingPeriod(e.target.value)} inputProps={{ "aria-label": t.budgetTab.budgetPeriod }}>
                          {PERIODS.map((p) => <MenuItem key={p} value={p}>{t.budgetTab.periodName(p)}</MenuItem>)}
                        </Select>
                        <IconButton size="small" color="success" onClick={saveEditExisting} aria-label={t.common.save}><CheckIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => setEditExisting(null)} aria-label={t.common.cancel}><CloseIcon fontSize="small" /></IconButton>
                      </Box>
                    ) : (
                      <>
                        <ListItemText primary={getCatName(cat)} secondary={fmt(amount, true) + t.budgetTab.perPeriod(budgetPeriods[cat] ?? "month")} />
                        <ListItemSecondaryAction>
                          <IconButton size="small" onClick={() => startEditExisting(cat)} aria-label={t.budgetTab.editBudget}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeletingCat(cat)} aria-label={t.budgetTab.deleteBudget}><DeleteIcon fontSize="small" /></IconButton>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            </>
          )}
          <Typography variant="subtitle2" color="text.secondary">{t.budgetTab.addNew}</Typography>
          <FormControl fullWidth>
            <InputLabel id="budget-category-label">{t.common.category}</InputLabel>
            <Select labelId="budget-category-label" value={newCat} onChange={(e) => setNewCat(e.target.value)} label={t.common.category}>
              {availableCats.map((cat) => {
                const { label, color, Icon } = catMeta(cat);
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
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField label={t.budgetTab.budgetAmount} type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} sx={{ flex: 1 }} />
            <FormControl sx={{ minWidth: 130 }}>
              <InputLabel id="budget-period-label">{t.budgetTab.budgetPeriod}</InputLabel>
              <Select labelId="budget-period-label" label={t.budgetTab.budgetPeriod} value={newPeriod} onChange={(e) => setNewPeriod(e.target.value)}>
                {PERIODS.map((p) => <MenuItem key={p} value={p}>{t.budgetTab.periodName(p)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Button variant="outlined" onClick={handleAddBudget} disabled={!newCat || !newBudget} startIcon={<AddIcon />}>
            {t.common.add}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{t.common.close}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deletingCat} onClose={() => setDeletingCat(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t.budgetTab.deleteBudget}</DialogTitle>
        <DialogContent>
          <Typography>{t.budgetTab.deleteBudgetFor(getCatName(deletingCat))}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingCat(null)}>{t.common.cancel}</Button>
          <Button color="error" variant="contained" onClick={() => deleteBudget(deletingCat)}>
            {t.common.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
