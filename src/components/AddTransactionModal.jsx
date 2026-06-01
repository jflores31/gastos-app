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
import {
  Home, Restaurant, Movie, AccountBalance, Pets,
  AttachMoney, Work, Lightbulb, WaterDrop, Wifi, PhoneAndroid, DirectionsBus,
  LocalGasStation, DirectionsCar, TwoWheeler, Build, TireRepair, OilBarrel,
  Security, LocalParking, Coffee, Checkroom, HealthAndSafety, School,
  CardGiftcard, Warning, Savings, DeliveryDining, SportsEsports, Celebration,
  Face, FitnessCenter, Flight, Receipt, ShoppingBag, MusicNote, Event, Speaker,
  Album, Theaters, PhotoCamera, Videocam, Campaign, LightbulbCircle,
  CorporateFare, Code, YouTube, OndemandVideo, TrendingUp,
} from "@mui/icons-material";
import { CATEGORIES } from "../data/index.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { useSupabaseUser } from "../context/UserContext";

const EXPENSE_ICONS = {
  VIVIENDA: <Home fontSize="small" />,
  LUZ: <Lightbulb fontSize="small" />,
  AGUA: <WaterDrop fontSize="small" />,
  INTERNET: <Wifi fontSize="small" />,
  CELULAR: <PhoneAndroid fontSize="small" />,
  COMIDA: <Restaurant fontSize="small" />,
  TRANSPORTE: <DirectionsBus fontSize="small" />,
  GASOLINA: <LocalGasStation fontSize="small" />,
  AUTO: <DirectionsCar fontSize="small" />,
  MOTO: <TwoWheeler fontSize="small" />,
  REPUESTOS: <Build fontSize="small" />,
  LLANTAS: <TireRepair fontSize="small" />,
  ACEITE: <OilBarrel fontSize="small" />,
  SOAT: <Security fontSize="small" />,
  ESTACIONAMIENTO: <LocalParking fontSize="small" />,
  STREAMING: <Movie fontSize="small" />,
  CAFES: <Coffee fontSize="small" />,
  ROPA: <Checkroom fontSize="small" />,
  SALUD: <HealthAndSafety fontSize="small" />,
  DEUDAS: <AccountBalance fontSize="small" />,
  EDUCACION: <School fontSize="small" />,
  MASCOTA: <Pets fontSize="small" />,
  REGALOS: <CardGiftcard fontSize="small" />,
  IMPREVISTOS: <Warning fontSize="small" />,
  AHORRO: <Savings fontSize="small" />,
  DELIVERY: <DeliveryDining fontSize="small" />,
  JUEGOS: <SportsEsports fontSize="small" />,
  SALIDAS: <Celebration fontSize="small" />,
  HIGIENE: <Face fontSize="small" />,
  GIMNASIO: <FitnessCenter fontSize="small" />,
  VIAJES: <Flight fontSize="small" />,
  IMPUESTOS: <Receipt fontSize="small" />,
  COMPRAS: <ShoppingBag fontSize="small" />,
};

const INCOME_ICONS = {
  SUELDO: <AttachMoney fontSize="small" />,
  HONORARIOS: <Code fontSize="small" />,
  NEGOCIO: <Work fontSize="small" />,
  INVERSIONES: <TrendingUp fontSize="small" />,
  INTERESES: <AccountBalance fontSize="small" />,
  ALQUILERES: <Home fontSize="small" />,
  VENTAS: <ShoppingBag fontSize="small" />,
  CONTENIDO: <YouTube fontSize="small" />,
  GAMING: <OndemandVideo fontSize="small" />,
  CLASES: <School fontSize="small" />,
  ASESORIAS: <Work fontSize="small" />,
  TECNICO: <Build fontSize="small" />,
  TELECOM: <Wifi fontSize="small" />,
  MUSICA: <MusicNote fontSize="small" />,
  EVENTOS: <Event fontSize="small" />,
  DJ: <Speaker fontSize="small" />,
  TOCADAS: <Album fontSize="small" />,
  PRODUCCION: <Theaters fontSize="small" />,
  FOTOGRAFIA: <PhotoCamera fontSize="small" />,
  EDICION: <Videocam fontSize="small" />,
  ORGANIZACION: <Campaign fontSize="small" />,
  ALQUILER_SONIDO: <LightbulbCircle fontSize="small" />,
  EVENTOS_CORP: <CorporateFare fontSize="small" />,
  COMISIONES: <AttachMoney fontSize="small" />,
  REGALOS: <CardGiftcard fontSize="small" />,
  CRIPTO: <AttachMoney fontSize="small" />,
  DIVIDENDOS: <TrendingUp fontSize="small" />,
  BONOS: <Work fontSize="small" />,
  CASHBACK: <ShoppingBag fontSize="small" />,
  AHORROS: <Savings fontSize="small" />,
};

