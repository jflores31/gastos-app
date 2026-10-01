import { useMemo, useState } from "react";
import { Autocomplete, Avatar, Box, Button, Chip, CircularProgress, Divider, List, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import { Person as PersonIcon } from "@/theme/icons";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { CATEGORIES } from "@/domain/categories/catalog";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { updateUser } from "@/features/auth/data/authApi";
import { CustomCategoriesSection } from "@/features/categories/components/CustomCategoriesSection";
import { YourDataSection } from "./YourDataSection";
import { TwoFactorSection } from "@/features/auth/components/TwoFactorSection";
import { profileAvatarSx, profileHeroSx, saveNameButtonSx } from "./settings.styles";

// "Perfil" tab of the settings panel. The name fields' state lives in SettingsPanel so an
// unsaved edit survives switching tabs, and resets each time the panel opens.
export function ProfileTab({ user, name, notify }) {
  const { t } = useSettings();

  if (!user) {
    return (
      <Box sx={{ p: 5, textAlign: "center", color: "text.secondary" }}>
        <PersonIcon sx={{ fontSize: 48, opacity: 0.35, mb: 1.5 }} />
        <Typography variant="body2">
          {t.settingsPanel.signInToSeeYour}
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
      <Box sx={profileHeroSx}>
        <Avatar
          src={user.user_metadata?.avatar_url || undefined}
          sx={profileAvatarSx}
        >
          {initials || <PersonIcon />}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 800 }} noWrap>{displayName}</Typography>
        {fullName && <Typography variant="body2" noWrap sx={{ opacity: 0.85, mt: 0.25 }}>{email}</Typography>}
      </Box>

      <List disablePadding>
        <PersonalInfoSection name={name} notify={notify} />
        <Divider variant="middle" />
        <FavoriteCategoriesSection user={user} notify={notify} />
        <Divider variant="middle" />
        <CustomCategoriesSection notify={notify} />
        <Divider variant="middle" />
        <TwoFactorSection notify={notify} />
        <Divider variant="middle" />
        <YourDataSection notify={notify} />
      </List>
    </Box>
  );
}

// `name` = { first, last, setFirst, setLast, metaFirst, metaLast } from SettingsPanel.
function PersonalInfoSection({ name, notify }) {
  const { t } = useSettings();
  const [saving, setSaving] = useState(false);
  const dirty = name.first.trim() !== (name.metaFirst || "").trim() || name.last.trim() !== (name.metaLast || "").trim();

  const handleSave = async () => {
    setSaving(true);
    const full_name = `${name.first.trim()} ${name.last.trim()}`.trim();
    const { error } = await updateUser({
      data: { first_name: name.first.trim(), last_name: name.last.trim(), full_name },
    });
    setSaving(false);
    if (error) notify(t.settingsPanel.errorSavingYourName, "error");
    else notify(t.settingsPanel.nameUpdated, "success");
  };

  return (
    <>
      <ListItem sx={{ pt: 2 }}>
        <ListItemText
          primary={t.settingsPanel.personalInfo}
          secondary={t.settingsPanel.yourNameShownAcrossThe}
          slotProps={{ primary: { variant: "overline" }, secondary: { variant: "caption" } }}
        />
      </ListItem>
      <ListItem sx={{ pt: 0, flexDirection: "column", alignItems: "stretch", gap: 1.5 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
          <TextField
            fullWidth size="small"
            label={t.settingsPanel.firstName}
            value={name.first}
            onChange={(e) => name.setFirst(e.target.value)}
            autoComplete="given-name"
            slotProps={{ htmlInput: { maxLength: 40 } }}
          />
          <TextField
            fullWidth size="small"
            label={t.settingsPanel.lastName}
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
          sx={saveNameButtonSx}
        >
          {saving
            ? <CircularProgress size={18} color="inherit" />
            : (t.common.save)}
        </Button>
      </ListItem>
    </>
  );
}

// Favourite categories live in the auth user's metadata (fav_categories).
function FavoriteCategoriesSection({ user, notify }) {
  const { t, lang } = useSettings();
  const { customCats } = useData();
  const [favInput, setFavInput] = useState(null);
  const favCats = useMemo(() => user?.user_metadata?.fav_categories || [], [user]);

  const allCatOptions = useMemo(() => [
    ...Object.entries(CATEGORIES.expense).map(([k, v]) => ({
      value: k, tipo: "EGRESO",
      label: v[lang],
      group: t.settingsPanel.expenseGroup,
    })),
    ...Object.entries(CATEGORIES.income).map(([k, v]) => ({
      value: k, tipo: "INGRESO",
      label: v[lang],
      group: t.settingsPanel.incomeGroup,
    })),
  ].filter((o) => !favCats.find((f) => f.categoria === o.value)), [lang, t, favCats]);

  const saveFavCats = async (newList) => {
    const { error } = await updateUser({ data: { fav_categories: newList } });
    if (error) notify(t.settingsPanel.errorSavingFavorites, "error");
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
          primary={t.settingsPanel.favoriteCategories}
          secondary={t.settingsPanel.shownFirstInTheSelector}
          slotProps={{ primary: { variant: "overline" }, secondary: { variant: "caption" } }}
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
          size="small" noOptionsText={t.settingsPanel.allCategoriesAdded}
          renderInput={(params) => (
            <TextField {...params} label={t.settingsPanel.addFavorite} size="small" />
          )}
        />
      </ListItem>
    </>
  );
}
