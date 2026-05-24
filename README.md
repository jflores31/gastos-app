# Finanzas - Gestión Personal

Aplicación de finanzas personales para rastrear ingresos, gastos, presupuestos y metas de ahorro. Construida con Next.js 14, Material UI v9, y NextAuth v5.

## Características

### Autenticación
- Login con email/contraseña (cuenta demo: `demo@finanzas.app` / `demo1234`)
- Login con Google y GitHub (OAuth)
- Registro de nuevos usuarios
- Recuperación de contraseña (flujo completo con token)
- Middleware que redirige a `/login` si no hay sesión activa

### Dashboard (OverviewTab)
- Resumen mensual con ingresos, gastos y balance neto
- Health score gauge (0-100) con arco SVG
- Gráfico de flujo de caja (StudioCashflow) — ingresos vs gastos por mes
- Desglose de gastos por categoría con gráfico donut
- Insights automáticos (IA-style) basados en tus datos
- Heat calendar de gastos diarios
- Comparación vs mes anterior con barras de progreso
- Selector de período (semana, mes, trimestre, año)

### Gastos (ExpensesTab)
- Gastos de hoy con detalle por transacción
- Top categorías con filtros y barras de progreso
- Presupuesto vs real por categoría
- Resumen del período (total, transacciones, promedio diario, mayor gasto)
- Lista completa de transacciones con filtrado por categoría
- Total general con barra destacada

### Ingresos (IncomeTab)
- Tarjeta de ingresos totales con sparkline
- Grid de categorías de ingreso con porcentajes
- Gráfico donut de distribución de ingresos
- Tendencia de ingresos con StudioCashflow
- Lista de transacciones de ingreso
- Total general

### Presupuestos (BudgetTab)
- Health score gauge visual
- Tarjetas de presupuesto por categoría con progreso
- Donut de distribución de gastos
- Comparación con mes anterior
- Gastos recurrentes
- CRUD de presupuestos (crear, editar, eliminar)
- Alertas en 80% y 100% del presupuesto

### Metas (GoalsTab)
- CRUD de metas de ahorro con fecha límite (DatePicker)
- Gestión de cuentas bancarias y tarjetas
- Patrimonio neto (activos - deudas) en tiempo real
- División de gastos por miembro de familia
- Pronóstico de 3 meses
- Seguimiento de inversiones (AFP, DPF, crypto)
- Control de deudas y préstamos
- Suscripciones recurrentes
- Evolución del patrimonio (6 meses)

### Configuración (SettingsPanel)
- Tema claro/oscuro con transición instantánea
- 4 paletas de acento (Amber, Indigo, Green, Mono)
- Densidad Comfy/Compact
- Idioma Español/Inglés
- 8 monedas (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL)

### Diseño Responsivo
- Navegación por tabs en desktop, BottomNavigation en móvil
- Grid adaptivo con breakpoints (xs, sm, md, lg)
- Diálogos y modales responsivos
- Modales de agregar transacción y login

## Tecnologías

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | Material UI (MUI) v9 |
| Auth | NextAuth v5 (Credentials + Google + GitHub) |
| Database ORM | Prisma v6 (MySQL/PlanetScale) |
| Date Picker | MUI X Date Pickers + dayjs |
| Animations | Framer Motion |
| State | React Context + localStorage |
| Email | Resend (pendiente integración) |
| Lenguaje | TypeScript (rutas) + JSX/JavaScript (componentes) |