export default function AddTransactionModal({ initialCategory = "", mode = "all", onAdd, onClose, editTx = null, showToast }) {
  const { t, lang, currency } = useSettings();
  const { addTx, updateTx, customCats } = useData();
  const user = useSupabaseUser();

  const [tipo, setTipo] = useState(editTx?.tipo || (mode === "income" ? "INGRESO" : "EGRESO"));
  const [concepto, setConcepto] = useState(editTx?.concepto || "");
  const [valor, setValor] = useState(editTx?.valor?.toString() || "");
  const [fecha, setFecha] = useState(editTx ? dayjs(editTx.date) : dayjs());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const favCats = user?.user_metadata?.fav_categories || [];

  const categoryOptions = useMemo(() => {
    const myGroup = lang === "es" ? "⭐ Mis Categorías" : "⭐ My Categories";
    const customGroup = lang === "es" ? "🏷️ Personalizadas" : "🏷️ Custom";
    const myOptions = favCats
      .map((f) => {
        if (f.tipo === "EGRESO") {
          const v = CATEGORIES.expense[f.categoria];
          return v ? { value: f.categoria, label: v[lang], group: myGroup, type: "EGRESO", icon: EXPENSE_ICONS[f.categoria] } : null;
        }
        const v = CATEGORIES.income[f.categoria];
        return v ? { value: f.categoria, label: v[lang], group: myGroup, type: "INGRESO", icon: INCOME_ICONS[f.categoria] } : null;
      })
      .filter(Boolean);
    const customOptions = customCats.map((c) => ({
      value: `custom_${c.id}`,
      label: c.nombre,
      group: customGroup,
      type: c.tipo,
      icon: <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: c.color, flexShrink: 0 }} />,
      color: c.color,
    }));
    return [
      ...myOptions,
      ...customOptions,
      ...Object.entries(CATEGORIES.income).map(([k, v]) => ({ value: k, label: v[lang], group: t.income, type: "INGRESO", icon: INCOME_ICONS[k] })),
      ...Object.entries(CATEGORIES.expense).map(([k, v]) => ({ value: k, label: v[lang], group: t.expense, type: "EGRESO", icon: EXPENSE_ICONS[k] })),
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, customCats, t.income, t.expense]);

  // When editing, resolve the initial category string to a full option object
  const [categoria, setCategoria] = useState(() => {
    if (editTx?.categoria) return categoryOptions.find((o) => o.value === editTx.categoria) || null;
    if (initialCategory) return categoryOptions.find((o) => o.value === initialCategory) || null;
    return null;
  });

  const filteredOptions = useMemo(() => categoryOptions.filter((o) => {
    if (o.value?.startsWith("custom_")) return true;
    if (mode === "expense") return o.type === "EGRESO";
    return tipo === "INGRESO" ? o.type === "INGRESO" : o.type === "EGRESO";
  }), [categoryOptions, mode, tipo]);

  const validate = () => {
    const errs = {};
    if (!categoria) errs.categoria = lang === "es" ? "Selecciona una categoría" : "Select a category";
    if (!concepto.trim()) errs.concepto = lang === "es" ? "Ingresa un concepto" : "Enter a concept";
    if (!valor || parseFloat(valor) <= 0) errs.valor = lang === "es" ? "Ingresa un monto válido" : "Enter a valid amount";
    else if (parseFloat(valor) > 10_000_000) errs.valor = lang === "es" ? "El monto máximo es 10,000,000" : "Maximum amount is 10,000,000";
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
        valor: parseFloat(valor),
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
      showToast?.(lang === "es" ? "Error al guardar. Intenta de nuevo." : "Error saving. Please try again.", "error");
    }
  };

  const currSymbol = { PEN: "S/", USD: "$", EUR: "€", MXN: "$", COP: "$", ARS: "$", CLP: "$", BRL: "R$" }[currency] || "$";

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm"
      slots={{ transition: Slide }}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {editTx
          ? (lang === "es" ? "Editar Transacción" : "Edit Transaction")
          : mode === "expense" ? (lang === "es" ? "Registrar Gasto Diario" : "Register Daily Expense")
          : mode === "income" ? (lang === "es" ? "Registrar Ingreso" : "Register Income")
          : t.addTx}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
        {mode === "all" && (
          <ToggleButtonGroup value={tipo} exclusive onChange={(_, v) => { if (v) { setTipo(v); setCategoria(null); } }} fullWidth size="small">
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
          onChange={(_, v) => { setCategoria(v); if (v?.type) setTipo(v.type); if (errors.categoria) setErrors((e) => ({ ...e, categoria: null })); }}
          getOptionLabel={(opt) => opt?.label || ""}
          isOptionEqualToValue={(a, b) => a?.value === b?.value}
          renderOption={(props, opt) => (
            <Box component="li" {...props} key={opt.value} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {opt.icon}
              <Typography variant="body2">{opt.label}</Typography>
            </Box>
          )}
          renderGroup={(params) => (
            <Box key={params.key}>
              <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: "block", bgcolor: "action.hover", fontWeight: 600 }}>
                {params.group}
              </Typography>
              {params.children}
            </Box>
          )}
          renderInput={(params) => (
            <TextField {...params} label={t.category} error={!!errors.categoria} helperText={errors.categoria}
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

        <TextField label={t.concept} value={concepto} onChange={(e) => { setConcepto(e.target.value); if (errors.concepto) setErrors((er) => ({ ...er, concepto: null })); }}
          error={!!errors.concepto} helperText={errors.concepto} fullWidth slotProps={{ htmlInput: { maxLength: 100 } }} />

        <TextField label={t.amount} type="number" inputMode="decimal" value={valor} onChange={(e) => { setValor(e.target.value); if (errors.valor) setErrors((er) => ({ ...er, valor: null })); }}
          error={!!errors.valor} helperText={errors.valor} fullWidth
          slotProps={{ input: { startAdornment: <InputAdornment position="start">{currSymbol}</InputAdornment>, inputProps: { min: 0, max: 10_000_000, step: "any" } } }} />

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang === "es" ? "es" : "en"}>
          <DatePicker
            label={lang === "es" ? "Fecha" : "Date"}
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
          {saving ? <CircularProgress size={20} color="inherit" /> : editTx ? (lang === "es" ? "Actualizar" : "Update") : t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}