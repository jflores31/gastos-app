"use client"

import { useState, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress,
  ToggleButton, ToggleButtonGroup, TextField, Autocomplete, InputAdornment,
  Slide, Box, Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { Star, Label } from "../theme/icons";
import { EXPENSE_ICONS, INCOME_ICONS, DEFAULT_ICON, iconByName } from "../theme/categoryIcons.js";
import { CATEGORIES, CURRENCIES, toBase, fromBase } from "../data/index";
import { suggestCategory } from "../data/suggest";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext.jsx";
import { useSupabaseUser } from "../context/UserContext";

// Category icon in the picker, tinted with the category color.
const optionIcon = (Icon, color) => <Icon fontSize="small" sx={{ color }} />;

// Per-transaction cap, in the base currency (PEN).
const MAX_AMOUNT_BASE = 10_000_000;

export default function AddTransactionModal({ initialCategory = "", initialConcept = "", initialAmount = null, mode = "all", onAdd, onClose, editTx = null, showToast }) {
  const { t, lang, currency, fmt } = useSettings();
  const { txs, addTx, updateTx, customCats } = useData();
  const user = useSupabaseUser();

  const [tipo, setTipo] = useState(editTx?.tipo || (mode === "income" ? "INGRESO" : "EGRESO"));
  const [concepto, setConcepto] = useState(editTx?.concepto || initialConcept);
  // Stored amounts are in PEN; the form works in the selected currency.
  const baseAmount = editTx?.valor ?? initialAmount;
  const [valor, setValor] = useState(baseAmount != null ? String(fromBase(baseAmount, currency)) : "");
  const [fecha, setFecha] = useState(editTx ? dayjs(editTx.date) : dayjs());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const favCats = user?.user_metadata?.fav_categories || [];

  const myGroup = t.txModal.myCategories;
  const customGroup = t.txModal.custom;
  const groupIcons = { [myGroup]: { Icon: Star, color: "warning.main" }, [customGroup]: { Icon: Label, color: "primary.main" } };

  const categoryOptions = useMemo(() => {
    const builtIn = (k, v, group, type) => ({
      value: k, label: v[lang], group, type,
      icon: optionIcon((type === "INGRESO" ? INCOME_ICONS : EXPENSE_ICONS)[k] || DEFAULT_ICON, v.color),
    });
    const myOptions = favCats
      .map((f) => {
        if (f.tipo === "EGRESO") {
          const v = CATEGORIES.expense[f.categoria];
          return v ? builtIn(f.categoria, v, myGroup, "EGRESO") : null;
        }
        const v = CATEGORIES.income[f.categoria];
        return v ? builtIn(f.categoria, v, myGroup, "INGRESO") : null;
      })
      .filter(Boolean);
    const customOptions = customCats.map((c) => ({
      value: `custom_${c.id}`,
      label: c.nombre,
      group: customGroup,
      type: c.tipo,
      icon: optionIcon(iconByName(c.icon) || DEFAULT_ICON, c.color),
      color: c.color,
    }));
    return [
      ...myOptions,
      ...customOptions,
      ...Object.entries(CATEGORIES.income).map(([k, v]) => builtIn(k, v, t.income, "INGRESO")),
      ...Object.entries(CATEGORIES.expense).map(([k, v]) => builtIn(k, v, t.expense, "EGRESO")),
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, customCats, t.income, t.expense]);

  // When editing, resolve the initial category string to a full option object
  const [categoria, setCategoria] = useState(() => {
    if (editTx?.categoria) return categoryOptions.find((o) => o.value === editTx.categoria) || null;
    if (initialCategory) return categoryOptions.find((o) => o.value === initialCategory) || null;
    return null;
  });

  // Category filled in from the concept (suggestCategory): "history" | "catalog" | null.
  // A category the user picks by hand is never replaced.
  const [suggested, setSuggested] = useState(null);

  const handleConceptChange = (value) => {
    setConcepto(value);
    if (errors.concepto) setErrors((er) => ({ ...er, concepto: null }));
    if (editTx || (categoria && !suggested)) return;
    const s = suggestCategory(value, txs, mode === "expense" ? "EGRESO" : mode === "income" ? "INGRESO" : tipo);
    const opt = s && categoryOptions.find((o) => o.value === s.categoria);
    if (opt) {
      setCategoria(opt);
      setSuggested(s.source);
      if (errors.categoria) setErrors((e) => ({ ...e, categoria: null }));
    } else if (suggested) {
      setCategoria(null);
      setSuggested(null);
    }
  };

  const filteredOptions = useMemo(() => categoryOptions.filter((o) => {
    if (o.value?.startsWith("custom_")) return true;
    if (mode === "expense") return o.type === "EGRESO";
    return tipo === "INGRESO" ? o.type === "INGRESO" : o.type === "EGRESO";
  }), [categoryOptions, mode, tipo]);

  const validate = () => {
    const errs = {};
    if (!categoria) errs.categoria = t.txModal.selectACategory;
    if (!concepto.trim()) errs.concepto = t.txModal.enterAConcept;
    // toBase() rounds to 2 PEN decimals, so a tiny COP/CLP amount can become 0.
    if (!valor || parseFloat(valor) <= 0 || toBase(parseFloat(valor), currency) <= 0) errs.valor = t.txModal.enterAValidAmount;
    else if (toBase(parseFloat(valor), currency) > MAX_AMOUNT_BASE) errs.valor = t.txModal.maximumAmountIs(fmt(MAX_AMOUNT_BASE));
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      const tx = {
        // The transaction type must follow the selected category's own type,
        // not the toggle/mode. Custom categories are shown regardless of the
        // toggle, so deriving tipo from the category prevents an income
        // category from being saved as an expense (and vice versa).
        tipo: categoria?.type || tipo,
        categoria: categoria?.value || categoria,
        concepto: concepto.toUpperCase(),
        dia: fecha.date(),
        mes: fecha.month(),
        año: fecha.year(),
        date: fecha.toDate(),
        valor: toBase(parseFloat(valor), currency),
        anomaly: false,
      };
      if (editTx) {
        await updateTx({ ...tx, id: editTx.id });
      } else {
        await addTx(tx);
      }
      if (onAdd) onAdd();
      onClose();
    } catch {
      setSaving(false);
      showToast?.(t.txModal.errorSavingPleaseTryAgain, "error");
    }
  };

  const currSymbol = (CURRENCIES[currency] || CURRENCIES.PEN).symbol;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm"
      slots={{ transition: Slide }}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {editTx
          ? (t.txModal.editTransaction)
          : mode === "expense" ? (t.txModal.registerDailyExpense)
          : mode === "income" ? (t.txModal.registerIncome)
          : t.addTx}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, "&&": { pt: 1 } }}>
        {mode === "all" && (
          <ToggleButtonGroup value={tipo} exclusive onChange={(_, v) => { if (v) { setTipo(v); setCategoria(null); setSuggested(null); } }} fullWidth size="small">
            <ToggleButton value="INGRESO" sx={{ fontWeight: 600, color: "success.main", "&.Mui-selected": { bgcolor: "success.light", color: "success.dark" } }}>
              {t.income}
            </ToggleButton>
            <ToggleButton value="EGRESO" sx={{ fontWeight: 600, color: "error.main", "&.Mui-selected": { bgcolor: "error.light", color: "error.dark" } }}>
              {t.expense}
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        <Autocomplete
          options={filteredOptions}
          groupBy={(opt) => opt.group}
          value={categoria}
          onChange={(_, v) => { setCategoria(v); setSuggested(null); if (v?.type) setTipo(v.type); if (errors.categoria) setErrors((e) => ({ ...e, categoria: null })); }}
          getOptionLabel={(opt) => opt?.label || ""}
          isOptionEqualToValue={(a, b) => a?.value === b?.value}
          renderOption={(props, opt) => (
            <Box component="li" {...props} key={opt.value} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {opt.icon}
              <Typography variant="body2">{opt.label}</Typography>
            </Box>
          )}
          renderGroup={(params) => {
            const groupIcon = groupIcons[params.group];
            return (
              <Box key={params.key}>
                <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: "flex", alignItems: "center", gap: 0.75, bgcolor: "action.hover", fontWeight: 600 }}>
                  {groupIcon && <groupIcon.Icon sx={{ fontSize: 14, color: groupIcon.color }} />}
                  {params.group}
                </Typography>
                {params.children}
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label={t.category} error={!!errors.categoria}
              helperText={errors.categoria || (suggested === "history" ? t.txModal.suggestedFromHistory : suggested === "catalog" ? t.txModal.suggestedFromConcept : undefined)}
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps?.input,
                  startAdornment: categoria?.icon ? (
                    <InputAdornment position="start">{categoria.icon}</InputAdornment>
                  ) : params.slotProps?.input?.startAdornment,
                },
              }}
            />
          )}
        />

        <TextField label={t.concept} value={concepto} onChange={(e) => handleConceptChange(e.target.value)}
          error={!!errors.concepto} helperText={errors.concepto} fullWidth slotProps={{ htmlInput: { maxLength: 100 } }} />

        <TextField label={t.amount} type="number" inputMode="decimal" value={valor} onChange={(e) => { setValor(e.target.value); if (errors.valor) setErrors((er) => ({ ...er, valor: null })); }}
          error={!!errors.valor} helperText={errors.valor} fullWidth
          slotProps={{ input: { startAdornment: <InputAdornment position="start">{currSymbol}</InputAdornment>, inputProps: { min: 0, max: fromBase(MAX_AMOUNT_BASE, currency), step: "any" } } }} />

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
          <DatePicker
            label={t.txModal.date}
            value={fecha}
            onChange={(newValue) => {
              if (newValue) setFecha(newValue.hour(fecha.hour()).minute(fecha.minute()).second(fecha.second()));
            }}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>{t.cancel}</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : editTx ? (t.txModal.update) : t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}