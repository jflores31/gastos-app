# Historial de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado [SemVer](https://semver.org/lang/es/).
El proyecto reinició su numeración en `0.0.1`; el historial previo se descartó.

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

### Añadido
- CI en GitHub Actions: lint, typecheck, tests y build en cada push a `main` y en cada PR.
- Tests de conversión de moneda y de paginación.

### Eliminado
- Restos de la plantilla de Vite (`index.html`, `src/assets/hero.png`, `public/icons.svg`) y `ErrorBoundary.jsx`, que no se usaba.
