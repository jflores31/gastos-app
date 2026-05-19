# Gastos App - Expense Tracker

Aplicación de finanzas personales para rastrear ingresos y gastos con gestión de presupuestos.

## 🚀 Características Principales

### 📊 Dashboard (OverviewTab)
- Resumen mensual con ingresos, gastos y balance total
- Indicador de salud financiera (health score gauge)
- Comparación de tendencia vs mes anterior
- Gráfico de flujo de caja (StudioCashflow) mostrando ingresos vs gastos en el tiempo
- Desglose de gastos por categoría con gráfico donut

### 💰 Gestión de Gastos (ExpensesTab)
- Filtrado de gastos por categoría
- Resumen de gastos de hoy
- Lista de transacciones con iconos de categoría
- Lista desplazable con max-height para rendimiento
- Estado vacío cuando no hay transacciones

### 💵 Gestión de Ingresos (IncomeTab)
- Desglose de ingresos por categoría
- Lista de transacciones con indicadores de ingreso
- Sparkline de tendencia de ingresos
- Estado vacío cuando no hay ingresos

### 📈 Gestión de Presupuestos (BudgetTab)
- Establecer presupuestos mensuales por categoría
- Barras de progreso con animaciones suaves mostrando gasto vs presupuesto
- Alertas en umbral del 80% (amarillo) y sobre presupuesto (rojo)
- **Operaciones CRUD:**
  - Editar presupuestos existentes en línea
  - Eliminar presupuestos
  - Agregar nuevas categorías de presupuesto via diálogo de gestión
- Gráfico donut para distribución de gastos (top 5 categorías)
- Comparación con mes anterior
- Cálculo de health score

### 🎯 Pestaña de Metas (GoalsTab)
- **Metas de Ahorro (CRUD):** Crear, editar, eliminar metas de ahorro con seguimiento de fecha límite
- **Gestión de Cuentas:** Agregar, editar, eliminar cuentas bancarias y tarjetas de crédito
- **Seguimiento de Patrimonio Neto:** Cálculo en tiempo real de activos vs deudas
- **División de Gastos Familiares:** Desglose visual del gasto por miembro de familia
- **Pronóstico 3 meses:** Ahorros proyectados basados en tendencias
- **Resumen de Inversiones:** Seguimiento de AFP, DPF, ahorros, crypto con rendimientos
- **Control de Deudas:** Monitorear préstamos con progreso y cuotas restantes
- **Seguimiento de Suscripciones:** Pagos mensuales recurrentes (Netflix, Spotify, etc.)
- **Evolución del Patrimonio:** Gráfico de historial de 6 meses
- Selector de fecha para fechas límite de metas (MUI X Date Pickers)

### 📁 Categorías de Gastos
- 33+ categorías predefinidas (Comida, Transporte, Entretenimiento, etc.)
- Iconos codificados por color
- Soporte multilingüe (Español/Inglés)

## 🛠️ Tecnologías

- **Frontend:** React 19 + Vite
- **UI Framework:** Material UI (MUI) v9
- **Date Picker:** MUI X Date Pickers (adapter dayjs)
- **State Management:** React Context
- **Persistencia:** LocalStorage
- **Build Tool:** Vite

## 📂 Estructura del Proyecto

```
src/
├── components/
│   ├── DashboardStudio.jsx    # App principal con navegación de pestañas
│   ├── OverviewTab.jsx        # Dashboard con gráficos de flujo de caja
│   ├── ExpensesTab.jsx       # Seguimiento de gastos y listas
│   ├── IncomeTab.jsx         # Seguimiento de ingresos y listas
│   ├── BudgetTab.jsx         # Gestión de presupuestos
│   ├── GoalsTab.jsx          # Metas de ahorro, cuentas, inversiones
│   ├── Charts.jsx            # Donut, SparkArea, StudioCashflow, HeatCalendar
│   ├── shared.jsx            # Componentes reutilizables
│   ├── AddTransactionModal.jsx  # Modal para agregar transacciones
│   ├── SettingsPanel.jsx     # Panel de configuración
│   └── ErrorBoundary.jsx     # Manejo de errores
├── context/
│   ├── DataContext.jsx        # Estado de transacciones y presupuestos
│   └── SettingsContext.jsx   # Configuración de idioma y moneda
├── data/
│   ├── index.js              # Categorías, presupuestos, transacciones
│   └── helpers.js            # Funciones utilitarias
├── theme/
│   └── materialTheme.js     # Configuración del tema MUI
├── hooks/
│   └── useLocalStorage.js    # Hook personalizado para localStorage
├── App.jsx                   # Componente raíz
└── main.jsx                  # Punto de entrada
```

