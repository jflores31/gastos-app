// Iconos de categorías — fuente única para el selector de categorías, las listas
// y los avatares de las pestañas. Guarda componentes (no elementos) para que cada
// uso elija tamaño y color. Los iconos salen de icons.js (variante Rounded).
import {
  AccountBalance, Album, Apartment, BeachAccess, Build, Campaign, CardGiftcard,
  Category, Celebration, CellTower, Checkroom, ChildCare, Code, Coffee, CorporateFare,
  CreditCard, CurrencyBitcoin, DeliveryDining, Diamond, DirectionsBike, DirectionsBus,
  DirectionsCar, ElectricBolt, EmojiEvents, Event, Face, FitnessCenter, Flag, Flight,
  Gavel, Handshake, Handyman, HealthAndSafety, Highlight, Home, Laptop, Lightbulb,
  LiveTv, LocalAtm, LocalGasStation, LocalGroceryStore, LocalParking, Loyalty,
  Medication, Movie, MusicNote, OilBarrel, Payments, Percent, Pets, PhoneAndroid,
  PhotoCamera, Receipt, RequestQuote, Restaurant, Savings, School, Security,
  ShoppingBag, SmartDisplay, Spa, Speaker, SportsEsports, SportsSoccer, Storefront,
  SupportAgent, Theaters, TireRepair, TrendingUp, TwoWheeler, Videocam, Warning,
  WaterDrop, Wifi, Work,
} from "./icons";
import { CATEGORIES } from "../data/index";

export const EXPENSE_ICONS = {
  VIVIENDA: Home,
  LUZ: Lightbulb,
  AGUA: WaterDrop,
  INTERNET: Wifi,
  CELULAR: PhoneAndroid,
  COMIDA: Restaurant,
  TRANSPORTE: DirectionsBus,
  GASOLINA: LocalGasStation,
  AUTO: DirectionsCar,
  MOTO: TwoWheeler,
  REPUESTOS: Build,
  LLANTAS: TireRepair,
  ACEITE: OilBarrel,
  SOAT: Security,
  ESTACIONAMIENTO: LocalParking,
  STREAMING: Movie,
  CAFES: Coffee,
  ROPA: Checkroom,
  SALUD: HealthAndSafety,
  DEUDAS: RequestQuote,
  EDUCACION: School,
  MASCOTA: Pets,
  REGALOS: CardGiftcard,
  IMPREVISTOS: Warning,
  AHORRO: Savings,
  DELIVERY: DeliveryDining,
  JUEGOS: SportsEsports,
  SALIDAS: Celebration,
  HIGIENE: Face,
  GIMNASIO: FitnessCenter,
  VIAJES: Flight,
  IMPUESTOS: Gavel,
  COMPRAS: ShoppingBag,
};

export const INCOME_ICONS = {
  SUELDO: Payments,
  HONORARIOS: Code,
  NEGOCIO: Work,
  INVERSIONES: TrendingUp,
  INTERESES: AccountBalance,
  ALQUILERES: Apartment,
  VENTAS: Storefront,
  CONTENIDO: SmartDisplay,
  GAMING: LiveTv,
  CLASES: School,
  ASESORIAS: SupportAgent,
  TECNICO: Handyman,
  TELECOM: CellTower,
  MUSICA: MusicNote,
  EVENTOS: Event,
  DJ: Speaker,
  TOCADAS: Album,
  PRODUCCION: Theaters,
  FOTOGRAFIA: PhotoCamera,
  EDICION: Videocam,
  ORGANIZACION: Campaign,
  ALQUILER_SONIDO: Highlight,
  EVENTOS_CORP: CorporateFare,
  COMISIONES: Percent,
  REGALOS: CardGiftcard,
  CRIPTO: CurrencyBitcoin,
  DIVIDENDOS: TrendingUp,
  BONOS: EmojiEvents,
  CASHBACK: Loyalty,
  AHORROS: LocalAtm,
};

// Iconos elegibles en los selectores (metas y categorías personalizadas).
// En la DB se guarda la clave (p. ej. "Flight"), no el componente.
export const ICON_CHOICES = {
  Flag, Savings, Home, Apartment, Flight, BeachAccess, DirectionsCar, TwoWheeler,
  DirectionsBike, School, Laptop, PhoneAndroid, Pets, ChildCare, FitnessCenter,
  SportsSoccer, SportsEsports, MusicNote, PhotoCamera, Movie, Restaurant, Coffee,
  LocalGroceryStore, ShoppingBag, Checkroom, Spa, HealthAndSafety, Medication,
  CardGiftcard, Celebration, Diamond, Work, Handshake, Storefront, Payments,
  CreditCard, AccountBalance, TrendingUp, ElectricBolt, Wifi, Build, Receipt, Category,
};

export const DEFAULT_ICON = Category;
const FALLBACK_COLOR = "#9e9e9e";

// Componente para una clave guardada en DB, o null si no es un icono conocido
// (p. ej. metas viejas que guardaban un glifo de texto como "◉").
export function iconByName(name) {
  return (name && Object.prototype.hasOwnProperty.call(ICON_CHOICES, name) && ICON_CHOICES[name]) || null;
}

// Nombre, color e icono de una categoría: de fábrica (CATEGORIES) o personalizada
// (`custom_<id>`). Si la personalizada fue borrada, cae en valores genéricos.
// Algunas claves existen en ingresos y egresos (REGALOS): `tipo` desempata.
export function resolveCategoryMeta(categoria, customCats = [], lang = "es", tipo) {
  if (categoria?.startsWith("custom_")) {
    const id = categoria.slice("custom_".length);
    const c = customCats.find((cc) => cc.id === id);
    return {
      label: c?.nombre || categoria,
      color: c?.color || FALLBACK_COLOR,
      Icon: iconByName(c?.icon) || DEFAULT_ICON,
    };
  }
  const inc = CATEGORIES.income[categoria];
  const exp = CATEGORIES.expense[categoria];
  const useIncome = tipo === "INGRESO" ? !!inc : !exp && !!inc;
  const def = useIncome ? inc : exp;
  const Icon = (useIncome ? INCOME_ICONS : EXPENSE_ICONS)[categoria] || DEFAULT_ICON;
  return {
    label: def?.[lang] || categoria,
    color: def?.color || FALLBACK_COLOR,
    Icon,
  };
}
