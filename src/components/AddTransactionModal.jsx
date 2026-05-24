"use client"

import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  ToggleButton, ToggleButtonGroup, TextField, Autocomplete, InputAdornment,
  Slide, Box, Avatar, Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  Home, Restaurant, FlashOn, Movie, AccountBalance, Pets, ChildCare, MoreHoriz,
  AttachMoney, Work, Lightbulb, WaterDrop, Wifi, PhoneAndroid, DirectionsBus,
  LocalGasStation, DirectionsCar, TwoWheeler, Build, TireRepair, OilBarrel,
  Security, LocalParking, Coffee, Checkroom, HealthAndSafety, School,
  CardGiftcard, Warning, Savings, DeliveryDining, SportsEsports, Celebration,
  Face, FitnessCenter, Flight, Receipt, ShoppingBag, MusicNote, Event, Speaker,
  Album, Theaters, PhotoCamera, Videocam, Campaign, LightbulbCircle,
  CorporateFare, Code, YouTube, OndemandVideo, TrendingUp,
} from "@mui/icons-material";

const HomeIcon = Home;
const RestaurantIcon = Restaurant;
const ServicesIcon = FlashOn;
const MovieIcon = Movie;
const DebtIcon = AccountBalance;
const PetIcon = Pets;
const KidsIcon = ChildCare;
const OtherIcon = MoreHoriz;
const IncomeIcon = AttachMoney;
const BusinessIcon = Work;
const LightIcon = Lightbulb;
const WaterIcon = WaterDrop;
const WifiIcon = Wifi;
const PhoneIcon = PhoneAndroid;
const BusIcon = DirectionsBus;
const GasIcon = LocalGasStation;
const CarIcon = DirectionsCar;
const BikeIcon = TwoWheeler;
const BuildIcon = Build;
const TireIcon = TireRepair;
const OilIcon = OilBarrel;
const SecurityIcon = Security;
const ParkingIcon = LocalParking;
const CoffeeIcon = Coffee;
const ClothesIcon = Checkroom;
const HealthIcon = HealthAndSafety;
const SchoolIcon = School;
const GiftIcon = CardGiftcard;
const UnexpectedIcon = Warning;
const SavingsIcon = Savings;
const DeliveryIcon = DeliveryDining;
const GamesIcon = SportsEsports;
const PartyIcon = Celebration;
const HygieneIcon = Face;
const GymIcon = FitnessCenter;
const TravelIcon = Flight;
const TaxIcon = Receipt;
const ShopIcon = ShoppingBag;
const MusicIcon = MusicNote;
const EventIcon = Event;
const SpeakerIcon = Speaker;
const AlbumIcon = Album;
const TheaterIcon = Theaters;
const VideoIcon = Videocam;
const CampaignIcon = Campaign;
const LightEqIcon = LightbulbCircle;
const CorpIcon = CorporateFare;
const CodeIcon = Code;
const YouTubeIcon = YouTube;
const StreamIcon = OndemandVideo;
const TrendingUpIcon = TrendingUp;
const AccountBalanceIcon = AccountBalance;
import { CATEGORIES } from "../data/index.js";
import { useSettings } from "../context/SettingsContext.jsx";
import { useData } from "../context/DataContext.jsx";

const Transition = Slide;

const EXPENSE_ICONS = {
  VIVIENDA: <HomeIcon fontSize="small" />,
  LUZ: <LightIcon fontSize="small" />,
  AGUA: <WaterIcon fontSize="small" />,
  INTERNET: <WifiIcon fontSize="small" />,
  CELULAR: <PhoneIcon fontSize="small" />,
  COMIDA: <RestaurantIcon fontSize="small" />,
  TRANSPORTE: <BusIcon fontSize="small" />,
  GASOLINA: <GasIcon fontSize="small" />,
  AUTO: <CarIcon fontSize="small" />,
  MOTO: <BikeIcon fontSize="small" />,
  REPUESTOS: <BuildIcon fontSize="small" />,
  LLANTAS: <TireIcon fontSize="small" />,
  ACEITE: <OilIcon fontSize="small" />,
  SOAT: <SecurityIcon fontSize="small" />,
  ESTACIONAMIENTO: <ParkingIcon fontSize="small" />,
  STREAMING: <MovieIcon fontSize="small" />,
  CAFES: <CoffeeIcon fontSize="small" />,
  ROPA: <ClothesIcon fontSize="small" />,
  SALUD: <HealthIcon fontSize="small" />,
  DEUDAS: <DebtIcon fontSize="small" />,
  EDUCACION: <SchoolIcon fontSize="small" />,
  MASCOTA: <PetIcon fontSize="small" />,
  REGALOS: <GiftIcon fontSize="small" />,
  IMPREVISTOS: <UnexpectedIcon fontSize="small" />,
  AHORRO: <SavingsIcon fontSize="small" />,
  DELIVERY: <DeliveryIcon fontSize="small" />,
  JUEGOS: <GamesIcon fontSize="small" />,
  SALIDAS: <PartyIcon fontSize="small" />,
  HIGIENE: <HygieneIcon fontSize="small" />,
  GIMNASIO: <GymIcon fontSize="small" />,
  VIAJES: <TravelIcon fontSize="small" />,
  IMPUESTOS: <TaxIcon fontSize="small" />,
  COMPRAS: <ShopIcon fontSize="small" />,
};

