# Finanzas — Gestión Personal

Aplicación de finanzas personales para rastrear ingresos, gastos, presupuestos, metas y más. Desplegada en **[www.jeshu.cfd](https://www.jeshu.cfd)**.

## Stack

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| UI | Material UI (MUI) v9 |
| Auth + DB | Supabase (email/password + Google + GitHub OAuth) |
| Date Picker | MUI X Date Pickers + dayjs |
| State | React Context + localStorage |
| Lenguaje | TypeScript (rutas/config) + JSX (componentes) |
| Deploy | Vercel → `https://www.jeshu.cfd` |

## Características

### Autenticación
- Login con email/contraseña, Google OAuth y GitHub OAuth
- Registro con nombre, apellidos y email — confirmación por email
- Recuperación de contraseña completa (forgot → email → reset con detección de enlace expirado)
- Protección de rutas doble capa: `src/proxy.ts` (server) + `router.replace` en `DashboardStudio` (client)
- Auto-logout por inactividad a los 2 minutos con aviso a los 30 s

**Sistema de diseño unificado en todas las páginas de auth:**

| Página | Acento | Estado especial |
|---|---|---|
| `login` | Índigo `#6366f1` | — |
| `register` | Verde `#22c55e` | Success: dark glass card con checkmark |
| `forgot-password` | Sky `#38bdf8` | Success: email resaltado, instrucciones sobre spam |
| `reset-password` | Ámbar `#f59e0b` | 4 estados: loading, expired, form, success |

Todos comparten: fondo `#07080f`, 3 blobs de gradiente radial posicionados, tarjeta de vidrio centrada (`backdropFilter: blur(36px)`, borde semitransparente, sombra profunda), inputs oscuros con focus coloreado, botón con gradiente animado y `CircularProgress` en carga.

### Dashboard (OverviewTab)
- Saludo dinámico por hora del día + nombre del usuario logueado
- Resumen mensual: ingresos, gastos y balance neto
- Health score gauge (0–100) con arco SVG
- Gráfico de flujo de caja (ingresos vs gastos por mes)
- Desglose de gastos por categoría con gráfico donut
- Heat calendar de gastos diarios
- Comparación vs período anterior con barras de progreso — oculta en "todo" (sin período definido), muestra "Sin datos" si no hay transacciones en el período previo; etiqueta dinámica según período activo
- Selector de período: semana, mes, trimestre, año

### Gastos (ExpensesTab)
- Gastos de hoy con detalle por transacción
- Top categorías con barras de progreso
- Presupuesto vs real por categoría con alertas visuales
- Resumen del período (total, transacciones, promedio diario, mayor gasto)
- Lista completa con edición y eliminación (confirmación de borrado)
- Filtrado por categoría
- **CalendarFilter:** mapa de calor interactivo — vista por día (7 columnas) y por mes (4×3) con intensidad de color proporcional al gasto; click para filtrar la lista, chip con X para limpiar el filtro
- Fecha y hora completa en cada transacción: "24 de mayo de 2026, 3:45 p.m."

### Ingresos (IncomeTab)
- Tarjeta de ingresos totales con sparkline
- Grid de categorías con porcentajes y donut — **tarjetas interactivas:** click en la tarjeta filtra la lista por esa categoría; botón "+" añade una transacción pre-seleccionando esa categoría
- Tendencia mensual
- **CalendarFilter:** mismo mapa de calor que Gastos pero en color verde (success)
- Lista de transacciones con edición y eliminación
- Fecha y hora completa en cada transacción

### Presupuestos (BudgetTab)
- Health score gauge visual
- Tarjetas por categoría con progreso y alertas al 80% y 100%
- Donut de distribución de gastos
- **Gráfica "Presupuesto vs Gasto real":** barras horizontales por categoría, coloreadas verde/amarillo/rojo según uso; barras al 100%+ con patrón de rayas diagonales; footer con totales y chip del porcentaje global
- Comparación con mes anterior
- CRUD de presupuestos — cargados exclusivamente desde Supabase (sin valores por defecto hardcodeados)
- Al eliminar un presupuesto se borra permanentemente de la BD

### Metas y Finanzas (GoalsTab)
- CRUD de metas de ahorro con fecha límite
- Gestión de cuentas bancarias/tarjetas/efectivo — 100% datos del usuario en Supabase
- Patrimonio neto (activos − deudas) en tiempo real
- Seguimiento de inversiones (AFP, DPF, cripto, etc.)
- Control de deudas y préstamos con cuotas
- Suscripciones recurrentes
- Pronóstico de 3 meses basado en tendencia real

### Configuración (SettingsPanel)
- Tema claro/oscuro
- 4 paletas de acento (Amber, Indigo, Green, Mono)
- Densidad Comfy/Compact
- Idioma Español/Inglés
- 8 monedas (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL)
- **Categorías Favoritas:** marca categorías existentes para verlas primero en el selector
- **Mis Categorías:** CRUD de categorías propias (nombre, tipo Gasto/Ingreso, color) guardadas en Supabase — el nombre se muestra correctamente en todas las listas y filtros

### Diseño Responsivo
- Navegación por tabs en desktop, BottomNavigation fija en móvil
- Drawer de ajustes ocupa 100% en móvil, 360px en desktop
- Formularios de registro apilados verticalmente en pantallas pequeñas
- Touch targets mínimo 40×44 px en todos los botones de acción

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
│   ├── ExpensesTab.jsx             # Gastos con CRUD
│   ├── IncomeTab.jsx               # Ingresos con CRUD
│   ├── BudgetTab.jsx               # Presupuestos
│   ├── GoalsTab.jsx                # Metas, cuentas, inversiones, deudas, subs
│   ├── Charts.jsx                  # Donut, SparkArea, StudioCashflow, HeatCalendar
│   ├── shared.jsx                  # Delta, SummaryCard, NoTransactions, CalendarFilter
│   ├── AddTransactionModal.jsx     # Modal nueva/editar transacción
│   ├── SettingsPanel.jsx           # Drawer de ajustes + categorías personalizadas
│   ├── LoginModal.jsx              # Modal de login in-app
│   └── ErrorBoundary.jsx
├── context/
│   ├── DataContext.jsx             # CRUD: txs, budgets (+ deleteBudgetCat), goals, accounts,
│   │                               #   investments, debts, subscriptions, customCats
│   ├── SettingsContext.jsx         # theme, density, currency, lang, palette + PALETTES export
│   └── UserContext.tsx             # useSupabaseUser() → undefined | User | null
├── data/
│   ├── index.js                    # CATEGORIES, CURRENCIES, I18N (sin datos mock)
│   └── helpers.js                  # filterByPeriod, periodLabel, monthCount
├── theme/
│   └── materialTheme.js            # Temas light/dark + 4 paletas de acento
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
| Guardas en DELETE/UPDATE | Cada mutación llama `getUser()` y añade `.eq("user_id", user.id)` antes de ejecutar la query |
| Sesión persistente | `persistSession: true` (default) — sesión sobrevive recargas de página |
| Límite en montos | Monto máximo 10,000,000 validado en cliente y con `max` en el input |
| Redirección segura | `router.replace("/login")` en vez de `window.location.href` |

## Notas Técnicas

**`proxy.ts` vs `middleware.ts`:** Next.js 16 usa la convención `proxy.ts`. El nombre `middleware.ts` está deprecado y produce warning en build.

**Supabase redirectTo:** `window.location.origin` puede devolver `https://www.jeshu.cfd` (con www) pero Supabase solo permite `https://jeshu.cfd/**`. Siempre aplicar `.replace(/^https:\/\/www\./, "https://")` antes de pasarlo como `redirectTo`.

**PALETTES:** Definidas como objeto en `SettingsContext.jsx` y exportadas. Nunca redefinir en otro archivo.

**Sin datos mock en producción:** `SAVINGS_GOALS`, `ACCOUNTS`, `FAMILY_MEMBERS`, `BUDGETS` y `generateTransactions()` fueron eliminados de `data/index.js`. Todos los datos provienen exclusivamente de Supabase.

**Presupuestos — carga y borrado:** `DataContext` inicializa `editBudgets` en `{}` y lo llena solo desde Supabase. `deleteBudgetCat(cat)` borra de la BD antes de actualizar el estado, evitando que los presupuestos eliminados reaparezcan al recargar.

**AddTransactionModal — prevención de doble submit:** `saving` state deshabilita el botón y muestra `CircularProgress` mientras `addTx`/`updateTx` están en vuelo.

**Categorías personalizadas en modal:** Se almacenan como `value: "custom_${id}"` para distinguirlas de las categorías estáticas.

**Resolución de nombre de categoría custom:** Todos los tabs usan `resolveCatName(categoria)` que busca primero en `CATEGORIES`, luego en `customCats` por `id = categoria.slice("custom_".length)`. Aplica en `ExpensesTab`, `IncomeTab`, `OverviewTab` y `BudgetTab`. El array `customCats` viene de `useData()`.

**CalendarFilter:** Componente en `shared.jsx`. Recibe `{ txs, tipo, onFilter, lang, currency }`. Vista día: grid 7 columnas con `alpha(mainColor, intensidad)`; vista mes: grid 4×3. Color rojo (error) para EGRESO, verde (success) para INGRESO. Click en celda llama `onFilter({ type: "day"|"month", date })`, click nuevamente limpia el filtro.

**Comparación vs período anterior (OverviewTab):** `filterByPeriod(txs, "all", -1)` ignora el offset y retorna todos los datos — la sección se oculta cuando `period === "all"`. Cuando no hay transacciones en el período anterior (`prevIn === 0 && prevOut === 0`), muestra "Sin datos del período anterior" en lugar de barras vacías con "+0.0%". La etiqueta es dinámica: "vs semana/mes/trimestre/año anterior" según el período seleccionado.

**Fecha y hora en transacciones:** `AddTransactionModal` inicializa con `dayjs()` (hora exacta). Al cambiar solo la fecha en el `DatePicker`, se preserva la hora: `newValue.hour(fecha.hour()).minute(fecha.minute()).second(fecha.second())`. Supabase almacena el ISO completo. Las listas muestran `toLocaleString("es-PE", { day, month: "long", year, hour, minute, hour12: true })`.

**Snackbar sobre BottomNavigation en mobile:** `sx={{ bottom: { xs: 72, sm: 24 } }}` para que no quede tapado por el nav fijo de 56px.

## Despliegue

```bash
# Deploy a producción en Vercel
vercel --prod
```

Las variables de entorno se configuran en el Dashboard de Vercel.

## Licencia

MIT
