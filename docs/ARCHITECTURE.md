# Arquitectura

🌐 **Español** · [English](ARCHITECTURE.en.md)

Cómo está organizado el código, cómo fluyen los datos y las decisiones técnicas que conviene conocer antes de tocarlo.

## Estructura del proyecto

```
.
├── .github/workflows/ci.yml        # CI: lint, typecheck, tests, build y e2e en cada PR y push a main
├── e2e/                            # Tests end-to-end (Playwright) + playwright.config.ts
│   └── mock-supabase/              # Supabase simulado (Auth + PostgREST) para los tests con sesión
├── .env.example                    # Variables de entorno (copiar a .env.local)
├── CHANGELOG.md                    # Historial de cambios
├── LICENSE                         # GPL-3.0
├── README.md · README.en.md        # Presentación, inicio rápido e índice de la documentación
├── docs/                           # Documentación (índice en el README); los .en.md son la versión en inglés
│   ├── FEATURES.md                 # Características, por pantalla
│   ├── ARCHITECTURE.md             # Este archivo: estructura, flujo de datos y notas técnicas
│   ├── PROJECT-STRUCTURE.md        # Dónde va cada cosa en src/, capas y reglas que comprueba npm test
│   ├── ARCHITECTURE-AUDIT.md       # Auditoría y plan del refactor por funcionalidades, con el resultado
│   ├── DATABASE.md                 # Esquema, cómo instalarlo y cómo migrar a otro sistema
│   ├── SECURITY.md                 # Medidas de seguridad
│   ├── SECURITY-CSP.md             # CSP con nonce por request
│   ├── TESTING.md                  # Tests unitarios, de componentes y end-to-end
│   ├── DEPLOYMENT.md               # Despliegue, PRs, versiones y solución de problemas
│   ├── ICONS.md                    # Sistema de iconos y mapa categoría → icono
│   └── INVESTIGACION.md            # Proyectos similares, hoja de ruta y su estado
├── public/                         # favicon.svg e iconos de la app instalable
├── scripts/
│   ├── generate-icons.mjs          # Genera los iconos de public/icons/
│   └── dependency-map.mjs          # Grafo de imports, reglas de capas y exports sin uso (lo usa architecture.test.js)
├── src/                            # (detalle abajo)
└── supabase/
    ├── config.toml                 # Configuración del proyecto de Supabase (CLI local)
    ├── schema.sql                  # Esquema completo: instala o pone al día cualquier versión (idempotente)
    └── seed/reset.sql              # Vacía las 9 tablas — destructivo
```

`src/` se organiza por funcionalidad (`features/`) y por capas. El árbol completo, las reglas que comprueba `npm test` y cómo agregar una funcionalidad están en [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md). En resumen:

```
src/
├── app/            # Solo rutas: layout, page, error, api/*, auth/callback y las 4 páginas de auth (entradas finas)
├── features/       # transactions, budgets, goals, accounts, investments, debts, subscriptions, categories,
│                   #   import-export, auth, settings, dashboard — cada una con components/ hooks/ domain/ data/
├── components/     # UI compartida: ui/, charts/, forms/, feedback/, providers/
├── contexts/       # DataContext (+ useTableCrud), SettingsContext, UserContext
├── domain/         # Reglas compartidas: money, period, health, netWorth, categories/
├── hooks/ · i18n/ · lib/ (supabase/, rates, reportError, featureFlags) · theme/ · types/ (domain, database)
└── proxy.ts        # Guard de auth + 2FA + CSP con nonce por request (Next.js 16)
```

## Flujo de datos: Supabase → pestañas

```
Supabase DB (9 tablas, RLS auth.uid() = user_id)
  └── DataProvider: load() — purga la papelera y hace 10 consultas en paralelo (contexts/DataContext.tsx)
        ├── fetchAllRows(transactions) → transactionFromRow() → flagAnomalies() → txs[]   (features/transactions/data)
        ├── goalFromRow / accountFromRow / transferFromRow / investmentFromRow / debtFromRow / subscriptionFromRow
        │                                                                     (features/<feature>/data)
        ├── budgetsFromRows() → editBudgets{} + budgetPeriods{}               (features/budgets/data)
        ├── accountBalance() → accounts[].current (saldo de hoy)              (features/accounts/domain)
        └── sin mapear → customCats[]
              │
              └── useData()  (tipado: DataValue)
                    ├── OverviewTab · ExpensesTab · IncomeTab · BudgetTab  (txs + editBudgets + customCats)
                    └── GoalsTab  (goals + accounts + transfers + investments + debts + subscriptions)

Escrituras: useTransactionMutations · useBudgetMutations · useTableCrud(<tabla>Table)  → lanzan si falla,
            y solo entonces no tocan el estado
Auth (login, registro, 2FA, cerrar sesión): features/auth/data/authApi.ts
Cada pestaña: filterByPeriod(txs, period) → reglas de features/*/domain y domain/ → components/charts
Nombre / color / icono de categoría: resolveCategoryMeta()  (theme/categoryIcons.ts)
Montos: guardados en PEN (+ moneda, lo escrito y la tasa de cada transacción) → fmtMoney(v, currency) al mostrar,
        con las tasas del día (/api/rates → setLiveRates); toBase()/fromBase() en formularios
```

