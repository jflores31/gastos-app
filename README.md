# Gastos App - Expense Tracker

Personal finance application to track income and expenses with budget management.

## Features

### Dashboard (OverviewTab)
- Monthly summary with total income, expenses, and balance
- Health score gauge (visual indicator for financial health)
- Trend comparison vs previous month
- Cashflow chart (StudioCashflow) showing income vs expenses over time
- Spending breakdown by category with donut chart

### Expense Categories
- 33+ predefined categories (Food, Transport, Entertainment, etc.)
- Color-coded category icons
- Multi-language support (Spanish/English)

### Budget Management (BudgetTab)
- Set monthly budgets per category
- Progress bars with smooth animations showing spending vs budget
- Alerts at 80% threshold (yellow) and over-budget (red)
- **CRUD Operations:**
  - Edit existing budgets inline
  - Delete budgets
  - Add new budget categories via management dialog
- Donut chart for expense distribution (top 5 categories)
- Comparison with previous month
- Health score calculation

### Goals Tab (Metas)
- **Savings Goals (CRUD):** Create, edit, delete savings goals with deadline tracking
- **Accounts Management:** Add, edit, delete bank accounts and credit cards
- **Net Worth Tracking:** Real-time calculation of assets vs debts
- **Family Spending Split:** Visual breakdown of spending by family member
- **3-Month Forecast:** Projected savings based on trends
- **Investments Overview:** Track AFP, DPF, savings, crypto with returns
- **Debt Control:** Monitor loans with progress and remaining installments
- **Subscriptions Tracker:** Monthly recurring payments (Netflix, Spotify, etc.)
- **Net Worth Evolution:** 6-month history chart
- Date picker for goal deadlines

### Expenses Tab
- Category-based expense filtering
- Today's expenses summary
- Transaction list with category icons
- Scrollable list with max-height for performance
- Empty state when no transactions

### Income Tab
- Income by category breakdown
- Transaction list with income indicators
- Income trend sparkline
- Empty state when no income

## Tech Stack

- React 19 + Vite
- Material UI (MUI) v9
- MUI X Date Pickers (dayjs adapter)
- React Context for state management
- LocalStorage for data persistence

## Project Structure

```
src/
├── components/
│   ├── DashboardStudio.jsx    # Main app with tabs navigation
│   ├── OverviewTab.jsx       # Dashboard with cashflow charts
│   ├── ExpensesTab.jsx       # Expense tracking and lists
│   ├── IncomeTab.jsx         # Income tracking and lists
│   ├── BudgetTab.jsx         # Budget management
│   ├── GoalsTab.jsx         # Savings goals, accounts, investments
│   ├── Charts.jsx           # Donut, SparkArea, StudioCashflow, HeatCalendar
│   ├── shared.jsx           # Reusable components (StatsCard, EmptyState)
│   └── ...
├── context/
│   ├── DataContext.jsx       # Transaction and budget state
│   └── SettingsContext.jsx   # Language and currency settings
├── data/
│   ├── index.js              # Categories, budgets, transactions
│   └── helpers.js            # Utility functions
├── theme/
│   └── materialTheme.js       # MUI theme configuration
├── hooks/
│   └── useLocalStorage.js    # Custom hook for localStorage
└── App.jsx                   # Root component
```

## Running

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Frontend Improvements (Phases 1-3)

### Phase 1: Critical Fixes
- GoalsTab: Responsive minHeight (`{ xs: 280, sm: 320, md: 350 }`)
- GoalsTab: Equal card layout (md={4} for all 3 cards)
- OverviewTab: Grid columns with additional breakpoints

### Phase 2: UX Improvements
- BudgetTab: Smooth progress bar animations (0.8s ease-in-out)
- BudgetTab: Donut chart labels with tooltip and text truncation
- BudgetTab: Tooltips for better interaction
- ExpensesTab: Lists with max-height (400px) and scroll

### Phase 3: Consistency
- **StatsCard component:** Reusable card with consistent styling
- **EmptyState component:** Generic empty state for lists
- **NoTransactions component:** Specific empty state for transactions
- Standardized empty states in ExpensesTab and IncomeTab

## Components Library (shared.jsx)

### StatsCard
```jsx
<StatsCard 
  title="Title"
  subtitle="Subtitle"
  icon={<Icon />}
  iconColor="success"
  topBorderColor="success.main"
  minHeight={280}
>
  {/* content */}
</StatsCard>
```

### EmptyState
```jsx
<EmptyState 
  icon={<Icon />}
  title="No data"
  subtitle="Description"
/>
```

### NoTransactions
```jsx
<NoTransactions lang="es" type="expense" /> // or "income"
```

## Recent Changes

- Complete rewrite of BudgetTab.jsx with proper JSX structure
- Added budget management dialog (edit, delete, add)
- Health score gauge with SVG arc visualization
- Alert chips at 80% threshold
- Donut chart for expense distribution
- Comparison with previous month
- Recurring expenses card
- Uniform card heights with flexbox
- Date picker for goal deadlines (MUI X Date Pickers)
- CRUD for savings goals and accounts
- Investments, debts, subscriptions tracking
- Net worth evolution chart
- Responsive design improvements
- Empty states for transactions
- Smooth animations on progress bars

## Data Persistence

- Transactions stored in LocalStorage (`gastos-userTxs`)
- Budgets stored in LocalStorage (`gastos-budgets`)
- Default data loaded from `src/data/index.js`

## Language Support

Full Spanish/English support via SettingsContext:
- Category names
- UI labels and buttons
- Date formats (DD/MM/YYYY or MM/DD/YYYY)
- Currency formatting

## Browser Support

- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design with BottomNavigation
- Touch-friendly interactions

## License

MIT