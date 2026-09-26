# Testing

> Tres niveles: tests unitarios (Vitest, entorno `node`), tests de componentes (Vitest + jsdom + Testing Library) y tests end-to-end (Playwright contra el build de producción). La CI (`.github/workflows/ci.yml`) corre los tres en cada PR y en cada push a `main`, junto con lint, typecheck y build.

## Stack

- **[Vitest](https://vitest.dev/)** para unitarios y componentes. Config en [`vitest.config.mjs`](../vitest.config.mjs):
  - `include: ["src/**/*.test.{js,jsx}"]`;
  - entorno `node` por defecto;
  - JSX con el runtime automático, como Next.
- **jsdom + [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** para componentes. Cada archivo de componente pide jsdom con un comentario en la primera línea: `// @vitest-environment jsdom`.
- **[Playwright](https://playwright.dev/)** para end-to-end. Config en [`playwright.config.ts`](../playwright.config.ts) y tests en [`e2e/`](../e2e). Levanta `next start` en el puerto 3100 con variables de Supabase falsas.

## Cómo correr

```bash
npm run test         # unitarios + componentes (vitest run)
npm run test:watch   # modo watch
npm run build && npm run test:e2e   # end-to-end: necesita un build de producción
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

- Ningún test necesita un Supabase real.
- Para correr los tests end-to-end en otra máquina, instalar antes el navegador con `npx playwright install chromium` (la CI lo hace sola).

## Qué está cubierto

### Unitarios y componentes: 76 tests en 9 archivos

| Archivo | Tests | Qué cubre |
|---|---|---|
| [`src/data/helpers.test.js`](../src/data/helpers.test.js) | 24 | [`helpers.js`](../src/data/helpers.js), el eslabón que tocan las 4 pestañas principales (detalle abajo) |
| [`src/data/currency.test.js`](../src/data/currency.test.js) | 13 | `toBase` / `fromBase`: PEN sin conversión, redondeo, que lo escrito sea lo que muestra `fmtMoney`, ida y vuelta en cada moneda, moneda desconocida, strings numéricos |
| [`src/data/fetchAllRows.test.js`](../src/data/fetchAllRows.test.js) | 5 | Paginación de más de 1000 filas: sin duplicados, total múltiplo exacto de la página, tabla vacía, `pageSize` propio, error → todo o nada |
| [`src/theme/categoryIcons.test.js`](../src/theme/categoryIcons.test.js) | 11 | Toda categoría tiene icono y no hay claves huérfanas. `iconByName` y `resolveCategoryMeta` con categorías nativas, repetidas (`REGALOS`), personalizadas, borradas y desconocidas |
| [`src/lib/reportError.test.js`](../src/lib/reportError.test.js) | 8 | Reporte de errores del navegador: recorte de campos, solo el pathname (sin query), sin repetidos, tope de 10, `fetch` si no hay `sendBeacon`, nunca lanza |
| [`src/app/api/client-error/route.test.js`](../src/app/api/client-error/route.test.js) | 4 | La ruta escribe una línea JSON y responde 204. Descarta campos desconocidos, 400 si el JSON es inválido, 413 si pasa de 8 KB |
| [`src/components/AddTransactionModal.test.jsx`](../src/components/AddTransactionModal.test.jsx) | 4 | **Moneda en el modal:** PEN tal cual; en USD guarda `100 / 0.27`; editar precarga el monto en la moneda elegida; el tope se valida en PEN |
| [`src/theme/IconPicker.test.jsx`](../src/theme/IconPicker.test.jsx) | 3 | Una opción por icono, marca la seleccionada, devuelve la clave, un glifo viejo no marca nada |
| [`src/hooks/useLocalStorage.test.jsx`](../src/hooks/useLocalStorage.test.jsx) | 4 | **Hidratación del tema:** el primer render usa el valor por defecto aunque haya uno guardado. También cubre la persistencia, el updater funcional y un valor inválido |

Los tests de moneda y de `useLocalStorage` se verificaron **reintroduciendo los bugs originales**: con el código viejo fallan (3 de 4 y 1 de 4, respectivamente).

### End-to-end: 10 tests en [`e2e/smoke.spec.ts`](../e2e/smoke.spec.ts)

- **Sin sesión:** `/` redirige a `/login`.
- **`/login` en tema claro y oscuro:**
  - el CSP trae nonce y `'strict-dynamic'`, sin `'unsafe-inline'`, y **todos** los `<script>` llevan el nonce;
  - el formulario es interactivo (hidrató);
  - aplica el tema guardado;
  - la consola queda sin errores.
- **Otras páginas de auth:** `/register`, `/forgot-password` y `/reset-password` cargan sin errores de consola.
- **Recursos:** las fuentes se cargan desde la app, sin peticiones a otros dominios, y el favicon existe y está enlazado.
- **Reporte de errores:**
  - un error no capturado llega a `/api/client-error` (204), sin la query de la URL;
  - la ruta rechaza cuerpos inválidos (400) o grandes (413);
  - las demás rutas `/api` siguen protegidas (307 → `/login`).

### Detalle de `helpers.test.js`

| Función | Casos clave |
|---|---|
| `flagAnomalies` | frontera exacta `3×` (no marca en `=`, sí en `>`); mediana par/impar; mínimo `4` muestras; solo `EGRESO`; aislamiento por categoría; inmutabilidad |
| `healthScore` | alcanza `100`; suelo `0`; tope del bono de ahorro (`+40`); penalti por anomalía (`-5` c/u); tope del penalti por gasto (`-15`) |
| `healthLabel` / `healthTone` | umbrales `75` / `50`, bilingüe |
| `linearRegressionSlope` | pendiente conocida; serie plana = `0`; `n<2` = `0` |
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
4. **Código que habla con Supabase:** pasar un objeto con la forma del query builder (ver `fakeTable()` en `fetchAllRows.test.js`).
5. **End-to-end:** agregar casos en `e2e/`. Sin un Supabase de pruebas solo se puede cubrir lo que funciona sin sesión.

## Gotchas

- **`getToday()` devuelve `new Date()`** (hora real). Los tests de `filterByPeriod` deben **anclarse al "ahora"**, no a fechas fijas.
- **El outlier cuenta como muestra en `flagAnomalies`:** cambia la paridad del conteo al calcular la mediana.
- **Frontera estricta:** `flagAnomalies` marca solo si `valor > mediana × 3`. Probar ambos lados.
- **`fmtMoney` depende del locale** (`toLocaleString(undefined, …)`). Usar montos sin separador de miles (p. ej. `$100`).
- **El redondeo de moneda acumula error:** la ida y vuelta puede desviarse hasta `0.005 × tasa + 0.005`.
- **Importar iconos MUI en `node` funciona** (no se renderizan): `categoryIcons.test.js` compara referencias sin jsdom.
- **Playwright no expone el cuerpo de `sendBeacon`:**
  - el test end-to-end del reporte envuelve `navigator.sendBeacon` con `addInitScript` para guardar el payload;
  - deja salir el beacon real, así también se verifica la respuesta de la ruta.
- **React en producción no avisa de desajustes de hidratación en atributos** (solo en desarrollo). El test end-to-end del tema oscuro pasaría aunque volviera el bug. Esa regresión la cubre `useLocalStorage.test.jsx`.
- **Navegador local:** este repo fija `@playwright/test` en `1.56.1`. Si `PLAYWRIGHT_BROWSERS_PATH` apunta a navegadores ya instalados de esa versión, no hace falta `playwright install`.

## Pendiente / próximos candidatos

- **Flujos con sesión:** login real, alta y edición de transacciones, moneda en el dashboard y sesión entre pestañas. Necesitan un proyecto de Supabase de pruebas, con sus credenciales como secretos de la CI.
- **Más componentes:** pestañas con datos simulados (p. ej. que "Resumen del periodo" use tonos válidos).
- **`DataContext`:** carga y mutaciones con un cliente de Supabase simulado.