## Módulos clave

| Módulo | Rol |
|---|---|
| `features/dashboard/components/DashboardStudio.tsx` | Shell de la app: compone `AppHeader`, `MainNav`, las 5 pestañas, el aviso y los diálogos; guarda la pestaña activa y el `period` compartido |
| `features/auth/hooks/useSessionGuard.ts` | Seguridad de sesión: inactividad con aviso, máximo de 8 h, navegador reabierto (`BroadcastChannel`) |
| `contexts/DataContext.tsx` | Estado de las 9 tablas, carga una vez por usuario y expone las escrituras; única puerta a los datos |
| `features/*/data/` | Fila ↔ objeto de cada tabla y sus escrituras; `authApi.ts` para Supabase Auth |
| `features/*/domain/` · `domain/` | Cálculos puros (períodos, salud financiera, anomalías, recurrentes, presupuestos, patrimonio, CSV); un bug aquí afecta a todas las pestañas, por eso tienen tests |
| `components/forms/useEntityDialog.ts` | Estado y handlers de los diálogos crear/editar/borrar (metas, cuentas, inversiones, deudas, suscripciones) |
| `theme/categoryIcons.ts` | Nombre, color e icono de cualquier categoría |
| `proxy.ts` | Guard de rutas + CSP con nonce por request |

**`createClient()`** se llama en cada operación (`authApi`, `DataContext`), pero `createBrowserClient` es un singleton: no abre conexiones nuevas.

