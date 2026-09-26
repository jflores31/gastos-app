# Finanzas — Gestión Personal

Aplicación de finanzas personales para rastrear ingresos, gastos, presupuestos, metas y más. Desplegada en **[www.jeshu.cfd](https://www.jeshu.cfd)**.

**Versión:** `v0.0.1` · [Historial de cambios](CHANGELOG.md) · [Investigación de proyectos similares y hoja de ruta](docs/INVESTIGACION.md)

<!-- i18n-selector-start -->
🌐 **Español** · [English](README.en.md)
<!-- i18n-selector-end -->

## Stack

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack) |
| UI | Material UI (MUI) v9 + `@mui/icons-material` (variante Rounded) |
| Auth + DB | Supabase (email/password; OAuth preparado pero desactivado) |
| Date Picker | MUI X Date Pickers + dayjs |
| State | React Context + localStorage |
| Lenguaje | TypeScript (rutas/config) + JSX (componentes) |
| Tests | Vitest (unitarios y componentes con jsdom) + Playwright (end-to-end) |
| CI | GitHub Actions: lint, typecheck, tests y build |
| Deploy | Vercel → `https://www.jeshu.cfd` |

## Características

### Autenticación
- Login con email/contraseña
- Registro con nombre, apellidos y email — confirmación por email
- Recuperación de contraseña completa (forgot → email → reset con detección de enlace expirado)
- Protección de rutas doble capa: `src/proxy.ts` (server) + `router.replace` en `DashboardStudio` (client)
- Auto-logout por inactividad a los 2 minutos con aviso a los 30 s, medido entre todas las pestañas (una pestaña inactiva no cierra la sesión si estás activo en otra)
- Cierre forzado al reabrir el navegador: `UserContext` escribe el flag `gastos_session_alive` en `sessionStorage` al detectar `SIGNED_IN`; `DashboardStudio` lo verifica al montar. Si falta, pregunta por `BroadcastChannel` a las otras pestañas: si alguna responde (pestaña nueva con el navegador abierto) hereda el flag; si no (navegador reabierto) cierra la sesión solo en este navegador (`scope: "local"`)
- Pestaña abierta >8 h: `checkSessionAge` lee `gastos_last_active` (localStorage) al recuperar visibilidad (`visibilitychange` + `pageshow` para bfcache) y cierra sesión si supera el límite

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
- **Mini cards de ingresos y gastos:** chip `+X.X% vs ant.` se muestra solo si hay período anterior con datos (`delta != null`); sub-etiqueta "N registros / N gastos" con singular/plural bilingüe; ambas cards usan `CategoryBars` — lista de barras horizontales (top 5) con dot de color, nombre, monto exacto y barra proporcional a la categoría más grande
- Selector de período: semana, mes, trimestre, año (con `flexWrap` para pantallas pequeñas)
- Insight "Proyección" proporcional al período activo (usa `daysCount(period)` como divisor)

### Gastos (ExpensesTab)
- Gastos de hoy con detalle por transacción
- Top categorías con icono, posición y barras de progreso
- Presupuesto vs real — muestra las categorías del presupuesto activo (`editBudgets`), no hardcoded; mensaje "Sin presupuestos" si no hay ninguno
- Resumen del período (total, transacciones, promedio diario, mayor gasto) — **todos reflejan el filtro activo**; barras de progreso con valores relativos significativos (sin barra para el conteo)
- Promedio diario calculado con `daysCount(period)` (7/30/90/365 según período)
- Mayor gasto = máximo de las transacciones filtradas
- Lista completa con el icono de cada categoría, edición y eliminación (confirmación de borrado)
- Filtrado por categoría con chips que muestran el icono
- **CalendarFilter:** mapa de calor interactivo — vista por día y mes con intensidad proporcional; click filtra la lista, el footer muestra el total filtrado con etiqueta "(filtrado)"
- Footer total actualiza en tiempo real al aplicar cualquier filtro
- Fecha y hora completa en cada transacción

### Ingresos (IncomeTab)
- Tarjeta de ingresos totales con sparkline; chip `+X.X% vs ant.` oculto cuando no hay período anterior (`dIn = null`)
- Grid de categorías con icono, porcentajes y donut — nombre, color e icono vía `resolveCategoryMeta` (nativas y personalizadas); tarjetas interactivas para filtrar por fuente
- Tendencia mensual con leyenda completa: ingreso / egreso / neto
- **CalendarFilter** en color verde (success)
- Footer total actualiza en tiempo real al aplicar cualquier filtro
- Lista de transacciones con edición y eliminación; avatar con el icono y el color de cada categoría