const INCOME_ICONS = {
  SUELDO: <IncomeIcon fontSize="small" />,
  HONORARIOS: <CodeIcon fontSize="small" />,
  NEGOCIO: <BusinessIcon fontSize="small" />,
  INVERSIONES: <TrendingUpIcon fontSize="small" />,
  INTERESES: <AccountBalanceIcon fontSize="small" />,
  ALQUILERES: <HomeIcon fontSize="small" />,
  VENTAS: <ShopIcon fontSize="small" />,
  CONTENIDO: <YouTubeIcon fontSize="small" />,
  GAMING: <StreamIcon fontSize="small" />,
  CLASES: <SchoolIcon fontSize="small" />,
  ASESORIAS: <BusinessIcon fontSize="small" />,
  TECNICO: <BuildIcon fontSize="small" />,
  TELECOM: <WifiIcon fontSize="small" />,
  MUSICA: <MusicIcon fontSize="small" />,
  EVENTOS: <EventIcon fontSize="small" />,
  DJ: <SpeakerIcon fontSize="small" />,
  TOCADAS: <AlbumIcon fontSize="small" />,
  PRODUCCION: <TheaterIcon fontSize="small" />,
  FOTOGRAFIA: <PhotoCamera fontSize="small" />,
  EDICION: <VideoIcon fontSize="small" />,
  ORGANIZACION: <CampaignIcon fontSize="small" />,
  ALQUILER_SONIDO: <LightEqIcon fontSize="small" />,
  EVENTOS_CORP: <CorpIcon fontSize="small" />,
  COMISIONES: <IncomeIcon fontSize="small" />,
  REGALOS: <GiftIcon fontSize="small" />,
  CRIPTO: <IncomeIcon fontSize="small" />,
  DIVIDENDOS: <TrendingUpIcon fontSize="small" />,
  BONOS: <BusinessIcon fontSize="small" />,
  CASHBACK: <ShoppingBag fontSize="small" />,
  AHORROS: <SavingsIcon fontSize="small" />,
};

export default function AddTransactionModal({ initialCategory = "", mode = "all", onAdd, onClose }) {
  const { t, lang, currency } = useSettings();
  const { addTx } = useData();

  const [tipo, setTipo] = useState(mode === "income" ? "INGRESO" : "EGRESO");
  const [categoria, setCategoria] = useState(initialCategory || null);
  const [concepto, setConcepto] = useState("");
  const [valor, setValor] = useState("");
  const [fecha, setFecha] = useState(dayjs());
  const [errors, setErrors] = useState({});

  const categoryOptions = [
    ...Object.entries(CATEGORIES.income).map(([k, v]) => ({ value: k, label: v[lang], group: t.income, type: "INGRESO", icon: INCOME_ICONS[k] })),
    ...Object.entries(CATEGORIES.expense).map(([k, v]) => ({ value: k, label: v[lang], group: t.expense, type: "EGRESO", icon: EXPENSE_ICONS[k] })),
  ];

  const filteredOptions = categoryOptions.filter((o) => {
    if (mode === "expense") return o.type === "EGRESO";
    return tipo === "INGRESO" ? o.type === "INGRESO" : o.type === "EGRESO";
  });

  const validate = () => {
    const errs = {};
    if (!categoria) errs.categoria = lang === "es" ? "Selecciona una categoría" : "Select a category";
    if (!concepto.trim()) errs.concepto = lang === "es" ? "Ingresa un concepto" : "Enter a concept";
    if (!valor || parseFloat(valor) <= 0) errs.valor = lang === "es" ? "Ingresa un monto válido" : "Enter a valid amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    addTx({
      id: Date.now(),
      tipo,
      categoria: categoria.value || categoria,
      concepto: concepto.toUpperCase(),
      dia: fecha.date(),
      mes: fecha.month(),
      año: fecha.year(),
      date: fecha.toDate(),
      valor: parseFloat(valor),
      anomaly: false,
    });
    if (onAdd) onAdd();
    onClose();
  };

  const currSymbol = { PEN: "S/", USD: "$", EUR: "€", MXN: "$", COP: "$", ARS: "$", CLP: "$", BRL: "R$" }[currency] || "$";

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm"
      slots={{ transition: Transition }}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{mode === "expense" ? (lang === "es" ? "Registrar Gasto Diario" : "Register Daily Expense") : mode === "income" ? (lang === "es" ? "Registrar Ingreso" : "Register Income") : t.addTx}</DialogTitle>
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
          onChange={(_, v) => { setCategoria(v); if (errors.categoria) setErrors((e) => ({ ...e, categoria: null })); }}
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
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    {categoria?.icon}
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        <TextField label={t.concept} value={concepto} onChange={(e) => { setConcepto(e.target.value); if (errors.concepto) setErrors((er) => ({ ...er, concepto: null })); }}
          error={!!errors.concepto} helperText={errors.concepto} fullWidth />

        <TextField label={t.amount} type="number" value={valor} onChange={(e) => { setValor(e.target.value); if (errors.valor) setErrors((er) => ({ ...er, valor: null })); }}
          error={!!errors.valor} helperText={errors.valor} fullWidth
          slotProps={{ input: { startAdornment: <InputAdornment position="start">{currSymbol}</InputAdornment> } }} />

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang === "es" ? "es" : "en"}>
          <DatePicker
            label={lang === "es" ? "Fecha" : "Date"}
            value={fecha}
            onChange={(newValue) => setFecha(newValue)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">{t.cancel}</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">{t.save}</Button>
      </DialogActions>
    </Dialog>
  );
}