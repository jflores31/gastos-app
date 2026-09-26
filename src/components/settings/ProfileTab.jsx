import { useMemo, useState } from "react";
import { Autocomplete, Avatar, Box, Button, Chip, CircularProgress, Divider, List, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import { Person as PersonIcon } from "../../theme/icons";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { CATEGORIES } from "../../data/index.js";
import { resolveCategoryMeta } from "../../theme/categoryIcons.js";
import { createClient } from "../../lib/supabase";
import { CustomCategoriesSection } from "./CustomCategoriesSection.jsx";

// "Perfil" tab of the settings panel. The name fields' state lives in SettingsPanel so an
// unsaved edit survives switching tabs, and resets each time the panel opens.
export function ProfileTab({ user, name, notify }) {
  const { lang } = useSettings();

  if (!user) {
    return (
      <Box sx={{ p: 5, textAlign: "center", color: "text.secondary" }}>
        <PersonIcon sx={{ fontSize: 48, opacity: 0.35, mb: 1.5 }} />
        <Typography variant="body2">
          {lang === "es" ? "Inicia sesión para ver tu perfil y categorías." : "Sign in to see your profile and categories."}
        </Typography>
      </Box>
    );
  }

  const fullName = user.user_metadata?.full_name || "";
  const email = user.email || "";
  const displayName = fullName || email || "Usuario";
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (email[0] || "U").toUpperCase();

  return (
    <Box>
      {/* Hero */}
      <Box sx={{
        px: 3, pt: 4, pb: 3.5, textAlign: "center", color: "primary.contrastText",
        background: (t) => `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
      }}>
        <Avatar
          src={user.user_metadata?.avatar_url || undefined}
          sx={{
            width: 78, height: 78, mx: "auto", mb: 1.5,
            bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 800, fontSize: 28,
            border: "3px solid rgba(255,255,255,0.55)", boxShadow: "0 8px 26px rgba(0,0,0,0.22)",
          }}
        >
          {initials || <PersonIcon />}
        </Avatar>
        <Typography variant="h6" fontWeight={800} noWrap>{displayName}</Typography>
        {fullName && <Typography variant="body2" noWrap sx={{ opacity: 0.85, mt: 0.25 }}>{email}</Typography>}
      </Box>

      <List disablePadding>
        <PersonalInfoSection name={name} notify={notify} />
        <Divider variant="middle" />
        <FavoriteCategoriesSection user={user} notify={notify} />
        <Divider variant="middle" />
        <CustomCategoriesSection notify={notify} />
      </List>
    </Box>
  );
}

// `name` = { first, last, setFirst, setLast, metaFirst, metaLast } from SettingsPanel.
function PersonalInfoSection({ name, notify }) {
  const { lang } = useSettings();
  const [saving, setSaving] = useState(false);
  const dirty = name.first.trim() !== (name.metaFirst || "").trim() || name.last.trim() !== (name.metaLast || "").trim();

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const full_name = `${name.first.trim()} ${name.last.trim()}`.trim();
    const { error } = await supabase.auth.updateUser({
      data: { first_name: name.first.trim(), last_name: name.last.trim(), full_name },
    });
    setSaving(false);
    if (error) notify(lang === "es" ? "Error al guardar tu nombre" : "Error saving your name", "error");
    else notify(lang === "es" ? "Nombre actualizado" : "Name updated", "success");
  };

  return (
    <>
      <ListItem sx={{ pt: 2 }}>
        <ListItemText
          primary={lang === "es" ? "Datos personales" : "Personal info"}
          secondary={lang === "es" ? "Tu nombre visible en la app" : "Your name shown across the app"}
          primaryTypographyProps={{ variant: "overline" }}
          secondaryTypographyProps={{ variant: "caption" }}
        />
      </ListItem>
      <ListItem sx={{ pt: 0, flexDirection: "column", alignItems: "stretch", gap: 1.5 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
          <TextField
            fullWidth size="small"
            label={lang === "es" ? "Nombre" : "First name"}
            value={name.first}
            onChange={(e) => name.setFirst(e.target.value)}
            autoComplete="given-name"
            slotProps={{ htmlInput: { maxLength: 40 } }}
          />
          <TextField
            fullWidth size="small"
            label={lang === "es" ? "Apellidos" : "Last name"}
            value={name.last}
            onChange={(e) => name.setLast(e.target.value)}
            autoComplete="family-name"
            slotProps={{ htmlInput: { maxLength: 40 } }}
          />
        </Box>
        <Button
          variant="contained" size="small"
          onClick={handleSave}
          disabled={!dirty || saving}
          sx={{ alignSelf: "flex-end", borderRadius: 2, textTransform: "none", fontWeight: 600, minWidth: 120 }}
        >
          {saving
            ? <CircularProgress size={18} color="inherit" />
            : (lang === "es" ? "Guardar" : "Save")}
        </Button>
      </ListItem>
    </>
  );
}

// Favourite categories live in the auth user's metadata (fav_categories).
function FavoriteCategoriesSection({ user, notify }) {
  const { lang } = useSettings();
  const { customCats } = useData();
  const [favInput, setFavInput] = useState(null);
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
    if (error) notify(lang === "es" ? "Error al guardar favoritos" : "Error saving favorites", "error");
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

  return (
    <>
      <ListItem sx={{ pt: 2 }}>
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
              const { label, Icon } = resolveCategoryMeta(f.categoria, customCats, lang, f.tipo);
              return (
                <Chip key={f.categoria} icon={<Icon />} label={label} size="small" onDelete={() => handleRemoveFav(f.categoria)}
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
    </>
  );
}
