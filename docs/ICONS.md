# Iconos

Cómo se eligen, se pintan y se animan los iconos de la app. La estructura del código está en [ARCHITECTURE.md](ARCHITECTURE.md).

## El sistema

Todos los iconos salen de `@mui/icons-material` (MUI v9) en variante **Rounded** (Material You / Material 3): son SVG, sin emojis ni imágenes propias. La app usa 123 iconos distintos. El favicon (`public/favicon.svg`) es una alcancía blanca sobre el gradiente del acento Océano; los iconos de la app instalable se generan desde él con `node scripts/generate-icons.mjs`.

Cuatro piezas:

| Pieza | Archivo | Qué hace |
|---|---|---|
| Módulo central | `src/theme/icons.ts` | Re-exporta cada icono en variante Rounded (import directo, mejor tree-shaking). Los componentes importan desde aquí, nunca desde `@mui/icons-material`: cambiar de estilo (p. ej. a Outlined) es editar solo este archivo. Excepciones: `GitHub` y `Google` no tienen variante Rounded (quedan Filled) y `ErrorOutlined` apunta a `ErrorRounded` |
| Categoría → icono | `src/theme/categoryIcons.ts` | `EXPENSE_ICONS` e `INCOME_ICONS` (mapa de abajo), `ICON_CHOICES` (los elegibles) y `resolveCategoryMeta()`, que da nombre, color e icono de cualquier categoría, de fábrica o propia |
| Pintado | `src/components/ui/GradientIcon.jsx` | `GradientIcon` (burbuja con el gradiente de un tono, en los encabezados) y `CategoryAvatar` (squircle con el color de la categoría, en las listas) |
| Animación | `src/theme/materialTheme.ts` | El tema de MUI anima todos los iconos (ver [Animación](#animación)) |

## Mapa categoría → icono

Las categorías (`CATEGORIES` en `src/domain/categories/catalog.ts`) no llevan icono, solo nombre, color y conceptos. El icono se asigna en `categoryIcons.ts`, y lo usan el selector de transacciones, las listas, los chips de filtro, los presupuestos y las suscripciones. `categoryIcons.test.js` falla si una categoría queda sin icono; una desconocida muestra `Category`.

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

Metas y categorías propias eligen su icono en `IconPicker.tsx` (`src/components/ui/`), entre los 43 de `ICON_CHOICES`. En la base se guarda la clave (p. ej. `"Flight"`), no el componente; las metas viejas con un glifo de texto (`"◉"`) se siguen mostrando tal cual. Cada icono tiene nombre accesible en los dos idiomas (`t.iconNames`).

`Flag`, `Savings`, `Home`, `Apartment`, `Flight`, `BeachAccess`, `DirectionsCar`, `TwoWheeler`, `DirectionsBike`, `School`, `Laptop`, `PhoneAndroid`, `Pets`, `ChildCare`, `FitnessCenter`, `SportsSoccer`, `SportsEsports`, `MusicNote`, `PhotoCamera`, `Movie`, `Restaurant`, `Coffee`, `LocalGroceryStore`, `ShoppingBag`, `Checkroom`, `Spa`, `HealthAndSafety`, `Medication`, `CardGiftcard`, `Celebration`, `Diamond`, `Work`, `Handshake`, `Storefront`, `Payments`, `CreditCard`, `AccountBalance`, `TrendingUp`, `ElectricBolt`, `Wifi`, `Build`, `Receipt`, `Category`

## Iconos de la interfaz, por archivo

Los que no son de categoría. Se obtiene buscando los `import { … } from ".../theme/icons"` de `src/` (sin tests ni `categoryIcons.ts`).

| Archivo (en `src/`) | Iconos |
|---|---|
| `components/ui/EmptySection.tsx` | Add |
| `components/ui/EmptyState.jsx` | Inbox |
| `features/accounts/components/AccountsCard.jsx` | AccountBalance, Add, AttachMoney, CreditCard, Delete, Edit, SwapHoriz |
| `features/auth/components/AuthThemeToggle.tsx` | DarkMode, LightMode |
| `features/auth/components/ForgotPasswordPage.tsx` | ArrowBack, LockReset, MarkEmailRead |
| `features/auth/components/LoginModal.jsx` | Close, GitHub, Google |
| `features/auth/components/LoginPage.tsx` | AccountBalanceWallet, GitHub, Google, Visibility, VisibilityOff |
| `features/auth/components/RegisterPage.tsx` | AccountBalanceWallet, CheckCircle, GitHub, Google, Visibility, VisibilityOff |
| `features/auth/components/ResetPasswordPage.tsx` | ArrowBack, CheckCircle, ErrorOutlined, LockReset, Visibility, VisibilityOff |
| `features/budgets/components/BudgetCardsGrid.jsx` | Add, Check, Edit |
| `features/budgets/components/BudgetVsActualCard.jsx` | CompareArrows |
| `features/budgets/components/DistributionCard.jsx` | PieChart |
| `features/budgets/components/HealthSummaryCard.jsx` | AccountBalanceWallet, CheckCircle, TrendingDown, TrendingUp, Warning |
| `features/budgets/components/ManageBudgetsDialog.jsx` | Add, Check, Close, Delete, Edit |
| `features/budgets/components/PeriodComparisonCard.jsx` | CompareArrows |
| `features/budgets/components/RecurringCard.jsx` | Event |
| `features/budgets/components/UpcomingPaymentsCard.jsx` | CalendarMonth |
| `features/categories/components/CustomCategoriesSection.jsx` | Add, Delete, Edit |
| `features/dashboard/components/AppHeader.tsx` | Add, Login, Logout, Settings, Visibility, VisibilityOff |
| `features/dashboard/components/MainNav.tsx` | AccountBalanceWallet, AttachMoney, Dashboard, Flag, Receipt |
| `features/dashboard/components/OverviewTab.jsx` | AccountBalanceWallet, CalendarMonth, Insights, PieChart, Savings, ShowChart, Timeline, TrendingDown, TrendingUp, Warning |
| `features/debts/components/DebtsCard.jsx` | Add, CreditScore |
| `features/goals/components/ForecastCard.jsx` | Timeline |
| `features/goals/components/GoalsSection.jsx` | Add, Savings |
| `features/goals/components/NetWorthEvolutionCard.jsx` | History |
| `features/investments/components/InvestmentsSection.jsx` | Add, ShowChart |
| `features/settings/components/PreferencesTab.jsx` | DarkMode, LightMode |
| `features/settings/components/ProfileTab.jsx` | Person |
| `features/settings/components/SettingsPanel.jsx` | Close, Person, Settings |
| `features/settings/components/YourDataSection.jsx` | DataObject, RestoreFromTrash, TableChart, UploadFile |
| `features/subscriptions/components/SubscriptionsCard.jsx` | Add, Subscriptions |
| `features/transactions/components/AddTransactionModal.tsx` | Label, Star |
| `features/transactions/components/CalendarFilter.tsx` | CalendarMonth, ChevronLeft, ChevronRight |
| `features/transactions/components/ExpensesTab.jsx` | Add, CalendarMonth, ExpandLess, ExpandMore, Receipt, TrendingDown, Warning |
| `features/transactions/components/IncomeTab.jsx` | AccountBalanceWallet, Add, PieChart, ShowChart |
| `features/transactions/components/NoTransactions.jsx` | AttachMoney, Receipt |
| `features/transactions/components/TransactionList.jsx` | Delete, Edit |
| `features/transactions/components/TrashDialog.jsx` | DeleteForever, DeleteSweep, RestoreFromTrash |

## Animación

El tema de MUI (`src/theme/materialTheme.ts`) centraliza el comportamiento, no la lista de iconos:

| Componente | Efecto |
|---|---|
| `MuiSvgIcon` | Transición suave de `transform` y `color` |
| `MuiIconButton` | `scale(1.12)` al pasar el mouse, `scale(0.92)` al hacer click |
| `MuiFab` | `translateY(-2px) scale(1.06)` al pasar el mouse |
| `MuiTab` | El icono crece (`scale(1.18)`) al pasar el mouse y hace `iconPop` al seleccionarse |
| `MuiBottomNavigationAction` | El mismo `iconPop` al seleccionarse |
| `MuiCard` | "Pop" sutil del avatar al pasar el mouse sobre la tarjeta |

Con `prefers-reduced-motion: reduce`, `globals.css` acorta animaciones y transiciones a casi 0 ms.
