# Gastos App - Documentacion de Avances

## Proyecto
App personal de finanzas con React + Vite + MUI (Material Design 3).

## Objetivo
Dashboard con layout full-width responsivo, cards compactas alineadas verticalmente, sin espacio vacio horizontal.

---

## Cambios Realizados

### 1. Error "useSettings must be used within SettingsProvider"
- **Archivo**: `src/main.jsx`
- **Cambio**: Se reestructuro el arbol de providers para que `SettingsProvider` envuelva correctamente a los componentes que usan `useSettings`.

### 2. Layout full-width (sin maxWidth: 1440)
- **Archivo**: `src/components/DashboardStudio.jsx`
- **Cambio**: Se elimino `maxWidth: 1440` del contenedor principal. Ahora el dashboard ocupa todo el ancho disponible.

### 3. Graficos responsivos
- **Archivo**: `src/components/Charts.jsx`
- **Cambio**: Donut, SparkArea y StudioCashflow ahora usan `width: 100%` y `height: auto` en sus SVGs para adaptarse al contenedor.

### 4. OverviewTab - CSS Grid en lugar de MUI Grid
- **Archivo**: `src/components/OverviewTab.jsx`
- **Cambio**: Se reemplazo MUI Grid por CSS Grid para control total del layout.
- **Fila 1**: `gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr 1fr 1fr" }` con `gap: 1.5`
- **Fila 2**: `gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" }` con `gap: 2`

### 5. Fila 1 - Cards con misma altura
- **Archivo**: `src/components/OverviewTab.jsx`
- **Cambio**: `alignItems: "start"` → `alignItems: "stretch"` para que las 5 cards (Balance + 4 mini cards) mantengan la misma altura uniforme.

### 6. Cards mini compactas
- **Archivo**: `src/components/OverviewTab.jsx`
- **Cambios**:
  - `CardContent`: padding `p: 2` → `p: 1.5`, layout flex column
  - Avatar: `32px` → `24px`, fontSize `14` → `12`
  - Labels: `noWrap` eliminado, `flex: 1` para llenar ancho disponible
  - Balance Typography: `h3` → `h4`
  - Balance CardContent padding: `p: 2` → `p: 1.5`

### 7. Stack spacing reducido
- **Archivo**: `src/components/OverviewTab.jsx`
- **Cambio**: Stack principal `spacing: 3` → `spacing: 2` para menos espacio vertical entre filas.

### 8. "vs mes anterior" fusionado en Heatmap card
- **Archivo**: `src/components/OverviewTab.jsx`
- **Cambio**: Se elimino la card separada "vs mes anterior" y se integro dentro de la card de Heatmap como seccion adicional.

### 9. Header compacto
- **Archivo**: `src/components/OverviewTab.jsx`
- **Cambio**: `gap: 2` → `gap: 1`, `alignItems: "flex-end"` → `"center"`

### 10. Tabs responsivos (Expenses, Income, Goals)
- **Archivos**: `src/components/ExpensesTab.jsx`, `src/components/IncomeTab.jsx`, `src/components/GoalsTab.jsx`
- **Cambio**: Breakpoints ajustados para full-width.

### 11. Card Flujo de caja - Titulo centrado con letra mas grande + etiquetas de colores
- **Archivo**: `src/components/OverviewTab.jsx`
- **Cambio**: 
  - Titulo "Flujo de caja" centrado con `variant="h5"` y `fontWeight={700}` (antes `variant="subtitle1"`)
  - Subtitulo "los ultimos 12 meses" centrado debajo
  - Chips (Ingresos, Egresos, Neto) reemplazados por etiquetas de texto con colores:
    - Ingresos: `color: "success.main"` (verde)
    - Egresos: `color: "error.main"` (rojo)
    - Neto: `color: "primary.main"` (azul)
  - Layout centrado con `textAlign: "center"` en lugar de `justifyContent: "space-between"`

---

## Estructura Actual del Layout

```
OverviewTab
├── Header (saludo + period selector)
├── Fila 1 - CSS Grid (2fr 1fr 1fr 1fr 1fr, alignItems: stretch)
│   ├── Balance Card (coloreado, con sparkline)
│   ├── Ingresos mini card
│   ├── Egresos mini card
│   ├── Ahorro mini card
│   └── Anomalias mini card
└── Fila 2 - CSS Grid (1fr 1fr 1fr 1fr)
    ├── Flujo de caja (titulo centrado h5, etiquetas de colores, grafica SVG)
    ├── Breakdown (Donut + categorias)
    ├── Insights (AI analysis)
    └── Heatmap + vs mes anterior (calendar + barras comparativas)
```

## Configuracion de Build
- Comando: `npm run build`
- Dev: `npm run dev` (http://localhost:5173)
- Bundle: ~770KB (gzip: ~234KB)

## Archivos Principales
| Archivo | Descripcion |
|---------|-------------|
| `src/components/OverviewTab.jsx` | Layout principal con CSS Grid, mini cards, flujo de caja centrado |
| `src/components/DashboardStudio.jsx` | Contenedor full-width |
| `src/components/Charts.jsx` | Donut, SparkArea, StudioCashflow, HeatCalendar |
| `src/components/ExpensesTab.jsx` | Tab de egresos |
| `src/components/IncomeTab.jsx` | Tab de ingresos |
| `src/components/GoalsTab.jsx` | Tab de metas |
| `src/context/SettingsContext.jsx` | Settings provider |
| `src/context/DataContext.jsx` | Data provider |
| `src/data/index.js` | Categorias, formateo, agrupacion |
| `src/data/helpers.js` | Filtros, periodos, scores, insights |

## Decisiones Clave
1. **CSS Grid > MUI Grid**: Layout de 5 columnas `2fr 1fr 1fr 1fr 1fr` no es posible con el sistema de 12 columnas de MUI Grid.
2. **"vs mes anterior" dentro de Heatmap**: Se integra como seccion en lugar de card separada para compactar el layout.
3. **alignItems: "stretch"**: Todas las cards de fila 1 comparten la misma altura.
4. **Etiquetas de colores en Flujo de caja**: Se reemplazaron los Chips de MUI por texto tipografico con colores semanticos (success/error/primary) para un look mas limpio.
5. **Titulo centrado h5**: "Flujo de caja" ahora es mas prominente y centrado sobre la grafica.