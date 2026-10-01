# Características

🌐 **Español** · [English](FEATURES.en.md)

Todo lo que hace la app, por pantalla. Resumen en el [README](../README.md).

## Autenticación
- Login con email/contraseña
- Registro con nombre, apellidos y email — confirmación por email
- Recuperación de contraseña completa (forgot → email → reset con detección de enlace expirado)
- Protección de rutas doble capa: `src/proxy.ts` (server) + `router.replace` en `DashboardStudio` (client)
- Auto-logout por inactividad (2, 5, 15 o 30 minutos, se elige en Ajustes; 2 por defecto) con aviso 30 s antes, medido entre todas las pestañas (una pestaña inactiva no cierra la sesión si estás activo en otra)
- Cierre forzado al reabrir el navegador: `UserContext` escribe el flag `gastos_session_alive` en `sessionStorage` al detectar `SIGNED_IN`; `DashboardStudio` lo verifica al montar. Si falta, pregunta por `BroadcastChannel` a las otras pestañas: si alguna responde (pestaña nueva con el navegador abierto) hereda el flag; si no (navegador reabierto) cierra la sesión solo en este navegador (`scope: "local"`)
- Pestaña abierta >8 h: `checkSessionAge` lee `gastos_last_active` (localStorage) al recuperar visibilidad (`visibilitychange` + `pageshow` para bfcache) y cierra sesión si supera el límite

**Sistema de diseño unificado en todas las páginas de auth — soporta tema claro y oscuro:**

| Página | Acento | Estado especial |
|---|---|---|
| `login` | Índigo `#6366f1` | — |
| `register` | Verde `#22c55e` | Success: tarjeta con checkmark |
| `forgot-password` | Sky `#38bdf8` | Success: email resaltado, instrucciones sobre spam |
| `reset-password` | Ámbar `#f59e0b` | 4 estados: loading, expired, form, success |

En modo oscuro: fondo `#07080f`, 3 blobs de gradiente radial, tarjeta de vidrio (`backdropFilter: blur(36px)`), borde semitransparente, sombra profunda, inputs con focus coloreado. En modo claro: fondo `background.default`, tarjeta `background.paper`, sombras suaves de color.

## Dashboard (OverviewTab)
- Saludo dinámico por hora del día + nombre del usuario logueado
- Resumen del período: ingresos, gastos y balance neto
- Health score gauge (0–100) con arco SVG
- Gráfico de flujo de caja (ingresos vs gastos por mes)
- Desglose de gastos por categoría con gráfico donut
- Heat calendar de gastos diarios
- Comparación vs período anterior con barras de progreso — oculta en "todo", muestra "Sin datos" si no hay transacciones previas; etiqueta dinámica según período activo
- **Mini cards de ingresos y gastos:** chip `+X.X% vs ant.` se muestra solo si hay período anterior con datos (`delta != null`); sub-etiqueta "N registros / N gastos" con singular/plural bilingüe; ambas cards usan `CategoryBars` — lista de barras horizontales (top 5) con dot de color, nombre, monto exacto y barra proporcional a la categoría más grande
- Selector de período: semana, mes, trimestre, año (con `flexWrap` para pantallas pequeñas)
- Insight "Proyección" proporcional al período activo (usa `daysCount(period)` como divisor)

## Gastos (ExpensesTab)
- Gastos de hoy con detalle por transacción
- Top categorías con icono, posición y barras de progreso
- Presupuesto vs real — muestra las categorías del presupuesto activo (`editBudgets`), no hardcoded; mensaje "Sin presupuestos" si no hay ninguno
- Resumen del período (total, transacciones, promedio diario, mayor gasto) — **todos reflejan el filtro activo**; barras de progreso con valores relativos significativos (sin barra para el conteo)
- Promedio diario calculado con `daysCount(period)` (7/30/90/365 según período)
- Mayor gasto = máximo de las transacciones filtradas
- Lista completa con el icono de cada categoría, edición y eliminación (confirmación de borrado)
- Filtrado por categoría con chips que muestran el icono; se combina con el calendario (igual que en Ingresos)
- **CalendarFilter:** mapa de calor interactivo — vista por día y mes con intensidad proporcional; click filtra la lista, el footer muestra el total filtrado con etiqueta "(filtrado)"
- Footer total actualiza en tiempo real al aplicar cualquier filtro
- Fecha y hora completa en cada transacción
- **Cuenta de cada transacción (opcional):** el formulario tiene un selector de cuenta cuando hay alguna; su saldo la incluye, y la lista la muestra junto a la fecha ("· BCP")
- **Moneda de cada transacción:** el formulario tiene un selector de moneda junto al monto (por defecto, la de Ajustes) y muestra el equivalente ("≈ S/200"). Se guarda el monto en PEN y, además, la moneda, lo escrito y la tasa de ese día. La lista muestra lo escrito junto a la fecha ("· €50") cuando la app está en otra moneda, y exactamente lo escrito cuando está en la misma. Al editar se abre en su moneda y conserva su tasa, salvo que se cambie la moneda

