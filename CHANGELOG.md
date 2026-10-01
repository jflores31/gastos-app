# Historial de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado [SemVer](https://semver.org/lang/es/).
El proyecto reinició su numeración en `0.0.1`; el historial previo se descartó.

## [Unreleased]

### Cambiado
- **Estilos separados del código (T16)**, sin cambios de aspecto. Dónde va cada estilo: [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md#estilos).
  - **Tokens compartidos:** `src/theme/tokens.ts` reúne las sombras de tarjeta, la tarjeta con borde de color, la que se eleva al pasar el mouse, la columna de un diálogo, el interruptor Gasto / Ingreso y los colores de la barra del navegador.
  - **Un `*.styles.ts` por componente** (o por funcionalidad) con sus `sx` grandes y sus colores: auth, transacciones, Resumen, Presupuesto, Metas, Ajustes, categorías, importar y la UI compartida. Los acentos del selector salen de los del tema en lugar de repetirlos.
  - **Sin `style={{}}`:** los SVG de los gráficos usan clases o `sx`; los `Link` de auth y `global-error` usan CSS Modules.
  - **Regla de lint:** un color literal o un `style={{}}` en un componente es un error; `src/stylesLint.test.js` comprueba la regla.
  - **Verificación:** en cada fase, hasta 246 capturas (claro/oscuro, es/en, escritorio/390 px) sin diferencias contra `main`. El CSP sigue permitiendo atributos `style`, porque MUI los escribe en el HTML ([docs/SECURITY-CSP.md](docs/SECURITY-CSP.md#próximas-mejoras-posibles)).
- **Código organizado por funcionalidades y capas** (sin cambios de comportamiento ni de aspecto). Plan, hallazgos y resultado en [docs/ARCHITECTURE-AUDIT.md](docs/ARCHITECTURE-AUDIT.md); dónde va cada cosa en [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md).
  - **Funcionalidades:** `src/features/<funcionalidad>/{components,hooks,domain,data}` para transacciones, presupuestos, metas, cuentas, inversiones, deudas, suscripciones, categorías, importar/exportar, auth, ajustes y el shell (`dashboard`). `src/data/` y `src/app/components/` desaparecen.
  - **Compartido:** `components/` (ui, charts, forms, feedback, providers), `domain/` (dinero, períodos, salud, patrimonio, categorías), `lib/supabase/`, `types/`.
  - **Shell:** `DashboardStudio` pasó de 366 a ~90 líneas. La seguridad de sesión se movió a `useSessionGuard`, el aviso a `useToast`, y salieron también `useTransactionModal`, `AppHeader` y `MainNav`. Gastos e Ingresos comparten `TransactionList`.
  - **Datos:** `DataContext` (TypeScript) guarda el estado y hace la carga. Cada tabla tiene su mapeo y sus escrituras en `features/*/data`, y `types/database.ts` tipa las filas. Las pantallas de auth usan `authApi` y ya no importan Supabase.
  - **Reglas en `npm test`** (`architecture.test.js` + `scripts/dependency-map.mjs`): capas, Supabase solo en la capa de datos, imports relativos dentro de una funcionalidad y `@/` entre ellas, sin ciclos. `database.test.ts` compara los mappers con `supabase/schema.sql`.
  - **TypeScript:** pasaron la UI compartida, los hooks, `CalendarFilter`, `AddTransactionModal`, `DataContext` y el shell (`DashboardStudio`). Cada archivo se comprobó comparando el JS emitido: solo se agregaron tipos.
  - **`supabase/schema.sql`:** índice de secciones al principio (solo comentarios; `pg_dump` idéntico).
  - **Verificación:** 138 capturas (claro/oscuro, es/en, escritorio/390 px) idénticas píxel a píxel antes y después de cada fase, y los 36 e2e en verde. Los unitarios pasaron de 211 a 230.
  - **Hallazgos** (props que MUI 9 ya no lee; Gastos ignoraba la categoría con el calendario): corregidos después, en un PR aparte (ver *Corregido*).
- **Licencia GPL-3.0** (antes MIT): archivo `LICENSE` y `"license": "GPL-3.0-only"` en `package.json`. Lo ya publicado bajo MIT sigue bajo MIT para quien lo obtuvo así.
- **Guardar y borrar sin llamadas extra:** las 17 funciones de `DataContext` usaban `supabase.auth.getUser()` (una petición al servidor de Auth) antes de cada escritura. Ahora usan el usuario de la sesión, que ya llega con los eventos de auth; RLS sigue validando el JWT en el servidor.
- **Sin sesión, error visible:** antes las mutaciones no hacían nada y la UI mostraba "guardado". Ahora lanzan un error ("No hay sesión activa") que se muestra como toast.
- **CRUD unificado:** metas, cuentas, inversiones, deudas, suscripciones y categorías personalizadas comparten `useTableCrud()`. Transacciones y presupuestos siguen aparte. `DataContext` pasó de 537 a 425 líneas, con la misma API.
- **Textos en un diccionario (T6):**
  - Los 339 `lang === "es" ? … : …` repartidos en los componentes pasaron a `src/i18n/`, en español e inglés.
  - Los textos con datos son funciones, así el plural queda en el diccionario (`t.overviewTab.expenseRecords(n)`).
  - Sin cambios visibles: 36 capturas de pantalla (5 pestañas y 13 diálogos o paneles, en los dos idiomas) salieron idénticas.
  - `src/i18n/messages.test.js` exige las mismas claves en los dos idiomas e impide volver a escribir ternarios de idioma.
- **Componentes grandes divididos (T7):**
  - `GoalsTab` (816 líneas → 55): una sección por archivo en `src/components/goals/`, con un hook `useEntityDialog()` y un marco `EntityDialog` en lugar de cinco copias del mismo estado y handlers.
  - `SettingsPanel` (500 → 77): pestañas en `src/components/settings/`.
  - `BudgetTab` (488 → 56): una tarjeta por archivo en `src/components/budget/`.
  - Sin cambios visibles: capturas de pantalla idénticas píxel a píxel antes y después, y tests end-to-end escritos antes de dividir.
- **TypeScript estricto (T8):**
  - `strict: true`, y ESLint revisa también los `.ts`/`.tsx` con `typescript-eslint`.
  - `src/data`, `src/i18n`, `src/lib`, `SettingsContext` y `useLocalStorage` pasaron a TypeScript, con los tipos del dominio en `src/types.ts` (`Transaction`, `Goal`, `Period`…).
  - El diccionario en inglés está tipado como `typeof es`: una clave faltante o una función con otros parámetros no compila.
  - Lo que encontró el lint: 8 pantallas de auth copiaban el tema a un estado desde un efecto (un render de más); ahora lo leen directo.
- **CSP:** `connect-src` incluye el origen de `NEXT_PUBLIC_SUPABASE_URL`, además de `*.supabase.co`. Así funciona con un dominio propio de Supabase y con el simulado de los tests.
- **CI:** el build apunta al Supabase simulado (`http://127.0.0.1:54321`) para que los tests end-to-end puedan iniciar sesión.
- **OAuth en un solo lugar:** el flag `OAUTH_ENABLED` vive en `src/lib/featureFlags.js`, y `LoginModal` ya no muestra los botones de Google/GitHub mientras esté desactivado (el login y el registro ya lo respetaban).
- **Iconos en los marcadores que quedaban:** el selector de categoría de suscripciones, las barras de las mini cards de Overview y las leyendas de los donuts de Overview y Presupuestos muestran el icono de la categoría en vez de un punto o un cuadrado de color. Overview resuelve nombres y colores con `resolveCategoryMeta()`.

### Añadido (producto)
- **Verificación en dos pasos (Perfil):** con una app de autenticación (TOTP). Se activa escaneando un QR (o escribiendo la clave) y confirmando con un código; desde entonces, al entrar se pide el código después de la contraseña. Se desactiva con confirmación.
- **Suscripciones con el icono de su categoría:** en vez de la inicial, cada una muestra el icono y el color de su categoría, sin pedir logos a servicios externos (sabrían qué suscripciones hay). El nombre sugiere la categoría ("Netflix" → Streaming).
- **Saldo calculado y transferencias entre cuentas (Metas):**
  - una transacción puede asociarse a una cuenta (selector opcional en el formulario), y la lista la muestra junto a la fecha;
  - el saldo que se escribe en una cuenta vale desde ese momento, y la app le suma los ingresos y le resta los gastos asociados posteriores; las cuentas existentes no cambian hasta que se asocie algo;
  - las transferencias (botón ⇄) mueven dinero entre dos cuentas sin contar como ingreso ni gasto, con fecha y nota opcional; las últimas 5 se listan y se pueden borrar;
  - borrar una cuenta deja sus movimientos sin cuenta, sin cambiar el saldo de las otras;
  - el CSV suma la columna `cuenta` (al importarlo se reconoce por el nombre) y la copia JSON trae las transferencias.
- **Moneda de cada transacción y tasas del día:**
  - el formulario tiene un selector de moneda junto al monto (por defecto, la de Ajustes) y muestra el equivalente;
  - se guarda el monto en PEN, como siempre, y además la moneda, lo escrito y la tasa de ese día. La lista muestra lo escrito junto a la fecha, y al editar se abre en su moneda con la tasa con que se guardó;
  - los montos se convierten con las tasas del día de open.er-api.com, pedidas desde el servidor (`/api/rates`, caché de 12 h). Si no responde, se usan las fijas de antes. Ajustes muestra de qué día son, la cotización ("1 USD = S/3.85") y la atribución que pide el proveedor;
  - el CSV exportado suma las columnas `moneda`, `monto_original` y `tasa`, y la importación las lee (los CSV anteriores siguen sirviendo). Un CSV de banco se importa en la moneda que se elija.
- **Presupuestos semanales, mensuales o anuales**, con avisos al 80 % y al 100 % de lo gastado en su período: una franja en Presupuesto y un aviso al guardar el gasto que cruza el umbral.
- **Papelera:** borrar una transacción la manda a la papelera, con "Deshacer" en el aviso. Desde Perfil → Tus datos → Papelera se restaura o se elimina definitivamente; a los 30 días se eliminan solas.
- **Próximos pagos (Presupuesto):** lo que vence hasta el mismo día del mes que viene, a partir de los gastos que se repiten y de las suscripciones (sin contarlas dos veces). Los que ya pasaron sin registrarse salen como vencidos, y "Registrar" abre el formulario lleno.
- **Importar CSV (Perfil → Tus datos):** el export propio o un archivo de banco con columnas a elegir. Vista previa con filas nuevas, ya registradas y con errores; reimportar un archivo no duplica nada.
- **Categoría sugerida por el concepto:** al escribir el concepto de una transacción nueva, la categoría se completa con la que más usaste con ese concepto o, sin historial, con la del catálogo que aparece en el texto. Nunca reemplaza una categoría elegida a mano.
- **Cierre por inactividad configurable:** en Ajustes se elige 2, 5, 15 o 30 minutos (antes, 2 fijos). El aviso sigue llegando 30 s antes, y el valor se sincroniza entre pestañas.
- **Modo privacidad:** el botón del ojo oculta todos los montos ("S/••••") y se recuerda.
- **Exportar datos (Perfil → Tus datos):**
  - las transacciones en CSV, preparadas para Excel y protegidas contra fórmulas;
  - una copia completa en JSON.
- **App instalable:** manifest, iconos (incluido uno `maskable`) y metadatos para iOS.

### Base de datos
> ⚠ **Antes de desplegar:** ejecutar `supabase/schema.sql` en el SQL Editor de Supabase. Una sola vez cubre todos los cambios de esta sección, sea cual sea la versión de la base (requiere Postgres 15+).

- **Un solo archivo de esquema:** las 8 migraciones fechadas de `supabase/migrations/` se reemplazan por `supabase/schema.sql`, que instala desde cero o pone al día una base de cualquier versión anterior, y se puede ejecutar más de una vez. Separa lo que es PostgreSQL estándar (tablas, restricciones, índices, triggers) de lo que depende de Supabase (`auth.users`, RLS, verificación en dos pasos), para poder llevar la base a otro sistema. Probado en Postgres 16: una base nueva queda idéntica a la que dejaban las 8 migraciones; copias de bases anteriores quedan con el mismo esquema y sin perder datos; en un Postgres sin Supabase, la parte estándar se aplica y la otra falla sin tocar nada. Guía en `docs/DATABASE.md`.
- **La verificación en dos pasos protege los datos:** una política `RESTRICTIVE` por tabla. Quien la activó solo ve y escribe sus filas con una sesión `aal2`, es decir, después del código. La condición está en `public.mfa_satisfied()`, `SECURITY DEFINER` porque lee `auth.mfa_factors`, y solo la puede ejecutar `authenticated`. Probado en Postgres 16: con solo la contraseña no se ve ni se escribe nada; con el código, solo lo propio; quien no la activó sigue igual.
- **Saldo a una fecha y transferencias:** `accounts.balance_at` (las existentes quedan con la fecha en que se ejecuta el esquema), `transactions.cuenta_id` y la tabla `transfers` (RLS, `updated_at`, índices). Las claves foráneas usan `(id, user_id)`: nadie puede asociar una transacción o una transferencia a la cuenta de otro usuario. Al borrar una cuenta, `ON DELETE SET NULL (col)` deja sus transacciones sin cuenta y sus transferencias sin ese lado. `supabase/seed/reset.sql` vacía también `transfers` (sin ella, el `TRUNCATE` fallaba por la clave foránea). Probado en Postgres 16: rechaza la cuenta de otro usuario, una transferencia a la misma cuenta y un monto de 0; RLS aísla las transferencias.
- **Moneda de cada transacción:** `transactions.moneda` (una de las 8 monedas, `PEN` por defecto: las existentes quedan así), `monto_original` y `tasa`, con `CHECK` de moneda válida y montos positivos.
- **Presupuestos por período:** `budgets.periodo` (`week`, `month` o `year`; los existentes quedan en `month`).
- **Papelera:** `transactions.deleted_at` y un índice parcial para las borradas.
- **Sin la columna `anomaly`:** siempre valía `false` y el código ya no la escribe.
- **Validaciones en la base (T9):** `transactions` rechaza un `tipo` que no sea INGRESO/EGRESO y un `valor` de 0 o negativo (antes solo lo validaba el cliente), y las tablas tienen `updated_at`, que mantiene un trigger. El encabezado de `schema.sql` trae una consulta para encontrar antes las filas que no cumplen.
- **Esquema idempotente (T10):** se puede ejecutar más de una vez (`IF NOT EXISTS`, `DROP … IF EXISTS` antes de cada restricción, política y trigger), y cada parte va en una transacción.

### Seguridad
- **Verificación en dos pasos de punta a punta:** el proxy deja una sesión que todavía debe el código solo en `/login?mfa=1`, `DataContext` no carga hasta el código y la base no devuelve filas sin `aal2`. Así no se salta ni abriendo otra página ni usando la API de Supabase directamente.
- **CSP de estilos:** los `<style>` necesitan el nonce de la respuesta, como los scripts. Emotion lo recibe del layout y lo pone en cada `<style>`. Solo los atributos `style="…"` siguen permitidos inline. Un `<style>` inyectado ya no se aplica.
- **Reporte de violaciones del CSP:** el navegador las envía a `/api/csp-report`, que las escribe en los logs sin la query de las URLs.

### Dependencias
- **React 19**, igual al que ya usaba Next 16 por dentro (los tests unitarios corrían con React 18).
- **`@supabase/ssr` 0.12 y `supabase-js` 2.117.** Cuando el proxy renueva la sesión, la respuesta sale con `Cache-Control: no-store`, así un CDN no puede guardar una respuesta con la cookie de un usuario y entregársela a otro. Antes, una ruta estática (como el manifest) salía con `public, max-age=0`.
- **Vitest 5.**
- `npm audit`: 0 vulnerabilidades.

### Corregido
- **Brillo de la comparación con el período anterior (Resumen):** la barra del período actual pedía un halo con el nombre del color del tema (`0 0 8px success.main`), que no es CSS válido, así que el navegador lo descartaba. Ahora usa el color real del tema y el halo se ve al final de la barra. Cambia el aspecto a propósito: en las capturas, solo el Resumen.
- **Props que MUI 9 ya no lee** (estaban sin efecto desde la actualización a MUI 9; cambia el aspecto a propósito, con capturas antes y después):
  - **Negritas:** 96 `fontWeight` de `Typography` pasaron a `sx`. Títulos, montos y etiquetas vuelven a salir en negrita en casi todas las pantallas.
  - **Límites de los campos:** los nombres de metas, cuentas, deudas, inversiones y suscripciones vuelven a tener `maxLength: 60`, y 4 montos `min: 0` (`inputProps` → `slotProps.htmlInput`).
  - **Listas de Perfil, Ajustes, 2FA, Tus datos y Categorías:** los títulos vuelven a usar `overline` y `caption` (`primaryTypographyProps` → `slotProps.primary`).
  - **`Grid`:** `alignItems` pasó a `sx`; la tarjeta de salud de Presupuesto vuelve a centrar sus columnas en vertical.
  - **Que no vuelvan:** ESLint marca esas props (y `InputProps`, `InputLabelProps`, `FormHelperTextProps`, `SelectProps` de `TextField` y `PaperProps` de `Dialog`), con lo que hay que usar en su lugar.
- **Gastos ignoraba la categoría con el calendario:** con un día o mes elegido, la lista y el total mostraban todas las categorías aunque hubiera un chip elegido. Ahora filtra como Ingresos: el calendario reemplaza al período y la categoría se aplica encima. Las dos pestañas usan el mismo hook, `useTxFilters`.
- **Transacciones que no contaban en su período:** el mes, el trimestre y el año terminaban a las 00:00 del último día, así que lo registrado ese día después de medianoche no entraba en los totales (el 30 de septiembre por la tarde no contaba en septiembre). La semana empezaba el lunes a la hora actual, no a las 00:00. Ahora los límites son días completos.
- **Montos con el formato del idioma:** `fmtMoney` usaba el locale del navegador; un navegador en alemán mostraba "S/3.500" con la app en español. Ahora usa el del idioma elegido (`es-PE` o `en-US`), igual en el servidor y en el navegador. Los negativos grandes (-1234,56) ya no salen con decimales.
- **Notificaciones repetidas:** en el panel de ajustes, una segunda notificación se cerraba con el tiempo que le quedaba a la primera.
- **Error de hidratación intermitente (React #418):**
  - `/reset-password` fallaba en 1 de cada 20 cargas, más con el servidor cargado.
  - Causa: emotion escribía un `<style>` por componente dentro del `<body>` y los movía al `<head>` al cargar. Los que llegaban después, por el streaming, quedaban como nodos de más.
  - Ahora `AppRouterCacheProvider` (`@mui/material-nextjs`) pone los estilos en el `<head>` desde el servidor.
  - Verificado con 200 cargas seguidas sin error (antes fallaban 6 de 100).
- **Etiquetas en un solo idioma:**
  - el engranaje se anunciaba "Settings" y el botón de cerrar "Close" también en español;
  - editar y borrar una cuenta se anunciaban "Editar" y "Eliminar" también en inglés;
  - las paletas tenían nombres solo en español;
  - el selector de iconos anunciaba claves internas ("TwoWheeler"). Ahora sus 43 iconos tienen nombre en los dos idiomas.
- **Diálogos que recortaban la etiqueta del primer campo:** MUI pone `padding-top: 0` al contenido que sigue al título, con un selector más específico que el padding de la app. Afectaba a todos los diálogos de Metas y al de categorías propias. Hay un test end-to-end que lo detecta.
- **Patrimonio neto sin inversiones:** solo sumaba los saldos de las cuentas, así que un DPF o un fondo AFP no aparecía en el patrimonio ni en su evolución. Ahora las inversiones cuentan como activo (`netWorthOf()`, con tests).
- **Inversiones:** el tipo "Acciones" mostraba la etiqueta "Ahorro", y "Ahorro" no se traducía al inglés.
- **Presupuestos:**
  - en "Gestionar", el botón que cancela la edición de un monto tenía el icono de la papelera;
  - los botones de icono de ese diálogo y el de guardar en cada tarjeta no tenían nombre accesible;
  - en "Recurrentes", un mismo concepto en dos categorías (p. ej. MANTENIMIENTO del auto y de la moto) repetía la `key` de React.
- **Accesibilidad:** 6 selectores no tenían nombre accesible, porque su etiqueta no estaba enlazada: moneda, categoría de presupuesto, tipo de cuenta, tipo de inversión, ciclo y categoría de suscripción. Un lector de pantalla solo leía el valor elegido.

### Añadido
- **Tests end-to-end con sesión:** 11 tests en `e2e/session.spec.ts` contra un Supabase simulado (`e2e/mock-supabase/`), que Playwright levanta junto a la app. Cubren:
  - login;
  - las 5 pestañas, los ajustes, el tema oscuro y el inglés, sin errores de consola;
  - alta, edición y borrado de un gasto;
  - moneda en USD;
  - iconos de metas y categorías;
  - Metas: cuentas, inversiones, deudas y suscripciones;
  - Presupuestos: la tarjeta y "Gestionar";
  - Perfil: nombre, favoritas y categorías propias;
  - la etiqueta flotante de los diálogos;
  - sesión entre pestañas y al reabrir el navegador.
- El Supabase simulado lee las tablas de `supabase/schema.sql` y aplica RLS por usuario. Escribir una columna inexistente falla (`PGRST204`) como en producción.
- `src/context/DataContext.test.jsx`: 8 tests con un cliente de Supabase simulado (carga, alta, edición, borrado, errores, sin sesión, reintento sin `icon` y que nunca se llame a `auth.getUser()`). Con el `DataContext` anterior fallan los 4 que describen el comportamiento nuevo.

### Documentación
- **Reorganizada:** el README queda como portada (qué hace, stack, inicio rápido, índice y licencia) y el detalle pasa a `docs/`: `FEATURES`, `ARCHITECTURE`, `DATABASE`, `SECURITY` y `DEPLOYMENT`, en español y en inglés (`.en.md`).
- **`docs/DATABASE.md`** (nuevo): las tablas, cómo instalar o poner al día el esquema, qué depende de Supabase (en el SQL y en el código) y cómo migrar a otro sistema: base, datos, usuarios y código, con una lista de verificación.
- **`docs/ICONS.md`** reemplaza a `ICONOS_Y_ESTRUCTURA.txt`, con el mapa de iconos y los iconos por archivo sacados del código actual (123 iconos). La estructura del proyecto vive en `docs/ARCHITECTURE.md`.
- **`docs/INVESTIGACION.md`:** sección "Estado de la hoja de ruta" con lo hecho y lo pendiente.
- `docs/TESTING.md`: el build de los tests end-to-end necesita las variables `NEXT_PUBLIC_SUPABASE_*`.

### Eliminado
- `supabase/migrations/` (reemplazadas por `supabase/schema.sql`; siguen en el historial de git).
- `ICONOS_Y_ESTRUCTURA.txt` (ahora `docs/ICONS.md`).

## [0.0.1]

### Cambiado
- Versión reiniciada a `0.0.1` (antes `1.7.0`) y eliminado el historial de versiones anteriores de los READMEs y docs.
- `npm run lint` usa `eslint .` (Next 16 eliminó `next lint`); nuevo `npm run typecheck`. ESLint usa el preset `next` de `react-refresh` e ignora `.next/`.

### Corregido
- **Seguridad:** Next.js 16.2.6 → 16.3.6 y `npm audit fix` (0 vulnerabilidades en dependencias de producción).
- **Moneda:** con una moneda distinta de PEN, los montos se guardaban tal cual pero se mostraban multiplicados por la tasa (ingresabas $100 y veías $27). Ahora todos los formularios (transacciones, presupuestos, metas, cuentas, inversiones, deudas, suscripciones) convierten con `toBase()` al guardar y `fromBase()` al editar. El tope de 10,000,000 se valida en PEN.
- **Transacciones > 1000:** Supabase corta cada respuesta en 1000 filas y, al ordenar ascendente, se perdían las más recientes. Ahora se paginan con `fetchAllRows()`.
- **Sesión entre pestañas:** abrir la app en una pestaña nueva cerraba la sesión en todas (y, con `signOut()` global, en otros dispositivos); una pestaña inactiva cerraba la sesión aunque el usuario estuviera activo en otra. Ahora la pestaña nueva consulta a las demás por `BroadcastChannel`, la inactividad se mide con la marca compartida y los cierres automáticos usan `scope: "local"`.
- `.env.example` que el README pedía copiar y no existía.
- **Build sin red:**
  - Las fuentes (IBM Plex Sans y JetBrains Mono) se sirven desde `src/app/fonts/` con `next/font/local`, en vez de descargarse de Google Fonts en cada build; una descarga fallida había roto la CI.
  - El CSP ya no permite `fonts.googleapis.com` ni `fonts.gstatic.com`.
  - Las etiquetas de los gráficos pedían `Inter`, una fuente que nunca se cargaba; ahora usan la fuente de la app.
- **Tema oscuro e hidratación:** `useLocalStorage` leía `localStorage` en el primer render, así que un tema oscuro guardado generaba clases distintas a las del HTML del servidor (desajuste de hidratación que React no corrige). Ahora aplica el valor guardado después de montar.
- **"Resumen del periodo" (Gastos):** los cuadros pasaban `"error.main"`/`"info.main"` a `gradientBg()`, que espera un hex, y salían casi negros. Ahora usan iconos con tono semántico.

### Añadido
- **Errores visibles en producción:**
  - `reportError()` (`src/lib/reportError.js`) envía a `/api/client-error` los errores de los límites de error de Next, los fallos de carga de `DataContext` y los errores no capturados del navegador (`ErrorReporter`).
  - La ruta los escribe como una línea JSON `[client-error]` en los logs del servidor (Vercel → Logs).
  - Antes, `removeConsole` borraba también los `console.error` en producción; ahora se conservan `error` y `warn`.
- CI en GitHub Actions: lint, typecheck, tests y build en cada push a `main` y en cada PR.
- **Tests:** conversión de moneda, paginación, mapa de iconos y reporte de errores.
  - Tests de componentes (jsdom + Testing Library): moneda en `AddTransactionModal`, `IconPicker` e hidratación de `useLocalStorage`; se verificó que fallan con los bugs originales.
  - 10 tests end-to-end con Playwright sobre el build de producción: redirección sin sesión, CSP con nonce, temas, páginas de auth, fuentes locales, favicon y reporte de errores.
  - En total: 76 tests unitarios y de componentes más 10 end-to-end, todos en la CI.
- **Iconos:**
  - Mapa único categoría → icono (`src/theme/categoryIcons.js`) con `resolveCategoryMeta()`, que reemplaza la lógica `custom_` duplicada en Gastos, Ingresos y Presupuestos.
  - Las listas, chips de filtro, presupuestos y recurrentes muestran el icono de la categoría (`CategoryAvatar`) en vez de iniciales o números.
  - Encabezados unificados con `GradientIcon` (antes convivían dos estilos); `TONE_BY_PALETTE` reemplaza dos mapas de tonos duplicados.
  - 16 categorías con icono repetido o poco claro ahora tienen uno propio (p. ej. Cripto → `CurrencyBitcoin`, Comisiones → `Percent`, Impuestos → `Gavel`, Contenido → `SmartDisplay` en vez del logo de YouTube).
  - Selector de icono (`IconPicker`) para metas (antes, texto libre) y para categorías personalizadas (antes, solo un punto de color).
  - Grupos del selector de categorías con iconos en vez de emojis.
  - Favicon propio: el anterior era el logo de Vite.
- `docs/INVESTIGACION.md`: comparativa de 12 proyectos open source y 4 apps comerciales, con 14 ideas priorizadas para la hoja de ruta.
- **Base de datos:** `supabase/migrations/upgrade_0.0.1.sql`, un script idempotente para una DB existente (⚠ ejecutarlo en Supabase antes de desplegar). Incluye:
  - la columna `custom_categories.icon`; sin ella, las categorías se guardan sin icono;
  - índices `(user_id, …)` en las tablas;
  - políticas RLS con `(select auth.uid())`, que Postgres evalúa una vez por consulta.
  - `schema.sql` refleja lo mismo para instalaciones nuevas.
  - Con 200.000 transacciones, cargar las de un usuario pasó de ~120 ms a ~1,4 ms.

### Documentación
- READMEs (es/en):
  - Stack al día y estructura completa del repo.
  - Mecanismo de sesión entre pestañas.
  - Esquema con iconos y el paso de migración.
  - "Notas Técnicas" reagrupadas por tema, sin las notas obsoletas o contradictorias (CSP en `next.config.mjs`, iconos en `AddTransactionModal`, carga solo en `INITIAL_SESSION`).
  - Sección de arquitectura sin las métricas viejas de graphify.
  - Despliegue con la CI y las migraciones, cómo mergear un PR y cómo publicar o borrar una versión (solo en el README en español).
- `docs/TESTING.md`: los tres niveles de tests (unitarios, componentes y end-to-end), qué cubre cada archivo y gotchas nuevos (locale de `fmtMoney`, redondeo de moneda, `sendBeacon` en Playwright).
- `docs/SECURITY-CSP.md`: estado de la verificación en navegador y cómo quitar `'unsafe-inline'` de `style-src`.
- `docs/INVESTIGACION.md`: 15 mejoras técnicas priorizadas (índices, observabilidad, tests end-to-end, i18n, tipado…).
- `ICONOS_Y_ESTRUCTURA.txt`: stack, monedas y árbol de `app/` actualizados.

### Eliminado
- Restos de la plantilla de Vite (`index.html`, `src/assets/hero.png`, `public/icons.svg`) y `ErrorBoundary.jsx`, que no se usaba.
