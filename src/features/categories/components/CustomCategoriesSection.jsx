import { useState } from "react";
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItem, ListItemText,
  TextField, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@/theme/icons";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { CategoryAvatar } from "@/components/ui/GradientIcon";
import { IconPicker } from "@/components/ui/IconPicker";
import { DEFAULT_ICON, iconByName } from "@/theme/categoryIcons";
import { dialogColumnSx, typeToggleSx } from "@/theme/tokens";
import { COLOR_PRESETS, NEW_CATEGORY_COLOR, categoryRowSx, colorSwatchSx } from "./CustomCategoriesSection.styles";

const EMPTY_CAT = { nombre: "", tipo: "EGRESO", color: NEW_CATEGORY_COLOR, icon: "Category" };

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
          slotProps={{ primary: { variant: "overline" }, secondary: { variant: "caption" } }}
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
                <Box key={c.id} sx={categoryRowSx}>
                  <CategoryAvatar icon={iconByName(c.icon) || DEFAULT_ICON} color={c.color} size={28} />
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{c.nombre}</Typography>
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
        {/* 12px of padding-top: the floating label rises ~9px above its field. */}
        <DialogContent sx={dialogColumnSx(2, 1.5)}>
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
              <ToggleButton value="EGRESO" sx={typeToggleSx("error")}>
                {t.settingsPanel.expense}
              </ToggleButton>
              <ToggleButton value="INGRESO" sx={typeToggleSx("success")}>
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
                  sx={colorSwatchSx(c, catForm.color === c)}
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