## Ingresos (IncomeTab)
- Tarjeta de ingresos totales con sparkline; chip `+X.X% vs ant.` oculto cuando no hay período anterior (`dIn = null`)
- Grid de categorías con icono, porcentajes y donut — nombre, color e icono vía `resolveCategoryMeta` (nativas y personalizadas); tarjetas interactivas para filtrar por fuente
- Tendencia mensual con leyenda completa: ingreso / egreso / neto
- **CalendarFilter** en color verde (success)
- Footer total actualiza en tiempo real al aplicar cualquier filtro
- Lista de transacciones con edición y eliminación; avatar con el icono y el color de cada categoría

## Presupuestos (BudgetTab)
- Health score gauge visual
- Tarjetas por categoría con icono, progreso y alertas al 80% y 100%
- Donut de distribución de gastos — **apila verticalmente en mobile** (columna en xs, fila en sm+)
- **Gráfica "Presupuesto vs Gasto real":** barras horizontales por categoría, coloreadas verde/amarillo/rojo; barras al 100%+ con patrón de rayas diagonales; footer con totales
- Comparación con período anterior — etiqueta dinámica según período activo (semana/mes/trimestre/año)
- CRUD de presupuestos — exclusivamente desde Supabase; selector incluye categorías personalizadas (custom) además de las nativas

## Metas y Finanzas (GoalsTab)
- CRUD de metas de ahorro con fecha límite, color e icono elegible (`IconPicker`) — formulario con nombre único
- Cuentas bancarias/tarjetas/efectivo con **saldo calculado**: el saldo que se escribe vale desde ese momento, y la app le suma los ingresos y le resta los gastos asociados a la cuenta y las **transferencias** (botón ⇄), que mueven dinero entre cuentas sin contar como ingreso ni gasto. Las últimas 5 se listan con su nota y se pueden borrar. Borrar una cuenta deja sus movimientos sin cuenta, sin cambiar el saldo de las otras
- Patrimonio neto en tiempo real (`netWorthOf()`): activos (saldos positivos de cuentas + inversiones) − deudas (saldos negativos + préstamos)
- Seguimiento de inversiones (AFP, DPF, cripto, etc.) — formulario con nombre único
- Control de deudas y préstamos con cuotas — formulario con campo de nombre único (guarda en ambos idiomas automáticamente)
- Suscripciones recurrentes con selector de categoría (nativas + personalizadas); botón "Agregar / Add" bilingüe en estados vacíos. Cada una muestra el icono y el color de su categoría en vez de un logo (un servicio de logos sabría qué pagas), y el nombre sugiere la categoría ("Netflix" → Streaming), sin reemplazar una elegida a mano
- **Pronóstico de 3 meses** basado en tendencia lineal real (slope de los últimos 6 meses de netos reales); 3 estados según historial disponible: "Sin datos" (0 meses), "Se necesitan al menos 2 meses" + promedio actual (1 mes), barras reales con `+trend×i` (2+ meses); nota "Tendencia estable · N meses" si `|trend| < 1`; total proyectado = suma real de los 3 meses
- **Evolución del patrimonio** reconstruye historial real trabajando hacia atrás desde `netWorth` actual

## Perfil y Configuración (SettingsPanel)
Drawer con **dos pestañas** que separan Perfil de Ajustes:
- **Perfil:** hero con avatar, nombre y email; **Datos personales** (editar nombre y apellidos — se guardan como `first_name`/`last_name` + `full_name` sincronizado); **Categorías Favoritas** (aparecen primero en el selector de transacciones) y **Mis Categorías** (CRUD de categorías propias — nombre, tipo, color e icono — en Supabase); **Verificación en dos pasos** (TOTP: se activa con un código QR o la clave y un primer código, y se desactiva con confirmación)
- **Ajustes:** tema claro/oscuro, paletas de acento (puntos con `flexWrap` en mobile), densidad Comfy/Compact, idioma Español/Inglés, 8 monedas (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL). Los montos se guardan siempre en PEN y se muestran con las **tasas del día** (`/api/rates`; si el proveedor no responde, las fijas de `CURRENCIES`). Debajo de la moneda se ve de qué día son y la cotización ("1 USD = S/3.85")
- El **avatar** de la AppBar abre Perfil; el **engranaje** abre Ajustes (prop `initialTab`)
- **Toggle día/noche en el login** (`AuthThemeToggle`): el usuario elige tema antes de entrar; persiste en `localStorage`

## Privacidad, exportación y app instalable
- **Modo privacidad:** el botón del ojo en la barra superior oculta todos los montos ("S/••••"). Se recuerda en el navegador. Los montos se formatean con `fmt()` de `useSettings()`, que ya conoce la moneda y este modo.
- **Tus datos (Perfil):**
  - las transacciones se descargan en CSV (UTF-8 con BOM para Excel, montos en PEN junto con la moneda, lo escrito, la tasa y la cuenta de cada una, celdas protegidas contra fórmulas); al importarlo, la cuenta se reconoce por su nombre;
  - todo se descarga como copia completa en JSON (`src/features/import-export/domain/export.ts`).