## 🚀 Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

## 📝 Mejoras Frontend (Fases 1-3)

### Fase 1: Correcciones Críticas
- GoalsTab: minHeight responsivo (`{ xs: 280, sm: 320, md: 350 }`)
- GoalsTab: Distribución igual de tarjetas (md={4} para las 3)
- OverviewTab: Columnas de grid con breakpoints adicionales

### Fase 2: Mejoras de UX
- BudgetTab: Animaciones suaves en barras de progreso (0.8s ease-in-out)
- BudgetTab: Etiquetas del gráfico donut con tooltip y truncamiento de texto
- BudgetTab: Tooltips para mejor interacción
- ExpensesTab: Listas con max-height (400px) y scroll

### Fase 3: Consistencia Visual
- **Componente StatsCard:** Tarjeta reutilizable con estilo consistente
- **Componente EmptyState:** Estado vacío genérico para listas
- **Componente NoTransactions:** Estado vacío específico para transacciones
- Estados vacíos estandarizados en ExpensesTab e IncomeTab

## 📦 Biblioteca de Componentes (shared.jsx)

### StatsCard
```jsx
<StatsCard 
  title="Título"
  subtitle="Subtítulo"
  icon={<Icono />}
  iconColor="success"
  topBorderColor="success.main"
  minHeight={280}
>
  {/* contenido */}
</StatsCard>
```

### EmptyState
```jsx
<EmptyState 
  icon={<Icono />}
  title="Sin datos"
  subtitle="Descripción"
/>
```

### NoTransactions
```jsx
<NoTransactions lang="es" type="gasto" /> // o "ingreso"
```

## 🔄 Persistencia de Datos

- Transacciones almacenadas en LocalStorage (`gastos-userTxs`)
- Presupuestos almacenados en LocalStorage (`gastos-budgets`)
- Datos por defecto cargados desde `src/data/index.js`

## 🌍 Soporte de Idiomas

Soporte completo Español/Inglés vía SettingsContext:
- Nombres de categorías
- Etiquetas y botones de UI
- Formatos de fecha (DD/MM/YYYY o MM/DD/YYYY)
- Formato de moneda

## 📱 Soporte de Navegadores

- Navegadores de escritorio (Chrome, Firefox, Safari, Edge)
- Diseño responsivo móvil con BottomNavigation
- Interacciones táctiles

## 🔧 Preparación para Backend

El proyecto está listo para integración con backend. Endpoints sugeridos:

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrarse
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Transacciones
- `GET /api/transactions?period=month` - Obtener transacciones
- `POST /api/transactions` - Crear transacción
- `PUT /api/transactions/:id` - Actualizar transacción
- `DELETE /api/transactions/:id` - Eliminar transacción

### Presupuestos
- `GET /api/budgets` - Obtener presupuestos
- `POST /api/budgets` - Crear presupuesto
- `PUT /api/budgets/:id` - Actualizar presupuesto
- `DELETE /api/budgets/:id` - Eliminar presupuesto

### Metas de Ahorro
- `GET /api/goals` - Obtener metas
- `POST /api/goals` - Crear meta
- `PUT /api/goals/:id` - Actualizar meta
- `DELETE /api/goals/:id` - Eliminar meta

### Cuentas
- `GET /api/accounts` - Obtener cuentas
- `POST /api/accounts` - Crear cuenta
- `PUT /api/accounts/:id` - Actualizar cuenta
- `DELETE /api/accounts/:id` - Eliminar cuenta

## 📋 Historial de Cambios Recientes

- Reescritura completa de BudgetTab.jsx con estructura JSX correcta
- Agregado diálogo de gestión de presupuestos (editar, eliminar, agregar)
- Health score gauge con visualización de arco SVG
- Chips de alerta en umbral del 80%
- Gráfico donut para distribución de gastos
- Comparación con mes anterior
- Tarjeta de gastos recurrentes
- Alturas de tarjetas uniformes con flexbox
- Selector de fecha para fechas límite de metas
- CRUD para metas de ahorro y cuentas
- Seguimiento de inversiones, deudas, suscripciones
- Gráfico de evolución del patrimonio neto
- Mejoras de diseño responsivo
- Estados vacíos para transacciones
- Animaciones suaves en barras de progreso

## 📄 Licencia

MIT