### Presupuestos (BudgetTab)
- Health score gauge visual
- Tarjetas por categoría con icono, progreso y alertas al 80% y 100%
- Donut de distribución de gastos — **apila verticalmente en mobile** (columna en xs, fila en sm+)
- **Gráfica "Presupuesto vs Gasto real":** barras horizontales por categoría, coloreadas verde/amarillo/rojo; barras al 100%+ con patrón de rayas diagonales; footer con totales
- Comparación con período anterior — etiqueta dinámica según período activo (semana/mes/trimestre/año)
- CRUD de presupuestos — exclusivamente desde Supabase; selector incluye categorías personalizadas (custom) además de las nativas

### Metas y Finanzas (GoalsTab)
- CRUD de metas de ahorro con fecha límite, color e icono elegible (`IconPicker`) — formulario con nombre único
- Gestión de cuentas bancarias/tarjetas/efectivo
- Patrimonio neto (activos − deudas) en tiempo real
- Seguimiento de inversiones (AFP, DPF, cripto, etc.) — formulario con nombre único
- Control de deudas y préstamos con cuotas — formulario con campo de nombre único (guarda en ambos idiomas automáticamente)
- Suscripciones recurrentes con selector de categoría (nativas + personalizadas); botón "Agregar / Add" bilingüe en estados vacíos
- **Pronóstico de 3 meses** basado en tendencia lineal real (slope de los últimos 6 meses de netos reales); 3 estados según historial disponible: "Sin datos" (0 meses), "Se necesitan al menos 2 meses" + promedio actual (1 mes), barras reales con `+trend×i` (2+ meses); nota "Tendencia estable · N meses" si `|trend| < 1`; total proyectado = suma real de los 3 meses
- **Evolución del patrimonio** reconstruye historial real trabajando hacia atrás desde `netWorth` actual

### Perfil y Configuración (SettingsPanel)
Drawer con **dos pestañas** que separan Perfil de Ajustes:
- **Perfil:** hero con avatar, nombre y email; **Datos personales** (editar nombre y apellidos — se guardan como `first_name`/`last_name` + `full_name` sincronizado); **Categorías Favoritas** (aparecen primero en el selector de transacciones) y **Mis Categorías** (CRUD de categorías propias — nombre, tipo, color e icono — en Supabase)
- **Ajustes:** tema claro/oscuro, paletas de acento (puntos con `flexWrap` en mobile), densidad Comfy/Compact, idioma Español/Inglés, 8 monedas (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL). Los montos se guardan siempre en PEN: los formularios convierten con `toBase()` al guardar y `fromBase()` al editar (`src/data/index.js`), con tasas fijas
- El **avatar** de la AppBar abre Perfil; el **engranaje** abre Ajustes (prop `initialTab`)
- **Toggle día/noche en el login** (`AuthThemeToggle`): el usuario elige tema antes de entrar; persiste en `localStorage`

### Diseño Responsivo
- Navegación por tabs en desktop, `BottomNavigation` fija en móvil
- Chips de período con `flexWrap: "wrap"` — no desbordan en iPhone SE (320px)
- Drawer de ajustes: 100% ancho en móvil, 360px en desktop
- Donut de distribución en BudgetTab: columna en xs, fila en sm+
- Formularios de auth apilados verticalmente en pantallas pequeñas
- Touch targets mínimo 40×44 px en todos los botones de acción
- Snackbar posicionado sobre `BottomNavigation` en móvil (`bottom: { xs: 72, sm: 24 }`)
- Accesibilidad por teclado: `CalendarFilter` (celdas día/mes), sección "Gastos de hoy" (ExpensesTab) y filas de deudas/suscripciones (GoalsTab) tienen `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space)

## Estructura del Proyecto

```
.
├── .github/workflows/ci.yml        # CI: lint, typecheck, tests, build y e2e en cada PR y push a main
├── e2e/                            # Tests end-to-end (Playwright) + playwright.config.ts
├── .env.example                    # Variables de entorno (copiar a .env.local)
├── CHANGELOG.md                    # Historial de cambios
├── ICONOS_Y_ESTRUCTURA.txt         # Mapa de iconos y estructura en texto plano
├── docs/
│   ├── INVESTIGACION.md            # Proyectos similares, hoja de ruta y mejoras técnicas
│   ├── SECURITY-CSP.md             # CSP con nonce por request
│   └── TESTING.md                  # Tests unitarios (Vitest)
├── public/favicon.svg              # Icono de la app
├── src/                            # (detalle abajo)
└── supabase/
    ├── config.toml
    ├── migrations/schema.sql       # Esquema completo de la DB (fuente única, para una DB nueva)
    ├── migrations/upgrade_0.0.1.sql # Cambios de la 0.0.1 para una DB existente (idempotente)
    └── seed/reset.sql              # Vacía las 8 tablas — destructivo
