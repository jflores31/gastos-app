"use client"

import { useState, useMemo } from "react";
import {
  Drawer, Box, Typography, Divider, Avatar,
  Chip, Select, MenuItem, FormControl, InputLabel, IconButton, List, ListItem, ListItemText,
  Autocomplete, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButtonGroup, ToggleButton, Snackbar, Alert,
} from "@mui/material";
import { Close as CloseIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, Person as PersonIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "../theme/icons";
import { useSettings, PALETTES as PALETTES_MAP } from "../context/SettingsContext.jsx";
import { useSupabaseUser } from "../context/UserContext";
import { useData } from "../context/DataContext.jsx";
import { CURRENCIES, CATEGORIES } from "../data/index.js";
import { createClient } from "../lib/supabase";

const PALETTES = Object.entries(PALETTES_MAP).map(([key, val]) => ({ key, ...val }));

const COLOR_PRESETS = ["#e74c3c","#e67e22","#f39c12","#2ecc71","#1abc9c","#3498db","#9b59b6","#e91e63","#607d8b","#9e9e9e"];
const EMPTY_CAT = { nombre: "", tipo: "EGRESO", color: "#9e9e9e" };

export default function SettingsPanel({ open, onClose }) {
  const { theme, setTheme, density, setDensity, palette, setPalette, lang, setLang, currency, setCurrency } = useSettings();
  const user = useSupabaseUser();
  const { customCats, saveCustomCat, deleteCustomCat } = useData();
  const [favInput, setFavInput] = useState(null);
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [catError, setCatError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snack, setSnack] = useState(null);

  const fullName = user?.user_metadata?.full_name || "";
  const email = user?.email || "";
  const displayName = fullName || email || "Usuario";
  const avatarSrc = user?.user_metadata?.avatar_url || undefined;
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (email[0] || "U").toUpperCase();

  const favCats = useMemo(() => user?.user_metadata?.fav_categories || [], [user]);

  const allCatOptions = useMemo(() => [
    ...Object.entries(CATEGORIES.expense).map(([k, v]) => ({
      value: k, tipo: "EGRESO",
      label: lang === "es" ? v.es : v.en,
      group: lang === "es" ? "Gastos" : "Expenses",
    })),
    ...Object.entries(CATEGORIES.income).map(([k, v]) => ({
      value: k, tipo: "INGRESO",
      label: lang === "es" ? v.es : v.en,
      group: lang === "es" ? "Ingresos" : "Income",
    })),
  ].filter((o) => !favCats.find((f) => f.categoria === o.value)), [lang, favCats]);

  const saveFavCats = async (newList) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { fav_categories: newList } });
    if (error) setSnack({ msg: lang === "es" ? "Error al guardar favoritos" : "Error saving favorites", severity: "error" });
    return !error;
  };

  const handleAddFav = async (option) => {
    if (!option) return;
    const ok = await saveFavCats([...favCats, { categoria: option.value, tipo: option.tipo }]);
    if (ok) setFavInput(null);
  };

  const handleRemoveFav = async (categoria) => {
    await saveFavCats(favCats.filter((f) => f.categoria !== categoria));
  };

  const openCatDialog = (cat = null) => {
    setEditingCat(cat);
    setCatForm(cat ? { nombre: cat.nombre, tipo: cat.tipo, color: cat.color } : EMPTY_CAT);
    setCatError("");
    setCatDialog(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.nombre.trim()) { setCatError(lang === "es" ? "Ingresa un nombre" : "Enter a name"); return; }
    try {
      await saveCustomCat({ ...catForm, nombre: catForm.nombre.trim(), id: editingCat?.id });
      setCatDialog(false);
      setSnack({ msg: editingCat
        ? (lang === "es" ? "Categoría actualizada" : "Category updated")
        : (lang === "es" ? "Categoría creada" : "Category created"), severity: "success" });
    } catch {
      setSnack({ msg: lang === "es" ? "Error al guardar categoría" : "Error saving category", severity: "error" });
    }
  };

  const handleDeleteCat = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomCat(deleteTarget.id);
      setDeleteTarget(null);
      setSnack({ msg: lang === "es" ? "Categoría eliminada" : "Category deleted", severity: "success" });
    } catch {
      setDeleteTarget(null);
      setSnack({ msg: lang === "es" ? "Error al eliminar categoría" : "Error deleting category", severity: "error" });
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 360 }, p: 0, overflowY: "auto" } }}>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={700}>{lang === "es" ? "Perfil y Ajustes" : "Profile & Settings"}</Typography>
        <IconButton onClick={onClose} aria-label="Close"><CloseIcon /></IconButton>
      </Box>
      <Divider />

      {user && (
        <>
          <Box sx={{ px: 3, py: 2.5, display: "flex", alignItems: "center", gap: 2, bgcolor: "primary.main", color: "primary.contrastText" }}>
            <Avatar
              src={avatarSrc}
              sx={{ width: 56, height: 56, bgcolor: "primary.light", color: "primary.dark", fontWeight: 700, fontSize: 20 }}
            >
              {initials || <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>{displayName}</Typography>
              {fullName && <Typography variant="caption" noWrap sx={{ opacity: 0.85 }}>{email}</Typography>}
            </Box>
          </Box>
          <Divider />
        </>
      )}

      <List disablePadding>
        <ListItem>
          <ListItemText primary={lang === "es" ? "Tema" : "Theme"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <Chip icon={<LightModeIcon />} label={lang === "es" ? "Claro" : "Light"} variant={theme === "light" ? "filled" : "outlined"} color={theme === "light" ? "primary" : "default"} onClick={() => setTheme("light")} sx={{ flex: 1 }} />
            <Chip icon={<DarkModeIcon />} label={lang === "es" ? "Oscuro" : "Dark"} variant={theme === "dark" ? "filled" : "outlined"} color={theme === "dark" ? "primary" : "default"} onClick={() => setTheme("dark")} sx={{ flex: 1 }} />
          </Box>
        </ListItem>

        <Divider variant="middle" />

        <ListItem>
          <ListItemText primary={lang === "es" ? "Densidad" : "Density"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <Chip label={lang === "es" ? "Cómoda" : "Comfy"} variant={density === "comfy" ? "filled" : "outlined"} color={density === "comfy" ? "primary" : "default"} onClick={() => setDensity("comfy")} sx={{ flex: 1 }} />
            <Chip label={lang === "es" ? "Compacta" : "Compact"} variant={density === "compact" ? "filled" : "outlined"} color={density === "compact" ? "primary" : "default"} onClick={() => setDensity("compact")} sx={{ flex: 1 }} />
          </Box>
        </ListItem>

        <Divider variant="middle" />

        <ListItem>
          <ListItemText primary={lang === "es" ? "Color de acento" : "Accent color"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {PALETTES.map((p) => (
              <Box key={p.key} onClick={() => setPalette(p.key)} role="radio" aria-checked={palette === p.key} aria-label={p.label} tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setPalette(p.key)}
                sx={{
                  width: 40, height: 40, borderRadius: "50%", bgcolor: p.color, cursor: "pointer",
                  border: palette === p.key ? "3px solid" : "2px solid transparent",
                  borderColor: palette === p.key ? "text.primary" : "transparent",
                  transition: "transform 0.15s, border-color 0.15s",
                  "&:hover": { transform: "scale(1.15)" },
                }} title={p.label} />
            ))}
          </Box>
        </ListItem>

        <Divider variant="middle" />

        <ListItem>
          <ListItemText primary={lang === "es" ? "Idioma" : "Language"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <Chip label="🇵🇪 Español" variant={lang === "es" ? "filled" : "outlined"} color={lang === "es" ? "primary" : "default"} onClick={() => setLang("es")} sx={{ flex: 1 }} />
            <Chip label="🇺🇸 English" variant={lang === "en" ? "filled" : "outlined"} color={lang === "en" ? "primary" : "default"} onClick={() => setLang("en")} sx={{ flex: 1 }} />
          </Box>
        </ListItem>

        <Divider variant="middle" />

        <ListItem>
          <ListItemText primary={lang === "es" ? "Moneda" : "Currency"} primaryTypographyProps={{ variant: "overline" }} />
        </ListItem>
        <ListItem sx={{ pt: 0 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{lang === "es" ? "Moneda" : "Currency"}</InputLabel>
            <Select value={currency} label={lang === "es" ? "Moneda" : "Currency"} onChange={(e) => setCurrency(e.target.value)}>
              {Object.entries(CURRENCIES).map(([k, c]) => (
                <MenuItem key={k} value={k}>{c.symbol} {k} · {c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListItem>

        {user && (
          <>
            <Divider variant="middle" />

            <ListItem>
              <ListItemText
                primary={lang === "es" ? "Categorías Favoritas" : "Favorite Categories"}
                secondary={lang === "es" ? "Aparecen primero en el selector" : "Shown first in the selector"}
                primaryTypographyProps={{ variant: "overline" }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </ListItem>
            <ListItem sx={{ pt: 0, flexDirection: "column", alignItems: "stretch", gap: 1.5 }}>
              {favCats.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {favCats.map((f) => {
                    const catData = CATEGORIES[f.tipo === "EGRESO" ? "expense" : "income"][f.categoria];
                    const label = catData?.[lang] || f.categoria;
                    return (
                      <Chip key={f.categoria} label={label} size="small" onDelete={() => handleRemoveFav(f.categoria)}
                        color={f.tipo === "EGRESO" ? "error" : "success"} variant="outlined" />
                    );
                  })}
                </Box>
              )}
              <Autocomplete
                options={allCatOptions} groupBy={(o) => o.group} value={favInput}
                onChange={(_, v) => handleAddFav(v)} getOptionLabel={(o) => o?.label || ""}
                size="small" noOptionsText={lang === "es" ? "Ya las agregaste todas" : "All categories added"}
                renderInput={(params) => (
                  <TextField {...params} label={lang === "es" ? "Agregar favorita" : "Add favorite"} size="small" />
                )}
              />
            </ListItem>

            <Divider variant="middle" />

            <ListItem
              secondaryAction={
                <Button size="small" startIcon={<AddIcon />} onClick={() => openCatDialog()} variant="outlined" sx={{ borderRadius: 2 }}>
                  {lang === "es" ? "Nueva" : "New"}
                </Button>
              }
            >
              <ListItemText
                primary={lang === "es" ? "Mis Categorías" : "My Categories"}
                secondary={lang === "es" ? "Categorías propias para tus transacciones" : "Custom categories for your transactions"}
                primaryTypographyProps={{ variant: "overline" }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </ListItem>
            <ListItem sx={{ pt: 0 }}>
              <Box sx={{ width: "100%" }}>
                {customCats.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    {lang === "es" ? "Ninguna aún. Crea tu primera categoría." : "None yet. Create your first category."}
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {customCats.map((c) => (
                      <Box key={c.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, bgcolor: "action.hover" }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: c.color, flexShrink: 0 }} />
                        <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{c.nombre}</Typography>
                        <Chip label={c.tipo === "EGRESO" ? (lang === "es" ? "Gasto" : "Expense") : (lang === "es" ? "Ingreso" : "Income")}
                          size="small" color={c.tipo === "EGRESO" ? "error" : "success"} variant="outlined" sx={{ fontSize: 10 }} />
                        <IconButton onClick={() => openCatDialog(c)} aria-label={lang === "es" ? "Editar categoría" : "Edit category"} sx={{ minWidth: 40, minHeight: 40 }}>
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton color="error" onClick={() => setDeleteTarget(c)} aria-label={lang === "es" ? "Eliminar categoría" : "Delete category"} sx={{ minWidth: 40, minHeight: 40 }}>
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </ListItem>
          </>
        )}
      </List>

      <Dialog open={catDialog} onClose={() => setCatDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingCat
            ? (lang === "es" ? "Editar Categoría" : "Edit Category")
            : (lang === "es" ? "Nueva Categoría" : "New Category")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label={lang === "es" ? "Nombre" : "Name"}
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
              {lang === "es" ? "Tipo" : "Type"}
            </Typography>
            <ToggleButtonGroup
              value={catForm.tipo}
              exclusive
              onChange={(_, v) => { if (v) setCatForm((f) => ({ ...f, tipo: v })); }}
              fullWidth
              size="small"
            >
              <ToggleButton value="EGRESO" sx={{ fontWeight: 600, color: "error.main", "&.Mui-selected": { bgcolor: "error.light", color: "error.dark" } }}>
                {lang === "es" ? "Gasto" : "Expense"}
              </ToggleButton>
              <ToggleButton value="INGRESO" sx={{ fontWeight: 600, color: "success.main", "&.Mui-selected": { bgcolor: "success.light", color: "success.dark" } }}>
                {lang === "es" ? "Ingreso" : "Income"}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              {lang === "es" ? "Color" : "Color"}
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCatDialog(false)} color="inherit">
            {lang === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={handleSaveCat} variant="contained">
            {lang === "es" ? "Guardar" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {lang === "es" ? "Eliminar categoría" : "Delete category"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {lang === "es"
              ? `¿Eliminar "${deleteTarget?.nombre}"? Las transacciones existentes no se verán afectadas.`
              : `Delete "${deleteTarget?.nombre}"? Existing transactions won't be affected.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            {lang === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={handleDeleteCat} variant="contained" color="error">
            {lang === "es" ? "Eliminar" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack?.severity ?? "success"} onClose={() => setSnack(null)} sx={{ width: "100%" }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Drawer>
  );
}
