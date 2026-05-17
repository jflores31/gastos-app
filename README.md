# Gastos App - Expense Tracker

Personal finance application to track income and expenses with budget management.

## Features

### Dashboard
- Monthly summary with total income, expenses, and balance
- Health score gauge (visual indicator for financial health)
- Trend comparison vs previous month

### Expense Categories
- 33+ predefined categories (Food, Transport, Entertainment, etc.)
- Color-coded category icons
- Multi-language support (Spanish/English)

### Budget Management
- Set monthly budgets per category
- Progress bars showing spending vs budget
- Alerts at 80% threshold (yellow) and over-budget (red)
- Edit existing budgets
- Delete budgets
- Add new budget categories

### Charts
- Donut chart for expense distribution (top 5 categories)
- Visual percentage breakdown

### Recurring Expenses
- List of fixed monthly payments
- Shows day of month, concept, and amount

## Tech Stack

- React + Vite
- Material UI (MUI)
- Chart.js (via Charts component)
- Local state management

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx      # Main dashboard
│   ├── BudgetTab.jsx      # Budget management (edit, add, delete budgets)
│   ├── Charts.jsx         # Donut chart component
│   └── ...
├── data/
│   └── index.js           # Categories, budgets, transactions data
├── utils/
│   └── format.js          # Currency formatting helpers
├── App.jsx                # Main app with tabs
└── main.jsx               # Entry point
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

## Recent Changes

- Complete rewrite of BudgetTab.jsx with proper JSX structure
- Added budget management dialog (edit, delete, add)
- Health score gauge with SVG arc visualization
- Alert chips at 80% threshold
- Donut chart for expense distribution
- Comparison with previous month
- Recurring expenses card
- Uniform card heights with flexbox