```

```
src/
├── app/
│   ├── layout.tsx                  # Root layout: Providers, fuentes, favicon; render dinámico (nonce del CSP)
│   ├── fonts/                      # IBM Plex Sans + JetBrains Mono (woff2, subset latin, OFL) vía next/font/local
│   ├── page.tsx                    # Home → DashboardStudio
│   ├── globals.css                 # Estilos globales (overflow-x: hidden, reduced motion, etc.)
│   ├── error.tsx · global-error.tsx · not-found.tsx
│   ├── login/ · register/ · forgot-password/ · reset-password/   # page.tsx de cada pantalla de auth
│   ├── auth/callback/route.ts      # Canje del código PKCE de OAuth (OAuth desactivado por ahora)
│   ├── api/client-error/route.ts   # Recibe errores del navegador y los escribe en los logs del servidor
│   └── components/
│       ├── Providers.tsx           # UserContext → Settings → Data → Theme
│       ├── DynamicThemeProvider.tsx
│       ├── ErrorReporter.tsx       # Reporta errores no capturados (window.onerror, unhandledrejection)
│       └── auth/                   # AuthCard, AuthErrorAlert, AuthThemeToggle, authStyles
├── components/
│   ├── DashboardStudio.jsx         # Shell: AppBar, tabs, BottomNav, período, toasts, seguridad de sesión
│   ├── OverviewTab.jsx             # Vista general con gráficos y saludo
│   ├── ExpensesTab.jsx             # Gastos con CRUD y filtros
│   ├── IncomeTab.jsx               # Ingresos con CRUD y filtros
│   ├── BudgetTab.jsx               # Presupuestos
│   ├── GoalsTab.jsx                # Metas, cuentas, inversiones, deudas, suscripciones
│   ├── Charts.jsx                  # Donut, SparkArea, StudioCashflow, HeatCalendar
│   ├── shared.jsx                  # StatsCard, EmptyState, NoTransactions, CalendarFilter
│   ├── AddTransactionModal.jsx     # Modal nueva/editar transacción
│   ├── SettingsPanel.jsx           # Drawer de perfil/ajustes + categorías personalizadas
│   └── LoginModal.jsx              # Modal de login in-app
├── context/
│   ├── DataContext.jsx             # Carga y CRUD: txs, budgets, goals, accounts,
│   │                               #   investments, debts, subscriptions, customCats
│   ├── SettingsContext.jsx         # theme, density, currency, lang, palette + PALETTES
│   └── UserContext.tsx             # useSupabaseUser() → undefined | User | null
├── data/
│   ├── index.js                    # CATEGORIES, CURRENCIES, I18N, fmtMoney, toBase/fromBase
│   ├── helpers.js                  # filterByPeriod, healthScore, flagAnomalies, recurringList,
│   │                               #   insightsList, linearRegressionSlope…
│   ├── fetchAllRows.js             # Paginación con .range() (Supabase corta en 1000 filas)
│   └── *.test.js                   # helpers, currency, fetchAllRows (componentes: *.test.jsx junto a cada uno)
├── theme/
│   ├── materialTheme.js            # Temas light/dark, acentos y animación de iconos
│   ├── icons.js                    # Set central de iconos MUI Rounded
│   ├── categoryIcons.js            # Categoría → icono, ICON_CHOICES, resolveCategoryMeta() (+ test)
│   ├── iconTones.js                # Gradientes por tono (TONES, TONE_BY_PALETTE)
│   ├── GradientIcon.jsx            # GradientIcon + CategoryAvatar
│   └── IconPicker.jsx              # Selector de icono (metas y categorías personalizadas)
├── hooks/
│   └── useLocalStorage.js          # Valor por defecto en el primer render; el guardado, tras montar
├── lib/
│   ├── featureFlags.js             # OAUTH_ENABLED (login, registro y LoginModal)
│   ├── reportError.js              # Envía errores del navegador a /api/client-error
│   ├── supabase.ts                 # Cliente browser (createBrowserClient)
│   └── supabase-server.ts          # Cliente server
└── proxy.ts                        # Guard de auth + CSP con nonce por request (Next.js 16)
```

## Base de Datos (Supabase)

Todas las tablas usan RLS con `auth.uid() = user_id`.

| Tabla | Descripción |
|---|---|
| `transactions` | Transacciones (tipo, categoria, concepto, valor en PEN, fecha) |
| `budgets` | Presupuestos mensuales por categoría (monto en PEN) |
| `goals` | Metas de ahorro con target, progreso, deadline, color e icono (clave de `ICON_CHOICES`; las metas viejas guardan un glifo de texto) |
| `accounts` | Cuentas bancarias/tarjetas/efectivo |
| `investments` | Inversiones con tasa de retorno |
| `debts` | Préstamos con cuotas y meses restantes |
| `subscriptions` | Suscripciones recurrentes |
| `custom_categories` | Categorías propias del usuario (nombre, tipo, color, icono) |

El esquema completo se encuentra en `supabase/migrations/schema.sql`.

> **Cambios de esquema en una DB existente:** `schema.sql` usa `CREATE TABLE IF NOT EXISTS`, así que no altera tablas ya creadas. Los cambios de cada versión van en un script idempotente que hay que ejecutar en el SQL Editor de Supabase **antes** de desplegar. Para la 0.0.1 es `supabase/migrations/upgrade_0.0.1.sql`, que agrega:
> - la columna `custom_categories.icon`;
> - índices `(user_id, …)` en las tablas;
> - políticas RLS con `(select auth.uid())`.
>
> Se probó en Postgres 16: ejecutarlo dos veces no da error y deja la DB igual que una instalación nueva con `schema.sql`. Con 200.000 transacciones, la carga de un usuario bajó de ~120 ms (recorrido completo de la tabla) a ~1,4 ms (índice).

> **Mantenimiento — vaciar la base de datos:** `supabase/seed/reset.sql` deja las 8 tablas a cero (`count` → `TRUNCATE` → verificación) sin tocar el esquema ni las cuentas de `auth.users`. Es **destructivo e irreversible** — ejecútalo desde el SQL Editor de Supabase.

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev

# Tests unitarios y de componentes (Vitest)
npm run test

# Tests end-to-end (Playwright) sobre el build de producción
npm run build && npm run test:e2e

# Lint (ESLint) y chequeo de tipos (tsc)
npm run lint
npm run typecheck
```

