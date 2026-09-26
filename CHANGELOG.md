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
- **Tema oscuro e hidratación:** `useLocalStorage` leía `localStorage` en el primer render, así que un tema oscuro guardado generaba clases distintas a las del HTML del servidor (desajuste de hidratación que React no corrige). Ahora aplica el valor guardado después de montar.
- **"Resumen del periodo" (Gastos):** los cuadros pasaban `"error.main"`/`"info.main"` a `gradientBg()`, que espera un hex, y salían casi negros. Ahora usan iconos con tono semántico.

### Añadido
- CI en GitHub Actions: lint, typecheck, tests y build en cada push a `main` y en cada PR.
- Tests de conversión de moneda, de paginación y del mapa de iconos.
- **Iconos:**
  - Mapa único categoría → icono (`src/theme/categoryIcons.js`) con `resolveCategoryMeta()`, que reemplaza la lógica `custom_` duplicada en Gastos, Ingresos y Presupuestos.
  - Las listas, chips de filtro, presupuestos y recurrentes muestran el icono de la categoría (`CategoryAvatar`) en vez de iniciales o números.
  - Encabezados unificados con `GradientIcon` (antes convivían dos estilos); `TONE_BY_PALETTE` reemplaza dos mapas de tonos duplicados.
  - 16 categorías con icono repetido o poco claro ahora tienen uno propio (p. ej. Cripto → `CurrencyBitcoin`, Comisiones → `Percent`, Impuestos → `Gavel`, Contenido → `SmartDisplay` en vez del logo de YouTube).
  - Selector de icono (`IconPicker`) para metas (antes, texto libre) y para categorías personalizadas (antes, solo un punto de color).
  - Grupos del selector de categorías con iconos en vez de emojis.
  - Favicon propio: el anterior era el logo de Vite.
- Columna `custom_categories.icon` en `schema.sql` (⚠ ejecutar el `ALTER TABLE` en Supabase antes de desplegar; sin ella, las categorías se guardan sin icono).

### Eliminado
- Restos de la plantilla de Vite (`index.html`, `src/assets/hero.png`, `public/icons.svg`) y `ErrorBoundary.jsx`, que no se usaba.
