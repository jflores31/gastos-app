# Testing

> Tres niveles: tests unitarios (Vitest, entorno `node`), tests de componentes (Vitest + jsdom + Testing Library) y tests end-to-end (Playwright contra el build de producción y un Supabase simulado). La CI (`.github/workflows/ci.yml`) corre los tres en cada PR y en cada push a `main`, junto con lint, typecheck y build.

## Stack

- **[Vitest](https://vitest.dev/)** para unitarios y componentes. Config en [`vitest.config.mjs`](../vitest.config.mjs):
  - `include: ["src/**/*.test.{js,jsx}"]`;
  - entorno `node` por defecto;
  - JSX con el runtime automático, como Next (`oxc.jsx.runtime`; desde Vitest 5 la opción `esbuild` se ignora).
- **jsdom + [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** para componentes. Cada archivo de componente pide jsdom con un comentario en la primera línea: `// @vitest-environment jsdom`.
- **[Playwright](https://playwright.dev/)** para end-to-end. Config en [`playwright.config.ts`](../playwright.config.ts) y tests en [`e2e/`](../e2e). Levanta dos servidores:
  - `next start` en el puerto 3100;
  - [`e2e/mock-supabase`](../e2e/mock-supabase) en el 54321, un Supabase simulado (ver abajo).

## Cómo correr

```bash
npm run test         # unitarios + componentes (vitest run)
npm run test:watch   # modo watch
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e npm run build
npm run test:e2e     # end-to-end: necesita ese build de producción
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

- Ningún test necesita un Supabase real.
- Para correr los tests end-to-end en otra máquina, instalar antes el navegador con `npx playwright install chromium` (la CI lo hace sola).
- **El build de los end-to-end debe apuntar al Supabase simulado.**
  - Next incrusta las variables `NEXT_PUBLIC_SUPABASE_*` al compilar, así que Playwright no puede cambiarlas después.
  - Las variables del comando tienen prioridad sobre `.env.local`: con ellas, el build no usa tu proyecto real.
  - Si faltan, las páginas de auth caen en el error global y fallan casi todos los tests. Si el build apunta a otro Supabase, fallan los tests con sesión.

## Qué está cubierto

### Unitarios y componentes: 211 tests en 22 archivos

| Archivo | Tests | Qué cubre |
|---|---|---|
| [`src/data/helpers.test.js`](../src/data/helpers.test.js) | 36 | [`helpers.ts`](../src/data/helpers.ts), el eslabón que tocan las pestañas (detalle abajo); incluye que los períodos sean días completos |
| [`src/data/currency.test.js`](../src/data/currency.test.js) | 21 | `toBase` / `fromBase`: PEN sin conversión, redondeo, que lo escrito sea lo que muestra `fmtMoney`, ida y vuelta en cada moneda, moneda desconocida, strings numéricos. `fmtMoney` usa el locale del idioma (no el del navegador) y redondea igual los negativos. **Tasas del día:** `setLiveRates` reemplaza las fijas (lo que falta o no es válido sigue fijo), `toBase` con la tasa de una transacción, `rateLabel` ("1 USD = S/3.85", "S/1 = 1,100 COP") y `fmtAmount` (un monto ya en su moneda) |
| [`src/data/fetchAllRows.test.js`](../src/data/fetchAllRows.test.js) | 5 | Paginación de más de 1000 filas: sin duplicados, total múltiplo exacto de la página, tabla vacía, `pageSize` propio, error → todo o nada |
| [`src/theme/categoryIcons.test.js`](../src/theme/categoryIcons.test.js) | 11 | Toda categoría tiene icono y no hay claves huérfanas. `iconByName` y `resolveCategoryMeta` con categorías nativas, repetidas (`REGALOS`), personalizadas, borradas y desconocidas |
| [`src/lib/reportError.test.js`](../src/lib/reportError.test.js) | 8 | Reporte de errores del navegador: recorte de campos, solo el pathname (sin query), sin repetidos, tope de 10, `fetch` si no hay `sendBeacon`, nunca lanza |
| [`src/app/api/client-error/route.test.js`](../src/app/api/client-error/route.test.js) | 4 | La ruta escribe una línea JSON y responde 204. Descarta campos desconocidos, 400 si el JSON es inválido, 413 si pasa de 8 KB |
| [`src/app/api/csp-report/route.test.js`](../src/app/api/csp-report/route.test.js) | 4 | **Reportes del CSP:** formato `report-uri` y de la Reporting API, URLs sin query ni hash, campos desconocidos descartados, máximo 10 por envío, 400 y 413 |
| [`src/app/api/rates/route.test.js`](../src/app/api/rates/route.test.js) | 8 | **Tasas del día:** del proveedor, solo las monedas de la app y con su fecha; `RATES_API_URL`; las fijas si el proveedor falla (error HTTP, respuesta de error, otra base, una tasa que falta o absurda, sin respuesta) |
| [`src/components/AddTransactionModal.test.jsx`](../src/components/AddTransactionModal.test.jsx) | 8 | **Moneda en el modal:** PEN tal cual; en USD guarda `100 / 0.27` con lo escrito y la tasa; en otra moneda que la de la app usa la tasa del día y muestra el equivalente; editar precarga la moneda y el monto de la transacción y conserva su tasa, salvo que cambie la moneda; el tope se valida en PEN. **Cuenta:** el selector aparece solo si hay cuentas, se guarda la elegida y al editar viene elegida (o "Sin cuenta") |
| [`src/components/goals/AccountsCard.test.jsx`](../src/components/goals/AccountsCard.test.jsx) | 5 | **Cuentas y transferencias:** cada cuenta muestra su saldo de hoy; editarla sin tocar el saldo conserva el guardado y su fecha, y escribir otro lo reemplaza con la fecha de ahora; transferir pide dos cuentas; la lista muestra las últimas, también con una cuenta borrada; el diálogo guarda el monto en PEN y no deja elegir la misma cuenta ni transferir sin monto |
| [`src/components/goals/SubscriptionsCard.test.jsx`](../src/components/goals/SubscriptionsCard.test.jsx) | 2 | **Suscripciones:** cada una muestra su categoría (sin categoría, la inicial); el nombre sugiere la categoría ("Spotify" → Streaming) y una elegida a mano no cambia |
| [`src/lib/mfa.test.js`](../src/lib/mfa.test.js) | 3 | **Verificación en dos pasos:** el nivel del token (`aal`, también con caracteres base64url), solo un TOTP verificado cuenta, y falta el segundo paso hasta que el token sea `aal2` |
| [`src/theme/IconPicker.test.jsx`](../src/theme/IconPicker.test.jsx) | 3 | Una opción por icono con su nombre traducido, marca la seleccionada, devuelve la clave, un glifo viejo no marca nada |
| [`src/i18n/messages.test.js`](../src/i18n/messages.test.js) | 6 | **Diccionario:** mismas claves, tipos y aridad en es/en; ningún texto vacío; ningún `lang === "es" ?` fuera de `src/i18n/`; nombres de iconos y paletas; plurales e interpolaciones |
| [`src/data/suggest.test.js`](../src/data/suggest.test.js) | 11 | **Categoría sugerida:** normalización (mayúsculas, tildes, espacios); historial (la más usada, empate → la más reciente, categorías propias, filtro por tipo, gana al catálogo); catálogo (concepto o nombre como palabras completas, gana la que coincide en más palabras, empate → nada) |
| [`src/data/import.test.js`](../src/data/import.test.js) | 27 | **Importar CSV:** RFC 4180 (comillas, saltos de línea, BOM, `;`), montos en varios formatos, fechas ISO y `DD/MM/AAAA` (e imposibles), columnas del export propio (con o sin las de moneda y cuenta) y de un banco, tipo por signo, categoría del archivo / sugerida / por defecto, líneas inválidas, **ida y vuelta con `transactionsToCsv`** (también la moneda, lo escrito, la tasa y la cuenta, que se reconoce por su nombre) y repetidas (una ya guardada absorbe una fila). Un archivo en otra moneda guarda lo escrito y la tasa del día, y reimportarlo con otra tasa sigue detectando las repetidas |
| [`src/data/budgets.test.js`](../src/data/budgets.test.js) | 5 | **Presupuestos por período:** `budgetFor` deja igual un presupuesto mensual y escala semanal/anual; `budgetAlerts` avisa al 80 % y al 100 % en el período del propio presupuesto, la semana empieza el lunes y un año nuevo empieza de cero |
| [`src/data/upcoming.test.js`](../src/data/upcoming.test.js) | 6 | **Próximos pagos** con fechas fijas: pagado este mes → mes siguiente, pendiente → este mes, día pasado sin registrar → vencido, día 31 en febrero, el 1 del mes siguiente entra, suscripción unida a su recurrente, suscripciones fechadas por su último pago (mensual y anual) o sin fecha, ingresos nunca |
| [`src/data/export.test.js`](../src/data/export.test.js) | 7 | **Exportación:** celdas CSV (comillas RFC 4180, protección contra fórmulas), CSV con BOM, cabecera y filas ordenadas (con la moneda, lo escrito, la tasa y la cuenta de cada una), copia JSON con todas las tablas (también las transferencias), nombres de archivo |
| [`src/context/SettingsContext.test.jsx`](../src/context/SettingsContext.test.jsx) | 12 | `fmt()` por moneda e idioma, **modo privacidad** (enmascara, cambia con la moneda, se guarda) e **inactividad** (2 min por defecto, valor inválido → 2, un cambio en otra pestaña llega a esta). **Moneda de cada transacción:** `fmtTx` muestra exactamente lo escrito si la app está en esa moneda y `txOriginal` lo muestra aparte si no. **Tasas del día:** sin sesión no se piden; con sesión vienen de `/api/rates` y convierten los montos; si la ruta falla quedan las fijas |
| [`src/context/DataContext.test.jsx`](../src/context/DataContext.test.jsx) | 15 | **Carga y mutaciones con un Supabase simulado:** las 9 tablas, alta con el `user_id` de la sesión, edición por `id`, borrado por `id` + `user_id`, un error no cambia el estado, sin sesión lanza, reintento sin `icon` ante `PGRST204`, y `auth.getUser()` nunca se llama. `addTxs` inserta en lotes de 500 y, si uno falla, informa cuántas se guardaron. La moneda de cada transacción se lee de la fila y se envía en cada escritura; volver a PEN limpia lo escrito y la tasa. **Cuentas:** el saldo de hoy suma los movimientos posteriores a su saldo (no los anteriores); una transferencia y un ingreso asociado lo mueven; borrar una cuenta deja sus transacciones sin cuenta y sus transferencias sin ese lado, sin cambiar el saldo de la otra. **Verificación en dos pasos:** con un factor verificado y una sesión `aal1` no carga nada; con `MFA_CHALLENGE_VERIFIED` (`aal2`) carga. **Papelera:** la lista activa pide `deleted_at IS NULL` y la papelera el resto; borrar hace `update` de `deleted_at`, restaurar lo vuelve a `null`, eliminar definitivamente y vaciar son `delete` solo de filas en la papelera, y al cargar se borran las de más de 30 días |
| [`src/hooks/useLocalStorage.test.jsx`](../src/hooks/useLocalStorage.test.jsx) | 4 | **Hidratación del tema:** el primer render usa el valor por defecto aunque haya uno guardado. También cubre la persistencia, el updater funcional y un valor inválido |

Los tests de moneda, `useLocalStorage` y `DataContext` se verificaron **reintroduciendo el código anterior**: con él fallan 3 de 4, 1 de 4 y 4 de 8, respectivamente. En `DataContext`, los 4 que siguen pasando describen comportamiento que no cambió.

### End-to-end sin sesión: 12 tests en [`e2e/smoke.spec.ts`](../e2e/smoke.spec.ts)

- **Sin sesión:** `/` redirige a `/login`.
- **`/login` en tema claro y oscuro:**
  - el CSP trae nonce y `'strict-dynamic'`, sin `'unsafe-inline'`, y **todos** los `<script>` llevan el nonce;
  - `style-src-elem` lleva el mismo nonce, y **todos** los `<style>` también;
  - el formulario es interactivo (hidrató);
  - aplica el tema guardado;
  - la consola queda sin errores.
- **CSP de estilos:** un `<style>` inyectado sin nonce se bloquea (`style-src-elem`), no se aplica, y el navegador envía el reporte a `/api/csp-report` (204). La ruta también acepta el formato de la Reporting API.
- **Otras páginas de auth:** `/register`, `/forgot-password` y `/reset-password` cargan sin errores de consola.
- **Recursos:** las fuentes se cargan desde la app, sin peticiones a otros dominios, y el favicon existe y está enlazado.
- **App instalable:**
  - el manifest es público y sus iconos existen, con su tipo;
  - hay un icono `maskable`;
  - Chromium no reporta errores de instalabilidad (`Page.getInstallabilityErrors`).
- **Reporte de errores:**
  - un error no capturado llega a `/api/client-error` (204), sin la query de la URL;
  - la ruta rechaza cuerpos inválidos (400) o grandes (413);
  - las demás rutas `/api` siguen protegidas (307 → `/login`), incluida `/api/rates`.

### End-to-end con sesión: 24 tests en [`e2e/session.spec.ts`](../e2e/session.spec.ts)

Corren contra el Supabase simulado. Cada test usa su propio usuario, así que corren en paralelo sin pisarse. Todos fallan si la consola registra una violación del CSP (`afterEach`).

- **Login:** con credenciales inválidas muestra el error y no entra.
- **Todas las pantallas sin errores de consola:**
  - las 5 pestañas con los datos del usuario;
  - los ajustes;
  - el tema oscuro;
  - el cambio a inglés.
- **Gasto de punta a punta:** el alta, la edición y el borrado llegan a la base con el `user_id` de la sesión. El borrado deja `deleted_at` en la fila y "Deshacer" lo revierte.
- **Papelera:** restaurar, eliminar definitivamente (con confirmación) y vaciar, comprobando la base simulada después de cada paso.
- **Categoría sugerida:** "netflix" completa Streaming (historial) y "gasolina grifo" Gasolina (catálogo); un concepto sin coincidencias la quita; una categoría elegida a mano no cambia; la transacción se guarda con la categoría sugerida.
- **Moneda y tasas del día:**
  - en USD, Ajustes muestra las tasas del día del proveedor simulado ("1 USD = S/3.85"), con el enlace de atribución, y los montos se convierten con ellas; un gasto de $26 se guarda como S/100 con `moneda`, `monto_original` y `tasa`;
  - con la app en soles, un gasto en euros muestra el equivalente en el formulario y ambos montos en la lista, y se edita en euros con la tasa con que se guardó.
- **Iconos:** una meta nueva y una categoría personalizada se guardan con su icono.
- **Cuentas y transferencias:**
  - con una sola cuenta no se puede transferir;
  - un gasto de S/500 asociado a BCP baja su saldo a S/2,000;
  - una transferencia de S/300 a Efectivo se guarda con su nota y mueve los dos saldos;
  - escribir un saldo lo guarda con la fecha de ahora;
  - borrar BCP deja el gasto sin cuenta y la transferencia sin origen, en la base, y Efectivo conserva su saldo.
- **Metas:** cuentas, inversiones, deudas y suscripciones se crean, editan y borran. Incluye una suscripción con categoría propia.
- **Presupuestos:**
  - editar el límite desde la tarjeta;
  - en "Gestionar", agregar uno nativo y uno de categoría propia, editar y cancelar, y borrar con confirmación.
- **Presupuestos semanales:** el período se guarda en la base, la franja de Presupuesto lista los que están al límite, y un gasto que cruza el 80 % y luego el 100 % muestra su aviso.
- **Próximos pagos:** los 4 gastos mensuales del seed, Netflix una sola vez (la suscripción se une al recurrente) y el promedio de MERCADO; "Registrar NETFLIX" abre el formulario con categoría, concepto y monto, y guarda.
- **Verificación en dos pasos:**
  - se activa con el QR: un código incorrecto se rechaza, y el correcto, calculado con la clave que muestra la pantalla, deja el factor verificado;
  - al volver a entrar, después de la contraseña se pide el código, e ir a `/` vuelve a `/login?mfa=1`;
  - con el código correcto entra y los datos cargan;
  - desactivarla pide confirmación y borra el factor.
- **Perfil:** el nombre y las favoritas se guardan en `user_metadata`; una categoría propia se edita (nombre, color, tipo) y se borra con confirmación.
- **Modo privacidad:** no queda ningún "S/<dígitos>" en las 5 pestañas, y se recuerda al recargar.
- **Tus datos:** descarga el CSV y el JSON y compara su contenido con la base simulada.
- **Importar CSV:**
  - el CSV exportado vuelve con todas sus filas como "ya registradas" (el botón queda en "Importar 0") y solo entran si se marca la casilla;
  - un CSV de banco (`;`, `DD/MM/AAAA`, `1.234,50`) propone las columnas, informa la línea con fecha inválida y guarda con la categoría sugerida o la de por defecto.
- **Diálogos:** la etiqueta flotante del primer campo queda dentro del contenido (antes MUI la recortaba).
- **Inactividad:** con el reloj simulado de Playwright (`page.clock`), eligiendo 5 minutos en Ajustes: a los 4:20 sigue la sesión, a los 4:35 aparece el aviso y a los 5:05 vuelve a `/login`.
- **Sesión:**
  - con el token vencido, el proxy la renueva y la respuesta sale con `Cache-Control: no-store` (probado con el manifest, una ruta estática que sin esto se podía cachear con la cookie nueva);
  - una pestaña nueva no cierra la sesión (el bug de la 0.0.1), y **Salir** sí;
  - al reabrir el navegador sin otra pestaña abierta, pide iniciar sesión de nuevo.

### El Supabase simulado ([`e2e/mock-supabase/`](../e2e/mock-supabase))

Un servidor Node sin dependencias que imita lo que la app usa de Supabase:

- **Auth:**
  - login con contraseña (`wrong-password` simula credenciales inválidas);
  - refresh, `getUser`, `updateUser`, logout, registro y recuperación.
  - Los tokens son JWT sin firma válida: el servidor simulado solo lee el `sub` y la expiración.
- **PostgREST:**
  - `select` con filtros (`eq`, `in`, `gt`…), `order` y paginación;
  - `insert`, `update`, `delete` y `upsert`;
  - `.single()`.
- **Esquema real:** las tablas y columnas salen de `supabase/schema.sql`, el mismo archivo que instala la base de Supabase. Escribir una columna que no existe devuelve `PGRST204`, como en producción. También se aplican `NOT NULL` y los `CHECK` (`col IN (…)` y `col > 0`, en la tabla o con `ADD CONSTRAINT`, en una o varias líneas).
- **RLS:** cada usuario solo ve y escribe sus filas. Insertar con otro `user_id` devuelve `42501`.
- **Verificación en dos pasos (MFA TOTP):** `/factors` para activar, desafiar, verificar y borrar, con códigos TOTP reales (RFC 6238, en `totp.mjs`, que también usan los tests). El JWT lleva `aal` (`aal1` con la contraseña, `aal2` con el código) y un refresh lo conserva. Con un factor verificado y `aal1`, PostgREST no devuelve filas ni deja escribir, como las políticas `RESTRICTIVE`.
- **Claves foráneas con `ON DELETE SET NULL`** (las de las cuentas): una referencia a una fila que no existe, o que no es del usuario, devuelve `23503`; al borrar la fila referenciada, la columna queda en `null`.
- **Datos iniciales ([`seed.mjs`](../e2e/mock-supabase/seed.mjs)):** cuatro meses de movimientos (con una anomalía este mes) y una fila en cada tabla. Las fechas son relativas a hoy.
- **Para los tests:** `GET /__mock/db?email=…` devuelve las filas de ese usuario, para comprobar qué se guardó.
- **Tasas de cambio:** `GET /__mock/rates` responde como open.er-api.com, con USD a 0.26 (la fija es 0.27) para distinguir unas de otras. Playwright apunta `RATES_API_URL` ahí.

Lo que **no** cubre: las políticas RLS reales, los triggers y el comportamiento exacto de Postgres. Para eso sigue haciendo falta probar en el preview de Vercel.

### Detalle de `helpers.test.js`

| Función | Casos clave |
|---|---|
| `flagAnomalies` | frontera exacta `3×` (no marca en `=`, sí en `>`); mediana par/impar; mínimo `4` muestras; solo `EGRESO`; aislamiento por categoría; inmutabilidad |
| `healthScore` | alcanza `100`; suelo `0`; tope del bono de ahorro (`+40`); penalti por anomalía (`-5` c/u); tope del penalti por gasto (`-15`) |
| `healthLabel` / `healthTone` | umbrales `75` / `50`, bilingüe |
| `linearRegressionSlope` | pendiente conocida; serie plana = `0`; `n<2` = `0` |
| `insightsList` | textos en es y en con los datos del período; sin anomalías no agrega ese aviso |
| `netWorthOf` | activos = saldos positivos + inversiones; deuda = saldos negativos + préstamos; sin datos = `0`; usa el saldo de hoy (`current`) si está calculado |
| `accountBalance` | suma ingresos y resta gastos de la cuenta posteriores a su saldo; lo anterior o igual a esa fecha ya está incluido; transferencias (resta del origen, suma al destino, un lado borrado); sin fecha cuenta todo; redondeo a 2 decimales |
| `recurringList` | agrupa por `categoria|concepto`; filtra `>= 3` meses; promedia día/monto; ignora `INGRESO` |
| `filterByPeriod` | `all`, `month`, `year` con `offset` |
| `periodLabel` / `monthCount` / `daysCount` / `fmtDate` | mapeos triviales |

## Cómo añadir tests

1. **Unitario:** crear `src/<area>/<algo>.test.js`; el patrón `src/**/*.test.{js,jsx}` lo recoge solo.
2. **Componente:**
   - crear `…/<Componente>.test.jsx` con `// @vitest-environment jsdom` en la primera línea;
   - reemplazar los contextos con `vi.mock` (ver `AddTransactionModal.test.jsx`, que simula `useSettings`, `useData` y `useSupabaseUser`);
   - llamar a `cleanup` en `afterEach`.
3. **Transacciones:** usar un factory mínimo con la forma de `mapRow` (ver `tx()` en `helpers.test.js`).
4. **Código que habla con Supabase:**
   - para una función suelta, pasar un objeto con la forma del query builder (ver `fakeTable()` en `fetchAllRows.test.js`);
   - para `DataContext`, usar el cliente simulado de `DataContext.test.jsx`: un builder encadenable y `await`-able que registra las llamadas, más `fake.respond(tabla, llamadas)` para decidir qué devuelve cada consulta.
5. **Textos nuevos:** van en `src/i18n/ui.ts`, en los dos idiomas. TypeScript (`en: typeof es`) y `messages.test.js` fallan si falta uno o si se escribe `lang === "es" ? …` en un componente.
6. **End-to-end:** agregar casos en `e2e/`.
   - Para flujos con sesión, usar `login(page, uniqueEmail(info))` y `mockDb(request, email)` de [`e2e/helpers.ts`](../e2e/helpers.ts).
   - Una columna nueva en la base va en `supabase/schema.sql`, en su `CREATE TABLE` y como `ADD COLUMN IF NOT EXISTS` para las bases que ya existen: el Supabase simulado la lee de ahí.

## Gotchas

- **`getToday()` devuelve `new Date()`** (hora real). Los tests de `filterByPeriod` deben **anclarse al "ahora"**, no a fechas fijas.
- **El outlier cuenta como muestra en `flagAnomalies`:** cambia la paridad del conteo al calcular la mediana.
- **Frontera estricta:** `flagAnomalies` marca solo si `valor > mediana × 3`. Probar ambos lados.
- **`fmtMoney` formatea con el locale que recibe** (`es-PE` por defecto; la app pasa `t.common.locale`), no con el del navegador, así el resultado es el mismo en cualquier máquina.
- **El redondeo de moneda acumula error:** la ida y vuelta puede desviarse hasta `0.005 × tasa + 0.005`.
- **Importar iconos MUI en `node` funciona** (no se renderizan): `categoryIcons.test.js` compara referencias sin jsdom.
- **Playwright no expone el cuerpo de `sendBeacon`:**
  - el test end-to-end del reporte envuelve `navigator.sendBeacon` con `addInitScript` para guardar el payload;
  - deja salir el beacon real, así también se verifica la respuesta de la ruta.
- **React en producción no avisa de desajustes de hidratación en atributos** (solo en desarrollo). El test end-to-end del tema oscuro pasaría aunque volviera el bug. Esa regresión la cubre `useLocalStorage.test.jsx`.
- **Los desajustes de hidratación pueden ser intermitentes.**
  - `/reset-password` fallaba 1 de cada 20 cargas con React #418: emotion escribía un `<style>` por componente en el `<body>`, y los que no alcanzaba a mover al `<head>` antes de hidratar sobraban.
  - `AppRouterCacheProvider` lo corrigió (ver `layout.tsx`).
  - Para detectar este tipo de fallo: `npx playwright test --repeat-each 50 --workers 4`.
- **Detrás de un diálogo de MUI, la página es `aria-hidden`:**
  - `getByRole` no encuentra nada del fondo mientras el diálogo está abierto, así que un `toHaveCount(0)` pasaría antes de tiempo;
  - después de borrar desde un diálogo, esperar a que se cierre (`expect(dialog).toHaveCount(0)`) y consultar la base con `expect.poll`.
- **Refactors de UI:** para comprobar que no cambió nada, comparar capturas de pantalla antes y después. `PNG` de `playwright-core/lib/utilsBundle` permite contar píxeles distintos sin dependencias extra.
- **Los emails de prueba llevan un sufijo aleatorio:** en local, el Supabase simulado sigue vivo entre corridas (`reuseExistingServer`). Sin el sufijo, un test encontraría los datos de la corrida anterior.
- **Navegador local:** este repo fija `@playwright/test` en `1.56.1`. Si `PLAYWRIGHT_BROWSERS_PATH` apunta a navegadores ya instalados de esa versión, no hace falta `playwright install`.

## Pendiente / próximos candidatos

- **Contra un Supabase real:** RLS, triggers y el esquema. Necesitan un proyecto de pruebas, con sus credenciales como secretos de la CI.
- **Más componentes:** pestañas con datos simulados (p. ej. que "Resumen del periodo" use tonos válidos).