La CI (`.github/workflows/ci.yml`) corre lint, typecheck, tests, build y tests end-to-end en cada push a `main` y en cada PR.

La app estará disponible en `http://localhost:3000`. Detalles de testing en **[docs/TESTING.md](docs/TESTING.md)**.

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Seguridad

| Medida | Detalle |
|---|---|
| HTTP Security Headers | CSP **con nonce por request** (`script-src 'self' 'nonce-…' 'strict-dynamic'`, sin `'unsafe-inline'`) generada en `proxy.ts`; resto de headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) en `next.config.mjs` |
| RLS en Supabase | Todas las tablas con políticas owner-only `FOR ALL TO authenticated USING / WITH CHECK (auth.uid() = user_id)` |
| Política de contraseñas | `minimum_password_length = 8` en `supabase/config.toml` |
| Guardas en DELETE/UPDATE | Cada mutación captura `{ error }` y hace `throw error` si falla — el estado local nunca se muta ante error |
| Sesión por browser session | `gastos_session_alive` en `sessionStorage` (limpiado por el navegador al cerrar); reabrir el browser fuerza re-login. La sesión sobrevive recargas de página normales. Una pestaña nueva abierta a mano pregunta por `BroadcastChannel("gastos-session")` si hay otra pestaña viva y, si responde, hereda la sesión en vez de cerrarla |
| Cierres automáticos acotados | Inactividad, 8 h y navegador reabierto usan `signOut({ scope: "local" })` (no revocan sesiones de otros dispositivos). Antes de cerrar por inactividad se relee `gastos_last_active` (compartido entre pestañas) para no cerrar la sesión si el usuario está activo en otra pestaña |
| Expiración por inactividad prolongada | `gastos_last_active` en `localStorage` actualizado en cada evento de usuario; si la pestaña lleva >8 h sin actividad se cierra la sesión al recuperar el foco |
| Límite en montos | Máximo 10,000,000 (en PEN, la moneda base) validado en cliente y con `max` en el input |
| Error feedback | `loadError` en `DataContext` — banner con botón Reintentar si la carga falla |
| Errores visibles en producción | Los errores del navegador (límites de error de Next, fallos de carga de datos, errores no capturados) se envían con `reportError()` a `/api/client-error`, que los escribe como una línea JSON `[client-error]` en los logs del servidor (Vercel → Logs). Se envía solo el pathname (sin query), con tope de tamaño y de 10 reportes por página. La ruta acepta reportes sin sesión para cubrir las páginas de auth. En producción se conservan `console.error` y `console.warn` |

> Arquitectura del CSP con nonce por request (flujo en `proxy.ts`, render dinámico, cómo verificar): **[docs/SECURITY-CSP.md](docs/SECURITY-CSP.md)**.

## Notas Técnicas

### Datos y Supabase

**Carga de datos:** `DataContext.load()` corre con el primer evento de `onAuthStateChange` que traiga `session.user` (`INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED` o `USER_UPDATED`) y se deduplica por `session.user.id`, así los refrescos periódicos del token no repiten las 8 queries. No se llama al montar (eso duplicaba las queries). Si falla, se resetea el flag para reintentar con el siguiente evento. Esto elimina el bug de "hay que refrescar 2 veces", cuando un `INITIAL_SESSION` sin sesión utilizable no tenía reintento. Las queries dependen de RLS (`select("*")` sin `.eq("user_id")`).

