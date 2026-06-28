# Finanzas — Gestión Personal

Aplicación de finanzas personales para rastrear ingresos, gastos, presupuestos, metas y más. Desplegada en **[www.jeshu.cfd](https://www.jeshu.cfd)**.

**Versión:** `v1.7.0`

<!-- i18n-selector-start -->
🌐 **Español** · [English](README.en.md)
<!-- i18n-selector-end -->

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
- Cierre forzado al reabrir el navegador: `UserContext` escribe el flag `gastos_session_alive` en `sessionStorage` al detectar `SIGNED_IN` (cubre email/password y OAuth); `DashboardStudio` lo verifica al montar — si falta (browser cerrado) llama `handleSignOut()` inmediatamente antes de renderizar el dashboard
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
- Top categorías con barras de progreso
- Presupuesto vs real — muestra las categorías del presupuesto activo (`editBudgets`), no hardcoded; mensaje "Sin presupuestos" si no hay ninguno
- Resumen del período (total, transacciones, promedio diario, mayor gasto) — **todos reflejan el filtro activo**; barras de progreso con valores relativos significativos (sin barra para el conteo)
- Promedio diario calculado con `daysCount(period)` (7/30/90/365 según período)
- Mayor gasto = máximo de las transacciones filtradas
- Lista completa con edición y eliminación (confirmación de borrado)
- Filtrado por categoría
- **CalendarFilter:** mapa de calor interactivo — vista por día y mes con intensidad proporcional; click filtra la lista, el footer muestra el total filtrado con etiqueta "(filtrado)"
- Footer total actualiza en tiempo real al aplicar cualquier filtro
- Fecha y hora completa en cada transacción

### Ingresos (IncomeTab)
- Tarjeta de ingresos totales con sparkline; chip `+X.X% vs ant.` oculto cuando no hay período anterior (`dIn = null`)
- Grid de categorías con porcentajes y donut — colores reales de `CATEGORIES.income[k].color` y categorías personalizadas; tarjetas interactivas para filtrar por fuente
- Tendencia mensual con leyenda completa: ingreso / egreso / neto
- **CalendarFilter** en color verde (success)
- Footer total actualiza en tiempo real al aplicar cualquier filtro
- Lista de transacciones con edición y eliminación; avatares con colores correctos por categoría

### Presupuestos (BudgetTab)
- Health score gauge visual
- Tarjetas por categoría con progreso y alertas al 80% y 100%
- Donut de distribución de gastos — **apila verticalmente en mobile** (columna en xs, fila en sm+)
- **Gráfica "Presupuesto vs Gasto real":** barras horizontales por categoría, coloreadas verde/amarillo/rojo; barras al 100%+ con patrón de rayas diagonales; footer con totales
- Comparación con período anterior — etiqueta dinámica según período activo (semana/mes/trimestre/año)
- CRUD de presupuestos — exclusivamente desde Supabase; selector incluye categorías personalizadas (custom) además de las nativas

### Metas y Finanzas (GoalsTab)
- CRUD de metas de ahorro con fecha límite — formulario con nombre único
- Gestión de cuentas bancarias/tarjetas/efectivo
- Patrimonio neto (activos − deudas) en tiempo real
- Seguimiento de inversiones (AFP, DPF, cripto, etc.) — formulario con nombre único
- Control de deudas y préstamos con cuotas — formulario con campo de nombre único (guarda en ambos idiomas automáticamente)
- Suscripciones recurrentes con selector de categoría (nativas + personalizadas); botón "Agregar / Add" bilingüe en estados vacíos
- **Pronóstico de 3 meses** basado en tendencia lineal real (slope de los últimos 6 meses de netos reales); 3 estados según historial disponible: "Sin datos" (0 meses), "Se necesitan al menos 2 meses" + promedio actual (1 mes), barras reales con `+trend×i` (2+ meses); nota "Tendencia estable · N meses" si `|trend| < 1`; total proyectado = suma real de los 3 meses
- **Evolución del patrimonio** reconstruye historial real trabajando hacia atrás desde `netWorth` actual

### Perfil y Configuración (SettingsPanel)
Drawer con **dos pestañas** que separan Perfil de Ajustes:
- **Perfil:** hero con avatar, nombre y email; **Datos personales** (editar nombre y apellidos — se guardan como `first_name`/`last_name` + `full_name` sincronizado); **Categorías Favoritas** (aparecen primero en el selector de transacciones) y **Mis Categorías** (CRUD de categorías propias — nombre, tipo, color — en Supabase)
- **Ajustes:** tema claro/oscuro, paletas de acento (puntos con `flexWrap` en mobile), densidad Comfy/Compact, idioma Español/Inglés, 8 monedas (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL)
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
│                                   #   healthScore, recurringList, insightsList,
│                                   #   linearRegressionSlope (OLS slope para series temporales)
├── theme/
│   └── materialTheme.js            # Temas light/dark + paletas de acento
├── hooks/
│   └── useLocalStorage.js
├── lib/
│   ├── supabase.ts                 # Cliente browser (createBrowserClient)
│   └── supabase-server.ts          # Cliente server
└── proxy.ts                        # Protección de rutas (Next.js 16)
supabase/
├── migrations/
│   └── schema.sql                  # Esquema completo de DB (todas las tablas aplicadas ✓)
└── seed/
    └── reset.sql                   # Vacía las 8 tablas (count → TRUNCATE → verificar) — destructivo
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

# Correr los tests unitarios (Vitest)
npm run test
```

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
| Sesión por browser session | `gastos_session_alive` en `sessionStorage` (limpiado por el navegador al cerrar); reabrir el browser fuerza re-login. La sesión sobrevive recargas de página normales |
| Expiración por inactividad prolongada | `gastos_last_active` en `localStorage` actualizado en cada evento de usuario; si la pestaña lleva >8 h sin actividad se cierra la sesión al recuperar el foco |
| Límite en montos | Máximo 10,000,000 validado en cliente y con `max` en el input |
| Error feedback | `loadError` en `DataContext` — banner con botón Reintentar si la carga falla |

> Arquitectura del CSP con nonce por request (flujo en `proxy.ts`, render dinámico, cómo verificar): **[docs/SECURITY-CSP.md](docs/SECURITY-CSP.md)**.

## Notas Técnicas

**Iconos coloridos + sistema de acento alegre (v1.7.0):** Los iconos (que seguían siendo MUI Rounded monocromos) ahora se pintan con **gradientes de 2 stops** y, donde corresponde, viven en una **burbuja squircle** de tinte suave. Wrapper nuevo `src/theme/GradientIcon.jsx` (reusa el set de `icons.js`, no lo reemplaza): aplica un `linearGradient` SVG con `id` único por `useId()` (mismo patrón que `Charts.jsx`) y soporta tanto `icon={Componente}` como `children` (colorea por CSS un icono ya renderizado). Los tonos viven en `src/theme/iconTones.js` (semánticos por dominio: ingresos=verde→teal, gastos=coral→rosa, presupuesto=ámbar→dorado, metas=azul→teal, patrimonio=índigo→violeta) + `toneFromColor()`/`gradientBg()` que derivan un gradiente vibrante desde el color base de cada categoría. Se aplicó en `StatsCard` (todos los tabs), mini-cards de Overview, avatares de categoría de Expenses/Income/Budget y cabeceras de sección de Goals; se refrescaron los colores de categoría grises/apagados en `CATEGORIES`. **Acento:** el set plano `amber/indigo/green/mono` se reemplazó por **Coral, Menta, Océano, Uva, Mono**, cada uno con gradiente y variantes light/dark (`ACCENTS` + `accentGradient()` en `materialTheme.js`); los acentos viejos se migran por alias (`amber→coral`, `indigo→ocean`, `green→mint`) para no resetear `gastos-palette`. Los swatches del selector y el FAB "+" usan el gradiente del acento. Diseño guiado por el skill `ui-ux-pro-max` (paletas fintech/playful, contraste AA).

**CSP con nonce por request — adiós `'unsafe-inline'` en scripts (v1.6.0):** El Content-Security-Policy se movió de los headers estáticos de `next.config.mjs` al middleware (`proxy.ts`), que genera un **nonce único por request** (`crypto.randomUUID()` en base64) y arma `script-src 'self' 'nonce-… ' 'strict-dynamic'` — eliminando `'unsafe-inline'` de los scripts (la mejora de seguridad de mayor severidad pendiente). El nonce se reenvía en los headers del *request* (`x-nonce` + `Content-Security-Policy`) para que Next lo estampe en sus `<script>`; se reconstruye tras cada mutación de cookies en el callback `setAll` de Supabase para no perder ni el reenvío de cookies de refresh ni el header. **Requisito clave:** como el nonce es único por request, las páginas deben renderizarse **dinámicamente** — el layout raíz hace `await headers()` para forzarlo (sin esto, las páginas estáticas servirían scripts sin nonce que `strict-dynamic` bloquearía, rompiendo la hidratación). `style-src` mantiene `'unsafe-inline'` (MUI/emotion inyectan estilos en runtime). Verificado: los 24 scripts de cada página llevan el nonce que coincide con el header, 0 scripts sin proteger.

**Scaffold de OAuth — ruta de callback PKCE (v1.5.0):** Se preparó el flujo OAuth (sigue **desactivado** con `OAUTH_ENABLED = false` hasta configurar los providers en Supabase). Nueva ruta `src/app/auth/callback/route.ts` que intercambia el `code` PKCE por sesión (`exchangeCodeForSession`) — indispensable con `@supabase/ssr`, sin ella los botones aterrizarían en `/` con un `?code=` sin canjear. Valida que `next` sea ruta interna (anti open-redirect) y honra `x-forwarded-host` en prod. Los tres `signInWithOAuth` (login, register, `LoginModal`) apuntan ahora a `/auth/callback?next=/`, y `proxy.ts` exime `/auth/callback` del guard de auth (llega sin sesión todavía). **Para activarlo:** crear las apps OAuth en Google/GitHub, pegar client id/secret en Supabase → Auth → Providers, añadir `https://www.jeshu.cfd/auth/callback` a las redirect URLs y poner `OAUTH_ENABLED = true`.

**Tests unitarios de los helpers (v1.4.0):** Primer set de tests del repo con **Vitest** (`npm run test`). `src/data/helpers.test.js` cubre `src/data/helpers.js` —el eslabón frágil que tocan los 4 tabs— con foco en límites: `flagAnomalies` (frontera 3× exacta, mediana par/impar, mínimo 4 muestras, solo EGRESO, inmutabilidad), `healthScore` (alcanza 100, suelo 0, topes de bono/penalti), `filterByPeriod`, `linearRegressionSlope` y `recurringList`. Config en `vitest.config.mjs` (`environment: node`, sin jsdom — los helpers son ESM puro sin React). Limpieza menor: `mapRow` en `DataContext` ahora siembra `anomaly: false` explícito (la columna de DB siempre es `false`; `flagAnomalies` es la única fuente de verdad).

**Salud financiera — score corregido + detección de anomalías (2026-06-18):** El `healthScore` (`helpers.js`) se reescaló para que **100 sea alcanzable** (antes el tope real era 90): el bono por ahorro pasó a `Math.min(40, savingsRate * 2)` → máximo 50 (base) + 40 (ahorro ≥ 20%) + 10 (gasto a la baja) = 100. La etiqueta y el color se centralizaron en `healthLabel(score, lang)` y `healthTone(score)` (umbrales 75/50), eliminando el `healthLabel` muerto y la duplicación de BudgetTab; **OverviewTab ahora colorea el score por nivel** (verde/amarillo/rojo) igual que BudgetTab. Se **activó la detección de gastos inusuales** (antes el campo `anomaly` se guardaba siempre en `false`, así que el penalti, el insight y el flag nunca aparecían): `flagAnomalies(txs)` marca un EGRESO como anómalo si supera **3× la mediana de su categoría** (mínimo 4 muestras; mediana robusta a outliers) y se aplica en `DataContext` vía `useMemo`, de modo que el penalti del score, el insight "Gastos inusuales" y el flag ⚠ de la lista de transacciones ya funcionan.

**Toggle de tema en el login + Perfil/Ajustes separados (v1.3.0):** El login monta `AuthThemeToggle` (botón flotante sol/luna) que llama `setTheme` de `useSettings` y persiste en `localStorage`; `isDark` se deriva de `palette.mode` con `useState+useEffect` (evita el mismatch de hidratación). Como las auth pages ya se adaptan a `palette.mode`, togglear redibuja la pantalla al instante. El `SettingsPanel` se rediseñó como Drawer con pestañas **Perfil** (hero + favoritas + mis categorías) y **Ajustes** (tema, densidad, acento, idioma, moneda); el avatar de la AppBar abre Perfil y el engranaje abre Ajustes vía la prop `initialTab`. El salto de pestaña al abrir usa el patrón "ajustar estado durante el render" con `wasOpen` (no `useEffect` — lo prohíbe la regla `react-hooks/set-state-in-effect`).

**Endurecimiento de seguridad (v1.3.0):** CSP ampliada con `object-src 'none'`, `base-uri 'self'` y `form-action 'self'`. `minimum_password_length` subido a 8 en `config.toml` (alinea con lo que la UI promete). Políticas RLS hechas explícitas (`TO authenticated … WITH CHECK`) en `schema.sql` + migración `20260618120000_rls_explicit_with_check.sql` — equivalente funcional (Postgres ya usaba `USING` como check de INSERT cuando se omitía `WITH CHECK`), solo más explícito y robusto. Auditoría completa: postura buena (RLS owner-only en las 8 tablas, `getUser()` siempre, sin `service_role` ni secretos en cliente).

**Refactor de charts (v1.3.0):** `Charts.jsx` — eliminado `SparkBar` (exportado pero sin uso), IDs de gradiente SVG únicos por instancia con `useId()` (evita la colisión de `url(#id)` cuando se montan varias instancias) y helpers compartidos `extent()` (min/max/rango) y `linePath()` (path `M/L`).

**Set de iconos en variante Rounded centralizado (v1.2.0):** Todos los iconos (`@mui/icons-material`) se importan desde un único módulo `src/theme/icons.js` que los re-exporta en su variante **Rounded** (Material 3 / Material You) con *deep-import* (mejor tree-shaking). Los 14 componentes/páginas importan desde ahí en lugar del *barrel* — cambiar de estilo (p. ej. a Outlined) a futuro = editar solo ese archivo. Casos especiales: los iconos de marca `GitHub`/`Google`/`YouTube` no tienen variante Rounded (quedan Filled) y `ErrorOutlined` mapea a `ErrorRounded`. Las microanimaciones del theme se conservan porque los iconos Rounded siguen siendo `MuiSvgIcon`.

**Microanimaciones de iconos centralizadas en el theme (v1.1.0):** Las animaciones de iconos viven en los `components.styleOverrides` de `materialTheme.js` (no dispersas por componente): `MuiIconButton` (scale 1.12 en hover + press 0.92), `MuiFab` (lift + scale), `MuiTab`/`MuiBottomNavigationAction` (icono hace `iconPop` al seleccionarse + scale en hover), `MuiCard` (el avatar de cabecera hace pop al hacer hover en la tarjeta) y `MuiSvgIcon` (transición suave de transform/color). El keyframe `iconPop` está en `globals.css`. Easing tipo *spring* `cubic-bezier(0.34,1.56,0.64,1)`, 200-300ms, solo hover/estado-activo (sin autoplay). Todo se neutraliza con el guard `@media (prefers-reduced-motion: reduce)` de `globals.css` (la duración colapsa a ~0). Los FAB de la AppBar (`+` y ⚙️) rotan 90° en hover vía `sx`.

**Tipo de transacción derivado de la categoría (no del toggle):** En `AddTransactionModal`, el `tipo` (INGRESO/EGRESO) que se guarda proviene de la **categoría seleccionada** (`categoria.type`), no del estado del toggle ni del `mode`. Como las categorías personalizadas se muestran siempre sin importar el toggle, guardar el `tipo` del toggle hacía que una categoría personalizada de ingreso (elegida con el toggle en EGRESO, el default del FAB) se guardara como gasto → el ingreso "no se registraba" y el neto/ahorro/balance descuadraban. El `onChange` del Autocomplete también sincroniza el toggle (`if (v?.type) setTipo(v.type)`). Backfill de datos viejos mal guardados (categorías personalizadas): `UPDATE transactions t SET tipo = cc.tipo FROM custom_categories cc WHERE t.categoria = 'custom_' || cc.id::text AND t.tipo <> cc.tipo;`.

**Carga de datos sin doble refresh:** `DataContext.load()` ya no depende solo de `INITIAL_SESSION` ni hace `getUser()` (round-trip de red) interno. Se carga con el primer evento de `onAuthStateChange` que traiga `session.user` (`INITIAL_SESSION` | `SIGNED_IN` | `TOKEN_REFRESHED` | `USER_UPDATED`), usando la sesión del propio evento. Se deduplica por `session.user.id` (para que los refrescos periódicos de token no re-ejecuten las 8 queries) y se resetea el flag en caso de fallo para permitir reintento. Esto elimina el bug de "hay que refrescar 2 veces": antes, si el primer `INITIAL_SESSION` llegaba sin sesión utilizable (token por refrescar / latencia / clock-skew) no había reintento y los datos no aparecían hasta recargar de nuevo. Las 8 queries usan RLS (`select("*")` sin `.eq("user_id")`), así que `session.user` solo sirve para "hay sesión + dedupe".

**Error "JWT issued at future":** aparece cuando el reloj del dispositivo está adelantado respecto a los servidores de Supabase (incluso 1 minuto basta). Supabase rechaza el JWT → todas las queries del `Promise.all` fallan → carga lenta + banner de error. Solución: sincronizar el reloj del sistema (`timedatectl set-ntp true` en Linux, "Sincronizar ahora" en Windows). El banner de error detecta este caso específico y muestra un mensaje accionable en lugar del texto técnico crudo.

**`proxy.ts` vs `middleware.ts`:** Next.js 16 usa la convención `proxy.ts`. El nombre `middleware.ts` está deprecado y produce warning en build.

**Supabase redirectTo:** `window.location.origin` puede devolver `https://www.jeshu.cfd` (con www) pero Supabase solo acepta `https://jeshu.cfd/**`. Siempre aplicar `.replace(/^https:\/\/www\./, "https://")` antes de `redirectTo`.

**Múltiples instancias de Supabase client:** Los eventos de `onAuthStateChange` no se propagan entre instancias distintas. `LoginModal` usa `window.location.reload()` tras el login para garantizar que `DataContext` recargue los datos.

**Datos sin mock:** Todos los datos provienen exclusivamente de Supabase. No hay `generateTransactions()`, `SAVINGS_GOALS`, `ACCOUNTS` ni `BUDGETS` hardcodeados.

**Filtros en ExpensesTab/IncomeTab:** `filteredTotal` se deriva con `useMemo` desde la lista ya filtrada (`expenseTxs`/`incomeTxs`). El footer y las cards de resumen siempre leen ese valor. El promedio diario usa `daysCount(period)` (7/30/90/365).

**Pronóstico GoalsTab:** 3 guards según historial: `length === 0` → "Sin datos"; `length === 1` → mensaje "Se necesitan al menos 2 meses" + promedio del mes disponible; `length >= 2` → tendencia OLS `linearRegressionSlope(nets)` (mínimos cuadrados sobre todos los puntos, más estable que primer-último). La barra de progreso usa `avgIn > 0 ? barPct : 50` para evitar `NaN%`. Si `|trend| < 1` muestra nota "Tendencia estable · N meses de historial". Total proyectado = `next.reduce((s,n) => s+n.net, 0)` (suma real, no `netAvg * 3`).

**Evolución del patrimonio GoalsTab:** Se reconstruye desde `netWorth` actual hacia atrás: `history[i].value = netWorth - sum(nets[i+1..end])`. Barras rojas si el valor es negativo, verdes si positivo.

**`insightsList` period-aware:** Acepta `period` como último parámetro. La proyección de fin de período usa `(totalOut / daysCount(period)) * 30` para normalizar a mes-equivalente independientemente del período seleccionado.

**Mini cards OverviewTab:** `dIn`/`dOut` son `null` (no `0`) cuando `prevIn`/`prevOut === 0`, lo que oculta el chip delta completamente. Cuando se muestra: `"+X.X% vs ant."` con signo siempre explícito. Sub-etiqueta: "N registros" (ingreso) / "N gastos" (egreso) con singular/plural y soporte bilingüe. Categorías de ingreso calculadas con `txByCategory(periodTxs, "INGRESO")` mapeadas a `CATEGORIES.income`; las de gasto desde el array `donut`.

**OverviewTab — `CategoryBars` reemplaza `MiniBarLabeled` + donut pequeño:** Los gráficos previos de las mini cards eran ilegibles — barras verticales sin montos (ingresos) y un donut de 88px sin leyenda (gastos). Ahora ambas cards usan el mismo componente `CategoryBars`: lista de barras horizontales (top 5) con dot de color, nombre (`noWrap`), monto exacto (`fmtMoney(..., true)`, tabular-nums) y barra proporcional a la categoría más grande del set (`value / peak`). Sigue el patrón aprobado de barras horizontales para desgloses de categoría. `MiniBarLabeled` se eliminó de `Charts.jsx` (sin uso).

**IncomeTab — colores por categoría:** Se eliminó el mapa estático `INCOME_COLORS` (desactualizado a 6 categorías). Los colores se leen directamente de `CATEGORIES.income[c.categoria]?.color` para categorías nativas y de `customCats.find(...)?.color` para personalizadas. El chip delta usa `dIn = prevIn ? ((totalIn - prevIn) / prevIn) * 100 : null` — `null` oculta el chip cuando no hay período anterior con datos (mismo patrón que OverviewTab).

**ExpensesTab — Presupuesto vs real:** La sección usa `Object.keys(editBudgets)` (categorías del presupuesto activo cargado desde Supabase) en vez de categorías hardcodeadas. Muestra mensaje "Sin presupuestos configurados" si `editBudgets` está vacío. Las barras de progreso del resumen usan valores relativos significativos; el ítem de conteo (`isCount`) no renderiza `LinearProgress`.

**BudgetTab — etiqueta de período dinámica:** La comparación con período anterior muestra "vs semana/mes/trimestre/año anterior" según el `period` activo, en lugar de "vs mes anterior" fijo.

**BudgetTab — categorías personalizadas:** `getCatName`/`getCatColor` resuelven nombre y color tanto para categorías nativas (`CATEGORIES.expense`) como para `custom_*` (via `customCats`). Definidas antes de `donutData` useMemo para evitar temporal dead zone. El selector "Agregar presupuesto" incluye `customCats.filter(cc => cc.tipo === "EGRESO")` junto a las nativas.

**GoalsTab — nombre único en formularios:** Los diálogos de metas, inversiones y deudas usan un solo campo "Nombre" que actualiza `es` y `en` simultáneamente (`setForm({ ...f, es: v, en: v })`). La BD sigue recibiendo `label_es` y `label_en` con el mismo valor; `d[lang]` funciona igual en cualquier idioma.

**GoalsTab — categoría en suscripciones:** El campo de categoría en el diálogo de suscripciones es un `Select` con todas las categorías de gasto (nativas de `CATEGORIES.expense` + `customCats` de tipo EGRESO), cada una con su punto de color. Antes era un `TextField` libre sin opciones.

**GoalsTab — `customCats` en useData:** El destructuring de `useData()` incluye `customCats` — faltaba y causaba crash al abrir el diálogo de suscripciones con el nuevo selector de categorías.

**DataContext — tipos numéricos en deudas:** `mapDebt` convierte `remaining` y `original_months` a `Number` (antes llegaban como strings desde Supabase), evitando cálculos de progreso rotos.

**GoalsTab — barra de progreso de deuda:** Fallback corregido: `orig = d.original_months || d.remaining || 1` en lugar de `d.remaining + 1`, que sobreestimaba el total de cuotas cuando `original_months` no estaba definido.

**ExpensesTab — nombre de categoría custom en presupuesto:** La tarjeta "Presupuesto vs real" resuelve el nombre de categorías `custom_*` via `customCats` en vez de mostrar la clave cruda.

**IncomeTab — chip de filtro activo con categorías custom:** El chip que muestra la categoría activa resuelve el nombre de `custom_*` via `customCats` en vez de mostrar la clave cruda.

**BudgetTab — monto en diálogo de gestión:** La lista de presupuestos existentes mostraba `amount × monthCount(period)` con etiqueta "/mes" — doble cálculo incorrecto. Ahora muestra `amount` (valor mensual) directamente.

**DashboardStudio — Avatar seguro contra nombre vacío:** `displayName?.[0]?.toUpperCase() || "?"` reemplaza `displayName[0].toUpperCase()` que lanzaba `TypeError` si el usuario no tenía nombre ni email resuelto.

**Login / Register — try-catch en llamadas a Supabase:** Ambas páginas envuelven `signInWithPassword`/`signUp` en `try/catch/finally`; si Supabase lanza excepción de red, `setLoading(false)` se ejecuta en `finally` y aparece mensaje "Error de conexión" — el botón no queda bloqueado.

**GoalsTab — barra de progreso de deuda no puede ser negativa:** `Math.max(0, orig - d.remaining)` evita valores negativos cuando `remaining > original_months`.

**IncomeTab — leyenda del donut con nombre real:** `incomeDonut` resuelve `label` desde el origen (`CATEGORIES.income[key]?.[lang]` o `customCats.find(...)?.nombre`) en vez de pasar la clave cruda `custom_abc123` y depender de un lookup posterior que fallaba para categorías personalizadas.

**BudgetTab — confirmación al borrar presupuesto:** Eliminar un presupuesto desde el diálogo "Gestionar" ahora muestra un Dialog de confirmación antes de ejecutar el borrado (consistente con el resto de eliminaciones).

**GoalsTab — botones Eliminar deshabilitados durante operación:** Los botones de eliminar en los diálogos de metas, cuentas, inversiones, deudas y suscripciones quedan `disabled` mientras la operación async está en curso, evitando doble-click.

**GoalsTab — fecha límite de meta no puede ser en el pasado:** El DatePicker de metas incluye `minDate={dayjs()}` — no permite seleccionar fechas pasadas.

**GoalsTab — categoría de suscripción resuelta:** La tarjeta de suscripción muestra el nombre real de la categoría (nativa o `custom_*`) en vez de la clave cruda.

**ExpensesTab / IncomeTab — delete con try-catch:** El botón de confirmar eliminación de transacción usa `await` con `try/catch/finally`: muestra toast de error si falla y siempre cierra el diálogo.

**DashboardStudio — strings i18n:** Botón de login ("Entrar"/"Sign in") y banner de error ("Reintentar"/"Retry", "Error al cargar datos"/"Error loading data") respetan el idioma seleccionado.

**BudgetTab — footer "Presupuesto vs Gasto real" suma solo categorías presupuestadas:** El "Total gastado" del footer usaba `totalOut` (todos los gastos del período), mientras las filas individuales solo muestran el gasto de categorías con presupuesto asignado. Sumar las filas daba un total diferente al del footer. Fix: `totalSpentBudgeted = Σ spent[cat] para cat ∈ editBudgets`. La tarjeta de resumen superior (Health Score, "Gastado") sigue usando `totalOut` — correcto para el contexto de salud financiera global.

**Auth pages — modo oscuro no se aplicaba (hydration mismatch):** `isDark = theme.palette.mode === "dark"` se computaba en el primer render. El servidor siempre genera HTML con light mode (sin localStorage), el cliente quiere dark → React detecta el mismatch de `className` y lo deja sin parchear, quedando el DOM en light mode permanentemente aunque el estado interno fuera dark. Fix: `const [isDark, setIsDark] = useState(false)` + `useEffect(() => setIsDark(theme.palette.mode === "dark"), [theme.palette.mode])` en las 6 unidades afectadas: `login`, `register`, `forgot-password`, `reset-password`, `AuthCard`, `AuthErrorAlert`. El primer render coincide con el HTML del servidor (sin mismatch), y el `useEffect` aplica el tema correcto después de hidratar.

**DataContext — recarga en renovación de token corregida:** El listener `onAuthStateChange` ya no llama a `load()` en el evento `SIGNED_IN` (que Supabase dispara al renovar el JWT automáticamente), evitando que la pestaña de Metas se reiniciara sola cada ~55 minutos. Solo carga en `INITIAL_SESSION`.

**DataContext — `load()` no se llama al montar:** La llamada directa a `load()` en el `useEffect` fue eliminada. `INITIAL_SESSION` siempre dispara al suscribirse a `onAuthStateChange` y es la única fuente de verdad para la carga inicial. Llamar ambas producía 16 queries paralelas a Supabase en cada montaje.

**DataContext — `setEditBudgets` lanza error consistentemente:** El upsert de presupuestos ahora hace `if (error) throw error` + `setEditBudgetsState(newBudgets)`, igual que todas las demás funciones CRUD. Antes usaba `if (!error) setState` — los errores de Supabase se perdían silenciosamente y el caller no podía mostrar feedback.

**Auth páginas — try/catch/finally en todas las llamadas Supabase:** `forgot-password` y `reset-password` envuelven `resetPasswordForEmail` / `updateUser` en `try/catch/finally`. Sin `finally`, un error de red dejaba el botón en estado spinner permanente ya que `setLoading(false)` solo se ejecutaba en el branch de error explícito, no ante excepciones.

**`not-found.tsx` — debe ser Client Component:** La página usa `<Button component={Link}>` que pasa una función a MUI en tiempo de prerender. Next.js rechaza esto en Server Components. Se agregó `"use client"` y se eliminó el export de `metadata` (las páginas 404 no son indexadas por buscadores).

**CSP — `unsafe-eval` solo en desarrollo:** `next.config.mjs` ahora aplica `'unsafe-eval'` únicamente cuando `NODE_ENV !== "production"`. En producción se elimina — Next.js y MUI/Emotion no lo requieren en producción y su presencia debilita la política de seguridad de una app financiera.

**`AddTransactionModal` — sin aliases de iconos:** Los 50 `const XIcon = Y` eliminados. Los íconos de `@mui/icons-material` se usan directamente por su nombre de import en `EXPENSE_ICONS` e `INCOME_ICONS`. Los imports de datos (`CATEGORIES`, contextos) se movieron al bloque de imports del tope del archivo.

**`AuthErrorAlert` — detección de enlace expirado bilingüe:** La condición para mostrar el link de "Solicitar nuevo enlace" ahora comprueba `error.includes("expiró") || error.includes("expired")`. Antes solo detectaba el string en español — si Supabase devolvía el mensaje en inglés el link no aparecía.

**Auth páginas — tema claro/oscuro:** Todas usan `useTheme()` + `isDark = theme.palette.mode === "dark"`. `darkField` y `cardSx` se definen dentro del componente (no en módulo) para leer `isDark` en tiempo de render. `Blobs` acepta prop `{ isDark }` para ajustar opacidad de los gradientes.

**DataContext — `saveCustomCat` / `deleteCustomCat` lanzan error:** Ambas funciones ahora hacen `if (error) throw error` antes de mutar el estado local. Antes usaban `if (!error) setCustomCats(...)` sin throw — el try/catch de `SettingsPanel.handleSaveCat`/`handleDeleteCat` nunca disparaba, los errores de Supabase se perdían silenciosamente.

**IncomeTab — chip delta bilingüe:** El chip "vs ant." ahora usa `lang === "es" ? "vs ant." : "vs prev."`, consistente con OverviewTab.

**StudioCashflow — línea de neto con escala propia:** La línea de neto (ingreso − egreso) usaba `yFor()` diseñado para el rango 0–max de barras. Si el neto era negativo, la línea se renderizaba fuera del SVG (debajo de los labels de meses). Ahora usa `yForNet()` que escala al rango real del neto (min negativo → max positivo), manteniéndose siempre dentro del `viewBox`.

**OverviewTab — centro del donut Distribución consistente:** El centro mostraba `totalOut` (todos los gastos del período) pero los porcentajes usaban `donutTotal` (suma de top-6). El centro ahora usa `donutTotal` también — arco ↔ etiqueta ↔ centro todos relativos al mismo conjunto de segmentos visibles.

**GoalsTab — meta cumplida no muestra número negativo:** Cuando `current > target` (meta superada), `left = target - current` era negativo y se mostraba como "-S/X.XX faltan". Fix: `Math.max(0, target - current)` + texto `"¡Meta cumplida!" / "Goal reached!"` cuando `pct >= 1`.

**ExpensesTab — "Presupuesto vs real" no se distorsiona con calFilter activo:** La sección de presupuesto usaba `cats` (derivado de `expenseTxs`, calFilter-aware). Con un filtro de un día activo, mostraba 0% de uso para todas las categorías. Fix: nuevo memo `periodCats = txByCategory(periodTxs.filter(EGRESO))` para esa sección — siempre usa el período completo, independiente del calFilter.

**BudgetTab — "Presupuesto vs Gasto real" etiquetas legibles:** El encabezado de cada fila mostraba `S/204 / S/800` sin contexto. Ahora muestra `Gastado S/204 · límite S/800` (etiquetado, gastado en negrita y coloreado en rojo si excede). Se eliminó la línea inferior redundante de "límite S/800". Texto de excedido cambiado de "Excedido +S/X" a "Excedido en S/X".

**Presupuestos — carga y borrado:** `DataContext` inicializa `editBudgets` en `{}` y lo llena solo desde Supabase. `deleteBudgetCat(cat)` borra de la BD antes de actualizar el estado.

**AddTransactionModal — prevención de doble submit:** `saving` state deshabilita el botón y muestra `CircularProgress`. `handleSubmit` tiene try-catch para liberar `saving` si la operación lanza excepción.

**Seguridad de sesión — mecanismo de cierre al cerrar el navegador:** `UserContext.onAuthStateChange` escucha el evento `SIGNED_IN` (login explícito — email/password u OAuth) y escribe `sessionStorage.setItem("gastos_session_alive", "1")`. El navegador borra `sessionStorage` automáticamente al cerrarse. Al reabrir, `DashboardStudio` verifica el flag antes de mostrar el dashboard; si falta llama `handleSignOut()` y redirige a `/login`. Recargas de página (F5) preservan `sessionStorage` — la sesión continúa normalmente. Para pestañas dejadas abiertas: `gastos_last_active` en `localStorage` se actualiza en cada evento de usuario (mousedown/keydown/scroll/etc.); `checkSessionAge` verifica al recuperar visibilidad (`visibilitychange` + `pageshow` con `event.persisted` para restauraciones bfcache) y cierra la sesión si el timestamp supera 8 h. Todos los cierres de sesión (manual, inactividad, expiración) llaman `localStorage.removeItem("gastos_last_active")` para evitar el bucle de logout inmediato en el siguiente login.

**CalendarFilter:** En `shared.jsx`. Vista día: grid 7 columnas con `alpha(mainColor, intensidad)`; vista mes: grid 4×3. Rojo para EGRESO, verde para INGRESO. Click en celda activa `onFilter({ type, date })`, click nuevamente limpia. Chips de modo Día/Mes incluyen `aria-label` bilingüe para accesibilidad.

**Fecha y hora en transacciones:** `AddTransactionModal` inicializa con `dayjs()` (hora exacta). Al cambiar la fecha en el `DatePicker` se preserva la hora: `newValue.hour(h).minute(m).second(s)`.

**BudgetTab — toast feedback en presupuestos:** `saveEdit`, `saveEditExisting` y `handleAddBudget` muestran toast de confirmación al actualizar o agregar un presupuesto. Reciben `showToast` como prop desde `DashboardStudio`. La lista "Pagos recurrentes" limitada a 5 items muestra botón "Ver más / Show more (N)" si hay más; "Ver menos / Show less" para colapsar.

**SettingsPanel — try-catch en categorías personalizadas:** `handleSaveCat` y `handleDeleteCat` envuelven las llamadas a `saveCustomCat`/`deleteCustomCat` en `try/catch`; si falla la operación se muestra Snackbar de error en lugar de quedar en silencio.

**GoalsTab — validaciones de formulario:** Campos de monto objetivo/actual con `inputProps={{ min: 0 }}`; campo "Valor" de inversión ídem. Botón Guardar deshabilitado si `value ≤ 0` (inversión) o `price ≤ 0` (suscripción) o `remaining > original_months` (deuda). Campo TEA de deuda incluye `helperText` bilingüe explicando "Tasa efectiva anual / Annual effective rate". Campo Precio de suscripción muestra equivalente mensual cuando ciclo es anual (`≈ X.XX/mes`).

**OverviewTab — chip delta bilingüe:** El chip "vs ant." en las mini cards del resumen ahora cambia a "vs prev." cuando el idioma está en inglés (`lang === "es" ? "vs ant." : "vs prev."`).

**AddTransactionModal — error toast en fallo de guardado:** El bloque `catch` del `handleSubmit` muestra toast de error "Error al guardar. Intenta de nuevo." cuando `addTx`/`updateTx` lanza excepción (red, RLS). Requiere prop `showToast` pasada desde `DashboardStudio`. Sin esto el spinner desaparecía silenciosamente sin feedback.

**BudgetTab — delete de presupuesto con feedback correcto:** `deleteBudgetCat` en `DataContext` ahora hace `throw error` cuando Supabase falla, permitiendo que `BudgetTab.deleteBudget` (async con try/catch/finally) muestre toast de éxito o error y cierre los diálogos en `finally`. Antes el diálogo cerraba al instante sin esperar la DB; si fallaba, el presupuesto reaparecía en silencio. Consistente con el patrón de `ExpensesTab` e `IncomeTab`.

**GoalsTab — metas sin fecha límite:** Las metas sin `deadline` ya no muestran "0 días". El cálculo de días retorna `null` cuando `g.deadline` es null, y la línea se oculta completamente en el UI (`{days !== null && <Typography>...`). `new Date(null)` devuelve epoch (1970) que resultaba en 0 días — valor incorrecto.

**DataContext — todas las funciones CRUD lanzan error (`throw`):** Las 13 funciones CRUD (`addTx`, `updateTx`, `deleteTx`, `saveGoal`, `deleteGoal`, `saveAccount`, `deleteAccount`, `saveInvestment`, `deleteInvestment`, `saveDebt`, `deleteDebt`, `saveSubscription`, `deleteSubscription`) ahora hacen `if (error) throw error` en lugar de `if (!error && data)`. Esto permite que los handlers de los componentes atrapen el error y muestren feedback. Antes todos fallaban silenciosamente — solo `deleteBudgetCat` tenía `throw`.

**GoalsTab — `showToast` prop obligatoria:** `DashboardStudio` ahora pasa `showToast={showToast}` a `GoalsTab`. Sin esta prop, las 10 operaciones CRUD del tab (metas, cuentas, inversiones, deudas, suscripciones) daban éxito o error sin ningún feedback al usuario.

**GoalsTab — handlers con `try/catch/finally`:** Los 5 handlers de guardado (`handleSaveGoal`, `handleSaveAccount`, `handleSaveInvest`, `handleSaveDebt`, `handleSaveSub`) y sus equivalentes de borrado tienen `try/catch/finally` con `setSaving`. Sin `finally`, si Supabase lanzaba excepción el spinner quedaba activo y el dialog no se podía cerrar.

**GoalsTab — guard contra división por cero en progreso:** `const pct = g.target > 0 ? g.current / g.target : 0` evita `Infinity%` cuando el target de una meta es 0. Antes `Math.round(Infinity * 100)` renderizaba `"Infinity%"` y `fmtMoney(left)` mostraba un monto negativo en "faltan".

**ExpensesTab / IncomeTab — `showToast` en modal de edición:** El `<AddTransactionModal editTx={...}>` que se monta al editar una transacción ahora recibe `showToast={showToast}`. Sin esta prop, los errores al guardar una edición (red, RLS) eran silenciosos — el spinner desaparecía sin ningún mensaje.

**ExpensesTab — barra "Promedio diario" corregida:** La barra de progreso del resumen de período usaba la fórmula tautológica `(X / daysCount) / (X / daysCount) = 1`, siempre 100%. Ahora usa `filteredTotal / totalBudget` (% del presupuesto gastado) si hay presupuesto configurado, o 50% neutral si no lo hay.

**ExpensesTab — Top Categorías sync con calFilter:** `cats` ahora se deriva de `expenseTxs` (que ya incorpora `calFilter` y `activeCat`) en lugar de `periodTxs`. Antes, filtrar un día en el calendario actualizaba la lista y los totales pero las cards de "Top Categorías" seguían mostrando datos del mes completo. Los porcentajes y el total en el header de Top Categorías usan `filteredTotal` para ser consistentes con la vista activa.

**Matemática corregida en gráficos de distribución:** El denominador de los porcentajes en los gráficos donut/pie siempre es la suma de los propios segmentos mostrados (`sliceTotal`), no el total global. Antes, si el gráfico mostraba solo las top-6 categorías o solo las presupuestadas, los porcentajes nunca sumaban 100%. Aplicado en `OverviewTab` (Breakdown) y `BudgetTab` (Distribución).

**GoalsTab — rendimiento promedio de inversiones:** Cambiado de promedio simple a promedio ponderado por valor (`Σ(value × rate) / Σ(value)`). El promedio simple daba igual peso a todas las inversiones sin importar su tamaño.

**`linearRegressionSlope` en `helpers.js`:** Nueva función utilitaria que calcula la pendiente de una serie temporal por mínimos cuadrados ordinarios (OLS). Reemplaza el cálculo `(último - primero) / (n-1)` en el forecast de GoalsTab — el slope anterior era inestable cuando el primer o último mes era un outlier.

**GoalsTab — suscripciones anuales normalizadas a mensual:** El total mensual de suscripciones (`subscriptions.reduce(...)`) ahora aplica `cycle === "yearly" ? price / 12 : price` por cada ítem. Antes, una suscripción anual de S/120 añadía 120 al total mensual en lugar de 10 — el "Total mensual" se sobreestimaba enormemente si había suscripciones anuales.

**SettingsPanel — `inputProps` deprecado en MUI v9:** El `TextField` de nombre de categoría usaba `inputProps={{ maxLength: 40 }}` (prop de MUI v4/v5). Cambiado a `slotProps={{ htmlInput: { maxLength: 40 } }}`, consistente con el resto del proyecto.

## Arquitectura del Codebase (graphify)

Grafo de conocimiento generado con [graphify](https://github.com/ananddtyagi/cc-marketplace) sobre el codebase completo. **289 nodos · 539 edges · 26 comunidades.** Disponible en `graphify-out/graph.html`.

### Comunidades detectadas

| Comunidad | Nodos clave |
|-----------|-------------|
| UI Charts & Visualizations | `Donut`, `StudioCashflow`, `SparkArea`, `HeatCalendar`, `CalendarFilter`, `filterByPeriod`, `txByCategory`, `healthScore` |
| Supabase CRUD & Data Context | `DataProvider`, `mapRow/mapGoal/mapAccount/...`, 8 tablas DB, RLS |
| Auth Pages | `login`, `register`, `forgot-password`, `reset-password`, `AuthCard`, `AuthErrorAlert` |
| Goals, Accounts & Finances | `GoalsTab`, `DashboardStudio`, `LoginModal`, `linearRegressionSlope` |
| App Layout & Fonts | `layout.tsx`, `Providers.tsx`, `SettingsContext`, `UserContext`, `DynamicThemeProvider` |
| Theme & Dark Mode | `materialTheme.js`, `lightTheme`, `darkTheme`, `getTheme` |
| Route Protection & Server Lib | `proxy.ts`, `supabase-server.ts`, `createServerSupabaseClient` |

### God Nodes — abstracciones más conectadas

| Nodo | Edges | Rol |
|------|-------|-----|
| `OverviewTab` | 33 | Hub visual principal — consume charts + helpers + 3 contextos |
| `IncomeTab` | 28 | Conecta charts + datos + CalendarFilter |
| `DashboardStudio.jsx` | 27 | **Puente de todas las comunidades** (betweenness 0.183) |
| `DataProvider()` | 19 | Fuente de verdad de todos los datos |
| `createClient()` | 18 | Bridge auth → todas las comunidades (betweenness 0.120) |

### Flujo de datos: Supabase → Tabs

```
Supabase DB (8 tablas, RLS auth.uid = user_id)
  └── DataProvider.load() — Promise.all([8 queries]) — DataContext.jsx:L106
        ├── mapRow()         → txs[]
        ├── mapGoal()        → goals[]
        ├── mapAccount()     → accounts[]
        ├── mapInvestment()  → investments[]
        ├── mapDebt()        → debts[]
        ├── mapSubscription()→ subscriptions[]
        └── raw              → customCats[], editBudgets{}
              │
              └── useMemo → useData() hook
                              │
        ┌───────────────────┬─┴──────────────────────┐
   OverviewTab        ExpensesTab/IncomeTab       GoalsTab
   BudgetTab          txs+editBudgets             goals+accounts
   txs+editBudgets    +customCats                 +investments
   +customCats              │                     +debts+subs
              │             │
              └── filterByPeriod(txs, period) → helpers → Charts
```

### Insights arquitectónicos

**`DashboardStudio` es el único puente entre todas las comunidades** porque es el único componente que consume los 3 contextos globales simultáneamente (Settings + User + Data), controla el `period` compartido con todos los tabs, y es el canal exclusivo de `showToast`. Si se eliminara, el grafo se fragmentaría en 6 islas desconectadas.

**`createClient()` conecta 6 comunidades** a pesar de tener solo 9 líneas. Se llama dentro de cada función CRUD (no a nivel de módulo), generando 18+ importaciones en todo el codebase. Internamente `createBrowserClient` es un singleton, por lo que no crea múltiples conexiones a Supabase — pero el patrón de import sí crea los edges que cruzan comunidades.

**Los helpers de `helpers.js` son el eslabón más frágil:** `filterByPeriod`, `txByCategory`, `linearRegressionSlope` y `healthScore` tienen edges hacia los 4 tabs principales. Un bug aquí afecta simultáneamente OverviewTab, ExpensesTab, IncomeTab y BudgetTab. El grafo detectó **cero edges hacia archivos de test**.

## Despliegue

```bash
vercel --prod
```

Las variables de entorno se configuran en el Dashboard de Vercel.

Cada push a `main` dispara un despliegue automático en Vercel (la integración GitHub → Vercel está activa).

## Solución de problemas

**Una función parece "rota" solo en producción (www.jeshu.cfd) pero funciona en local.**
Casi siempre es **caché del navegador**: tras un despliegue, el navegador puede combinar el HTML antiguo en caché con los chunks de JavaScript nuevos, ejecutando una mezcla de versiones. La app **no usa Service Worker ni PWA**, así que no hay caché propia que limpiar — es la del navegador.

- **Solución:** *hard refresh* con `Ctrl + Shift + R` (Cmd + Shift + R en Mac) o abrir el sitio en una **ventana de incógnito**.
- Antes de buscar el bug en el código, verifica que el síntoma también se reproduce en **local** (`npm run dev`) y en **incógnito**. Si solo ocurre en producción y el código local es idéntico a `origin/main`, es caché.
- Caso real (2026-06-16): el filtro de fechas del calendario (Gastos/Ingresos) mostraba el chip con la fecha pero dejaba la lista vacía, únicamente en producción. El código era correcto; un *hard refresh* lo resolvió.

## Licencia

MIT
