# Historial de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado [SemVer](https://semver.org/lang/es/).
El proyecto reinició su numeración en `0.0.1`; el historial previo se descartó.

## [Unreleased]

### Cambiado
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
- **Validaciones en la base (T9):** `transactions` rechaza un `tipo` que no sea INGRESO/EGRESO y un `valor` de 0 o negativo (antes solo lo validaba el cliente), y las 8 tablas tienen `updated_at`, que mantiene un trigger. El código ya no escribe la columna `anomaly` (siempre `false`); se borra en una migración posterior, una vez desplegado este código. ⚠ Ejecutar `supabase/migrations/20260927000000_schema_hygiene.sql` antes de desplegar.
- **Migraciones fechadas e idempotentes (T10):** `schema.sql` y `upgrade_0.0.1.sql` pasan a ser `supabase/migrations/20260618000000_init.sql`, el primero de una serie de archivos con fecha en el nombre. Se puede ejecutar más de una vez (`DROP POLICY IF EXISTS` antes de cada `CREATE POLICY`) y va en una transacción. Probado en Postgres 16: en una DB nueva, en la de producción y en una anterior a la 0.0.1 deja el mismo esquema, y RLS sigue aislando a cada usuario.

### Seguridad
- **CSP de estilos:** los `<style>` necesitan el nonce de la respuesta, como los scripts. Emotion lo recibe del layout y lo pone en cada `<style>`. Solo los atributos `style="…"` siguen permitidos inline. Un `<style>` inyectado ya no se aplica.
- **Reporte de violaciones del CSP:** el navegador las envía a `/api/csp-report`, que las escribe en los logs sin la query de las URLs.

### Dependencias
- **React 19**, igual al que ya usaba Next 16 por dentro (los tests unitarios corrían con React 18).
- **`@supabase/ssr` 0.12 y `supabase-js` 2.117.** Cuando el proxy renueva la sesión, la respuesta sale con `Cache-Control: no-store`, así un CDN no puede guardar una respuesta con la cookie de un usuario y entregársela a otro. Antes, una ruta estática (como el manifest) salía con `public, max-age=0`.
- **Vitest 5.**
- `npm audit`: 0 vulnerabilidades.

### Corregido
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
- El Supabase simulado lee las tablas de `supabase/migrations/*.sql` y aplica RLS por usuario. Escribir una columna inexistente falla (`PGRST204`) como en producción.
- `src/context/DataContext.test.jsx`: 8 tests con un cliente de Supabase simulado (carga, alta, edición, borrado, errores, sin sesión, reintento sin `icon` y que nunca se llame a `auth.getUser()`). Con el `DataContext` anterior fallan los 4 que describen el comportamiento nuevo.

### Documentación
- `README.en.md`: secciones "How to merge a PR" y "Versions and releases", como en el README en español, y la CI que también corre los tests end-to-end.
- `docs/TESTING.md`: el build de los tests end-to-end necesita las variables `NEXT_PUBLIC_SUPABASE_*`.

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