**Más de 1000 transacciones:** PostgREST corta cada respuesta en `max_rows` (1000). `transactions` se pide con `fetchAllRows()` (`src/data/fetchAllRows.js`), que pagina con `.range()` ordenando por `fecha` + `id`. Es todo o nada: si una página falla, no se muestra un resultado parcial.

**Moneda:** los montos se guardan siempre en PEN. `fmtMoney(v, currency)` multiplica por la `rate` fija de `CURRENCIES` al mostrar, y los formularios convierten con `toBase()` al guardar y `fromBase()` al precargar una edición (transacciones, presupuestos, metas, cuentas, inversiones, deudas y suscripciones; las tasas % y los meses no se convierten). El tope de 10,000,000 se valida en PEN. Límite conocido: redondear a 2 decimales en PEN puede mover un monto en COP hasta unas 5 unidades.

**Tipo de transacción derivado de la categoría (no del toggle):** en `AddTransactionModal`, el `tipo` (INGRESO/EGRESO) que se guarda es el de la **categoría seleccionada** (`categoria.type`). Las categorías personalizadas se muestran sin importar el toggle, y guardar el `tipo` del toggle hacía que un ingreso personalizado se registrara como gasto. El `onChange` del Autocomplete también sincroniza el toggle. Backfill de datos viejos: `UPDATE transactions t SET tipo = cc.tipo FROM custom_categories cc WHERE t.categoria = 'custom_' || cc.id::text AND t.tipo <> cc.tipo;`.

**Mutaciones con error explícito:**
- Todas las funciones CRUD de `DataContext` hacen `if (error) throw error` antes de tocar el estado local.
- **Usuario de la sesión:** usan el id del usuario de la sesión, guardado en un ref desde `onAuthStateChange` y leído con `requireUserId()`, en vez de llamar a `supabase.auth.getUser()` (una petición al servidor de Auth) antes de cada escritura. RLS sigue validando el JWT en el servidor.
- **Sin sesión:** `requireUserId()` lanza "No hay sesión activa", así que la UI muestra un error en vez de un "guardado" falso.
- **CRUD común:** metas, cuentas, inversiones, deudas, suscripciones y categorías personalizadas usan `useTableCrud()`, que hace update por `id` o insert, y borra por `id` + `user_id`. `optionalColumns` reintenta sin una columna nueva si la DB todavía no la tiene (`PGRST204`). Transacciones y presupuestos tienen funciones propias.
- **En los componentes:** los handlers usan `try/catch/finally` y muestran un toast de éxito o error; por eso `DashboardStudio` pasa `showToast` a las pestañas y a `AddTransactionModal`.

**Presupuestos:** `editBudgets` empieza en `{}` y se llena solo desde Supabase; `deleteBudgetCat(cat)` borra en la DB antes de actualizar el estado. El monto guardado es mensual; las vistas lo multiplican por `monthCount(period)`.

**Tipos numéricos:** los `map*` de `DataContext` convierten a `Number` los decimales que Supabase devuelve como string (p. ej. `remaining` y `original_months` de deudas).

**Datos sin mock:** todo sale de Supabase; no hay transacciones, metas, cuentas ni presupuestos de ejemplo en el código.

**Varias instancias del cliente Supabase:** los eventos de `onAuthStateChange` no se propagan entre instancias distintas. `LoginModal` usa `window.location.reload()` tras el login para que `DataContext` recargue.

**Error "JWT issued at future":** aparece cuando el reloj del dispositivo está adelantado respecto a Supabase (basta 1 minuto). Supabase rechaza el JWT y fallan todas las queries. Solución: sincronizar el reloj del sistema. El banner de error detecta este caso y muestra un mensaje accionable.

### Sesión y autenticación

**Seguridad de sesión:**
- `UserContext` escribe `gastos_session_alive` en `sessionStorage` al recibir `SIGNED_IN`; el navegador la borra al cerrarse y las recargas (F5) la conservan.
- Al montar, `DashboardStudio` la verifica. Si falta, pregunta por `BroadcastChannel("gastos-session")` si hay otra pestaña viva (espera unos 300 ms): si alguna responde, es una pestaña nueva con el navegador abierto y hereda la marca; si no, el navegador se reabrió y cierra sesión.
- Inactividad: 2 min con aviso a los 30 s. `gastos_last_active` (localStorage, compartido entre pestañas) se actualiza con cada evento del usuario y se relee antes de avisar o cerrar, así una pestaña inactiva no cierra la sesión si estás activo en otra.
- Pestaña abierta más de 8 h: se revisa al recuperar visibilidad (`visibilitychange` y `pageshow` para bfcache).
- Los cierres automáticos usan `signOut({ scope: "local" })`, que no revoca las sesiones de otros dispositivos; el botón "Cerrar sesión" mantiene el alcance global. Todos borran `gastos_last_active` para no entrar en un bucle de logout en el siguiente login.

