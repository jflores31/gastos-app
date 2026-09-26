import { useState } from "react";
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItem, ListItemText,
  TextField, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "../../theme/icons";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext.jsx";
import { CategoryAvatar } from "../../theme/GradientIcon.jsx";
import { IconPicker } from "../../theme/IconPicker.jsx";
import { DEFAULT_ICON, iconByName } from "../../theme/categoryIcons.js";

const COLOR_PRESETS = ["#e74c3c","#e67e22","#f39c12","#2ecc71","#1abc9c","#3498db","#9b59b6","#e91e63","#607d8b","#9e9e9e"];
const EMPTY_CAT = { nombre: "", tipo: "EGRESO", color: "#9e9e9e", icon: "Category" };

// "Mis categorías" in the profile tab: list, create/edit dialog and delete confirmation.
// `notify(msg, severity)` shows the panel's snackbar.
export function CustomCategoriesSection({ notify }) {
  const { t } = useSettings();
  const { customCats, saveCustomCat, deleteCustomCat } = useData();
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [catError, setCatError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCatDialog = (cat = null) => {
    setEditingCat(cat);
    setCatForm(cat ? { nombre: cat.nombre, tipo: cat.tipo, color: cat.color, icon: cat.icon || "Category" } : EMPTY_CAT);
    setCatError("");
    setCatDialog(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.nombre.trim()) { setCatError(t.settingsPanel.enterAName); return; }
    try {
      await saveCustomCat({ ...catForm, nombre: catForm.nombre.trim(), id: editingCat?.id });
      setCatDialog(false);
      notify(editingCat
        ? (t.settingsPanel.categoryUpdated)
        : (t.settingsPanel.categoryCreated), "success");
    } catch {
      notify(t.settingsPanel.errorSavingCategory, "error");
    }
  };

  const handleDeleteCat = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomCat(deleteTarget.id);
      setDeleteTarget(null);
      notify(t.settingsPanel.categoryDeleted, "success");
    } catch {
      setDeleteTarget(null);
      notify(t.settingsPanel.errorDeletingCategory, "error");
    }
  };

  return (
    <>
      <ListItem
        secondaryAction={
          <Button size="small" startIcon={<AddIcon />} onClick={() => openCatDialog()} variant="outlined" sx={{ borderRadius: 2 }}>
            {t.settingsPanel.new}
          </Button>
        }
      >
        <ListItemText
          primary={t.settingsPanel.myCategories}
          secondary={t.settingsPanel.customCategoriesForYourTransactions}
          primaryTypographyProps={{ variant: "overline" }}
          secondaryTypographyProps={{ variant: "caption" }}
        />
      </ListItem>
      <ListItem sx={{ pt: 0, pb: 3 }}>
        <Box sx={{ width: "100%" }}>
          {customCats.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
              {t.settingsPanel.noneYetCreateYourFirst}
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {customCats.map((c) => (
                <Box key={c.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, bgcolor: "action.hover" }}>
                  <CategoryAvatar icon={iconByName(c.icon) || DEFAULT_ICON} color={c.color} size={28} />
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{c.nombre}</Typography>
                  <Chip label={c.tipo === "EGRESO" ? (t.settingsPanel.expense) : (t.settingsPanel.incomeType)}
                    size="small" color={c.tipo === "EGRESO" ? "error" : "success"} variant="outlined" sx={{ fontSize: 10 }} />
                  <IconButton onClick={() => openCatDialog(c)} aria-label={t.settingsPanel.editCategoryLabel} sx={{ minWidth: 40, minHeight: 40 }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton color="error" onClick={() => setDeleteTarget(c)} aria-label={t.settingsPanel.deleteCategory} sx={{ minWidth: 40, minHeight: 40 }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </ListItem>

      <Dialog open={catDialog} onClose={() => setCatDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingCat
            ? (t.settingsPanel.editCategoryTitle)
            : (t.settingsPanel.newCategory)}
        </DialogTitle>
        {/* "&&" beats MUI's padding-top: 0 after a DialogTitle (see goals/EntityDialog.jsx).
            12px: the floating label rises ~9px above its field. */}
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, "&&": { pt: 1.5 } }}>
          <TextField
            label={t.common.name}
            value={catForm.nombre}
            onChange={(e) => { setCatForm((f) => ({ ...f, nombre: e.target.value })); setCatError(""); }}
            error={!!catError}
            helperText={catError}
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { maxLength: 40 } }}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              {t.common.type}
            </Typography>
            <ToggleButtonGroup
              value={catForm.tipo}
              exclusive
              onChange={(_, v) => { if (v) setCatForm((f) => ({ ...f, tipo: v })); }}
              fullWidth
              size="small"
            >
              <ToggleButton value="EGRESO" sx={{ fontWeight: 600, color: "error.main", "&.Mui-selected": { bgcolor: "error.light", color: "error.dark" } }}>
                {t.settingsPanel.expense}
              </ToggleButton>
              <ToggleButton value="INGRESO" sx={{ fontWeight: 600, color: "success.main", "&.Mui-selected": { bgcolor: "success.light", color: "success.dark" } }}>
                {t.settingsPanel.incomeType}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              {t.settingsPanel.color}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {COLOR_PRESETS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setCatForm((f) => ({ ...f, color: c }))}
                  role="radio" aria-checked={catForm.color === c} aria-label={c} tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setCatForm((f) => ({ ...f, color: c }))}
                  sx={{
                    width: 32, height: 32, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                    border: catForm.color === c ? "3px solid" : "2px solid transparent",
                    borderColor: catForm.color === c ? "text.primary" : "transparent",
                    transition: "transform 0.15s",
                    "&:hover": { transform: "scale(1.2)" },
                  }}
                />
              ))}
            </Box>
          </Box>
          <IconPicker
            label={t.common.icon}
            value={catForm.icon}
            color={catForm.color}
            onChange={(icon) => setCatForm((f) => ({ ...f, icon }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCatDialog(false)} color="inherit">
            {t.common.cancel}
          </Button>
          <Button onClick={handleSaveCat} variant="contained">
            {t.common.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t.settingsPanel.deleteCategory}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t.settingsPanel.confirmDeleteCategory(deleteTarget?.nombre)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            {t.common.cancel}
          </Button>
          <Button onClick={handleDeleteCat} variant="contained" color="error">
            {t.common.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
