import { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  List, ListItem, ListItemSecondaryAction, ListItemText, MenuItem, Select, TextField, Typography,
} from "@mui/material";
import { Check as CheckIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "../../theme/icons";
import { CATEGORIES, fmtMoney, toBase, fromBase } from "../../data/index.js";
import { resolveCategoryMeta } from "../../theme/categoryIcons.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useData } from "../../context/DataContext.jsx";

// "Gestionar presupuestos": edit or delete existing monthly budgets and add new ones
// (native or custom expense categories). Deleting asks for confirmation.
export function ManageBudgetsDialog({ open, onClose, showToast }) {
  const { lang, currency } = useSettings();
  const { editBudgets, setEditBudgets, deleteBudgetCat, customCats } = useData();
  const [newCat, setNewCat] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [editExisting, setEditExisting] = useState(null);
  const [editExistingVal, setEditExistingVal] = useState("");
  const [deletingCat, setDeletingCat] = useState(null);

  const catMeta = (cat) => resolveCategoryMeta(cat, customCats, lang, "EGRESO");
  const getCatName = (cat) => catMeta(cat).label;
  const close = () => { onClose(); setEditExisting(null); };

  const handleAddBudget = async () => {
    const v = toBase(parseFloat(newBudget), currency);
    if (!newCat || !(v > 0)) return;
    try {
      await setEditBudgets((b) => ({ ...b, [newCat]: v }));
      showToast?.(lang === "es" ? "Presupuesto agregado" : "Budget added");
      setNewCat("");
      setNewBudget("");
    } catch {
      showToast?.(lang === "es" ? "Error al agregar presupuesto" : "Error adding budget", "error");
    }
  };

  const startEditExisting = (cat) => {
    setEditExisting(cat);
    setEditExistingVal(String(fromBase(editBudgets[cat], currency)));
  };

  const saveEditExisting = async () => {
    const v = toBase(parseFloat(editExistingVal), currency);
    if (!(v > 0)) { setEditExisting(null); return; }
    try {
      await setEditBudgets((b) => ({ ...b, [editExisting]: v }));
      showToast?.(lang === "es" ? "Presupuesto actualizado" : "Budget updated");
    } catch {
      showToast?.(lang === "es" ? "Error al actualizar presupuesto" : "Error updating budget", "error");
    } finally {
      setEditExisting(null);
    }
  };

  const deleteBudget = async (cat) => {
    try {
      await deleteBudgetCat(cat);
      showToast?.(lang === "es" ? "Presupuesto eliminado" : "Budget deleted");
    } catch {
      showToast?.(lang === "es" ? "Error al eliminar presupuesto" : "Error deleting budget", "error");
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
        <DialogTitle sx={{ fontWeight: 700 }}>{lang === "es" ? "Gestionar Presupuestos" : "Manage Budgets"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2, minWidth: { xs: "80vw", sm: 360 } }}>
          {Object.keys(editBudgets).length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary">{lang === "es" ? "Presupuestos existentes" : "Existing budgets"}</Typography>
              <List dense sx={{ bgcolor: "action.hover", borderRadius: 1 }}>
                {Object.entries(editBudgets).map(([cat, amount]) => (
                  <ListItem key={cat} sx={{ py: 0.5 }}>
                    {editExisting === cat ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                        <TextField size="small" type="number" value={editExistingVal} onChange={(e) => setEditExistingVal(e.target.value)} sx={{ flex: 1 }} autoFocus />
                        <IconButton size="small" color="success" onClick={saveEditExisting}><CheckIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => setEditExisting(null)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    ) : (
                      <>
                        <ListItemText primary={getCatName(cat)} secondary={fmtMoney(amount, currency, true) + (lang === "es" ? "/mes" : "/month")} />
                        <ListItemSecondaryAction>
                          <IconButton size="small" onClick={() => startEditExisting(cat)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeletingCat(cat)}><DeleteIcon fontSize="small" /></IconButton>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            </>
          )}
          <Typography variant="subtitle2" color="text.secondary">{lang === "es" ? "Agregar nuevo" : "Add new"}</Typography>
          <FormControl fullWidth>
            <InputLabel id="budget-category-label">{lang === "es" ? "Categoría" : "Category"}</InputLabel>
            <Select labelId="budget-category-label" value={newCat} onChange={(e) => setNewCat(e.target.value)} label={lang === "es" ? "Categoría" : "Category"}>
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
          <TextField label={lang === "es" ? "Monto mensual" : "Monthly amount"} type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} fullWidth />
          <Button variant="outlined" onClick={handleAddBudget} disabled={!newCat || !newBudget} startIcon={<AddIcon />}>
            {lang === "es" ? "Agregar" : "Add"}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{lang === "es" ? "Cerrar" : "Close"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deletingCat} onClose={() => setDeletingCat(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{lang === "es" ? "Eliminar presupuesto" : "Delete budget"}</DialogTitle>
        <DialogContent>
          <Typography>{lang === "es" ? `¿Eliminar el presupuesto de "${getCatName(deletingCat)}"?` : `Delete budget for "${getCatName(deletingCat)}"?`}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingCat(null)}>{lang === "es" ? "Cancelar" : "Cancel"}</Button>
          <Button color="error" variant="contained" onClick={() => deleteBudget(deletingCat)}>
            {lang === "es" ? "Eliminar" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
