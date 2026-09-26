# Testing

> Tests unitarios del repo con Vitest. La CI (`.github/workflows/ci.yml`) los corre en cada PR y en cada push a `main`, junto con lint, typecheck y build.

## Stack

- **[Vitest](https://vitest.dev/)** — runner ESM-nativo, sin transpilación extra.
- Entorno **`node`** (sin jsdom): hoy solo se testean funciones puras y módulos de datos, no componentes React renderizados.
- Config: [`vitest.config.mjs`](../vitest.config.mjs) — `include: ["src/**/*.test.js"]`.

## Cómo correr

```bash
npm run test         # corre toda la suite una vez (vitest run)
npm run test:watch   # modo watch (re-corre al guardar)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

No requiere variables de entorno ni Supabase: los módulos testeados son cálculo puro o reciben un cliente simulado.

## Qué está cubierto

53 tests en 4 archivos:

| Archivo | Tests | Qué cubre |
|---|---|---|
| [`src/data/helpers.test.js`](../src/data/helpers.test.js) | 24 | [`helpers.js`](../src/data/helpers.js), el eslabón que tocan las 4 pestañas principales (ver tabla de abajo) |
| [`src/data/currency.test.js`](../src/data/currency.test.js) | 13 | `toBase` / `fromBase` de [`index.js`](../src/data/index.js): PEN sin conversión, redondeo a 2 decimales, que lo escrito en el formulario sea lo que muestra `fmtMoney`, ida y vuelta estable en cada moneda de `CURRENCIES`, moneda desconocida → PEN, strings numéricos |
| [`src/data/fetchAllRows.test.js`](../src/data/fetchAllRows.test.js) | 5 | Paginación de [`fetchAllRows.js`](../src/data/fetchAllRows.js): 1000 + 1000 + 250 filas sin duplicados, total múltiplo exacto del tamaño de página, tabla vacía, `pageSize` custom, error en una página → todo o nada |
| [`src/theme/categoryIcons.test.js`](../src/theme/categoryIcons.test.js) | 11 | [`categoryIcons.js`](../src/theme/categoryIcons.js): toda categoría de `CATEGORIES` tiene icono y no hay claves huérfanas; `iconByName` rechaza glifos viejos y claves del prototipo; `resolveCategoryMeta` con categorías nativas, claves repetidas en ingresos y egresos (`REGALOS`), personalizadas, personalizadas borradas o sin icono y claves desconocidas |

### Detalle de `helpers.test.js`

| Función | Casos clave |
|---|---|
| `flagAnomalies` | frontera exacta `3×` (no marca en `=`, sí en `>`); mediana par/impar; mínimo `4` muestras; solo `EGRESO`; aislamiento por categoría; inmutabilidad (no muta la entrada) |
| `healthScore` | alcanza `100`; suelo `0`; tope del bono de ahorro (`+40`); penalti por anomalía (`-5` c/u); tope del penalti por gasto (`-15`) |
| `healthLabel` / `healthTone` | umbrales `75` / `50`, bilingüe |
| `linearRegressionSlope` | pendiente conocida; serie plana = `0`; `n<2` = `0` |
| `recurringList` | agrupa por `categoria|concepto`; filtra `>= 3` meses; promedia día/monto; ignora `INGRESO` |
| `filterByPeriod` | `all`, `month`, `year` con `offset` |
| `periodLabel` / `monthCount` / `daysCount` / `fmtDate` | mapeos triviales |

## Cómo añadir tests

1. Crear `src/<area>/<algo>.test.js`; el patrón `src/**/*.test.js` lo recoge solo.
2. Importar de Vitest: `import { describe, it, expect } from "vitest"`.
3. Para transacciones, usar un factory mínimo que respete la forma de `mapRow` (ver el helper `tx()` en `helpers.test.js`): `tipo`, `categoria`, `concepto`, `valor`, `date`, `dia`, `mes`, `año`.
4. Para código que habla con Supabase, pasar un objeto con la misma forma que el query builder en vez del cliente real (ver `fakeTable()` en `fetchAllRows.test.js`).

## Gotchas

- **`getToday()` devuelve `new Date()`** (hora real). Cualquier test de `filterByPeriod` debe **anclarse al "ahora"** (fechas relativas a `new Date()`), no a fechas fijas, o se rompe otro día.
- **El outlier cuenta como muestra en `flagAnomalies`.** La transacción anómala que agregas entra en el cálculo de la mediana y **cambia la paridad del conteo**. Diseña el caso con el total (par/impar) que quieras *incluyendo* el outlier.
- **Frontera estricta:** `flagAnomalies` marca solo si `valor > mediana × 3` (no `>=`). Probar ambos lados (`30` no marca, `31` sí, con mediana `10`).
- **`fmtMoney` depende del locale** (`toLocaleString(undefined, …)`). En tests, usar montos sin separador de miles (p. ej. `$100`) para que el resultado no cambie según la máquina.
- **El redondeo de moneda acumula error:** `toBase` redondea a 2 decimales en PEN y `fromBase` vuelve a redondear. La ida y vuelta puede desviarse hasta `0.005 × tasa + 0.005`, que es la tolerancia que usa `currency.test.js`.
- **Importar iconos MUI en `node` funciona** (son componentes, no se renderizan). Por eso `categoryIcons.test.js` puede comparar referencias (`toBe(ICON_CHOICES.Pets)`) sin jsdom.

## Pendiente / próximos candidatos

- **Componentes React:** requerirían `environment: "jsdom"` + `@testing-library/react` (no instalados hoy).
- **End-to-end:** Playwright contra un proyecto de Supabase de pruebas, para cubrir login, moneda, sesión entre pestañas e iconos en la UI real.
- **`DataContext`:** la carga y las mutaciones están acopladas a Supabase y necesitarían un cliente simulado.
