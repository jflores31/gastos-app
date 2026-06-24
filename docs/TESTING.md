# Testing

> Tests unitarios del repo. Introducidos en **v1.4.0**.

## Stack

- **[Vitest](https://vitest.dev/)** — runner ESM-nativo, sin transpilación extra.
- Entorno **`node`** (sin jsdom): hoy solo se testean funciones puras, no componentes React.
- Config: [`vitest.config.mjs`](../vitest.config.mjs) — `include: ["src/**/*.test.js"]`.

## Cómo correr

```bash
npm run test         # corre toda la suite una vez (vitest run)
npm run test:watch   # modo watch (re-corre al guardar)
```

No requiere variables de entorno ni Supabase: los helpers son puro cálculo.

## Qué está cubierto

`src/data/helpers.test.js` cubre [`src/data/helpers.js`](../src/data/helpers.js) — el **eslabón frágil** que tocan los 4 tabs (Overview, Expenses, Budget, Goals). 24 tests, foco en los límites:

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

1. Crear `src/<area>/<algo>.test.js` (el patrón `src/**/*.test.js` lo recoge solo).
2. Importar de Vitest: `import { describe, it, expect } from "vitest"`.
3. Construir datos con un factory mínimo que respete la forma de `mapRow` (ver el helper `tx()` en `helpers.test.js`): `tipo`, `categoria`, `concepto`, `valor`, `date`, `dia`, `mes`, `año`.

## Gotchas (aprendidos al escribir la suite)

- **`getToday()` devuelve `new Date()`** (hora real). Cualquier test de `filterByPeriod` debe **anclarse al "ahora"** (construir las fechas relativas a `new Date()`), no a fechas fijas, o se rompe otro día. Ver el bloque `filterByPeriod` en `helpers.test.js`.
- **El outlier cuenta como muestra en `flagAnomalies`.** Al testear la mediana, la transacción anómala que agregas entra en el cálculo y **cambia la paridad del conteo**. Diseña el caso con el conteo total (par/impar) que quieras *incluyendo* el outlier — no asumas que la "base" define la mediana.
- **Frontera estricta:** `flagAnomalies` marca solo si `valor > mediana × 3` (no `>=`). Probar ambos lados (`30` no marca, `31` sí, con mediana `10`).

## Pendiente / próximos candidatos

- Componentes React requerirían `environment: "jsdom"` + `@testing-library/react` (no instalados hoy).
- El resto de `helpers.js` ya está cubierto; el siguiente eslabón sería la lógica de `DataContext` (más acoplada a Supabase, necesitaría mocks).