- **Papelera (Perfil → Tus datos):**
  - borrar una transacción no pide confirmación: va a la papelera (`deleted_at`) y un aviso ofrece "Deshacer" durante 6 segundos;
  - desde la papelera se restaura o se elimina definitivamente (con confirmación), una por una o todas;
  - a los 30 días se eliminan solas: `DataContext` las borra al cargar los datos;
  - las borradas no cuentan en ningún total, exportación ni importación.
- **App instalable:** `src/app/manifest.ts` y los iconos de `public/icons/`, generados con `node scripts/generate-icons.mjs`. Chrome, Edge y Android ofrecen "Instalar app"; iOS, "Agregar a pantalla de inicio". No hay Service Worker a propósito (ver [Solución de problemas](DEPLOYMENT.md#solución-de-problemas)).

## Registrar más rápido
- **Categoría sugerida por el concepto:** al escribir el concepto de una transacción nueva, si todavía no elegiste categoría, se completa sola (`suggestCategory()` en `src/domain/categories/suggest.ts`):
  - primero con la categoría que más usaste con ese mismo concepto (sin importar mayúsculas ni tildes);
  - si no hay historial, con la categoría del catálogo cuyo nombre o conceptos aparecen en el texto ("pago netflix" → Streaming);
  - si dos categorías empatan, no sugiere nada;
  - una categoría elegida a mano nunca se reemplaza, y debajo del campo se indica de dónde salió la sugerencia.
- **Importar CSV (Perfil → Tus datos):**
  - **Formatos:** el CSV que exporta la app se reconoce solo; en un archivo de banco o una planilla se elige qué columna es la fecha, el concepto y el monto (se proponen por el nombre de la cabecera).
  - **Qué entiende:** separador `,` o `;`, fechas `AAAA-MM-DD` o `DD/MM/AAAA`, y montos como `1,234.56`, `1.234,56` o `-S/ 45`.
  - **Tipo y categoría:** sin columna de tipo, el signo del monto decide si es ingreso o egreso. La categoría sale del archivo, de la sugerencia por concepto o de una categoría por defecto que se elige en la vista previa.
  - **Vista previa:** cuántas filas son nuevas, cuántas ya estaban registradas (mismo día, concepto, monto y tipo) y cuáles tienen errores, con su número de línea. Las ya registradas se omiten salvo que se pida lo contrario, así que reimportar un archivo no duplica nada.
  - **Guardado:** `addTxs()` inserta en lotes de 500; si uno falla, avisa cuántas se guardaron. Límites: 5 MB y 10.000 filas. Código: `src/features/import-export/domain/csvImport.ts` y `ImportDialog.jsx`.

- **Próximos pagos (Presupuesto):** lo que vence desde hoy hasta el mismo día del mes que viene (`upcomingPayments()` en `features/budgets/domain/recurring.ts`), así cada pago mensual aparece una sola vez:
  - **Gastos que se repiten 3 meses o más:** vencen el día en que sueles pagarlos. Si ya lo registraste este mes, pasan al mes siguiente; si el día pasó y no está registrado, salen como "Vencido".
  - **Suscripciones:** una con el mismo nombre que un gasto repetido (Netflix) se une a él, con el precio de la suscripción. Las demás se fechan con su último pago (+1 mes o +1 año); una mensual nunca pagada aparece "Sin fecha".
  - **Registrar:** abre el formulario con la categoría, el concepto y el monto ya puestos.

## Presupuestos por período
- **Período:** cada presupuesto es semanal, mensual o anual; se elige en "Gestionar" al crearlo o editarlo.
- **Escala al período que se ve:** `budgetFor()` usa los meses de `monthCount` (semana 0,25, trimestre 3, año 12), así un presupuesto mensual se ve como siempre. La tarjeta de uno que no es del período que se ve muestra también su monto propio ("S/100/semana").
- **Alertas al 80 % y al 100 %:** `budgetAlerts()` mide lo gastado en el período del propio presupuesto (esta semana, este mes o este año):
  - Presupuesto muestra arriba una franja con los que están al límite;
  - al guardar, editar o importar un gasto que cruza uno de esos umbrales aparece un aviso ("Llegaste al 85 % del presupuesto de Salud y farmacias");
  - lo que ya estaba pasado al cargar los datos no avisa.

## Diseño Responsivo
- Navegación por tabs en desktop, `BottomNavigation` fija en móvil
- Chips de período con `flexWrap: "wrap"` — no desbordan en iPhone SE (320px)
- Drawer de ajustes: 100% ancho en móvil, 360px en desktop
- Donut de distribución en BudgetTab: columna en xs, fila en sm+
- Formularios de auth apilados verticalmente en pantallas pequeñas
- Touch targets mínimo 40×44 px en todos los botones de acción
- Snackbar posicionado sobre `BottomNavigation` en móvil (`bottom: { xs: 72, sm: 24 }`)
- Accesibilidad por teclado: `CalendarFilter` (celdas día/mes), sección "Gastos de hoy" (ExpensesTab) y filas de deudas/suscripciones (GoalsTab) tienen `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space)
