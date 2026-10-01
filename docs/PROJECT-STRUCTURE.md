# Estructura del código

🌐 **Español** · [English](PROJECT-STRUCTURE.en.md)

Dónde va cada cosa en `src/`, qué capas hay y qué reglas comprueba `npm test`. Para el flujo de datos y las decisiones técnicas, ver [ARCHITECTURE.md](ARCHITECTURE.md). Cómo se llegó a esta estructura: [ARCHITECTURE-AUDIT.md](ARCHITECTURE-AUDIT.md).

## Árbol

El código se organiza **por funcionalidad** (`features/`), no por tipo de archivo. Lo que usan varias funcionalidades vive fuera, en carpetas compartidas.

```text
src/
├── app/                  # Solo rutas de Next.js: layout, page, error, not-found, manifest, globals.css, fonts/
│   ├── login/ · register/ · forgot-password/ · reset-password/
│   │                     #   page.tsx: entrada fina que renderiza la pantalla de features/auth
│   ├── auth/callback/    # Vuelta del login con Google/GitHub (OAuth)
│   └── api/              # client-error, csp-report, rates (tasas del día)
├── features/             # Una carpeta por funcionalidad (abajo)
├── components/           # UI compartida, sin reglas de negocio
│   ├── ui/               #   EmptyState, EmptySection, GradientIcon (+ CategoryAvatar), IconPicker
│   ├── charts/           #   Donut, SparkArea, StudioCashflow, HeatCalendar (SVG propio)
│   ├── forms/            #   EntityDialog + useEntityDialog (crear / editar / borrar)
│   ├── feedback/         #   useToast + Toast (un aviso a la vez)
│   └── providers/        #   Providers, DynamicThemeProvider, ErrorReporter
├── contexts/             # Estado global: DataContext (+ useTableCrud), SettingsContext, UserContext
├── domain/               # Reglas que usan varias funcionalidades: money, period, health, netWorth,
│                         #   categories/ (catalog, suggest)
├── hooks/                # useLocalStorage
├── i18n/                 # Todos los textos, en es y en
├── lib/                  # Infraestructura: supabase/ (client, server, fetchAllRows), rates, reportError, featureFlags
├── theme/                # Tema de MUI, iconos, tonos y categoría → nombre → color → icono
├── types/                # domain.ts (lo que usa la app) y database.ts (las filas de las 9 tablas)
└── proxy.ts              # Sesión, 2FA y CSP en cada request
```

**Cada funcionalidad** tiene las carpetas que necesita, siempre con estos nombres:

```text
features/<funcionalidad>/
├── components/   # Pantallas, tarjetas y diálogos (React + MUI)
├── hooks/        # Estado y efectos de esas pantallas
├── domain/       # Reglas puras: sin React, sin MUI, sin Supabase (con tests)
└── data/         # Mapeo fila ↔ objeto y escrituras en Supabase
```

| Funcionalidad | Qué tiene |
|---|---|
| `transactions` | Gastos e Ingresos (`ExpensesTab`, `IncomeTab`, `TransactionList`), el modal de alta y edición, el filtro de calendario, la papelera; agregaciones, anomalías y filtro de fecha; las escrituras de transacciones |
| `budgets` | La pestaña Presupuesto y sus 9 tarjetas y diálogos; los avisos al 80 % y 100 %; presupuestos por período, recurrentes y próximos pagos |
| `goals` | Metas, proyección y evolución del patrimonio |
| `accounts` | Cuentas, transferencias y saldo de hoy |
| `investments` · `debts` · `subscriptions` | Una tarjeta cada una y su tabla |
| `categories` | Categorías propias |
| `import-export` | Importar CSV; exportar CSV y JSON |
| `auth` | Login, registro, recuperación, 2FA, el login dentro de la app; `useSessionGuard` (inactividad, 8 h, navegador reabierto); `authApi` |
| `settings` | El panel de Perfil y Ajustes, y "Tus datos" |
| `dashboard` | El shell de la app (`DashboardStudio`, `AppHeader`, `MainNav`), Resumen y Metas, y los avisos del Resumen |

## Capas

```text
UI       app/, features/*/components, components/
Estado   contexts/, features/*/hooks
Dominio  domain/, features/*/domain, types/        sin React, MUI ni Supabase
Datos    features/*/data, lib/supabase/            el único lugar con consultas
```

Los datos llegan a la UI por `useData()` (`contexts/DataContext.tsx`). `DataContext` guarda el estado de las 9 tablas, escucha la sesión y hace la carga. Cada tabla se lee y se escribe con el módulo `data/` de su funcionalidad.

