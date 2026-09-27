# Finanzas — Gestión Personal

Aplicación de finanzas personales para rastrear ingresos, gastos, presupuestos, metas y más. Desplegada en **[www.jeshu.cfd](https://www.jeshu.cfd)**.

**Versión:** `v0.0.1` · [Historial de cambios](CHANGELOG.md) · Licencia [GPL-3.0](LICENSE)

<!-- i18n-selector-start -->
🌐 **Español** · [English](README.en.md)
<!-- i18n-selector-end -->

## Qué hace

- **Registrar:** ingresos y gastos con su categoría (se sugiere por el concepto), su moneda (8, convertidas con las tasas del día) y, si se quiere, su cuenta. Importa y exporta CSV, y lo borrado va a una papelera con "Deshacer".
- **Entender:** resumen por semana, mes, trimestre o año, con salud financiera, flujo de caja, gastos por categoría, calendario de gastos y comparación con el período anterior.
- **Planificar:** presupuestos semanales, mensuales o anuales con avisos al 80 % y al 100 %, y los próximos pagos a partir de los gastos que se repiten y de las suscripciones.
- **Patrimonio:** metas de ahorro, cuentas con saldo calculado y transferencias entre ellas, inversiones, deudas, suscripciones y un pronóstico de 3 meses.
- **Cuenta y privacidad:** login con email, verificación en dos pasos (TOTP), cierre de sesión por inactividad y al reabrir el navegador, modo privacidad que oculta los montos, tema claro u oscuro, español o inglés, y app instalable.

Detalle por pantalla en **[docs/FEATURES.md](docs/FEATURES.md)**. Los montos se guardan en PEN: con la app en otra moneda, los totales se convierten con la tasa de hoy ([límites conocidos](docs/ARCHITECTURE.md#datos-y-supabase)).

## Stack

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack) + React 19 |
| UI | Material UI (MUI) v9 + `@mui/icons-material` (variante Rounded) + `@mui/material-nextjs` (estilos en el `<head>` desde el servidor) |
| Auth + DB | Supabase con `@supabase/ssr` 0.12 (email/password; OAuth preparado pero desactivado). El esquema es PostgreSQL estándar salvo usuarios, RLS y la verificación en dos pasos ([cómo migrar](docs/DATABASE.md#migrar-a-otro-sistema)) |
| Date Picker | MUI X Date Pickers + dayjs |
| State | React Context + localStorage |
| Lenguaje | TypeScript `strict` (rutas, datos, textos, contextos de ajustes y usuario) + JSX (componentes) |
| Tests | Vitest 5 (unitarios y componentes con jsdom) + Playwright (end-to-end) |
| CI | GitHub Actions: lint, typecheck, tests, build y end-to-end |
| Deploy | Vercel → `https://www.jeshu.cfd` |

## Inicio rápido

1. **Dependencias y variables de entorno:**

   ```bash
   npm install
   cp .env.example .env.local   # completar con la URL y la anon key del proyecto de Supabase
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

2. **Base de datos:** ejecutar [`supabase/schema.sql`](supabase/schema.sql) en Supabase → SQL Editor. Sirve para una base nueva y para poner al día una existente, y se puede ejecutar más de una vez. Detalle en [docs/DATABASE.md](docs/DATABASE.md).

3. **Servidor de desarrollo:** `npm run dev` → `http://localhost:3000`.

**Verificar un cambio** (lo mismo que corre la CI en cada PR y push a `main`):

```bash
npm run lint && npm run typecheck   # ESLint y tsc
npm test                            # Vitest: unitarios y componentes

# End-to-end (Playwright) sobre el build de producción, contra un Supabase simulado
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e npm run build
npm run test:e2e
```

Detalles de testing en **[docs/TESTING.md](docs/TESTING.md)**.

## Documentación

| Documento | Qué contiene |
|---|---|
| [Características](docs/FEATURES.md) | Todo lo que hace la app, por pantalla |
| [Arquitectura](docs/ARCHITECTURE.md) | Estructura del código, flujo de datos, módulos clave y notas técnicas |
| [Base de datos](docs/DATABASE.md) | Tablas, cómo instalar o poner al día el esquema, qué depende de Supabase y cómo migrar a otro sistema |
| [Seguridad](docs/SECURITY.md) · [CSP](docs/SECURITY-CSP.md) | Medidas de seguridad y el Content-Security-Policy con nonce por request |
| [Tests](docs/TESTING.md) | Unitarios, de componentes y end-to-end, y el Supabase simulado |
| [Despliegue y versiones](docs/DEPLOYMENT.md) | Vercel, cómo mergear un PR, cómo publicar una versión y solución de problemas |
| [Iconos](docs/ICONS.md) | Sistema de iconos y mapa categoría → icono |
| [Investigación y hoja de ruta](docs/INVESTIGACION.md) | Proyectos similares, ideas de producto y mejoras técnicas, con su estado |
| [Historial de cambios](CHANGELOG.md) | Qué cambió en cada versión |

## Licencia

[GNU General Public License v3.0](LICENSE) (`GPL-3.0-only`). Copyright © 2026 jflores31.

- Se puede usar, estudiar, modificar y redistribuir. Quien distribuya la app, o una versión modificada, tiene que hacerlo también bajo GPL-3.0 y con su código fuente.
- Ofrecerla como servicio web, sin distribuirla, no obliga a publicar el código (eso lo exigiría la AGPL-3.0).
- Se ofrece sin garantía (secciones 15 y 16 de la licencia).
- Las fuentes de `src/app/fonts/` (IBM Plex Sans y JetBrains Mono) conservan su licencia SIL OFL 1.1, y las dependencias de npm la suya (MIT, Apache-2.0, BSD, ISC, LGPL-3.0 y CC-BY-4.0), todas compatibles con la GPL-3.0.