> El README incluía métricas de un grafo generado con [graphify](https://github.com/ananddtyagi/cc-marketplace) sobre una versión anterior. Se quitaron porque ya no correspondían al código. El mapa de dependencias actual sale de `node scripts/dependency-map.mjs`.

## Notas técnicas

### Datos y Supabase

**Carga de datos:** `DataContext.load()` corre con el primer evento de `onAuthStateChange` que traiga `session.user` (`INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED` o `USER_UPDATED`) y se deduplica por `session.user.id`, así los refrescos periódicos del token no repiten las consultas de carga. No se llama al montar (eso duplicaba las queries). Si falla, se resetea el flag para reintentar con el siguiente evento. Esto elimina el bug de "hay que refrescar 2 veces", cuando un `INITIAL_SESSION` sin sesión utilizable no tenía reintento. Las queries dependen de RLS (`select("*")` sin `.eq("user_id")`).

**Más de 1000 transacciones:** PostgREST corta cada respuesta en `max_rows` (1000). `transactions` se pide con `fetchAllRows()` (`src/lib/supabase/fetchAllRows.ts`), que pagina con `.range()` ordenando por `fecha` + `id`. Es todo o nada: si una página falla, no se muestra un resultado parcial.

**Moneda:** los montos se guardan siempre en PEN. `fmtMoney(v, currency)` multiplica por la tasa al mostrar, y los formularios convierten con `toBase()` al guardar y `fromBase()` al precargar una edición (presupuestos, metas, cuentas, inversiones, deudas y suscripciones; las tasas % y los meses no se convierten). El tope de 10,000,000 se valida en PEN. Límite conocido: redondear a 2 decimales en PEN puede mover un monto en COP hasta unas 5 unidades.

- **Tasas del día:**
  - `src/lib/rates.ts` las pide a [open.er-api.com](https://open.er-api.com) (gratis, sin clave, se actualiza a diario) desde el servidor, con caché de 12 h;
  - el navegador solo habla con `/api/rates` (detrás del login), así que el CSP sigue en `'self'` y el proveedor no ve quién pregunta;
  - si el proveedor falla o responde algo raro (otra base, una tasa que falta, 0), se usan las fijas de `CURRENCIES`, igual que hasta que llegan: el render del servidor siempre usa las fijas;
  - `RATES_API_URL` apunta a otro proveedor con el mismo formato (los e2e usan el Supabase simulado);
  - el acceso gratuito sin clave pide atribución donde se muestran las tasas: Ajustes enlaza "Rates By Exchange Rate API" junto a la fecha.
- **Transacciones:** guardan también `moneda`, `monto_original` (lo escrito) y `tasa` (unidades de esa moneda por 1 PEN, la de ese día); en PEN, los dos últimos quedan en `null`. Así una transacción en la misma moneda que la app se muestra exactamente como se escribió (`fmtTx()`), y en otra, con lo escrito aparte (`txOriginal()`). Al importar un CSV, las repetidas se comparan por lo escrito, así reimportar un archivo en dólares otro día (con otra tasa) las sigue detectando.
- **Límites conocidos (con la app en otra moneda que PEN):**
  - los totales suman `valor` en PEN y lo convierten con la tasa de hoy, como Cashew: un total en dólares puede diferir unos centavos de la suma de lo escrito en cada fila si la tasa cambió desde entonces;
  - presupuestos, metas, cuentas, inversiones, deudas y suscripciones guardan solo el monto en PEN, así que en dólares se ven con la tasa de hoy: un presupuesto de $100 puede verse como $96 si el dólar subió. Guardar la moneda también en esas tablas sería otro cambio de esquema.

**Tipo de transacción derivado de la categoría (no del toggle):** en `AddTransactionModal`, el `tipo` (INGRESO/EGRESO) que se guarda es el de la **categoría seleccionada** (`categoria.type`). Las categorías personalizadas se muestran sin importar el toggle, y guardar el `tipo` del toggle hacía que un ingreso personalizado se registrara como gasto. El `onChange` del Autocomplete también sincroniza el toggle. Backfill de datos viejos: `UPDATE transactions t SET tipo = cc.tipo FROM custom_categories cc WHERE t.categoria = 'custom_' || cc.id::text AND t.tipo <> cc.tipo;`.

**Mutaciones con error explícito:**
- Todas las funciones CRUD de `DataContext` hacen `if (error) throw error` antes de tocar el estado local.
- **Usuario de la sesión:** usan el id del usuario de la sesión, guardado en un ref desde `onAuthStateChange` y leído con `requireUserId()`, en vez de llamar a `supabase.auth.getUser()` (una petición al servidor de Auth) antes de cada escritura. RLS sigue validando el JWT en el servidor.
- **Sin sesión:** `requireUserId()` lanza "No hay sesión activa", así que la UI muestra un error en vez de un "guardado" falso.
- **CRUD común:** metas, cuentas, inversiones, deudas, suscripciones y categorías personalizadas usan `useTableCrud()`, que hace update por `id` o insert, y borra por `id` + `user_id`. `optionalColumns` reintenta sin una columna nueva si la DB todavía no la tiene (`PGRST204`). Transacciones y presupuestos tienen funciones propias.
- **En los componentes:** los handlers usan `try/catch/finally` y muestran un toast de éxito o error; por eso `DashboardStudio` pasa `showToast` a las pestañas y a `AddTransactionModal`.

**Presupuestos:** `editBudgets` empieza en `{}` y se llena solo desde Supabase; `deleteBudgetCat(cat)` borra en la DB antes de actualizar el estado. Cada presupuesto guarda su período (`budgetPeriods`: semana, mes o año) y las vistas lo escalan al período que se ve con `budgetFor()`.

**Tipos numéricos:** los `map*` de `DataContext` convierten a `Number` los decimales que Supabase devuelve como string (p. ej. `remaining` y `original_months` de deudas).

**Datos sin mock:** todo sale de Supabase; no hay transacciones, metas, cuentas ni presupuestos de ejemplo en el código.

**Varias instancias del cliente Supabase:** los eventos de `onAuthStateChange` no se propagan entre instancias distintas. `LoginModal` usa `window.location.reload()` tras el login para que `DataContext` recargue.

**Error "JWT issued at future":** aparece cuando el reloj del dispositivo está adelantado respecto a Supabase (basta 1 minuto). Supabase rechaza el JWT y fallan todas las queries. Solución: sincronizar el reloj del sistema. El banner de error detecta este caso y muestra un mensaje accionable.

### Sesión y autenticación

**Seguridad de sesión:**
- `UserContext` escribe `gastos_session_alive` en `sessionStorage` al recibir `SIGNED_IN`; el navegador la borra al cerrarse y las recargas (F5) la conservan.
- Al montar, `DashboardStudio` la verifica. Si falta, pregunta por `BroadcastChannel("gastos-session")` si hay otra pestaña viva (espera unos 300 ms): si alguna responde, es una pestaña nueva con el navegador abierto y hereda la marca; si no, el navegador se reabrió y cierra sesión.
- Inactividad: 2 min por defecto (configurable en Ajustes: 2, 5, 15 o 30, en `gastos-idle-minutes`), con aviso 30 s antes. El valor se sincroniza entre pestañas con el evento `storage`, así una pestaña con el valor viejo no cierra la sesión antes de tiempo. `gastos_last_active` (localStorage, compartido entre pestañas) se actualiza con cada evento del usuario y se relee antes de avisar o cerrar, así una pestaña inactiva no cierra la sesión si estás activo en otra.
- Pestaña abierta más de 8 h: se revisa al recuperar visibilidad (`visibilitychange` y `pageshow` para bfcache).
- Los cierres automáticos usan `signOut({ scope: "local" })`, que no revoca las sesiones de otros dispositivos; el botón "Cerrar sesión" mantiene el alcance global. Todos borran `gastos_last_active` para no entrar en un bucle de logout en el siguiente login.

**OAuth (desactivado):** `src/app/auth/callback/route.ts` canjea el código PKCE y valida que `next` sea una ruta interna. Para activarlo: crear las apps OAuth en Google/GitHub, cargar client id/secret en Supabase → Auth → Providers, añadir `https://www.jeshu.cfd/auth/callback` a las redirect URLs y poner `OAUTH_ENABLED = true` en `src/lib/featureFlags.ts` (lo usan el login, el registro y `LoginModal`). ⚠ Antes, revisar la marca de sesión: el canje ocurre en el servidor, así que el cliente no recibe `SIGNED_IN` y no se escribiría `gastos_session_alive`.

**Supabase `redirectTo`:** `window.location.origin` puede devolver `https://www.jeshu.cfd` (con www), pero Supabase solo acepta `https://jeshu.cfd/**`. Aplicar `.replace(/^https:\/\/www\./, "https://")` antes de `redirectTo`.

**`proxy.ts` vs `middleware.ts`:** Next.js 16 usa la convención `proxy.ts`; `middleware.ts` está deprecado y produce warning en build.

**CSP:** se arma por request en `src/proxy.ts` (`buildCsp`) con nonce y `'strict-dynamic'`; `'unsafe-eval'` solo se agrega fuera de producción. Detalle en [SECURITY-CSP.md](SECURITY-CSP.md).

**Páginas de auth:**
- Todas usan `useTheme()` e `isDark`, con `darkField`/`cardSx` dentro del componente y `Blobs` recibiendo `{ isDark }`.
- `isDark` arranca en `false` y se aplica en un `useEffect`, para que el primer render coincida con el HTML del servidor (evita el desajuste de hidratación).
- Las llamadas a Supabase (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`) van en `try/catch/finally`, así el botón nunca queda en spinner.
- `AuthErrorAlert` detecta el enlace expirado en español e inglés (`"expiró"` / `"expired"`).

### Iconos y tema

**Sistema de iconos:**
- Los iconos de categoría salen de un solo mapa, `src/theme/categoryIcons.ts`.
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

### Idiomas (i18n)

- **Todos los textos viven en `src/i18n/`**, en español e inglés. Los componentes los toman como `t` de `useSettings()`: `t.save`, `t.goalsTab.newGoal`, `t.common.delete`.
- **Textos con datos:** son funciones, así el plural y el orden de las palabras quedan en el diccionario. Por ejemplo, `t.overviewTab.expenseRecords(n)` da "1 gasto" o "3 gastos", y `t.common.vsPreviousPeriod(period)` da "vs trimestre anterior".
- **Fuera de React** (p. ej. `healthLabel` en `domain/health.ts` e `insightsList` en `features/dashboard/domain/insights.ts`): `messagesFor(lang)`.
- **Nombres accesibles:** también se traducen los `aria-label`, los nombres de los 43 iconos del selector (`t.iconNames`) y de las paletas (`t.palettes`).
- **Regla:** no se escribe `lang === "es" ? … : …`. `messages.test.js` falla si aparece fuera de `src/i18n/`, o si falta una clave en un idioma.
- **Nombres de categorías:** siguen en `CATEGORIES` (`src/domain/categories/catalog.ts`), con `es` y `en` en cada una.

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
- **Diálogos:** MUI pone `padding-top: 0` al `DialogContent` que sigue a un `DialogTitle`, con un selector más específico que el `sx`. El padding se aplica con `"&&": { pt }`; sin eso, la etiqueta flotante del primer campo queda recortada.
- `not-found.tsx` es Client Component (usa `<Button component={Link}>`).
- El borrado de transacciones usa `try/catch/finally`.

**CalendarFilter (`features/transactions/components/CalendarFilter.tsx`):**
- **Vistas:** día (grid de 7 columnas con `alpha(mainColor, intensidad)`) y mes (grid 4×3).
- **Colores:** rojo para EGRESO y verde para INGRESO.
- **Interacción:** el click filtra y un segundo click limpia. Los chips Día/Mes tienen `aria-label` bilingüe.
