# Auditoría de arquitectura

> Punto de partida del refactor arquitectónico: `main` en `be3d3ef` (29-09-2026).
> Reúne lo que el plan pedía en tres documentos (auditoría, mapa de dependencias y plan de migración).
> El [resultado](#resultado), con el mapa "después", está al final; la estructura resultante se documenta en [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md).

## Cómo se hizo

- **Mapa de dependencias:** [`scripts/dependency-map.mjs`](../scripts/dependency-map.mjs) lee los `import` de `src/` y resuelve los relativos y el alias `@/`. Con eso arma el grafo, detecta ciclos, aplica las reglas de capas y lista los exports sin uso.
- **Reglas en la CI:** `src/architecture.test.js` las aplica en cada `npm test`. Las violaciones que el código ya tenía van en una lista de excepciones, que el refactor solo puede vaciar.
- **Responsabilidad de cada archivo:** leída en el código, no deducida por el nombre.

## Baseline

| Chequeo | Resultado en `be3d3ef` |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS: 211 tests en 22 archivos |
| `npm run build` (contra el Supabase simulado) | PASS |
| `npm run test:e2e` | PASS: 36 de 36 |

**Baseline visual:** capturas de cada pantalla, diálogo y panel (auth, las 5 pestañas, 13 diálogos, Perfil y Ajustes):
- en claro y oscuro, español e inglés, escritorio y 390 px;
- con el reloj del navegador fijo;
- en cada comparación se toman de `be3d3ef` y de la rama en la misma corrida, porque los datos del Supabase simulado dependen de la fecha real;
- el criterio es 0 píxeles distintos.

## Estructura de partida

| Carpeta | Archivos (sin tests) | Qué tiene |
|---|---|---|
| `app/` | 22 | Rutas, pero también `app/components/` (providers y UI de auth) y la implementación completa de las 4 pantallas de auth |
| `components/` | 38 | Todas las pestañas, tarjetas y diálogos, agrupados en parte por pestaña (`budget/`, `goals/`, `settings/`) |
| `context/` | 3 | `DataContext.jsx` (588 líneas), `SettingsContext.tsx`, `UserContext.tsx` |
| `data/` | 6 | Lógica de dominio mezclada: `helpers.ts` (8 dominios), `index.ts` (3), importar y exportar, sugerencias, paginación |
| `hooks/` | 4 | Tres de transacciones o presupuestos y uno genérico |
| `lib/` | 6 | Clientes de Supabase, tasas, reporte de errores, 2FA, flags |
| `theme/` | 6 | Tema, iconos y tonos, más 2 componentes (`GradientIcon`, `IconPicker`) |
| `i18n/`, `types.ts`, `proxy.ts` | 5 | Textos, tipos del dominio, guard + CSP |

**Lenguajes:**
- 41 archivos `.ts`/`.tsx`: rutas, datos, textos, 2 contextos y la librería;
- 8 archivos `.js` de lógica: tema, hooks y `useEntityDialog`;
- 40 componentes `.jsx`;
- tests en `.js`/`.jsx`.

## Mapa de dependencias (antes)

Cada fila es una carpeta y lo que importa de las demás (sin tests):

| Área | Importa |
|---|---|
| `app` | `@supabase/supabase-js`, `components`, `context`, `lib`, `lib/supabase`, `theme` |
| `app/auth` | `@supabase/ssr` |
| `components` | `context`, `data`, `hooks`, `lib`, `lib/supabase`, `theme` |
| `context` | `@supabase/supabase-js`, `data`, `hooks`, `i18n`, `lib`, `lib/supabase`, `theme`, `types` |
| `data` | `i18n`, `types` |
| `hooks` | `context`, `data`, `theme` |
| `i18n` | — |
| `lib` | `data` |
| `lib/supabase` | `@supabase/ssr` |
| `proxy` | `@supabase/ssr`, `lib` |
| `theme` | `context`, `data` |
| `types` | — |

**Ciclos:** ninguno.

**Violaciones de las reglas de capas: 10**, y todas son deuda de partida:
- **9 archivos de UI llaman a Supabase directamente:**
  - las 4 páginas de auth;
  - `DashboardStudio` (logout), `LoginModal`, `ProfileTab` (nombre y favoritas) y `TwoFactorSection`;
  - `login/page.tsx`, además, importa un tipo de `@supabase/supabase-js`.
- **`theme/IconPicker.jsx` importa un contexto:** el tema depende de la capa de estado.

### Qué hace que el mapa sea difícil de leer
- **Nombres por tecnología:** `components/` depende de todo (`context`, `data`, `hooks`, `lib`, `lib/supabase`, `theme`). Desde fuera no se sabe qué pantalla usa qué dominio.
- **`data/` mezcla dominios:** es a la vez catálogo, monedas, períodos, presupuestos, patrimonio e importación. Solo `data/index.ts` lo importan 23 archivos.
- **`theme/` y `hooks/` dependen hacia arriba:** importan `context/` y `data/`, capas que deberían estar por encima de ellas.

## Hotspots

| Archivo | Problema | Riesgo al tocarlo | Qué lo protege |
|---|---|---|---|
| `context/DataContext.jsx` (588 líneas) | Estado, consultas, mutaciones y mappers de las 9 tablas en un componente. Es el único acceso a datos, pero también la única pieza que conoce las tablas | Alto | 8 tests con un cliente simulado que registra cada llamada, y los e2e con sesión |
| `components/DashboardStudio.jsx` (366) | Shell de la app mezclado con ~150 líneas de seguridad de sesión (inactividad, 8 h, navegador reabierto, `BroadcastChannel`) | Alto | e2e de inactividad con `page.clock`, pestañas y navegador reabierto |
| `data/helpers.ts` (319) | 17 funciones de 8 dominios; lo importan 15 archivos | Bajo (funciones puras) | `helpers.test.js`, `budgets.test.js`, `upcoming.test.js` |
| `data/index.ts` (205) | Catálogo de categorías, monedas con tasas del día (estado de módulo) y agregaciones de transacciones | Bajo | `currency.test.js`, `categoryIcons.test.js` |
| Páginas de auth (`app/*/page.tsx`, 190–320 líneas) | Implementación completa dentro de `app/`, llamando a Supabase | Medio | e2e de login, registro, recuperación, 2FA y CSP |
| `ExpensesTab.jsx` / `IncomeTab.jsx` | ~147 líneas iguales: lista con editar y borrar, filtros de calendario y categoría, pie con el total | Medio | e2e de alta, edición y borrado, y capturas |
| `components/shared.jsx` (337) | Mezcla UI genérica (`EmptyState`) con UI de transacciones (`CalendarFilter`, `NoTransactions`) y código muerto | Bajo | Capturas |

## Código muerto y exports

`node scripts/dependency-map.mjs --unused` en `be3d3ef`:

- **Sin uso en ningún lado** (borrados al empezar la fase 4, en su propio commit):
  - `StatsCard` y `SummaryCard` (`shared.jsx`), y `Delta`, que solo usaba `SummaryCard`;
  - `txByCategoryToday` (`data/index.ts`);
  - el icono `Download` (`theme/icons.js`);
  - `createServerSupabaseClient` (`lib/supabase-server.ts`): se usa en vez de borrarse, porque el callback de OAuth repite su código.
- **Solo lo usan tests:**
  - `fmtDate` (`helpers.ts`), que se borra junto con su test;
  - el resto (`csvCell`, `parseAmount`, `tokenAal`, `buildReport`…) son piezas internas que los tests prueban por separado, y se quedan.
- **24 exports que solo se usan en su propio archivo:** en su mayoría tipos de retorno públicos (`BackupData`, `UpcomingPayment`…). Se quedan.

## Fronteras server/client

- **Client:**
  - 27 archivos declaran `"use client"`: las páginas de auth y de error, el shell, las pestañas, los diálogos de primer nivel, los 3 contextos, los providers, `GradientIcon` e `IconPicker`;
  - el resto de los componentes son cliente porque solo los importan componentes cliente.
- **Servidor:**
  - `layout.tsx`: lee el nonce;
  - las rutas `app/api/*` y `app/auth/callback`;
  - `proxy.ts`;
  - `lib/supabase-server.ts` (`next/headers`).
- **Isomorfos:** `data/*`, `lib/rates.ts`, `lib/mfa.ts` (la usan `proxy.ts` y el cliente), `i18n/*` y `types.ts`.
- **Regla para el refactor:** mover un archivo no cambia su lado.
  - Las páginas de auth pasan a ser server components que renderizan el componente `"use client"` de la feature, que es la misma frontera que hoy, un nivel más abajo.
  - `window`, `localStorage` y `sessionStorage` solo se usan en componentes y hooks cliente (`useLocalStorage`, el shell).

## Matriz de migración por archivo

Columnas:
- **Deps / Dep. de:** cuántos archivos de `src/` importa y cuántos lo importan (sin tests).
- **Lado:** según `"use client"`, `next/headers` o su ubicación.
- **Acciones:** KEEP, MOVE, SPLIT, MIGRATE JS→TS y DELETE.
- **Tests:** se mueven con su módulo; los de `helpers.test.js` se reparten entre los módulos nuevos, con los mismos casos.

| Archivo | Tipo | Responsabilidad real | Feature | Deps | Dep. de | Lado | Acción | Destino | Riesgo | Motivo |
|---|---|---|---|---|---|---|---|---|---|---|
| `app/api/client-error/route.ts` | ts | Ruta: recibe errores del navegador y los escribe en los logs | observabilidad | 0 | 0 | server | KEEP | = (sin cambios) | Bajo | Es una ruta de Next: su lugar es app/ |
| `app/api/csp-report/route.ts` | ts | Ruta: recibe las violaciones del CSP | seguridad | 0 | 0 | server | KEEP | = (sin cambios) | Bajo | Ruta de Next |
| `app/api/rates/route.ts` | ts | Ruta: tasas de cambio del día (detrás del login) | moneda | 1 | 0 | server | KEEP | = (sin cambios) | Bajo | Ruta de Next; la lógica ya está en lib/rates.ts |
| `app/auth/callback/route.ts` | ts | Ruta: canje PKCE de OAuth | auth | 0 | 0 | server | KEEP | = (sin cambios) | Medio | Repite el cliente de servidor: pasa a usar lib/supabase/server.ts |
| `app/components/DynamicThemeProvider.tsx` | tsx | Aplica el tema MUI según los ajustes | compartido | 2 | 1 | client | MOVE | components/providers/DynamicThemeProvider.tsx | Bajo | app/ es solo para rutas |
| `app/components/ErrorReporter.tsx` | tsx | Envía errores no capturados a /api/client-error | observabilidad | 1 | 1 | client | MOVE | components/providers/ErrorReporter.tsx | Bajo | app/ es solo para rutas |
| `app/components/Providers.tsx` | tsx | Compone User → Settings → Data → Theme | compartido | 5 | 1 | client | MOVE | components/providers/Providers.tsx | Medio | app/ es solo para rutas; el nonce sigue en layout.tsx |
| `app/components/auth/AuthCard.tsx` | tsx | Tarjeta de las pantallas de auth | auth | 1 | 4 | client | MOVE | features/auth/components/AuthCard.tsx | Bajo | Es de la feature auth |
| `app/components/auth/AuthErrorAlert.tsx` | tsx | Error de auth (enlace expirado) | auth | 0 | 4 | client | MOVE | features/auth/components/AuthErrorAlert.tsx | Bajo | Es de la feature auth |
| `app/components/auth/AuthThemeToggle.tsx` | tsx | Botón día/noche del login | auth | 2 | 1 | client | MOVE | features/auth/components/AuthThemeToggle.tsx | Bajo | Es de la feature auth |
| `app/components/auth/authStyles.ts` | ts | Estilos compartidos de las pantallas de auth | auth | 0 | 5 | client (hereda) | MOVE | features/auth/components/authStyles.ts | Bajo | Los estilos van junto a su feature |
| `app/error.tsx` | tsx | Límite de error de Next | app | 1 | 0 | client | KEEP | = (sin cambios) | Bajo | Convención de Next |
| `app/forgot-password/page.tsx` | tsx | Pantalla completa: formulario, estados y Supabase | auth | 5 | 0 | client | SPLIT | page.tsx (entrada) + features/auth/components/ForgotPasswordPage.tsx; Supabase a authApi | Medio | La implementación sale de app/ y la UI deja de llamar a Supabase |
| `app/global-error.tsx` | tsx | Límite de error raíz | app | 1 | 0 | client | KEEP | = (sin cambios) | Bajo | Convención de Next |
| `app/globals.css` | css | Reset, reduced motion y reglas globales | app | 0 | 1 | — | KEEP | = (sin cambios) | Bajo | Único CSS; Next lo carga desde el layout |
| `app/layout.tsx` | tsx | Layout raíz: fuentes, nonce del CSP, providers | app | 2 | 0 | server | KEEP | = (sin cambios) | Medio | Convención de Next; importa Providers desde su nuevo lugar |
| `app/login/page.tsx` | tsx | Pantalla completa: login, código 2FA y Supabase | auth | 8 | 0 | client | SPLIT | page.tsx (entrada) + features/auth/components/LoginPage.tsx; Supabase a authApi | Medio | Ídem |
| `app/manifest.ts` | ts | Manifest de la app instalable | app | 0 | 0 | isomorfo | KEEP | = (sin cambios) | Bajo | Convención de Next |
| `app/not-found.tsx` | tsx | Página 404 | app | 0 | 0 | client | KEEP | = (sin cambios) | Bajo | Convención de Next |
| `app/page.tsx` | tsx | Entrada de / (renderiza el dashboard) | app | 1 | 0 | client (hereda) | KEEP | = (sin cambios) | Bajo | Solo cambia el import |
| `app/register/page.tsx` | tsx | Pantalla completa de registro | auth | 6 | 0 | client | SPLIT | page.tsx (entrada) + features/auth/components/RegisterPage.tsx; Supabase a authApi | Medio | Ídem |
| `app/reset-password/page.tsx` | tsx | Pantalla completa de nueva contraseña | auth | 5 | 0 | client | SPLIT | page.tsx (entrada) + features/auth/components/ResetPasswordPage.tsx; Supabase a authApi | Medio | Ídem |
| `components/AddTransactionModal.jsx` | jsx | Formulario de alta y edición de transacciones | transactions | 7 | 3 | client | MOVE + JS→TS | features/transactions/components/AddTransactionModal.tsx | Medio | Lógica compleja (moneda, tasa, cuenta, sugerencia): gana con tipos |
| `components/BudgetTab.jsx` | jsx | Pestaña Presupuesto | budgets | 12 | 1 | client | MOVE | features/budgets/components/BudgetTab.jsx | Bajo | Es de la feature |
| `components/Charts.jsx` | jsx | Donut, SparkArea, StudioCashflow, HeatCalendar | compartido | 0 | 3 | client (hereda) | MOVE + JS→TS | components/charts/Charts.tsx | Bajo | Lo usan 3 features: UI compartida y tipada |
| `components/DashboardStudio.jsx` | jsx | Shell: AppBar, pestañas, avisos, modal y seguridad de sesión | dashboard | 15 | 1 | client | SPLIT + JS→TS | features/dashboard/components/DashboardStudio.tsx + features/auth/hooks/useSessionGuard.ts + components/feedback/useToast.ts | Alto | Mezcla la UI con ~150 líneas de seguridad de sesión |
| `components/ExpensesTab.jsx` | jsx | Pestaña Gastos | transactions | 11 | 1 | client | MOVE (+ extraer lo duplicado) | features/transactions/components/ExpensesTab.jsx | Medio | Comparte ~147 líneas con IncomeTab |
| `components/GoalsTab.jsx` | jsx | Pestaña Metas: compone metas, cuentas, inversiones, deudas y suscripciones | dashboard | 10 | 1 | client | MOVE | features/dashboard/components/GoalsTab.jsx | Bajo | Pantalla que compone 5 features |
| `components/IncomeTab.jsx` | jsx | Pestaña Ingresos | transactions | 12 | 1 | client | MOVE (+ extraer lo duplicado) | features/transactions/components/IncomeTab.jsx | Medio | Comparte ~147 líneas con ExpensesTab |
| `components/LoginModal.jsx` | jsx | Login dentro de la app | auth | 4 | 1 | client | MOVE | features/auth/components/LoginModal.jsx | Medio | Es de auth; Supabase a authApi |
| `components/OverviewTab.jsx` | jsx | Pestaña Resumen | dashboard | 10 | 1 | client | MOVE | features/dashboard/components/OverviewTab.jsx | Bajo | Es del dashboard |
| `components/SettingsPanel.jsx` | jsx | Drawer de Perfil y Ajustes | settings | 5 | 1 | client | MOVE | features/settings/components/SettingsPanel.jsx | Bajo | Es de la feature |
| `components/budget/BudgetAlertsBanner.jsx` | jsx | Franja de presupuestos al límite | budgets | 4 | 1 | client (hereda) | MOVE | features/budgets/components/ | Bajo | Es de la feature |
| `components/budget/BudgetCardsGrid.jsx` | jsx | Tarjetas de presupuesto | budgets | 7 | 1 | client (hereda) | MOVE | features/budgets/components/ | Bajo | Es de la feature |
| `components/budget/BudgetVsActualCard.jsx` | jsx | Presupuesto vs gasto real | budgets | 6 | 1 | client (hereda) | MOVE | features/budgets/components/ | Bajo | Es de la feature |
| `components/budget/DistributionCard.jsx` | jsx | Distribución del gasto | budgets | 6 | 1 | client (hereda) | MOVE | features/budgets/components/ | Bajo | Es de la feature |
| `components/budget/HealthSummaryCard.jsx` | jsx | Salud financiera | budgets | 5 | 1 | client (hereda) | MOVE | features/budgets/components/ | Bajo | Es de la feature |
| `components/budget/ManageBudgetsDialog.jsx` | jsx | Diálogo Gestionar | budgets | 5 | 1 | client (hereda) | MOVE | features/budgets/components/ | Bajo | Es de la feature |
| `components/budget/PeriodComparisonCard.jsx` | jsx | Comparación con el período anterior | budgets | 4 | 1 | client (hereda) | MOVE | features/budgets/components/ | Bajo | Es de la feature |
| `components/budget/RecurringCard.jsx` | jsx | Pagos recurrentes | budgets | 6 | 1 | client (hereda) | MOVE | features/budgets/components/ | Bajo | Es de la feature |
| `components/budget/UpcomingPaymentsCard.jsx` | jsx | Próximos pagos | budgets | 6 | 1 | client (hereda) | MOVE | features/budgets/components/ | Bajo | Es de la feature |
| `components/goals/AccountsCard.jsx` | jsx | Cuentas, saldo y transferencias | accounts | 9 | 1 | client (hereda) | MOVE | features/accounts/components/AccountsCard.jsx | Bajo | Es de la feature |
| `components/goals/DebtsCard.jsx` | jsx | Deudas | debts | 8 | 1 | client (hereda) | MOVE | features/debts/components/DebtsCard.jsx | Bajo | Es de la feature |
| `components/goals/EmptySection.jsx` | jsx | Estado vacío con botón Agregar | compartido | 2 | 5 | client (hereda) | MOVE + JS→TS | components/ui/EmptySection.tsx | Bajo | Lo usan 5 features |
| `components/goals/EntityDialog.jsx` | jsx | Marco de diálogo crear/editar/borrar | compartido | 1 | 5 | client (hereda) | MOVE + JS→TS | components/forms/EntityDialog.tsx | Bajo | Lo usan 5 features |
| `components/goals/ForecastCard.jsx` | jsx | Pronóstico de 3 meses | goals | 4 | 1 | client (hereda) | MOVE | features/goals/components/ForecastCard.jsx | Bajo | Es de la feature |
| `components/goals/GoalsSection.jsx` | jsx | Metas de ahorro | goals | 10 | 1 | client (hereda) | MOVE | features/goals/components/GoalsSection.jsx | Bajo | Es de la feature |
| `components/goals/InvestmentsSection.jsx` | jsx | Inversiones | investments | 8 | 1 | client (hereda) | MOVE | features/investments/components/InvestmentsSection.jsx | Bajo | Es de la feature |
| `components/goals/NetWorthEvolutionCard.jsx` | jsx | Evolución del patrimonio | goals | 3 | 1 | client (hereda) | MOVE | features/goals/components/NetWorthEvolutionCard.jsx | Bajo | Parte de Metas y finanzas |
| `components/goals/SubscriptionsCard.jsx` | jsx | Suscripciones | subscriptions | 10 | 1 | client (hereda) | MOVE | features/subscriptions/components/SubscriptionsCard.jsx | Bajo | Es de la feature |
| `components/goals/TransferDialog.jsx` | jsx | Diálogo de transferencia | accounts | 3 | 1 | client (hereda) | MOVE | features/accounts/components/TransferDialog.jsx | Bajo | Es de la feature |
| `components/goals/useEntityDialog.js` | js | Estado de los diálogos CRUD | compartido | 0 | 5 | client (hereda) | MOVE + JS→TS | components/forms/useEntityDialog.ts | Bajo | Lo usan 5 features |
| `components/settings/CustomCategoriesSection.jsx` | jsx | Categorías propias (CRUD) | categories | 6 | 1 | client (hereda) | MOVE | features/categories/components/CustomCategoriesSection.jsx | Bajo | Es de la feature |
| `components/settings/DataExportSection.jsx` | jsx | Tus datos: exportar, importar, papelera | settings | 8 | 1 | client (hereda) | MOVE | features/settings/components/YourDataSection.jsx | Bajo | Sección de Perfil que reúne exportar, importar (import-export) y la papelera (transactions): es composición, como el resto de Perfil |
| `components/settings/ImportDialog.jsx` | jsx | Importar CSV | import-export | 5 | 1 | client (hereda) | MOVE | features/import-export/components/ImportDialog.jsx | Bajo | Es de la feature |
| `components/settings/PreferencesTab.jsx` | jsx | Ajustes: tema, idioma, moneda… | settings | 3 | 1 | client (hereda) | MOVE | features/settings/components/PreferencesTab.jsx | Bajo | Es de la feature |
| `components/settings/ProfileTab.jsx` | jsx | Perfil: datos, favoritas y secciones | settings | 9 | 1 | client (hereda) | MOVE | features/settings/components/ProfileTab.jsx | Medio | Supabase a authApi |
| `components/settings/TrashDialog.jsx` | jsx | Papelera | transactions | 5 | 1 | client (hereda) | MOVE | features/transactions/components/TrashDialog.jsx | Bajo | Es de las transacciones |
| `components/settings/TwoFactorSection.jsx` | jsx | Activar y desactivar la 2FA | auth | 2 | 1 | client (hereda) | MOVE | features/auth/components/TwoFactorSection.jsx | Medio | Es de auth; Supabase a authApi |
| `components/shared.jsx` | jsx | EmptyState, NoTransactions, StatsCard, Delta, SummaryCard, CalendarFilter | mixto | 4 | 2 | client (hereda) | SPLIT + DELETE | EmptyState → components/ui/EmptyState.tsx; NoTransactions y CalendarFilter → features/transactions/components/; StatsCard, SummaryCard y Delta: DELETE | Medio | Mezcla UI genérica y de transacciones; StatsCard, SummaryCard y Delta no se usan |
| `context/DataContext.jsx` | jsx | Estado, carga, mutaciones y mappers de 9 tablas | datos | 5 | 29 | client | SPLIT + JS→TS | contexts/DataContext.tsx + contexts/useTableCrud.ts + features/*/data/*.ts | Alto | Concentra 9 dominios; es el punto de cambio para dejar Supabase |
| `context/SettingsContext.tsx` | tsx | Ajustes, idioma, moneda, tasas del día, fmt | compartido | 6 | 41 | client | MOVE | contexts/SettingsContext.tsx | Bajo | Carpeta en plural, junto a los otros contextos |
| `context/UserContext.tsx` | tsx | Usuario de la sesión | auth | 1 | 6 | client | MOVE | contexts/UserContext.tsx | Medio | Pasa a usar authApi |
| `data/export.ts` | ts | CSV y copia JSON | import-export | 1 | 1 | isomorfo | MOVE | features/import-export/domain/export.ts | Bajo | Es de la feature |
| `data/fetchAllRows.ts` | ts | Paginación de PostgREST | infraestructura | 0 | 1 | isomorfo | MOVE | lib/supabase/fetchAllRows.ts | Bajo | Es acceso a datos de Supabase |
| `data/helpers.ts` | ts | Períodos, salud, anomalías, recurrentes, pronóstico, patrimonio, saldos, presupuestos | mixto | 4 | 15 | isomorfo | SPLIT + DELETE | domain/{period,health,netWorth}.ts, dashboard/domain/insights, transactions/domain/anomalies, budgets/domain/{budgets,recurring}, goals/domain/forecast, accounts/domain/balance; fmtDate: DELETE | Bajo | 8 dominios en un archivo; fmtDate solo lo usan tests |
| `data/import.ts` | ts | Importar CSV: lectura, columnas, fechas, montos | import-export | 3 | 2 | isomorfo | MOVE | features/import-export/domain/csvImport.ts | Bajo | Es de la feature |
| `data/index.ts` | ts | Catálogo de categorías, monedas y agregaciones | mixto | 1 | 23 | isomorfo | SPLIT + DELETE | domain/money.ts, domain/period.ts (getToday), domain/categories/catalog.ts, transactions/domain/aggregations.ts; txByCategoryToday: DELETE | Bajo | 3 dominios en un archivo; txByCategoryToday no se usa |
| `data/suggest.ts` | ts | Categoría sugerida por el concepto | categorías | 2 | 4 | isomorfo | MOVE | domain/categories/suggest.ts | Bajo | La usan transacciones, suscripciones, importación y recurrentes |
| `hooks/useBudgetAlertToasts.js` | js | Avisos al cruzar el 80/100 % | budgets | 4 | 1 | client (hereda) | MOVE + JS→TS | features/budgets/hooks/useBudgetAlertToasts.ts | Bajo | Es de la feature |
| `hooks/useLocalStorage.ts` | ts | Estado persistido en localStorage | compartido | 0 | 1 | isomorfo | KEEP | = (sin cambios) | Bajo | Hook genérico |
| `hooks/useMoveToTrash.js` | js | Mover a la papelera con Deshacer | transactions | 2 | 2 | client (hereda) | MOVE + JS→TS | features/transactions/hooks/useMoveToTrash.ts | Bajo | Es de la feature |
| `hooks/useTxExtras.js` | js | Cuenta y monto original de cada fila | transactions | 2 | 2 | client (hereda) | MOVE + JS→TS | features/transactions/hooks/useTxExtras.ts | Bajo | Es de la feature |
| `i18n/base.ts` | ts | Textos compartidos | i18n | 0 | 1 | isomorfo | KEEP | = (sin cambios) | Bajo | Única fuente de textos |
| `i18n/index.ts` | ts | MESSAGES y messagesFor | i18n | 2 | 2 | isomorfo | KEEP | = (sin cambios) | Bajo | Única fuente de textos |
| `i18n/ui.ts` | ts | Textos por área | i18n | 0 | 1 | isomorfo | KEEP | = (sin cambios) | Bajo | Única fuente de textos |
| `lib/featureFlags.ts` | ts | OAUTH_ENABLED | infraestructura | 0 | 3 | isomorfo | KEEP | = (sin cambios) | Bajo | Configuración |
| `lib/mfa.ts` | ts | Nivel de la sesión (aal) y factor TOTP | auth | 0 | 3 | isomorfo | MOVE | features/auth/domain/mfa.ts | Bajo | Regla de auth; la usan proxy.ts, login y DataContext |
| `lib/rates.ts` | ts | Tasas del día desde el proveedor (servidor) | moneda | 1 | 1 | isomorfo | KEEP | = (sin cambios) | Bajo | Infraestructura de /api/rates |
| `lib/reportError.ts` | ts | Envía errores a /api/client-error | observabilidad | 0 | 4 | isomorfo | KEEP | = (sin cambios) | Bajo | Infraestructura |
| `lib/supabase-server.ts` | ts | Cliente de servidor (sin uso) | infraestructura | 0 | 0 | server | MOVE | lib/supabase/server.ts | Medio | Hoy nadie lo importa; el callback de OAuth pasa a usarlo |
| `lib/supabase.ts` | ts | Cliente del navegador | infraestructura | 0 | 10 | isomorfo | MOVE | lib/supabase/client.ts | Bajo | Agrupa los clientes |
| `proxy.ts` | ts | Guard de auth + CSP con nonce | seguridad | 1 | 0 | server | KEEP | = (sin cambios) | Medio | Convención de Next 16; solo cambia el import de mfa |
| `theme/GradientIcon.jsx` | jsx | GradientIcon y CategoryAvatar | compartido | 1 | 20 | client | MOVE + JS→TS | components/ui/GradientIcon.tsx | Bajo | Es un componente, no parte del tema; lo usan 20 archivos |
| `theme/IconPicker.jsx` | jsx | Selector de icono | compartido | 3 | 2 | client | MOVE + JS→TS | components/ui/IconPicker.tsx | Bajo | Es un componente; hoy theme importa un contexto |
| `theme/categoryIcons.js` | js | Icono por categoría, ICON_CHOICES, resolveCategoryMeta | tema | 2 | 20 | client (hereda) | JS→TS | theme/categoryIcons.ts | Bajo | Única fuente de categoría → nombre → color → icono |
| `theme/iconTones.js` | js | Gradientes por tono | tema | 0 | 5 | client (hereda) | JS→TS | theme/iconTones.ts | Bajo | Tokens visuales |
| `theme/icons.js` | js | Set central de iconos Rounded | tema | 0 | 35 | client (hereda) | JS→TS + DELETE parcial | theme/icons.ts (sin Download, que no se usa) | Bajo | Tokens visuales |
| `theme/materialTheme.js` | js | Temas MUI, acentos, animaciones | tema | 0 | 3 | client (hereda) | JS→TS | theme/materialTheme.ts | Bajo | Tokens visuales |
| `types.ts` | ts | Tipos del dominio | tipos | 0 | 6 | isomorfo | MOVE | types/domain.ts (+ types/database.ts nuevo) | Bajo | Un lugar para los tipos del dominio y otro para las filas de la base |

## Migración JS → TS

`allowJs` se queda en `true`: quedan componentes `.jsx` a propósito. Se reconsidera cuando no quede ninguno.

**Estado (fases 5 y 6):**
- **Fase 5:** `useEntityDialog`, `EntityDialog`, `IconPicker`, `EmptySection`, `Charts` y `CalendarFilter`.
- **Fase 6:** `DataContext` y, justo después, `useBudgetAlertToasts`, `useMoveToTrash`, `useTxExtras` y `AddTransactionModal`. Esos cuatro usan `useData()`, que desde TypeScript se veía como `never` mientras `DataContext` era JS.
- **Siguen en `.jsx`:** `GradientIcon`, `EmptyState` y `TransactionList` (motivos en la tabla), y las pantallas y tarjetas.

**Cómo se comprueba que tipar no cambia nada:** se compara el JS que emite TypeScript (`transpileModule`, sin comentarios) para el `.jsx` viejo y para el `.tsx` nuevo. Tienen que ser idénticos. Si TypeScript obliga a cambiar código, y no solo a anotarlo, el archivo se queda en `.jsx` con el motivo.

| Estado | Archivos | Por qué |
|---|---|---|
| **Migrar** | `theme/{categoryIcons,iconTones,icons,materialTheme}.js` | Mapas y tokens que usa casi toda la UI; un nombre de icono mal escrito hoy no falla hasta que se renderiza |
| **Migrar** | `hooks/{useBudgetAlertToasts,useMoveToTrash,useTxExtras}.js`, `goals/useEntityDialog.js` | Lógica con estado y efectos, reutilizada por varias pantallas |
| **Migrar** | `context/DataContext.jsx` | Es el contrato de datos de toda la app; al dividirlo, los tipos de `types/` y `types/database.ts` quedan en cada mapper |
| **Migrar** | `components/Charts.jsx`, `theme/GradientIcon.jsx`, `theme/IconPicker.jsx`, `goals/EntityDialog.jsx`, `goals/EmptySection.jsx` | UI compartida: sus props son la interfaz que usan varias features. `EmptyState` (de `shared.jsx`) espera al PR aparte: usa un `fontWeight` que MUI 9 ignora (ver [Hallazgos](#hallazgos-durante-la-migración)) |
| **Migrar** | `AddTransactionModal.jsx`, `CalendarFilter` | La lógica de UI más compleja (moneda, tasa, cuenta, sugerencia; filtros de fecha) |
| **Migrar** | `DashboardStudio.jsx` | Al dividirlo: el shell y los hooks nuevos nacen en TS |
| **Pendiente** | Pestañas y tarjetas de las features: `BudgetTab`, las 9 de `budget/`, `ExpensesTab`, `IncomeTab`, `OverviewTab`, `GoalsTab`, las de `goals/`, las de `settings/`, `LoginModal`, `SettingsPanel`, `NoTransactions` | Son sobre todo maquetación con `sx`: los datos ya llegan tipados de los contextos y del dominio. Pasan a TS cuando se toquen por otra razón |
| **Pendiente** | `TransactionList.jsx` (extraído en la fase 4) | Usa `fontWeight` en `Typography`, que MUI 9 ignora y sus tipos rechazan. Tiparlo obliga a quitar la prop o a pasarla a `sx`, y lo segundo cambia el aspecto (ver [Hallazgos](#hallazgos-durante-la-migración)) |
| **Pendiente** | `GradientIcon.jsx` | Dibuja `<Icon>` solo cuando no recibe `children`. TypeScript no acepta un componente que puede no existir sin cambiar código (una comprobación antes de `<Icon>`), y la regla de la fase 5 es solo anotar |
| **No migrar** | `e2e/mock-supabase/*.mjs`, `scripts/*.mjs`, `eslint.config.js`, `vitest.config.mjs`, `next.config.mjs` | Scripts de Node y configuración: corren fuera del bundle, y en ESM funcionan tal cual |
| **No migrar** | Tests `.test.js`/`.test.jsx` existentes, también los que se dividen | Cambiarles la extensión no agrega nada, y pasarlos a TS obligaría a cambiar sus datos de prueba con casts: se mueven tal cual. Los tests nuevos van en `.test.ts` (Vitest ya los incluye) |

## Plan de migración

Fases con la numeración del brief:

| Fase | Contenido | Por qué en este orden |
|---|---|---|
| 0 | Baseline (arriba) | Referencia para detectar regresiones |
| 1 | Esta auditoría, `dependency-map.mjs`, `architecture.test.js` | Las reglas existen antes de mover nada |
| 2 y 3 | Estructura y módulos compartidos: `types/`, `domain/`, `lib/supabase/`, `theme` en TS, `components/{ui,charts,forms,providers}`, `contexts/` | Son las hojas del grafo: todo lo demás depende de ellas |
| 4 | Features, una por commit: `categories` → `transactions` → `accounts` → `budgets` → `goals` → `investments`, `debts`, `subscriptions` → `import-export` → `auth` → `settings` → `dashboard`. Después, del shell salen `useToast`, `useSessionGuard`, `useTransactionModal`, `AppHeader` y `MainNav`, y por último lo que es igual entre Gastos e Ingresos: `TransactionList` y `matchesCalendar` (`useTxFilters` no se hizo: ver [Hallazgos](#hallazgos-durante-la-migración)) | Cada feature se mueve cuando ya se movió lo que usa; `dashboard` compone todo y va al final |
| 5 | Migración a TS de la UI compartida, los hooks, `AddTransactionModal` y `CalendarFilter` | Sobre código ya ubicado, para no mover y tipar a la vez |
| 6 | Capa de datos: tabla de piezas de `DataContext`, `features/*/data`, `useTableCrud`, `DataContext.tsx` (pasa a TS aquí), `types/database.ts`, `authApi` | Con las features en su lugar, cada una recibe sus mappers y consultas |
| 7 | Índice de secciones en `schema.sql` | Solo comentarios: se comprueba con el archivo sin comentarios y con `pg_dump` |
| 8 | Limpieza: imports entre áreas con `@/`, código muerto, nombres | Al final, cuando nadie usa los caminos viejos |
| 9 | Validación y documentación | Checklist de aceptación |

**Reglas de trabajo:**
- **Commits que mueven:** solo mueven (`git mv` + imports). Los que extraen lógica van aparte.
- **Cada commit deja verdes** lint, typecheck y `npm test`.
- **Cada fase cierra con** build, e2e dos veces y las capturas.
- **Al partir `data/index.ts` y `data/helpers.ts`,** cada import se reescribe hacia el módulo que define la función: no quedan re-exports intermedios.
- **Push después de cada feature**, y los tests unitarios nunca en paralelo con los e2e (comparten CPU y los de componentes pasan de los 5 s).

## Piezas de `DataContext` (antes de la fase 6)

`contexts/DataContext.jsx` (589 líneas) es la única puerta a la base de datos. Antes de dividirlo, cada pieza con su destino:

| Pieza | Qué hace | Destino |
|---|---|---|
| `mapRow`, `currencyColumns` y el objeto de fila de una transacción (repetido en `addTx`, `addTxs` y `updateTx`) | Fila de `transactions` ↔ transacción de la app (fecha, moneda, cuenta, papelera) | `features/transactions/data/transactions.ts`: `transactionFromRow`, `transactionToRow`, `TRASH_DAYS`, `IMPORT_CHUNK` |
| `addTx`, `addTxs` (lotes de 500), `updateTx`, `deleteTx` (a la papelera), `restoreTx`, `purgeTx`, `emptyTrash` | Mutaciones de transacciones; mantienen `txs` ordenado por fecha y `trash` al día | `features/transactions/data/useTransactionMutations.ts` |
| Mapeo de `budgets` en `load()`, `setEditBudgets` (upsert por `user_id,categoria`), `deleteBudgetCat` | Presupuestos como `{ categoria: monto }` más `{ categoria: periodo }` | `features/budgets/data/budgets.ts` y `useBudgetMutations.ts` |
| `map*` / `*ToRow` de `goals`, `accounts`, `transfers`, `investments`, `debts`, `subscriptions`, `custom_categories` (con `optionalColumns: ["icon"]`) | Fila ↔ objeto de la app | `features/<feature>/data/<tabla>.ts`, que exporta `{ table, fromRow, toRow, optionalColumns? }` |
| `useTableCrud` | Guardar (insert o update) y borrar en una tabla 1:1 con una lista del estado; reintento sin columnas opcionales ante `PGRST204` | `contexts/useTableCrud.ts`, tipado con esa descripción de tabla |
| `deleteAccount` | Borra la cuenta y refleja el `ON DELETE SET NULL` en transacciones, papelera y transferencias | Se queda en `DataContext` (toca tres listas del estado) |
| Estado (13 `useState`), `requireUserId`, suscripción a auth, `load()` (purga de la papelera y 10 consultas), errores (`reportError`, `loadError`) | Carga una vez por usuario; espera el segundo paso de la 2FA; limpia todo al cerrar sesión | Se queda en `DataContext.tsx`, con las mismas consultas, el mismo orden y los mismos filtros |
| `flagAnomalies(txs)`, `accountBalance` | Derivados: anomalías y saldo de hoy de cada cuenta | Se quedan (ya viven en `transactions/domain` y `accounts/domain`) |

**Qué lo protege:** `DataContext.test.jsx` (15 tests) registra cada llamada encadenada al cliente y **no se toca**. Los e2e con sesión prueban lo mismo contra el Supabase simulado.

## Hallazgos durante la migración

Cosas que el código hace hoy y que la reorganización **no cambia**, porque cambiarlas sería un cambio funcional o visual.

**Decisión (01-10):** las dos se corrigen en un **PR aparte, después del refactor**, con capturas antes y después de las pantallas que cambian.

**1. Gastos e Ingresos no filtran igual.**
- **Gastos:** con un día o mes del calendario elegido, la lista muestra todos los gastos de esa fecha y **no aplica la categoría elegida** en los chips. Sin calendario, sí la aplica.
- **Ingresos:** aplica la categoría siempre, con o sin calendario.
- **Consecuencia:** no se creó `useTxFilters`, porque un solo hook obliga a elegir una de las dos reglas. Se extrajo solo lo que es igual: `matchesCalendar` (`transactions/domain/calendarFilter.ts`, con test) y la lista (`TransactionList`).
- **Decisión:** Gastos pasa a filtrar como Ingresos (la categoría se aplica con o sin calendario). Con las dos reglas iguales, el PR aparte crea `useTxFilters` para ambas pestañas.

**2. MUI 9 ya no lee varias props.**
- **Qué pasa:** desde MUI 9 estas props dejaron de existir. React las pasa al HTML como atributos desconocidos, el navegador no las usa y no tienen efecto. Se comprobó renderizando cada caso con `react-dom/server`.

  | Prop | Dónde | Cuántas | Efecto hoy |
  |---|---|---|---|
  | `fontWeight` (y las demás props de sistema) | `Typography` | 96 en 23 archivos | El texto queda con el peso de su variante: `<p font-weight="700">` no pone negrita |
  | `inputProps` | `TextField` | 9 | **No se aplican** `maxLength: 60` en 5 nombres (metas, cuentas, deudas, inversiones, suscripciones) ni `min: 0` en 4 montos |
  | `primaryTypographyProps`, `secondaryTypographyProps` | `ListItemText` | 11 | El texto principal y el secundario quedan sin su estilo propio |
  | `alignItems` | `Grid` | 3 | Dos son `stretch`, que ya es el valor por defecto; uno es `center`, en `HealthSummaryCard` |

- **Lo que sí funciona:**
  - **`Select`** sigue leyendo `inputProps` (el `aria-label` de `ManageBudgetsDialog`);
  - **`slotProps={{ htmlInput }}`**, la forma de MUI 9, ya se usa en ese mismo diálogo.
- **Consecuencia:**
  - el aspecto actual (y la referencia de las capturas) es **sin** esos estilos;
  - esos componentes no pasan a TS sin tocar la prop: los tipos de MUI 9 la rechazan. Por eso `EmptyState` y `TransactionList` siguen en `.jsx`.
- **Decisión:** el PR aparte las pasa a `slotProps` y `sx`, agrega una regla de lint contra ellas y después pasa a TS esos dos componentes.

## Base de datos

**Qué tiene `supabase/schema.sql`, en dos partes transaccionales:**
- **Parte 1:** tablas, columnas agregadas después, restricciones, claves foráneas entre tablas, índices y triggers de `updated_at`, más la función `set_updated_at()`.
- **Parte 2:**
  - claves foráneas a `auth.users` y RLS;
  - la función `mfa_satisfied()` (`SECURITY DEFINER`), con sus permisos;
  - las políticas `RESTRICTIVE` de la 2FA.

**Decisión: se mantiene en un solo archivo.**
- **Se ejecuta de una vez** en el SQL Editor.
- **Cada parte es atómica:** partirla en archivos que se ejecutan por separado perdería la transacción de la parte 1.
- **El Supabase simulado** lee ese mismo archivo.
- **Separarlo en carpetas** obligaría a mantener dos representaciones del mismo esquema.

**Lo único que cambia:** un índice de secciones al principio del archivo, para ubicar tablas, funciones, triggers y políticas, y encabezados uniformes. Ninguna sentencia se toca, y se comprueba con `pg_dump --schema-only` antes y después.
- **`supabase/seed/reset.sql`:** se queda como está.
- **`supabase/config.toml`:** es la configuración del CLI local, y también se queda.

## Resultado

Refactor terminado el 01-10-2026 en el PR #11. Ninguna fase cambió el comportamiento ni el aspecto de la app, ni el esquema (las reglas, el esquema, la autenticación, la 2FA, el CSP y RLS quedan igual).

### Chequeos

| Chequeo | Baseline `be3d3ef` | Final |
|---|---|---|
| `npm run lint` | PASS | PASS |
| `npm run typecheck` | PASS | PASS |
| `npm test` (unitarios y componentes) | 211 | **230** PASS (+3 de arquitectura, +9 de esquema, +3 del callback, +3 de `useToast`, +2 de `matchesCalendar`; −1 de `fmtDate`, código muerto) |
| `npm run build` | PASS | PASS |
| e2e (Playwright, Supabase simulado) | 36/36 | **36/36**, y 72/72 con `--repeat-each 2` |
| Capturas contra `be3d3ef` | — | **138 capturas, 0 píxeles distintos** al cerrar las fases 2/3, 4, 5 y 6, y en la corrida final después de la fase 8 (5 pestañas, diálogos, auth, Perfil y Ajustes; claro/oscuro, es/en, escritorio/390 px) |
| Mapa de dependencias | 10 violaciones, 0 ciclos | **0 violaciones, 0 ciclos, 0 exports sin uso, 0 archivos huérfanos** |
| `supabase/schema.sql` | — | solo comentarios: sin ellos es idéntico, y `pg_dump --schema-only` en Postgres 16 también |

Las capturas, los e2e (una vez y repetidos) y el build se corrieron al cerrar cada fase (2/3, 4, 5 y 6) y otra vez al final, con el mismo resultado: build en verde, 36/36, 72/72 y 0 píxeles distintos. Lint, typecheck y `npm test` corrieron en cada commit.

### Mapa de dependencias (después)

Cada fila es una carpeta y lo que importa de las demás (sin tests). Supabase (`@supabase/*`, `lib/supabase`) solo aparece en `features/*/data`, `contexts`, `app/auth` y `proxy`:

<details>
<summary>Ver el mapa (46 áreas)</summary>

| Área | Importa |
|---|---|
| `app` | `components`, `features/auth/components`, `features/dashboard/components`, `lib` |
| `app/auth` | `lib/supabase` |
| `components` | `contexts`, `i18n`, `lib`, `theme` |
| `contexts` | `@supabase/supabase-js`, `domain`, `features/accounts/data`, `features/accounts/domain`, `features/auth/domain`, `features/budgets/data`, `features/categories/data`, `features/debts/data`, `features/goals/data`, `features/investments/data`, `features/subscriptions/data`, `features/transactions/data`, `features/transactions/domain`, `hooks`, `i18n`, `lib`, `lib/supabase`, `theme`, `types` |
| `domain` | `i18n`, `types` |
| `features/accounts/components` | `components`, `contexts`, `domain`, `theme` |
| `features/accounts/data` | `types` |
| `features/accounts/domain` | `types` |
| `features/auth/components` | `contexts`, `features/auth/data`, `features/auth/domain`, `lib`, `theme` |
| `features/auth/data` | `@supabase/supabase-js`, `lib/supabase` |
| `features/auth/domain` | — |
| `features/auth/hooks` | `components`, `contexts`, `features/auth/data` |
| `features/budgets/components` | `components`, `contexts`, `domain`, `features/budgets/domain`, `features/transactions/domain`, `theme` |
| `features/budgets/data` | `@supabase/supabase-js`, `types` |
| `features/budgets/domain` | `domain`, `types` |
| `features/budgets/hooks` | `components`, `contexts`, `features/budgets/domain`, `theme` |
| `features/categories/components` | `components`, `contexts`, `theme` |
| `features/categories/data` | `types` |
| `features/dashboard/components` | `components`, `contexts`, `domain`, `features/accounts/components`, `features/auth/components`, `features/auth/hooks`, `features/budgets/components`, `features/budgets/hooks`, `features/dashboard/domain`, `features/dashboard/hooks`, `features/debts/components`, `features/goals/components`, `features/investments/components`, `features/settings/components`, `features/subscriptions/components`, `features/transactions/components`, `features/transactions/domain`, `theme` |
| `features/dashboard/domain` | `domain`, `i18n`, `types` |
| `features/dashboard/hooks` | — |
| `features/debts/components` | `components`, `contexts`, `domain`, `theme` |
| `features/debts/data` | `types` |
| `features/goals/components` | `components`, `contexts`, `domain`, `features/goals/domain`, `theme` |
| `features/goals/data` | `types` |
| `features/goals/domain` | — |
| `features/import-export/components` | `contexts`, `domain`, `features/import-export/domain`, `theme` |
| `features/import-export/domain` | `domain`, `types` |
| `features/investments/components` | `components`, `contexts`, `domain`, `theme` |
| `features/investments/data` | `types` |
| `features/settings/components` | `contexts`, `domain`, `features/auth/components`, `features/auth/data`, `features/categories/components`, `features/import-export/components`, `features/import-export/domain`, `features/transactions/components`, `theme` |
| `features/subscriptions/components` | `components`, `contexts`, `domain`, `theme` |
| `features/subscriptions/data` | `types` |
| `features/transactions/components` | `components`, `contexts`, `domain`, `features/budgets/domain`, `features/transactions/data`, `features/transactions/domain`, `features/transactions/hooks`, `theme`, `types` |
| `features/transactions/data` | `@supabase/supabase-js`, `types` |
| `features/transactions/domain` | `domain`, `types` |
| `features/transactions/hooks` | `components`, `contexts`, `types` |
| `hooks` | — |
| `i18n` | — |
| `lib` | `domain` |
| `lib/supabase` | `@supabase/ssr` |
| `proxy` | `@supabase/ssr`, `features/auth/domain` |
| `theme` | `domain`, `types` |
| `types` | — |

</details>

### Qué se movió y qué no

- **Funcionalidades:** las 12 viven en `src/features/<f>/{components,hooks,domain,data}`.
- **Carpetas por tecnología eliminadas:**
  - `src/data/` (repartida en `domain/` y en el `domain/` de cada funcionalidad);
  - `src/app/components/`, `src/context/` y `src/types.ts`.
- **Shell:** `DashboardStudio` pasó de 366 a ~90 líneas.
- **`DataContext`:** pasó de 589 líneas en JS a ~260 en TS. Su mapeo y sus escrituras están en `features/*/data`.
- **Supabase en la UI:** ninguno; la UI usa `authApi` y `useData()`.
- **TypeScript:** la lógica, los tipos, los contextos, los hooks, la capa de datos y la UI compartida.
- **Siguen en `.jsx`, con su motivo:**
  - las pantallas y tarjetas;
  - `GradientIcon`, `EmptyState` y `TransactionList` (ver [Migración JS → TS](#migración-js--ts)).
- **Pendientes (fuera del refactor):**
  - los dos [hallazgos](#hallazgos-durante-la-migración), en un PR aparte;
  - la T16 (estilos);
  - `allowJs`.

### Diferencias con el árbol de referencia del brief (y por qué)

El brief proponía un árbol "de referencia, no una orden rígida". Donde el resultado es distinto, el motivo sale de las dependencias reales:

| Propuesta | Resultado | Por qué |
|---|---|---|
| `features/<f>/{services,repositories,calculations,validations,types,tests}` | `features/<f>/{components,hooks,domain,data}` | **`domain/`** reúne cálculos, validaciones y reglas (todo función pura con test). **`data/`** reúne consultas, mappers y escrituras. Sin una capa `services/` ni `repositories/` por entidad: 7 tablas se guardan igual, y una descripción de tabla (`TableSpec`) con `useTableCrud` lo resuelve sin una clase por tabla. El único "servicio" es `authApi`, porque es la frontera con Supabase Auth |
| `features/<f>/tests/` | tests junto al módulo (`budgets.test.js` al lado de `budgets.ts`) | Una sola estrategia, la que el repo ya usaba; Vitest los encuentra por patrón |
| `types/{domain,database,common}/` con un archivo por entidad | `types/domain.ts` y `types/database.ts` | `domain.ts` tiene ~100 líneas y lo usan todas las funcionalidades: un archivo responde "¿dónde están los tipos?". Las filas de la base van aparte. Los tipos propios de un módulo (p. ej. `CalendarSelection`, `TxInput`) viven con él |
| `supabase/{migrations,functions,triggers,policies}/` | un solo `schema.sql`, con índice de secciones | Decisión del usuario: cada parte es una transacción atómica, el SQL Editor lo ejecuta de una vez y el simulado lee ese mismo archivo ([Base de datos](#base-de-datos)) |
| `src/styles/` | `app/globals.css` (sin mover), tema en `theme/`, `sx` junto a cada componente | `globals.css` es del layout raíz de Next. Separar los estilos del código es la T16, que sigue pendiente, y se cruza con el [hallazgo 2](#hallazgos-durante-la-migración) |
| `features/reports/` | no existe | La app no tiene una pantalla de reportes: las estadísticas son el Resumen (`dashboard`) y las exportaciones (`import-export`) |
| `components/layout/` (Header, Navigation) | `AppHeader` y `MainNav` en `features/dashboard/components` | Solo los usa el shell de la app; las pantallas de auth tienen su propio marco (`AuthCard`). Si otra página los necesita, pasan a `components/` (no importan funcionalidades) |
| `lib/{security,rates,utilities}/` | `lib/supabase/` y archivos sueltos (`rates.ts`, `reportError.ts`, `featureFlags.ts`) | Un archivo por tema; la seguridad de sesión es de `auth` (`useSessionGuard`, `proxy.ts`) |

### Criterio de aceptación (punto 41)

- [x] **La estructura representa los dominios de la app:** una carpeta por funcionalidad, con el nombre de la pantalla o la tabla que maneja.
- [x] **Las responsabilidades están separadas:** cuatro capas (UI, estado, dominio, datos) que `architecture.test.js` comprueba.
- [x] **Las dependencias son comprensibles:** el mapa de arriba, sin ciclos, y la convención de imports aplicada por test.
- [x] **No hay imports rotos:** `dependency-map.mjs` falla con un import sin resolver, y el typecheck y el build pasan.
- [x] **No hay archivos huérfanos:** 0 archivos sin importar (aparte de las entradas de Next) y 0 exports sin uso.
- [ ] **No hay duplicaciones importantes:** parcial. La lista de Gastos e Ingresos ya es una sola (`TransactionList`). Los filtros siguen duplicados porque no hacen lo mismo ([hallazgo 1](#hallazgos-durante-la-migración)); se unifican en el PR aparte.
- [x] **El JavaScript restante está justificado:** tabla de [Migración JS → TS](#migración-js--ts).
- [x] **TypeScript es el lenguaje principal de forma progresiva:** todo lo nuevo nace en TS, y cada migración se comprobó con el JS emitido.
- [x] **Los componentes no acceden a Supabase sin necesidad:** 0 violaciones; la regla está en `npm test`.
- [x] **La lógica de negocio se prueba por separado:** todo `domain/` es puro y tiene tests.
- [x] **Supabase sigue funcionando:** mismas consultas, en el mismo orden y con los mismos filtros (`DataContext.test.jsx` sin tocar), y los e2e contra el Supabase simulado. Falta la prueba manual en el preview de Vercel, contra el proyecto real.
- [x] **PostgreSQL sigue funcionando:** el esquema solo cambió en comentarios; `pg_dump` idéntico.
- [x] **RLS sigue funcionando:** las políticas son las mismas (`pg_dump`), y el simulado aplica RLS en los e2e.
- [x] **La 2FA sigue funcionando:** e2e de activar, pedir el código al entrar y desactivar; `authApi` solo pasa las llamadas.
- [x] **El CSP sigue funcionando:** e2e del nonce en scripts y estilos, del bloqueo y del reporte.
- [x] **La app conserva su comportamiento:** 138 capturas idénticas, 36 e2e y 230 unitarios.
- [x] **Los tests siguen funcionando:** ninguno se borró salvo el de `fmtDate`, que era código muerto. Los divididos se movieron sin cambiar.
- [x] **El build sigue funcionando.**
- [x] **La documentación coincide con el código:** PROJECT-STRUCTURE, ARCHITECTURE, DATABASE, TESTING, ICONS, README, CHANGELOG e INVESTIGACION están actualizados, y no hay enlaces rotos.
- [x] **Un desarrollador nuevo encuentra cada funcionalidad:** [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) dice dónde va cada cosa y cómo agregar una funcionalidad.