## Estructura del Proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                 # Root layout con Providers
│   ├── page.tsx                   # Home → DashboardStudio
│   ├── globals.css                # Estilos globales
│   ├── login/page.tsx             # Página de login
│   ├── register/page.tsx          # Página de registro
│   ├── forgot-password/page.tsx    # Recuperar contraseña
│   ├── reset-password/page.tsx     # Resetear contraseña
│   ├── api/auth/                  # API routes
│   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   ├── register/route.ts      # Registro de usuarios
│   │   ├── forgot-password/route.ts # Generar token de reset
│   │   └── reset-password/route.ts  # Validar token y resetear
│   └── components/
│       ├── Providers.tsx           # SessionProvider → Settings → Data → Theme
│       └── DynamicThemeProvider.tsx # Tema MUI dinámico + CSS vars
├── components/                    # Componentes UI
│   ├── DashboardStudio.jsx        # Shell principal con tabs y AppBar
│   ├── OverviewTab.jsx            # Dashboard overview
│   ├── ExpensesTab.jsx            # Pestaña de gastos
│   ├── IncomeTab.jsx              # Pestaña de ingresos
│   ├── BudgetTab.jsx              # Pestaña de presupuestos
│   ├── GoalsTab.jsx               # Pestaña de metas y cuentas
│   ├── Charts.jsx                 # SVG charts (Donut, SparkArea, Cashflow, HeatMap)
│   ├── shared.jsx                 # StatsCard, EmptyState, NoTransactions, TxTable
│   ├── AddTransactionModal.jsx    # Modal de nueva transacción
│   ├── SettingsPanel.jsx          # Drawer de configuración
│   ├── LoginModal.jsx             # Modal de login (in-app)
│   └── ErrorBoundary.jsx          # Error boundary
├── context/
│   ├── DataContext.jsx             # Estado de transacciones y presupuestos
│   └── SettingsContext.jsx         # Tema, idioma, moneda, paleta, densidad
├── data/
│   ├── index.js                    # Categorías, monedas, i18n, seed data
│   └── helpers.js                  # Filtros de período, health score, insights
├── theme/
│   └── materialTheme.js            # Temas light/dark + paletas de acento
├── hooks/
│   └── useLocalStorage.js          # Hook para persistir estado en localStorage
├── lib/
│   ├── auth.ts                     # NextAuth config (demo user + OAuth)
│   └── db.ts                       # Prisma client singleton
└── middleware.ts                    # Protección de rutas (redirect a /login)
```

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

La app estará disponible en `http://localhost:3000`.

### Cuenta Demo

Para probar sin crear una cuenta:

- **Email:** `demo@finanzas.app`
- **Contraseña:** `demo1234`

O haz clic en **"Usar cuenta demo"** en la página de login.

### Variables de Entorno

Crear un archivo `.env.local` con:

```env
NEXTAUTH_SECRET=tu-secret-aqui
NEXTAUTH_URL=http://localhost:3000

# OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Base de datos (para producción)
DATABASE_URL=mysql://user:password@host:3306/db

# Email (para recuperación de contraseña)
RESEND_API_KEY=
```

## Tema Oscuro

El modo oscuro es completamente funcional:

- Todos los componentes usan tokens de tema MUI (`background.paper`, `text.primary`, `action.hover`, etc.)
- Variables CSS dinámicas (`--accent`, `--income`, `--expense`, `--bg`) se actualizan con el tema activo
- Los SVG charts (SparkArea, StudioCashflow, HeatCalendar) se adaptan al tema
- 4 paletas de acento: Amber, Indigo, Green, Mono
- Cambio instantáneo entre claro/oscuro sin recarga

## Autenticación

El middleware protege todas las rutas excepto las páginas de auth y APIs:

- `/login` — Formulario de login con demo, Google y GitHub
- `/register` — Registro de nuevos usuarios
- `/forgot-password` — Solicitud de reset de contraseña
- `/reset-password` — Reset de contraseña con token válido

Los usuarios autenticados son redirigidos al dashboard al intentar acceder a páginas de auth.

## Base de Datos

El schema de Prisma incluye modelos para:

- **User** — Usuarios con email, password (bcrypt), name, image
- **Account** — Cuentas OAuth vinculadas
- **Session** — Sesiones de NextAuth
- **Transaction** — Transacciones (INGRESO/EGRESO) con categoría, concepto, valor, fecha
- **Budget** — Presupuestos mensuales por categoría
- **Goal** — Metas de ahorro con target, progreso y deadline
- **AccountFinancial** — Cuentas bancarias/tarjetas con balance

> Actualmente la app funciona con datos seed en localStorage. La integración con Prisma/PlanetScale está preparada pero pendiente de conectar al DataContext.

## Despliegue

La app está configurada para despliegue en Vercel:

```bash
# Build de producción
npm run build

# Las variables de entorno se configuran en Vercel Dashboard
```

## Licencia

MIT