**OAuth (desactivado):** `src/app/auth/callback/route.ts` canjea el código PKCE y valida que `next` sea una ruta interna. Para activarlo: crear las apps OAuth en Google/GitHub, cargar client id/secret en Supabase → Auth → Providers, añadir `https://www.jeshu.cfd/auth/callback` a las redirect URLs y poner `OAUTH_ENABLED = true` en `src/lib/featureFlags.js` (lo usan el login, el registro y `LoginModal`). ⚠ Antes, revisar la marca de sesión: el canje ocurre en el servidor, así que el cliente no recibe `SIGNED_IN` y no se escribiría `gastos_session_alive`.

**Supabase `redirectTo`:** `window.location.origin` puede devolver `https://www.jeshu.cfd` (con www), pero Supabase solo acepta `https://jeshu.cfd/**`. Aplicar `.replace(/^https:\/\/www\./, "https://")` antes de `redirectTo`.

**`proxy.ts` vs `middleware.ts`:** Next.js 16 usa la convención `proxy.ts`; `middleware.ts` está deprecado y produce warning en build.

**CSP:** se arma por request en `src/proxy.ts` (`buildCsp`) con nonce y `'strict-dynamic'`; `'unsafe-eval'` solo se agrega fuera de producción. Detalle en [docs/SECURITY-CSP.md](docs/SECURITY-CSP.md).

