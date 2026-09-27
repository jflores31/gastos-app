# Iconos

Cómo se eligen, se pintan y se animan los iconos de la app. La estructura del código está en [ARCHITECTURE.md](ARCHITECTURE.md).

## El sistema

Todos los iconos salen de `@mui/icons-material` (MUI v9) en variante **Rounded** (Material You / Material 3): son SVG, sin emojis ni imágenes propias. La app usa 123 iconos distintos. El favicon (`public/favicon.svg`) es una alcancía blanca sobre el gradiente del acento Océano; los iconos de la app instalable se generan desde él con `node scripts/generate-icons.mjs`.

Cuatro piezas:

| Pieza | Archivo | Qué hace |
|---|---|---|
| Módulo central | `src/theme/icons.js` | Re-exporta cada icono en variante Rounded (import directo, mejor tree-shaking). Los componentes importan desde aquí, nunca desde `@mui/icons-material`: cambiar de estilo (p. ej. a Outlined) es editar solo este archivo. Excepciones: `GitHub` y `Google` no tienen variante Rounded (quedan Filled) y `ErrorOutlined` apunta a `ErrorRounded` |
| Categoría → icono | `src/theme/categoryIcons.js` | `EXPENSE_ICONS` e `INCOME_ICONS` (mapa de abajo), `ICON_CHOICES` (los elegibles) y `resolveCategoryMeta()`, que da nombre, color e icono de cualquier categoría, de fábrica o propia |
| Pintado | `src/theme/GradientIcon.jsx` | `GradientIcon` (burbuja con el gradiente de un tono, en los encabezados) y `CategoryAvatar` (squircle con el color de la categoría, en las listas) |
| Animación | `src/theme/materialTheme.js` | El tema de MUI anima todos los iconos (ver [Animación](#animación)) |

## Mapa categoría → icono

Las categorías (`CATEGORIES` en `src/data/index.ts`) no llevan icono, solo nombre, color y conceptos. El icono se asigna en `categoryIcons.js`, y lo usan el selector de transacciones, las listas, los chips de filtro, los presupuestos y las suscripciones. `categoryIcons.test.js` falla si una categoría queda sin icono; una desconocida muestra `Category`.

| Gasto (`EXPENSE_ICONS`) | Icono | Ingreso (`INCOME_ICONS`) | Icono |
|---|---|---|---|
| `VIVIENDA` | Home | `SUELDO` | Payments |
| `LUZ` | Lightbulb | `HONORARIOS` | Code |
| `AGUA` | WaterDrop | `NEGOCIO` | Work |
| `INTERNET` | Wifi | `INVERSIONES` | TrendingUp |
| `CELULAR` | PhoneAndroid | `INTERESES` | AccountBalance |
| `COMIDA` | Restaurant | `ALQUILERES` | Apartment |
| `TRANSPORTE` | DirectionsBus | `VENTAS` | Storefront |
| `GASOLINA` | LocalGasStation | `CONTENIDO` | SmartDisplay |
| `AUTO` | DirectionsCar | `GAMING` | LiveTv |
| `MOTO` | TwoWheeler | `CLASES` | School |
| `REPUESTOS` | Build | `ASESORIAS` | SupportAgent |
| `LLANTAS` | TireRepair | `TECNICO` | Handyman |
| `ACEITE` | OilBarrel | `TELECOM` | CellTower |
| `SOAT` | Security | `MUSICA` | MusicNote |
| `ESTACIONAMIENTO` | LocalParking | `EVENTOS` | Event |
| `STREAMING` | Movie | `DJ` | Speaker |
| `CAFES` | Coffee | `TOCADAS` | Album |
| `ROPA` | Checkroom | `PRODUCCION` | Theaters |
| `SALUD` | HealthAndSafety | `FOTOGRAFIA` | PhotoCamera |
| `DEUDAS` | RequestQuote | `EDICION` | Videocam |
| `EDUCACION` | School | `ORGANIZACION` | Campaign |
| `MASCOTA` | Pets | `ALQUILER_SONIDO` | Highlight |
| `REGALOS` | CardGiftcard | `EVENTOS_CORP` | CorporateFare |
| `IMPREVISTOS` | Warning | `COMISIONES` | Percent |
| `AHORRO` | Savings | `REGALOS` | CardGiftcard |
| `DELIVERY` | DeliveryDining | `CRIPTO` | CurrencyBitcoin |
| `JUEGOS` | SportsEsports | `DIVIDENDOS` | TrendingUp |
| `SALIDAS` | Celebration | `BONOS` | EmojiEvents |
| `HIGIENE` | Face | `CASHBACK` | Loyalty |
| `GIMNASIO` | FitnessCenter | `AHORROS` | LocalAtm |
| `VIAJES` | Flight |  |  |
| `IMPUESTOS` | Gavel |  |  |
| `COMPRAS` | ShoppingBag |  |  |

## Iconos elegibles

Metas y categorías propias eligen su icono en `IconPicker.jsx`, entre los 43 de `ICON_CHOICES`. En la base se guarda la clave (p. ej. `"Flight"`), no el componente; las metas viejas con un glifo de texto (`"◉"`) se siguen mostrando tal cual. Cada icono tiene nombre accesible en los dos idiomas (`t.iconNames`).

`Flag`, `Savings`, `Home`, `Apartment`, `Flight`, `BeachAccess`, `DirectionsCar`, `TwoWheeler`, `DirectionsBike`, `School`, `Laptop`, `PhoneAndroid`, `Pets`, `ChildCare`, `FitnessCenter`, `SportsSoccer`, `SportsEsports`, `MusicNote`, `PhotoCamera`, `Movie`, `Restaurant`, `Coffee`, `LocalGroceryStore`, `ShoppingBag`, `Checkroom`, `Spa`, `HealthAndSafety`, `Medication`, `CardGiftcard`, `Celebration`, `Diamond`, `Work`, `Handshake`, `Storefront`, `Payments`, `CreditCard`, `AccountBalance`, `TrendingUp`, `ElectricBolt`, `Wifi`, `Build`, `Receipt`, `Category`

## Iconos de la interfaz, por archivo

Los que no son de categoría. Se obtiene buscando los `import { … } from ".../theme/icons"` de `src/` (sin tests ni `categoryIcons.js`).

| Archivo (en `src/`) | Iconos |
|---|---|
| `app/components/auth/AuthThemeToggle.tsx` | DarkMode, LightMode |
| `app/forgot-password/page.tsx` | ArrowBack, LockReset, MarkEmailRead |
| `app/login/page.tsx` | AccountBalanceWallet, GitHub, Google, Visibility, VisibilityOff |
| `app/register/page.tsx` | AccountBalanceWallet, CheckCircle, GitHub, Google, Visibility, VisibilityOff |
| `app/reset-password/page.tsx` | ArrowBack, CheckCircle, ErrorOutlined, LockReset, Visibility, VisibilityOff |
| `components/AddTransactionModal.jsx` | Label, Star |
| `components/DashboardStudio.jsx` | AccountBalanceWallet, Add, AttachMoney, Dashboard, Flag, Login, Logout, Receipt, Settings, Visibility, VisibilityOff |
| `components/ExpensesTab.jsx` | Add, CalendarMonth, Delete, Edit, ExpandLess, ExpandMore, Receipt, TrendingDown, Warning |
| `components/IncomeTab.jsx` | AccountBalanceWallet, Add, Delete, Edit, PieChart, ShowChart |
| `components/LoginModal.jsx` | Close, GitHub, Google |
| `components/OverviewTab.jsx` | AccountBalanceWallet, CalendarMonth, Insights, PieChart, Savings, ShowChart, Timeline, TrendingDown, TrendingUp, Warning |
| `components/SettingsPanel.jsx` | Close, Person, Settings |
| `components/budget/BudgetCardsGrid.jsx` | Add, Check, Edit |
| `components/budget/BudgetVsActualCard.jsx` | CompareArrows |
| `components/budget/DistributionCard.jsx` | PieChart |
| `components/budget/HealthSummaryCard.jsx` | AccountBalanceWallet, CheckCircle, TrendingDown, TrendingUp, Warning |
| `components/budget/ManageBudgetsDialog.jsx` | Add, Check, Close, Delete, Edit |
| `components/budget/PeriodComparisonCard.jsx` | CompareArrows |
| `components/budget/RecurringCard.jsx` | Event |
| `components/budget/UpcomingPaymentsCard.jsx` | CalendarMonth |
| `components/goals/AccountsCard.jsx` | AccountBalance, Add, AttachMoney, CreditCard, Delete, Edit, SwapHoriz |
| `components/goals/DebtsCard.jsx` | Add, CreditScore |
| `components/goals/EmptySection.jsx` | Add |
| `components/goals/ForecastCard.jsx` | Timeline |
| `components/goals/GoalsSection.jsx` | Add, Savings |
| `components/goals/InvestmentsSection.jsx` | Add, ShowChart |
| `components/goals/NetWorthEvolutionCard.jsx` | History |
| `components/goals/SubscriptionsCard.jsx` | Add, Subscriptions |
| `components/settings/CustomCategoriesSection.jsx` | Add, Delete, Edit |
| `components/settings/DataExportSection.jsx` | DataObject, RestoreFromTrash, TableChart, UploadFile |
| `components/settings/PreferencesTab.jsx` | DarkMode, LightMode |
| `components/settings/ProfileTab.jsx` | Person |
| `components/settings/TrashDialog.jsx` | DeleteForever, DeleteSweep, RestoreFromTrash |
| `components/shared.jsx` | AttachMoney, CalendarMonth, ChevronLeft, ChevronRight, Inbox, Receipt |

## Animación

El tema de MUI (`src/theme/materialTheme.js`) centraliza el comportamiento, no la lista de iconos:

| Componente | Efecto |
|---|---|
| `MuiSvgIcon` | Transición suave de `transform` y `color` |
| `MuiIconButton` | `scale(1.12)` al pasar el mouse, `scale(0.92)` al hacer click |
| `MuiFab` | `translateY(-2px) scale(1.06)` al pasar el mouse |
| `MuiTab` | El icono crece (`scale(1.18)`) al pasar el mouse y hace `iconPop` al seleccionarse |
| `MuiBottomNavigationAction` | El mismo `iconPop` al seleccionarse |
| `MuiCard` | "Pop" sutil del avatar al pasar el mouse sobre la tarjeta |

Con `prefers-reduced-motion: reduce`, `globals.css` acorta animaciones y transiciones a casi 0 ms.