## Reglas que comprueba `npm test`

[`src/architecture.test.js`](../src/architecture.test.js) usa [`scripts/dependency-map.mjs`](../scripts/dependency-map.mjs) y falla si aparece alguna de estas violaciones:

- **Supabase** solo en `features/*/data`, `contexts/`, `lib/supabase/`, `proxy.ts` y `app/auth/callback`. La UI usa `authApi` y `useData()`.
- **`components/`** no importa de `features/`: lo compartido no conoce las funcionalidades.
- **`lib/`, `domain/`, `types/`, `theme/` e `i18n/`** no importan de `features/`, `components/`, `contexts/` ni `hooks/`.
- **El dominio** (`domain/`, `features/*/domain`, `types/`) no importa React, MUI ni Supabase.
- **Entre funcionalidades** solo se importa `domain/`, `data/` o tipos. Las excepciones son las dos que componen pantallas de otras: `dashboard` (las cinco pestañas) y `settings` (Perfil).
- **Imports:** relativos dentro de la misma funcionalidad o carpeta; con `@/` al cruzar de una a otra.
- **Ciclos de importación:** ninguno.

Para ver el mapa: `node scripts/dependency-map.mjs` (`--areas` agrupa por carpeta y `--unused` lista los exports sin uso).

## Dónde va cada cosa

| Quiero agregar… | Va en |
|---|---|
| Una pantalla, tarjeta o diálogo de una funcionalidad | `features/<f>/components/` |
| Una regla de cálculo (montos, fechas, alertas) | `features/<f>/domain/`, con su test; en `domain/` si la usan varias funcionalidades |
| Una columna o tabla nueva | `supabase/schema.sql`, `types/database.ts` y el `data/` de la funcionalidad (`fromRow` / `toRow`); el test de `database.test.ts` comprueba que coincidan |
| Una llamada a Supabase Auth | `features/auth/data/authApi.ts` |
| Un texto | `i18n/` (es y en); `messages.test.js` comprueba que estén los dos |
| Un icono o un color de categoría | `theme/` (ver [ICONS.md](ICONS.md)) |
| Un componente que usan varias funcionalidades | `components/` (sin lógica de negocio) |
| Estilos | junto al componente, con `sx` de MUI; los repetidos, en el tema (`theme/materialTheme.ts`); los globales, en `app/globals.css`. Separarlos del código es la T16, pendiente |
| Una pestaña nueva | su funcionalidad en `features/`, y una entrada en `dashboard/components/MainNav.tsx` y `DashboardStudio.tsx` |

## Cómo agregar una funcionalidad

1. **Carpeta:** crear `features/<nombre>/` con las subcarpetas que haga falta (`components`, `domain`, `data`…).
2. **Reglas primero:** las funciones puras van en `domain/`, con un `*.test.ts` al lado.
3. **Datos:** si hay una tabla nueva:
   - agregarla a `supabase/schema.sql` (y al simulado no le hace falta nada: lee ese archivo);
   - poner su fila en `types/database.ts`;
   - escribir el `data/<tabla>.ts` con un `TableSpec`;
   - agregar el estado en `DataContext` con `useTableCrud`;
   - sumar la tabla al test de `database.test.ts`.
4. **UI:** los componentes leen con `useData()` y `useSettings()`. Los textos van en `i18n/` y los iconos en `theme/icons.ts`.
5. **Montaje:** la pantalla se monta desde `dashboard` (una pestaña) o desde `settings` (Perfil).
6. **Comprobar:** `npm run lint`, `npm run typecheck`, `npm test` (incluye las reglas de arriba) y `npm run test:e2e`.

## TypeScript

- **En TypeScript:** `allowJs` sigue activo. Ya están en TS la lógica, los tipos, los contextos, los hooks, la capa de datos y la UI compartida.
- **En `.jsx`:** las pantallas y tarjetas siguen así, y pasan a TS cuando se tocan por otra razón.
- **Excepción:** `GradientIcon` sigue en `.jsx` (sus props van en JSDoc, así los `.tsx` que lo usan se comprueban). El motivo se explica en [ARCHITECTURE-AUDIT.md](ARCHITECTURE-AUDIT.md#migración-js--ts).
- **Al migrar un archivo:** solo se agregan tipos. El JS que emite TypeScript tiene que ser el mismo que antes.

## Tests

- **Unitarios y de componentes:** van junto al código (`*.test.ts`, `*.test.jsx`), con Vitest.
- **End-to-end:** van en `e2e/`, con Playwright y un Supabase simulado.
- **Más detalle:** [TESTING.md](TESTING.md).