**Páginas de auth:**
- Todas usan `useTheme()` e `isDark`, con `darkField`/`cardSx` dentro del componente y `Blobs` recibiendo `{ isDark }`.
- `isDark` arranca en `false` y se aplica en un `useEffect`, para que el primer render coincida con el HTML del servidor (evita el desajuste de hidratación).
- Las llamadas a Supabase (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`) van en `try/catch/finally`, así el botón nunca queda en spinner.
- `AuthErrorAlert` detecta el enlace expirado en español e inglés (`"expiró"` / `"expired"`).

### Iconos y tema

**Sistema de iconos:**
- Los iconos de categoría salen de un solo mapa, `src/theme/categoryIcons.js`.
- `resolveCategoryMeta(categoria, customCats, lang, tipo)` devuelve nombre, color e icono para categorías de fábrica y personalizadas (`custom_<id>`). Lo usan el selector de transacciones, las listas, los chips de filtro y los presupuestos, y reemplaza los lookups de `customCats` que antes estaban repetidos en cada pestaña.
- Las listas muestran `CategoryAvatar` (squircle con el gradiente del color de la categoría) y los encabezados, `GradientIcon` con un tono semántico (`TONE_BY_PALETTE`).
- Metas y categorías personalizadas eligen icono con `IconPicker` y guardan la clave (p. ej. `"Flight"`). Las metas viejas con un glifo de texto se siguen mostrando.
- Si la columna `custom_categories.icon` todavía no existe, `saveCustomCat` recibe `PGRST204` y guarda sin icono.

**Tema sin desajuste de hidratación:** `useLocalStorage` usa el valor por defecto en el primer render (servidor e hidratación) y aplica el guardado justo después de montar. Leerlo en el inicializador de `useState` hacía que un tema oscuro guardado generara clases distintas a las del HTML del servidor, y React no corrige esos atributos.

### Cálculos y gráficos

**Filtros (Gastos/Ingresos):** `filteredTotal` se deriva con `useMemo` de la lista ya filtrada. El footer y las cards de resumen leen ese valor, y el promedio diario usa `daysCount(period)` (7/30/90/365).
- **Top categorías:** sigue a `calFilter` y a la categoría activa.
- **"Presupuesto vs real":** usa `periodCats`, del período completo, para no marcar 0 % con un filtro de un día.
- **Barra de "Promedio diario":** muestra el % del presupuesto gastado, o 50 % neutral si no hay presupuesto.

**Distribuciones:** el denominador de los porcentajes de los donuts es la suma de los segmentos mostrados, así siempre suman 100 % (Overview y Presupuestos). El centro del donut de Overview usa ese mismo total.

**Mini cards y deltas (Overview/Ingresos):**
- `dIn`/`dOut` valen `null` (no `0`) si el período anterior no tiene datos, y entonces se oculta el chip. Si se muestra, el signo va siempre explícito y el texto es bilingüe (`vs ant.` / `vs prev.`).
- `CategoryBars` (top 5 en barras horizontales con monto exacto) reemplazó a los mini gráficos ilegibles.

**`insightsList`:** recibe el `period`; la proyección normaliza a mes-equivalente con `(totalOut / daysCount(period)) * 30`.

**StudioCashflow:** la línea de neto usa su propia escala (`yForNet`) para no salirse del SVG cuando el neto es negativo.

**Presupuestos:**
- La comparación con el período anterior tiene etiqueta dinámica (semana/mes/trimestre/año).
- El footer de "Presupuesto vs Gasto real" suma solo las categorías presupuestadas, y cada fila se lee como "Gastado S/X · límite S/Y".
- Borrar un presupuesto pide confirmación y todas las acciones dan feedback con toast.
- "Pagos recurrentes" muestra 5 con "Ver más / Ver menos".

**Pronóstico (Metas):** usa 3 guards según el historial: 0 meses → "Sin datos"; 1 mes → "Se necesitan al menos 2 meses"; 2 o más → tendencia OLS con `linearRegressionSlope(nets)`, más estable que primero-último. Si `|trend| < 1` muestra "Tendencia estable". El total proyectado es la suma real de los 3 meses.

**Patrimonio e inversiones (Metas):** la evolución del patrimonio se reconstruye hacia atrás desde el `netWorth` actual. El rendimiento promedio de inversiones se pondera por valor. El total mensual de suscripciones normaliza las anuales (`price / 12`).

**Metas y deudas:**
- **Metas:** un solo campo "Nombre" guarda `label_es` y `label_en`, y la fecha límite no puede ser pasada. Sin fecha límite no se muestran días. Con `target = 0` no hay división por cero. Una meta superada dice "¡Meta cumplida!" en vez de mostrar un faltante negativo.
- **Deudas:** el progreso nunca es negativo y usa `original_months || remaining || 1`.
- **Formularios:** tienen validaciones (mínimos, precio > 0, cuotas restantes ≤ total, ayuda para "TEA") y los botones de eliminar se deshabilitan durante la operación.

### Formularios y UI

**`AddTransactionModal`:**
- `saving` evita el doble envío y muestra un spinner.
- Si falla el guardado, muestra un toast de error.
- La fecha arranca con la hora exacta y el DatePicker la conserva al cambiar el día.

**Categorías personalizadas:**
- Se resuelven en todas partes con `resolveCategoryMeta`, así nunca se muestra la clave cruda `custom_…`.
- En el diálogo de suscripciones, la categoría es un `Select` con las nativas y las personalizadas de gasto.
- `SettingsPanel` envuelve guardar y borrar en `try/catch`, con Snackbar, y usa `slotProps.htmlInput` (MUI v9) en lugar de `inputProps`.

**Otros:**
- El avatar de `DashboardStudio` no falla con nombre vacío (`displayName?.[0]?.toUpperCase() || "?"`).
- Los textos del botón "Entrar" y del banner de error son bilingües.
- `not-found.tsx` es Client Component (usa `<Button component={Link}>`).
- El borrado de transacciones usa `try/catch/finally`.

**CalendarFilter (`shared.jsx`):**
- **Vistas:** día (grid de 7 columnas con `alpha(mainColor, intensidad)`) y mes (grid 4×3).
- **Colores:** rojo para EGRESO y verde para INGRESO.
- **Interacción:** el click filtra y un segundo click limpia. Los chips Día/Mes tienen `aria-label` bilingüe.

## Arquitectura

### Flujo de datos: Supabase → pestañas

```
Supabase DB (8 tablas, RLS auth.uid() = user_id)
  └── DataProvider.load() — Promise.all de 8 queries (DataContext.jsx)
        ├── fetchAllRows(transactions) → mapRow() → flagAnomalies() → txs[]
        ├── mapGoal() / mapAccount() / mapInvestment() / mapDebt() / mapSubscription()
        └── sin mapear → customCats[], editBudgets{}
              │
              └── useData()
                    ├── OverviewTab · ExpensesTab · IncomeTab · BudgetTab  (txs + editBudgets + customCats)
                    └── GoalsTab  (goals + accounts + investments + debts + subscriptions)

Cada pestaña: filterByPeriod(txs, period) → helpers.js → Charts.jsx
Nombre / color / icono de categoría: resolveCategoryMeta()  (theme/categoryIcons.js)
Montos: guardados en PEN → fmtMoney(v, currency) al mostrar; toBase()/fromBase() en formularios
```

### Módulos clave

| Módulo | Rol |
|---|---|
| `DashboardStudio.jsx` | Shell de la app: único componente que consume los 3 contextos (Settings, User, Data), controla el `period` compartido, es el canal de `showToast` y aplica la seguridad de sesión |
| `DataContext.jsx` | Única fuente de datos y de mutaciones contra Supabase |
| `data/helpers.js` | Cálculos puros que usan las 4 pestañas principales (períodos, salud financiera, anomalías, recurrentes, tendencias); un bug aquí afecta a todas, por eso tiene tests |
| `theme/categoryIcons.js` | Nombre, color e icono de cualquier categoría |
| `proxy.ts` | Guard de rutas + CSP con nonce por request |

**`createClient()`** se llama dentro de cada función CRUD, pero `createBrowserClient` es un singleton: no abre conexiones nuevas.

> El README incluía métricas de un grafo generado con [graphify](https://github.com/ananddtyagi/cc-marketplace) sobre una versión anterior. Se quitaron porque ya no correspondían al código; el grafo se puede regenerar localmente (`graphify-out/`, ignorado por git).

## Despliegue

- La integración GitHub → Vercel despliega cada push a `main` en producción y crea un **preview** por cada PR.
- La CI (`.github/workflows/ci.yml`) corre lint, typecheck, tests, build y los tests end-to-end en cada PR; conviene mergear solo con la CI en verde.
- Si el cambio toca el esquema, ejecutar antes su script de actualización (para la 0.0.1, `supabase/migrations/upgrade_0.0.1.sql`) en el SQL Editor de Supabase (ver [Base de Datos](#base-de-datos-supabase)).
- Despliegue manual: `vercel --prod`. Las variables de entorno se configuran en el Dashboard de Vercel.

### Cómo mergear un PR

Mergear a `main` publica el cambio en producción. Los pasos, en la página del PR en GitHub:

1. **Revisar:** la pestaña *Files changed* muestra el diff. El preview de Vercel (enlazado en los checks del PR) permite probar el cambio con datos reales antes de mergear.
2. **Esperar la CI en verde:** el check *CI* del último commit debe estar en ✓.
3. **Migrar la DB, si hace falta:** si el PR trae un `supabase/migrations/upgrade_*.sql`, ejecutarlo en el SQL Editor de Supabase **antes** de mergear. Los scripts son idempotentes.
4. **Sacarlo de borrador:** un PR en *Draft* no se puede mergear. Pulsar **Ready for review** al final de la conversación del PR.
5. **Mergear:** **Merge pull request** → **Confirm merge**. Vercel despliega `main` en uno o dos minutos.
6. **Opcional:** **Delete branch** borra la rama del PR.

Desde la terminal, con [GitHub CLI](https://cli.github.com/): `gh pr ready <número>` y luego `gh pr merge <número> --merge`.

### Versiones y releases

- **Dónde vive la versión:**
  - en `package.json`;
  - en la línea **Versión** de los READMEs;
  - en [`CHANGELOG.md`](CHANGELOG.md). Cada cambio se anota bajo `## [Unreleased]` hasta publicar una versión.
- **Historial:** la numeración se reinició en `0.0.1` y el historial `v1.x` (tags y releases) se descartó.
- **Publicar una versión** (p. ej. `0.0.2`):
  1. En una rama:
     - `npm version 0.0.2 --no-git-tag-version`, que actualiza `package.json` y `package-lock.json`;
     - en el CHANGELOG, renombrar `## [Unreleased]` a `## [0.0.2]`;
     - actualizar la línea **Versión** de ambos READMEs.
  2. Abrir el PR y mergearlo.
  3. En GitHub, ir a **Releases** → **Draft a new release**:
     - tag `v0.0.2` sobre `main` (el tag se crea al publicar);
     - título `v0.0.2`;
     - como notas, la sección de esa versión en el CHANGELOG;
     - **Publish release**.
- **Borrar un release:** en **Releases**, abrir el release y pulsar el ícono de la papelera (**Delete**).
  - Borrar un release **no borra su tag**. El tag se borra aparte, desde la pestaña **Tags** o con `git push origin --delete vX.Y.Z`.
  - Si se borra primero el tag, el release no desaparece: queda como borrador y hay que borrarlo igual.

## Solución de problemas

**Una función parece "rota" solo en producción (www.jeshu.cfd) pero funciona en local.**
Casi siempre es **caché del navegador**: tras un despliegue, el navegador puede combinar el HTML antiguo en caché con los chunks de JavaScript nuevos, ejecutando una mezcla de versiones. La app **no usa Service Worker ni PWA**, así que no hay caché propia que limpiar — es la del navegador.

- **Solución:** *hard refresh* con `Ctrl + Shift + R` (Cmd + Shift + R en Mac) o abrir el sitio en una **ventana de incógnito**.
- Antes de buscar el bug en el código, verifica que el síntoma también se reproduce en **local** (`npm run dev`) y en **incógnito**. Si solo ocurre en producción y el código local es idéntico a `origin/main`, es caché.
- Caso real (2026-06-16): el filtro de fechas del calendario (Gastos/Ingresos) mostraba el chip con la fecha pero dejaba la lista vacía, únicamente en producción. El código era correcto; un *hard refresh* lo resolvió.

## Licencia

MIT
