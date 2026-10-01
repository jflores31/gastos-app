# Investigación: proyectos similares a gastos-app

> Fecha: 2026-09-26 · Versión analizada de gastos-app: `0.0.1`.
> Las cifras de estrellas y licencias se tomaron de las páginas públicas de cada repositorio en esa fecha.

## Resumen

- **Mercado open source:** lo lideran apps maduras y autoalojadas: Actual Budget (29.1k ★), Firefly III (24.7k ★), Sure (10k ★, continuación de Maybe Finance), Wallos (8.6k ★) y ezBookkeeping (5.7k ★). Casi todas resuelven lo que a gastos-app todavía le falta:
  - moneda por transacción con tasas actualizadas;
  - importar y exportar datos;
  - recurrentes programados;
  - reglas de categorización.
- **Mismo stack (Next.js + Supabase):** son proyectos chicos (0–7 ★), útiles como referencia técnica, no de producto. Uno de ellos agrega los totales en la base de datos en vez de traer todas las filas al cliente, que es el siguiente paso natural tras la paginación de la `0.0.1`.
- **Iconografía:** el enfoque de gastos-app (icono + color por categoría, elegible en las personalizadas) coincide con lo que hacen Cashew, ezBookkeeping y los trackers del mismo stack. Material You con color de acento, como Cashew, sigue siendo una buena base; no hace falta cambiar de librería.
- **Mejoras técnicas:** además de las ideas de producto, la revisión del código deja 15 mejoras técnicas priorizadas (sección [Mejoras técnicas](#mejoras-técnicas)). Las más urgentes son índices en la DB, no perder los errores en producción y tests end-to-end.
- **Licencias:** gastos-app era MIT cuando se hizo esta investigación y hoy es GPL-3.0. Firefly III y Sure (AGPL-3.0), Wallos y Cashew (GPL-3.0) sirven **solo como fuente de ideas**, no se copia su código. Actual Budget, ezBookkeeping, BudgetBee y los proyectos del mismo stack son MIT.

## Estado de la hoja de ruta

Al 1 de octubre de 2026, en el código:

- **Ideas de producto:** 13 de 14 hechas (✅ en [la tabla](#ideas-priorizadas-para-gastos-app)). Falta la **4, totales en Postgres**, a propósito: con los índices, la consulta de un usuario con 200.000 transacciones tarda ~1,4 ms en la base, y lo que queda es el costo de llevar las filas al navegador. Conviene retomarla si la carga se vuelve lenta con datos reales.
- **Mejoras técnicas:** T1 a T15 hechas ([tabla](#mejoras-técnicas)); **T16, separar los estilos del código, queda pendiente**. Las hechas tienen dos restos:
  - T3: faltan tests contra un Supabase real (RLS, triggers y el esquema); los end-to-end usan uno simulado;
  - T8: las pantallas y tarjetas siguen en JSX; el resto de `src/` es TypeScript estricto, incluidos `DataContext`, la capa de datos, los hooks y la UI compartida (detalle en [ARCHITECTURE-AUDIT.md](ARCHITECTURE-AUDIT.md#migración-js--ts)).
- **Refactor arquitectónico (01-10):** el código está organizado por funcionalidades y capas ([PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md)). Dejó dos hallazgos para un PR aparte: MUI 9 ya no lee varias props (`fontWeight`, `inputProps` de `TextField`…), y Gastos ignora la categoría con un filtro de calendario ([detalle](ARCHITECTURE-AUDIT.md#hallazgos-durante-la-migración)).
- **Límites conocidos:** presupuestos, metas, cuentas, inversiones, deudas y suscripciones guardan solo el monto en PEN, así que con la app en otra moneda se ven con la tasa de hoy. Detalle en [ARCHITECTURE.md](ARCHITECTURE.md#datos-y-supabase).
- **Próximos pasos de la investigación:** el 3 (fuente de tasas) está resuelto con open.er-api.com; el 1, el 2 y el 4 siguen abiertos.

## Alcance y método

**Preguntas guía**
1. ¿Cómo manejan varias monedas: moneda por transacción, tasas en vivo o fijas?
2. ¿Qué modelo de presupuesto usan (por sobres o mensual) y cómo tratan los recurrentes?
3. ¿Cómo representan las categorías (icono + color, iconos elegibles)?
4. ¿Permiten importar y exportar, funcionan como app instalable u offline, tienen transferencias entre cuentas?
5. En proyectos con Next.js + Supabase: ¿cómo resuelven la carga de datos, RLS, tests y CI?

**Fuentes**
- Topics de GitHub (`personal-finance`, `budgeting`, `budget-tracker`).
- Búsqueda web.
- README de cada repositorio.
- Artículos comparativos de apps comerciales en español.

**Criterios de la matriz:** tipo y licencia, stack, estrellas, moneda, presupuesto, categorías e iconos, importar/exportar y plataforma.

## Matriz comparativa

### Open source maduros

| Proyecto | Licencia | Stack | ★ | Moneda | Presupuesto / recurrentes | Categorías / iconos | Importar / exportar | Plataforma |
|---|---|---|---|---|---|---|---|---|
| [Actual Budget](https://github.com/actualbudget/actual) | MIT | Node / TypeScript | 29.1k | Multi-moneda | Por sobres (envelope) | Categorías agrupadas | Importa de otras apps | Local-first con sincronización; escritorio, Docker |
| [Firefly III](https://github.com/firefly-iii/firefly-iii) | AGPL-3.0 | PHP / Laravel | 24.7k | Cualquier moneda | Presupuestos, recurrentes, reglas automáticas, "piggy banks" (metas), doble partida | Categorías y etiquetas | Varias herramientas de importación, API REST | Autoalojado, 2FA |
| [Sure](https://github.com/we-promise/sure) (ex Maybe) | AGPL-3.0 | Ruby on Rails, PostgreSQL | 10k | Multi-moneda | Cuentas, patrimonio neto | — | Varios importadores | Web, macOS, móvil, API; asistente con IA opcional |
| [Wallos](https://github.com/ellite/Wallos) | GPL-3.0 | PHP, SQLite | 8.6k | Multi-moneda con tasas vía Fixer API | Solo suscripciones: calendario de pagos | **Busca el logo** de cada suscripción | — | Autoalojado; notificaciones por email, Telegram, webhooks |
| [ezBookkeeping](https://github.com/mayswind/ezbookkeeping) | MIT | Go + Vue / TypeScript | 5.7k | Multi-moneda con **varias fuentes de tasas y actualización automática** | — | Categorías de 2 niveles personalizables | CSV, Excel, OFX, QFX, QIF, IIF, Camt, MT940, GnuCash, Firefly, Beancount | App instalable (PWA), 2FA, mapa, adjuntos |
| [Cashew](https://github.com/jameskokoska/Cashew) | GPL-3.0 | Flutter, Drift, Firebase | 4.7k | Multi-moneda con conversión en tiempo real | Presupuestos con períodos flexibles; próximos, suscripciones, deudas; metas | Material You con color de acento | CSV / Google Sheets; backup en Drive | iOS, Android, Web (PWA), Windows |
| [BudgetBee](https://github.com/budgetbee/budgetbee) | MIT | Laravel + React / Vite | 645 | Multi-moneda | Presupuestos, gastos próximos o recurrentes, patrimonio | Categorías personalizables | Excel / JSON; API REST | Docker, varios usuarios (aún inestable, pre-1.0) |
| [expense-budget-tracker](https://github.com/kirill-markin/expense-budget-tracker) | MIT | Node, PostgreSQL | 31 | **Moneda por transacción** con reportes multi-moneda | Transferencias, saldos por cuenta y moneda | — | — | Docker / AWS; API para agentes de IA |

### Mismo stack: Next.js + Supabase

| Proyecto | Licencia | Stack | ★ | Qué aporta |
|---|---|---|---|---|
| [GeorgeDanicico/expense-tracker](https://github.com/GeorgeDanicico/expense-tracker) | sin licencia declarada | Next 16, React 19, Chakra 3, Supabase | 0 | Agregación **en la base de datos** ("historical rows are not transferred"); RLS; sesiones SSR con cookies; auth verificada en cada Server Action |
| [Usmansagemode/daily-expenses-tracker](https://github.com/Usmansagemode/daily-expenses-tracker) | MIT | Next 15, Supabase, shadcn/ui, Recharts, TanStack | 7 | Importar/exportar CSV; lectura de extractos PDF con IA; miembros y etiquetas; deudas, ahorros y préstamos con saldo |
| [JagadishPS-Z/expense-tracker](https://github.com/JagadishPS-Z/expense-tracker) | MIT | Next 14 + FastAPI, Supabase | 0 | Categorías del sistema + personalizadas **con icono y color**; presupuestos semanales, mensuales o anuales con alerta de exceso |
| [valiance-media-personal-finance-tracker](https://github.com/ciaranmci27/valiance-media-personal-finance-tracker) | MIT | Next 15, Supabase, Tailwind, Radix | 2 | **Modo privacidad** (oculta montos); exportar JSON/CSV; **papelera** para recuperar lo borrado |

### Apps comerciales (referencia de experiencia de uso)

| App | Lo destacable |
|---|---|
| Mobills | Muy usada en Latinoamérica; registro manual detallado con reportes sólidos |
| Fintonic | Importa movimientos de más de 1.500 bancos (España y Latinoamérica) y los categoriza automáticamente, con alertas |
| Monefy | Registro manual rapidísimo, simple y visual |
| Money Lover | Barra inferior de pestañas con iconos (presupuestos, cuentas, estadísticas) |

## Hallazgos por pregunta

**1. Moneda.** Los proyectos maduros guardan la **moneda de cada transacción** y convierten con **tasas actualizadas**.
- Ejemplos: ezBookkeeping (varias fuentes automáticas), Cashew (tiempo real), Wallos (Fixer API), expense-budget-tracker (moneda por transacción).
- gastos-app guarda todo en PEN con tasas fijas en `CURRENCIES` (`src/domain/money.ts`). La `0.0.1` corrigió que los montos se guardaran sin convertir, pero quedan dos límites:
  - las tasas no se actualizan;
  - redondear a 2 decimales en PEN introduce un error de hasta ~5 unidades en COP (medio céntimo × 1100).
- ⚠ Al elegir la fuente de tasas, verificar que cubra **PEN, COP, ARS y CLP**: las tasas de referencia del BCE (base de varias APIs gratuitas) no publican esas monedas.
- ✅ **Hecho (ideas 2 y 3):** cada transacción guarda su moneda, lo escrito y la tasa de ese día, y los montos se muestran con las tasas del día de open.er-api.com, que sí publica las 8 monedas. Las fijas quedan de respaldo. El redondeo en PEN sigue, pero lo escrito ya no se pierde.

**2. Presupuesto y recurrentes.**
- Actual usa sobres; el resto, presupuestos por categoría y período.
- Firefly, Cashew y BudgetBee **programan** recurrentes y próximos pagos. gastos-app solo los **detecta** a posteriori (`recurringList` en `src/features/budgets/domain/recurring.ts`), y las suscripciones viven aparte en `GoalsTab`.
- Firefly suma **reglas** que categorizan automáticamente.

**3. Categorías e iconos.**
- Icono + color por categoría es el estándar (JagadishPS, ezBookkeeping, Cashew).
- Wallos va más allá: busca el **logo** real de cada suscripción.
- gastos-app ya tiene iconos para todas las categorías y un selector para metas y categorías personalizadas (`src/theme/categoryIcons.js`, `IconPicker.jsx`).

**4. Importar/exportar, app instalable, transferencias.**
- **Importar y exportar** es casi universal: CSV como mínimo, OFX/QIF en los más completos. gastos-app no tiene ninguno de los dos.
- **App instalable/offline:** ezBookkeeping y Cashew la ofrecen.
- **Transferencias entre cuentas con saldo derivado:** Firefly (doble partida) y expense-budget-tracker. En gastos-app el saldo de `accounts` se edita a mano.
  - ✅ **Hecho (idea 12):** el saldo escrito vale desde una fecha y la app le suma las transacciones asociadas a la cuenta y las transferencias posteriores. Las transferencias van en su propia tabla, así no cuentan como ingreso ni gasto.

**5. Next.js + Supabase.** GeorgeDanicico agrega en la base de datos. gastos-app sigue trayendo todas las transacciones al cliente (`DataContext.load()`, ahora paginado con `fetchAllRows`) y calcula todo en JS. Con miles de filas conviene mover los totales a vistas o funciones RPC de Postgres.

## Ideas priorizadas para gastos-app

Impacto y esfuerzo en escala Alto / Medio / Bajo. "Inspirado en" indica de dónde sale la idea, no código a copiar.

| # | Idea | Impacto | Esfuerzo | Inspirado en | Dónde tocaría gastos-app |
|---|---|---|---|---|---|
| 1 | ✅ **Importar CSV** de movimientos, con mapeo de columnas (Perfil → Tus datos) | Alto | Medio | ezBookkeeping, Cashew, Usmansagemode | Nuevo `src/data/import/`; botón en `ExpensesTab` / `IncomeTab`; `addTx` en lote en `DataContext` |
| 2 | ✅ **Moneda por transacción** + tasa guardada al registrar (selector junto al monto; la lista muestra lo escrito) | Alto | Alto | expense-budget-tracker, ezBookkeeping | Columnas `moneda`, `monto_original` y `tasa` en `transactions` (`supabase/schema.sql`); `AddTransactionModal`; `fmtTx` / `txOriginal` en `SettingsContext`; export e importación CSV |
| 3 | ✅ **Tasas de cambio actualizadas** (una vez al día, con caché): open.er-api.com desde el servidor, caché de 12 h | Medio | Medio | ezBookkeeping, Wallos | Route handler `src/app/api/rates/route.ts` + `src/lib/rates.ts`; `CURRENCIES.rate` pasa a ser el respaldo; el CSP no cambia (el navegador solo habla con `/api/rates`) |
| 4 | **Totales agregados en Postgres** (vistas o RPC por mes y categoría) | Alto | Medio | GeorgeDanicico | una migración nueva (vistas / `rpc`); `DataContext`; `txByMonth` y `txByCategory` en `src/features/transactions/domain/aggregations.ts` |
| 5 | ✅ **Recurrentes programados** (próximos pagos, generar la transacción): tarjeta "Próximos pagos" con "Registrar" | Alto | Medio | Firefly, Cashew, BudgetBee | Unificar `subscriptions` y `recurringList`; nueva sección en `BudgetTab` |
| 6 | ✅ **Exportar CSV/JSON** | Medio | Bajo | valiance, Usmansagemode | Botón en `SettingsPanel`; serializar `txs` de `DataContext` |
| 7 | ✅ **Modo privacidad** (ocultar montos) | Medio | Bajo | valiance | Opción en `SettingsContext`; `fmtMoney` devuelve `••••` |
| 8 | ✅ **Reglas de auto-categorización** por concepto (`suggestCategory`: historial y catálogo) | Medio | Medio | Firefly, Fintonic | Reutilizar `CATEGORIES[*].concepts`; sugerir categoría en `AddTransactionModal` |
| 9 | ✅ **App instalable** (manifest + iconos) | Medio | Bajo | ezBookkeeping, Cashew | `src/app/manifest.ts`; reutilizar `public/favicon.svg`; revisar el CSP |
| 10 | ✅ **Presupuestos por período** (semanal/anual) y alerta al 80 % / 100 % | Medio | Medio | JagadishPS, Cashew | `budgets` (columna `periodo`); `BudgetTab`; `monthCount` en `helpers.ts` |
| 11 | ✅ **Papelera** (borrado lógico con `deleted_at`) y "deshacer" | Medio | Medio | valiance | una migración nueva; los `delete*` de `DataContext` pasan a `update` |
| 12 | ✅ **Transferencias entre cuentas** y saldo calculado (saldo a una fecha + movimientos posteriores) | Alto | Alto | Firefly, expense-budget-tracker | `accounts.balance_at`, `transactions.cuenta_id` y tabla `transfers` (`supabase/schema.sql`), en vez de un tipo `TRANSFER` que los totales contarían como gasto; `AccountsCard` y `TransferDialog` en `GoalsTab` |
| 13 | ✅ **2FA** con el MFA TOTP de Supabase Auth (Perfil → Verificación en dos pasos; el código se pide al entrar y la base exige `aal2`) | Medio | Medio | Firefly, ezBookkeeping | `TwoFactorSection` en Perfil; `/login`; `proxy.ts`; políticas `mfa aal2` en `supabase/schema.sql` |
| 14 | ✅ **Logos de suscripciones**, resuelto con el icono y el color de la categoría (sin servicios externos: no se filtra qué suscripciones hay) y la categoría sugerida por el nombre | Bajo | Medio | Wallos | `SubscriptionsCard`; el CSP no cambia |

**Orden sugerido** (máximo valor por esfuerzo): 6 → 7 → 9 → 1 → 4 → 5 → 3 → 2.

## Mejoras técnicas

Revisión del código de la versión `0.0.1`, complementaria a las ideas de producto. Prioridad Alta / Media / Baja.

| # | Prioridad | Área | Mejora | Por qué | Dónde |
|---|---|---|---|---|---|
| T1 | ✅ Hecho en 0.0.1 | Base de datos | **Índices** en `user_id` de las 8 tablas (en `transactions`, compuesto `(user_id, fecha)`), y políticas RLS con `(select auth.uid())` en vez de `auth.uid()` | Cada query filtra por `auth.uid() = user_id` vía RLS y no hay índices aparte de las PK: con muchos usuarios, cada carga recorre la tabla entera. Envolver `auth.uid()` en `select` hace que Postgres lo evalúe una vez por consulta y no por fila (recomendación de Supabase) | `supabase/schema.sql` |
| T2 | ✅ Hecho en 0.0.1 (`reportError` → `/api/client-error` → logs de Vercel; Sentry sigue como opción) | Observabilidad | Conservar `console.error` en producción (`removeConsole: { exclude: ["error"] }`) y sumar reporte de errores (p. ej. Sentry) | `removeConsole: true` borra **todos** los `console.*` en producción, incluidos los `console.error` de `DataContext`: hoy un fallo en producción no deja rastro | `next.config.mjs`, `DataContext.jsx`, `error.tsx` |
| T3 | ✅ Hecho: tests de componentes, 10 e2e de la parte pública y 7 con sesión contra un Supabase simulado (`e2e/mock-supabase`). Falta probar contra un Supabase real (RLS, migraciones) | Tests | Tests **end-to-end** con Playwright contra un proyecto de Supabase de pruebas, y tests de componentes (jsdom + Testing Library) | Solo hay tests unitarios. Los bugs corregidos en `0.0.1` (moneda, sesión entre pestañas, hidratación, colores del resumen) estaban en componentes, fuera del alcance de esos tests | nuevo `e2e/`, `vitest.config.mjs`, CI |
| T4 | ✅ Hecho (usuario de la sesión en `DataContext`) | Rendimiento | Dejar de llamar a `supabase.auth.getUser()` en cada mutación: usar el usuario de la sesión, o `DEFAULT auth.uid()` en `user_id` e insertar sin él | Hay 17 llamadas en `DataContext`, y cada una es una petición de red al servidor de Auth antes de la escritura real | `DataContext.jsx`, `schema.sql` |
| T5 | ✅ Hecho (`useTableCrud` + tests de `DataContext`) | Código | Factory genérica para el CRUD (`makeCrud(tabla, mapRow, toRow)`) | Las 17 funciones CRUD de `DataContext` (~300 líneas) repiten el mismo patrón: obtener el usuario, escribir, lanzar el error y actualizar el estado | `DataContext.jsx` |
| T6 | ✅ Hecho: `src/i18n/` (diccionario es/en, textos con datos como funciones) y un test que impide volver a los ternarios | i18n | Mover los textos a `I18N` (o a una librería como `next-intl`) | Hay 339 ternarios `lang === "es" ? … : …` repartidos en los componentes, aunque `I18N` ya existe en `data/index.js`. `IconPicker` usa claves en inglés como `aria-label` | `src/components/*`, `src/data/index.js`, `IconPicker.jsx` |
| T7 | ✅ Hecho: `goals/`, `settings/` y `budget/` (de 816, 500 y 488 líneas a 55, 77 y 56) | Código | Dividir los componentes grandes | `GoalsTab.jsx` tiene 821 líneas (5 secciones + 5 diálogos), `SettingsPanel.jsx` 500 y `BudgetTab.jsx` 488 | `src/components/` |
| T8 | ✅ Hecho: `strict`, `typescript-eslint`, y en TypeScript la lógica, `src/i18n`, `src/lib`, los contextos (también `DataContext`, en el refactor de 01-10), los hooks, la capa de datos y la UI compartida, con tipos en `src/types/` (`domain.ts` y `database.ts`). Siguen en JSX las pantallas y tarjetas | Tipado | Activar `strict` de forma gradual, añadir `typescript-eslint` y migrar `data/` y `context/` a TypeScript | `tsconfig.json` tiene `strict: false`, los componentes son JSX sin tipos y ESLint solo revisa `.js`/`.jsx` | `tsconfig.json`, `eslint.config.js` |
| T9 | ✅ Hecho: `CHECK` de `tipo` y `valor`, `updated_at` con trigger y `anomaly` borrada | Base de datos | Restricciones e higiene del esquema: `CHECK (tipo IN ('INGRESO','EGRESO'))` y `CHECK (valor > 0)` en `transactions`, quitar o usar la columna `anomaly` (siempre `false`), añadir `updated_at` | Solo `custom_categories` y `accounts` validan valores en la DB; el resto confía en el cliente | `schema.sql` |
| T10 | ✅ Hecho: primero como migraciones fechadas en `supabase/migrations/`; después se consolidaron en un solo `supabase/schema.sql`, idempotente, que instala o pone al día cualquier versión y separa lo que depende de Supabase (probado en Postgres 16) | Base de datos | Migraciones fechadas e idempotentes (`DROP POLICY IF EXISTS`) | `schema.sql` no lleva timestamp en el nombre, así que el CLI de Supabase no lo aplica como migración, y sus `CREATE POLICY` fallan si se ejecuta dos veces | `supabase/schema.sql` |
| T11 | ✅ Hecho (`src/lib/featureFlags.ts`) | Auth | Condicionar a `OAUTH_ENABLED` (o eliminar) `LoginModal` | Muestra los botones de Google/GitHub aunque OAuth está desactivado (login y registro sí respetan el flag). Solo se abre sin usuario, un caso que el proxy ya redirige a `/login` | `LoginModal.jsx`, `DashboardStudio.jsx` |
| T12 | ✅ Hecho | UI | Terminar la migración a iconos | Quedan 3 puntos de color en lugar del icono de la categoría: los dos del selector de categoría de suscripciones (`GoalsTab`) y `CategoryBars` (`OverviewTab`) | `GoalsTab.jsx`, `OverviewTab.jsx` |
| T13 | ✅ Hecho: `fmtMoney(v, moneda, compacto, locale)` con `t.common.locale`, e inactividad de 2, 5, 15 o 30 min en Ajustes | UX | Formatear montos con el idioma elegido (`es-PE` / `en-US`) en vez del locale del navegador; hacer configurable el cierre por inactividad | `fmtMoney` usa `toLocaleString(undefined)`. Los 2 minutos de inactividad son agresivos para una app de consulta | `data/index.ts`, `DashboardStudio.jsx`, `SettingsContext.tsx` |
| T14 | ✅ Hecho: `style-src-elem` con nonce (emotion lo recibe del layout), `style-src-attr 'unsafe-inline'` y `report-uri /api/csp-report` | Seguridad | Quitar `'unsafe-inline'` de `style-src` (nonce en el cache de emotion) y reportar violaciones del CSP | Detalle en [SECURITY-CSP.md](SECURITY-CSP.md#próximas-mejoras-posibles) | `proxy.ts`, `Providers.tsx` |
| T15 | ✅ Hecho: React 19, `@supabase/ssr` 0.12 (el proxy manda los headers `no-store` que ahora recibe `setAll`), `vitest` 5; `npm audit` en 0 | Dependencias | `@supabase/ssr` 0.5 → 0.12 (revisar la API de cookies), `vitest` 3 → 5 (su aviso de seguridad solo afecta a dev), alinear React 18 con `@types/react` 19 o subir a React 19 | Versiones atrasadas o desalineadas | `package.json` |
| T16 | ⏳ Pendiente (prioridad media) | Código / estilos | **Separar los estilos del código.** Los estilos repetidos (colores, radios, sombras, tarjetas, listas) van al tema de MUI (`styleOverrides` y variantes en `materialTheme.ts`); los propios de cada pantalla, a un archivo junto al componente (p. ej. `OverviewTab.styles.ts`, como ya hace `authStyles.ts`) o a CSS Modules, que el CSP ya permite porque se sirven desde `'self'`. Se verifica con capturas antes y después, píxel a píxel, como en T7 | Hoy los estilos están mezclados con la lógica y el marcado: 766 `sx={…}` en 46 archivos (`OverviewTab` 88, `ExpensesTab` 62, `IncomeTab` 61) y 22 `style={{…}}` en 9. Los valores se repiten entre pantallas y cuesta cambiar el diseño en un solo lugar. Quitar los `style={{…}}` también acerca el CSP a no necesitar `'unsafe-inline'` en `style-src-attr` ([SECURITY-CSP.md](SECURITY-CSP.md#próximas-mejoras-posibles)) | `src/features/*/components`, `src/components/*`, `src/theme/materialTheme.ts`, `src/features/auth/components/authStyles.ts`. Relacionado: las props de estilo que MUI 9 ya no lee ([hallazgo](ARCHITECTURE-AUDIT.md#hallazgos-durante-la-migración)) |

**Orden sugerido:** T1 a T15 están hechas; queda T16.

## Próximos pasos de la investigación

1. **Instalar y probar** en Docker Actual Budget y ezBookkeeping para evaluar de primera mano la importación y la moneda por transacción, las ideas 1 y 2.
2. **Leer el esquema** de `JagadishPS-Z/expense-tracker` (`001_init.sql`, MIT) para comparar el modelo de categorías con icono.
3. ✅ **Elegir la fuente de tasas** comprobando que cubra PEN, COP, ARS y CLP, con límites y atribución (idea 3): open.er-api.com, con la atribución en Ajustes.
4. **Revisar en Mobbin/Dribbble** patrones de registro rápido (estilo Monefy) para el FAB "+".

## Fuentes

- [actualbudget/actual](https://github.com/actualbudget/actual)
- [firefly-iii/firefly-iii](https://github.com/firefly-iii/firefly-iii)
- [we-promise/sure](https://github.com/we-promise/sure)
- [maybe-finance/maybe](https://github.com/maybe-finance/maybe)
- [ellite/Wallos](https://github.com/ellite/Wallos)
- [mayswind/ezbookkeeping](https://github.com/mayswind/ezbookkeeping)
- [jameskokoska/Cashew](https://github.com/jameskokoska/Cashew)
- [budgetbee/budgetbee](https://github.com/budgetbee/budgetbee)
- [kirill-markin/expense-budget-tracker](https://github.com/kirill-markin/expense-budget-tracker)
- [GeorgeDanicico/expense-tracker](https://github.com/GeorgeDanicico/expense-tracker)
- [Usmansagemode/daily-expenses-tracker](https://github.com/Usmansagemode/daily-expenses-tracker)
- [JagadishPS-Z/expense-tracker](https://github.com/JagadishPS-Z/expense-tracker)
- [ciaranmci27/valiance-media-personal-finance-tracker](https://github.com/ciaranmci27/valiance-media-personal-finance-tracker)
- [GitHub topic: budgeting](https://github.com/topics/budgeting)
- [GitHub topic: personal-finance](https://github.com/topics/personal-finance?l=javascript&o=desc&s=forks)
- [Mejor App Finanzas Personales 2026 — ahorrainteligent.me](https://ahorrainteligent.me/comparativas/mejores-apps-finanzas-personales/)
- [Mejores apps de finanzas personales en México — Compartamos Banco](https://www.compartamos.com.mx/compartamos/blog/cuida-tu-cartera/mejor-app-finanzas-personales-control-gastos)
- [Las mejores apps para controlar tus finanzas en 2026 — Inversimply](https://inversimply.com/las-mejores-apps-para-controlar-tus-finanzas/)
