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
- Protección de rutas doble capa: `src/proxy.ts` (server) + redirect en `DashboardStudio` (client)
- Auto-logout por inactividad a los 2 minutos con aviso a los 30 s

### Dashboard (OverviewTab)
- Saludo dinámico por hora del día + nombre del usuario logueado
- Resumen mensual: ingresos, gastos y balance neto
- Health score gauge (0–100) con arco SVG
- Gráfico de flujo de caja (ingresos vs gastos por mes)
- Desglose de gastos por categoría con gráfico donut
- Heat calendar de gastos diarios
- Comparación vs mes anterior con barras de progreso
- Selector de período: semana, mes, trimestre, año

### Gastos (ExpensesTab)
- Gastos de hoy con detalle por transacción
- Top categorías con barras de progreso
- Presupuesto vs real por categoría con alertas visuales
- Resumen del período (total, transacciones, promedio diario, mayor gasto)
- Lista completa con edición y eliminación (confirmación de borrado)
- Filtrado por categoría

### Ingresos (IncomeTab)
- Tarjeta de ingresos totales con sparkline
- Grid de categorías con porcentajes y donut
- Tendencia mensual
- Lista de transacciones con edición y eliminación

### Presupuestos (BudgetTab)
- Health score gauge visual
- Tarjetas por categoría con progreso y alertas al 80% y 100%
- Donut de distribución de gastos
- Comparación con mes anterior
- CRUD de presupuestos

### Metas y Finanzas (GoalsTab)
- CRUD de metas de ahorro con fecha límite
- Gestión de cuentas bancarias/tarjetas/efectivo
- Patrimonio neto (activos − deudas) en tiempo real
- Seguimiento de inversiones (AFP, DPF, cripto, etc.)
- Control de deudas y préstamos con cuotas
- Suscripciones recurrentes
- Pronóstico de 3 meses

### Configuración (SettingsPanel)
- Tema claro/oscuro
- 4 paletas de acento (Amber, Indigo, Green, Mono)
- Densidad Comfy/Compact
- Idioma Español/Inglés
- 8 monedas (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL)
- **Categorías Favoritas:** marca categorías existentes para verlas primero en el selector
- **Mis Categorías:** CRUD de categorías propias (nombre, tipo Gasto/Ingreso, color) guardadas en Supabase

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
│   ├── shared.jsx                  # Delta, SummaryCard, NoTransactions
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
│   ├── index.js                    # CATEGORIES, BUDGETS, CURRENCIES, I18N
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

## Notas Técnicas

**`proxy.ts` vs `middleware.ts`:** Next.js 16 usa la convención `proxy.ts`. El nombre `middleware.ts` está deprecado y produce warning en build.

**Supabase redirectTo:** `window.location.origin` puede devolver `https://www.jeshu.cfd` (con www) pero Supabase solo permite `https://jeshu.cfd/**`. Siempre aplicar `.replace(/^https:\/\/www\./, "https://")` antes de pasarlo como `redirectTo`.

**PALETTES:** Definidas como objeto en `SettingsContext.jsx` y exportadas. Nunca redefinir en otro archivo.

**Categorías personalizadas en modal:** Se almacenan como `value: "custom_${id}"` para distinguirlas de las categorías estáticas.

## Despliegue

```bash
# Deploy a producción en Vercel
vercel --prod
```

Las variables de entorno se configuran en el Dashboard de Vercel.

## Licencia

MIT
