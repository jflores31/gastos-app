# Finanzas — Gestión Personal

Aplicación de finanzas personales para rastrear ingresos, gastos, presupuestos, metas y más. Desplegada en **[www.jeshu.cfd](https://www.jeshu.cfd)**.

## Stack

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| UI | Material UI (MUI) v9 |
| Auth + DB | Supabase (email/password) |
| Date Picker | MUI X Date Pickers + dayjs |
| State | React Context + localStorage |
| Lenguaje | TypeScript (rutas/config) + JSX (componentes) |
| Deploy | Vercel → `https://www.jeshu.cfd` |

## Características

### Autenticación
- Login con email/contraseña
- Registro con nombre, apellidos y email — confirmación por email
- Recuperación de contraseña completa (forgot → email → reset con detección de enlace expirado)
- Protección de rutas doble capa: `src/proxy.ts` (server) + `router.replace` en `DashboardStudio` (client)
- Auto-logout por inactividad a los 2 minutos con aviso a los 30 s

**Sistema de diseño unificado en todas las páginas de auth — soporta tema claro y oscuro:**

| Página | Acento | Estado especial |
|---|---|---|
| `login` | Índigo `#6366f1` | — |
| `register` | Verde `#22c55e` | Success: tarjeta con checkmark |
| `forgot-password` | Sky `#38bdf8` | Success: email resaltado, instrucciones sobre spam |
| `reset-password` | Ámbar `#f59e0b` | 4 estados: loading, expired, form, success |

En modo oscuro: fondo `#07080f`, 3 blobs de gradiente radial, tarjeta de vidrio (`backdropFilter: blur(36px)`), borde semitransparente, sombra profunda, inputs con focus coloreado. En modo claro: fondo `background.default`, tarjeta `background.paper`, sombras suaves de color.

### Dashboard (OverviewTab)
- Saludo dinámico por hora del día + nombre del usuario logueado
- Resumen del período: ingresos, gastos y balance neto
- Health score gauge (0–100) con arco SVG
- Gráfico de flujo de caja (ingresos vs gastos por mes)
- Desglose de gastos por categoría con gráfico donut
- Heat calendar de gastos diarios
- Comparación vs período anterior con barras de progreso — oculta en "todo", muestra "Sin datos" si no hay transacciones previas; etiqueta dinámica según período activo
- **Mini cards de ingresos y gastos:** chip `+X.X% vs ant.` se muestra solo si hay período anterior con datos (`delta != null`); sub-etiqueta "N registros / N gastos" con singular/plural bilingüe; card de ingresos incluye `MiniBarLabeled` — barras verticales por categoría con nombre debajo; card de gastos incluye `Donut` circular pequeño por categoría
- Selector de período: semana, mes, trimestre, año (con `flexWrap` para pantallas pequeñas)
- Insight "Proyección" proporcional al período activo (usa `daysCount(period)` como divisor)

### Gastos (ExpensesTab)
- Gastos de hoy con detalle por transacción
- Top categorías con barras de progreso
- Presupuesto vs real por categoría con alertas visuales
- Resumen del período (total, transacciones, promedio diario, mayor gasto) — **todos reflejan el filtro activo**
- Promedio diario calculado con `daysCount(period)` (7/30/90/365 según período)
- Mayor gasto = máximo de las transacciones filtradas
- Lista completa con edición y eliminación (confirmación de borrado)
- Filtrado por categoría
- **CalendarFilter:** mapa de calor interactivo — vista por día y mes con intensidad proporcional; click filtra la lista, el footer muestra el total filtrado con etiqueta "(filtrado)"
- Footer total actualiza en tiempo real al aplicar cualquier filtro
- Fecha y hora completa en cada transacción

### Ingresos (IncomeTab)
- Tarjeta de ingresos totales con sparkline
- Grid de categorías con porcentajes y donut — tarjetas interactivas para filtrar por fuente
- Tendencia mensual
- **CalendarFilter** en color verde (success)
- Footer total actualiza en tiempo real al aplicar cualquier filtro
- Lista de transacciones con edición y eliminación

### Presupuestos (BudgetTab)
- Health score gauge visual
- Tarjetas por categoría con progreso y alertas al 80% y 100%
- Donut de distribución de gastos — **apila verticalmente en mobile** (columna en xs, fila en sm+)
- **Gráfica "Presupuesto vs Gasto real":** barras horizontales por categoría, coloreadas verde/amarillo/rojo; barras al 100%+ con patrón de rayas diagonales; footer con totales
- Comparación con mes anterior
- CRUD de presupuestos — exclusivamente desde Supabase

### Metas y Finanzas (GoalsTab)
- CRUD de metas de ahorro con fecha límite
- Gestión de cuentas bancarias/tarjetas/efectivo
- Patrimonio neto (activos − deudas) en tiempo real
- Seguimiento de inversiones (AFP, DPF, cripto, etc.)
- Control de deudas y préstamos con cuotas
- Suscripciones recurrentes
- **Pronóstico de 3 meses** basado en tendencia lineal real (slope de los últimos 6 meses de netos reales); 3 estados según historial disponible: "Sin datos" (0 meses), "Se necesitan al menos 2 meses" + promedio actual (1 mes), barras reales con `+trend×i` (2+ meses); nota "Tendencia estable · N meses" si `|trend| < 1`; total proyectado = suma real de los 3 meses
- **Evolución del patrimonio** reconstruye historial real trabajando hacia atrás desde `netWorth` actual

### Configuración (SettingsPanel)
- Tema claro/oscuro
- Paletas de acento (puntos con `flexWrap` para no desbordar en mobile)
- Densidad Comfy/Compact
- Idioma Español/Inglés
- 8 monedas (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL)
- **Categorías Favoritas:** aparecen primero en el selector de transacciones
- **Mis Categorías:** CRUD de categorías propias (nombre, tipo, color) en Supabase

### Diseño Responsivo
- Navegación por tabs en desktop, `BottomNavigation` fija en móvil
- Chips de período con `flexWrap: "wrap"` — no desbordan en iPhone SE (320px)
- Drawer de ajustes: 100% ancho en móvil, 360px en desktop
- Donut de distribución en BudgetTab: columna en xs, fila en sm+
- Formularios de auth apilados verticalmente en pantallas pequeñas
- Touch targets mínimo 40×44 px en todos los botones de acción
- Snackbar posicionado sobre `BottomNavigation` en móvil (`bottom: { xs: 72, sm: 24 }`)

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx                  # Root layout con Providers + IBM Plex Sans
│   ├── page.tsx                    # Home → DashboardStudio
│   ├── globals.css                 # Estilos globales (overflow-x: hidden, etc.)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── components/
│       ├── Providers.tsx           # UserContext → Settings → Data → Theme
│       └── DynamicThemeProvider.tsx
├── components/
│   ├── DashboardStudio.jsx         # Shell: AppBar, tabs, BottomNav, inactividad
│   ├── OverviewTab.jsx             # Vista general con gráficos y saludo
│   ├── ExpensesTab.jsx             # Gastos con CRUD y filtros
│   ├── IncomeTab.jsx               # Ingresos con CRUD y filtros
│   ├── BudgetTab.jsx               # Presupuestos
│   ├── GoalsTab.jsx                # Metas, cuentas, inversiones, deudas, subs
│   ├── Charts.jsx                  # Donut, SparkArea, StudioCashflow, HeatCalendar
│   ├── shared.jsx                  # Delta, SummaryCard, NoTransactions, CalendarFilter
│   ├── AddTransactionModal.jsx     # Modal nueva/editar transacción
│   ├── SettingsPanel.jsx           # Drawer de ajustes + categorías personalizadas
│   ├── LoginModal.jsx              # Modal de login in-app
│   └── ErrorBoundary.jsx
├── context/
│   ├── DataContext.jsx             # CRUD: txs, budgets, goals, accounts,
│   │                               #   investments, debts, subscriptions, customCats
│   ├── SettingsContext.jsx         # theme, density, currency, lang, palette + PALETTES export
│   └── UserContext.tsx             # useSupabaseUser() → undefined | User | null
├── data/
│   ├── index.js                    # CATEGORIES, CURRENCIES, I18N (sin datos mock)
│   └── helpers.js                  # filterByPeriod, periodLabel, monthCount, daysCount,
│                                   #   healthScore, recurringList, insightsList (period-aware)
├── theme/
│   └── materialTheme.js            # Temas light/dark + paletas de acento
├── hooks/
│   └── useLocalStorage.js
├── lib/
│   ├── supabase.ts                 # Cliente browser (createBrowserClient)
│   └── supabase-server.ts          # Cliente server
└── proxy.ts                        # Protección de rutas (Next.js 16)
supabase/
└── migrations/
    └── schema.sql                  # Esquema completo de DB (todas las tablas aplicadas ✓)
```

## Base de Datos (Supabase)

Todas las tablas usan RLS con `auth.uid() = user_id`.

| Tabla | Descripción |
|---|---|
| `transactions` | Transacciones (tipo, categoria, concepto, valor, fecha) |
| `budgets` | Presupuestos mensuales por categoría |
| `goals` | Metas de ahorro con target, progreso y deadline |
| `accounts` | Cuentas bancarias/tarjetas/efectivo |
| `investments` | Inversiones con tasa de retorno |
| `debts` | Préstamos con cuotas y meses restantes |
| `subscriptions` | Suscripciones recurrentes |
| `custom_categories` | Categorías propias del usuario (nombre, tipo, color) |

El esquema completo se encuentra en `supabase/migrations/schema.sql`.

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Seguridad

| Medida | Detalle |
|---|---|
| HTTP Security Headers | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy en `next.config.mjs` |
| RLS en Supabase | Todas las tablas con `auth.uid() = user_id` |
| Guardas en DELETE/UPDATE | Cada mutación captura `{ error }` y solo muta el estado local `if (!error)` |
| Sesión persistente | `persistSession: true` — sesión sobrevive recargas |
| Límite en montos | Máximo 10,000,000 validado en cliente y con `max` en el input |
| Error feedback | `loadError` en `DataContext` — banner con botón Reintentar si la carga falla |

## Notas Técnicas

**`proxy.ts` vs `middleware.ts`:** Next.js 16 usa la convención `proxy.ts`. El nombre `middleware.ts` está deprecado y produce warning en build.

**Supabase redirectTo:** `window.location.origin` puede devolver `https://www.jeshu.cfd` (con www) pero Supabase solo acepta `https://jeshu.cfd/**`. Siempre aplicar `.replace(/^https:\/\/www\./, "https://")` antes de `redirectTo`.

**Múltiples instancias de Supabase client:** Los eventos de `onAuthStateChange` no se propagan entre instancias distintas. `LoginModal` usa `window.location.reload()` tras el login para garantizar que `DataContext` recargue los datos.

**Datos sin mock:** Todos los datos provienen exclusivamente de Supabase. No hay `generateTransactions()`, `SAVINGS_GOALS`, `ACCOUNTS` ni `BUDGETS` hardcodeados.

**Filtros en ExpensesTab/IncomeTab:** `filteredTotal` se deriva con `useMemo` desde la lista ya filtrada (`expenseTxs`/`incomeTxs`). El footer y las cards de resumen siempre leen ese valor. El promedio diario usa `daysCount(period)` (7/30/90/365).

**Pronóstico GoalsTab:** 3 guards según historial: `length === 0` → "Sin datos"; `length === 1` → mensaje "Se necesitan al menos 2 meses" + promedio del mes disponible; `length >= 2` → tendencia real `(nets[last] - nets[0]) / (length - 1)`. La barra de progreso usa `avgIn > 0 ? barPct : 50` para evitar `NaN%`. Si `|trend| < 1` muestra nota "Tendencia estable · N meses de historial". Total proyectado = `next.reduce((s,n) => s+n.net, 0)` (suma real, no `netAvg * 3`).

**Evolución del patrimonio GoalsTab:** Se reconstruye desde `netWorth` actual hacia atrás: `history[i].value = netWorth - sum(nets[i+1..end])`. Barras rojas si el valor es negativo, verdes si positivo.

**`insightsList` period-aware:** Acepta `period` como último parámetro. La proyección de fin de período usa `(totalOut / daysCount(period)) * 30` para normalizar a mes-equivalente independientemente del período seleccionado.

**Mini cards OverviewTab:** `dIn`/`dOut` son `null` (no `0`) cuando `prevIn`/`prevOut === 0`, lo que oculta el chip delta completamente. Cuando se muestra: `"+X.X% vs ant."` con signo siempre explícito. Sub-etiqueta: "N registros" (ingreso) / "N gastos" (egreso) con singular/plural y soporte bilingüe. Card de ingresos: `MiniBarLabeled` — SVG con barras verticales por categoría de ingreso (color propio, nombre truncado debajo). Card de gastos: `Donut` (88px, thickness 16) con las mismas categorías del período activo. Categorías calculadas con `txByCategory(periodTxs, "INGRESO")` mapeadas a `CATEGORIES.income`.

**Auth páginas — tema claro/oscuro:** Todas usan `useTheme()` + `isDark = theme.palette.mode === "dark"`. `darkField` y `cardSx` se definen dentro del componente (no en módulo) para leer `isDark` en tiempo de render. `Blobs` acepta prop `{ isDark }` para ajustar opacidad de los gradientes.

**Presupuestos — carga y borrado:** `DataContext` inicializa `editBudgets` en `{}` y lo llena solo desde Supabase. `deleteBudgetCat(cat)` borra de la BD antes de actualizar el estado.

**AddTransactionModal — prevención de doble submit:** `saving` state deshabilita el botón y muestra `CircularProgress`. `handleSubmit` tiene try-catch para liberar `saving` si la operación lanza excepción.

**CalendarFilter:** En `shared.jsx`. Vista día: grid 7 columnas con `alpha(mainColor, intensidad)`; vista mes: grid 4×3. Rojo para EGRESO, verde para INGRESO. Click en celda activa `onFilter({ type, date })`, click nuevamente limpia.

**Fecha y hora en transacciones:** `AddTransactionModal` inicializa con `dayjs()` (hora exacta). Al cambiar la fecha en el `DatePicker` se preserva la hora: `newValue.hour(h).minute(m).second(s)`.

## Despliegue

```bash
vercel --prod
```

Las variables de entorno se configuran en el Dashboard de Vercel.

## Licencia

MIT
