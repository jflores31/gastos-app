# Finanzas — Personal Finance

Personal finance application to track income, expenses, budgets, goals, and more. Deployed at **[www.jeshu.cfd](https://www.jeshu.cfd)**.

<!-- i18n-selector-start -->
🌐 [Español](README.md) · **English**
<!-- i18n-selector-end -->

## Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| UI | Material UI (MUI) v9 |
| Auth + DB | Supabase (email/password) |
| Date Picker | MUI X Date Pickers + dayjs |
| State | React Context + localStorage |
| Language | TypeScript (routes/config) + JSX (components) |
| Deploy | Vercel → `https://www.jeshu.cfd` |

## Features

### Authentication
- Login with email/password
- Registration with first name, last name, and email — email confirmation required
- Full password recovery flow (forgot → email → reset with expired link detection)
- Double-layer route protection: `src/proxy.ts` (server) + `router.replace` in `DashboardStudio` (client)
- Auto-logout on inactivity after 2 minutes with a 30 s warning
- Forced logout on browser reopen: `UserContext` writes the `gastos_session_alive` flag to `sessionStorage` on `SIGNED_IN` (covers email/password and OAuth); `DashboardStudio` checks it on mount — if missing (browser was closed) it calls `handleSignOut()` immediately before rendering the dashboard
- Tab left open >8 h: `checkSessionAge` reads `gastos_last_active` (localStorage) on focus recovery (`visibilitychange` + `pageshow` for bfcache) and signs out if the threshold is exceeded

**Unified design system across all auth pages — supports light and dark theme:**

| Page | Accent | Special state |
|---|---|---|
| `login` | Indigo `#6366f1` | — |
| `register` | Green `#22c55e` | Success: card with checkmark |
| `forgot-password` | Sky `#38bdf8` | Success: email highlighted, spam instructions |
| `reset-password` | Amber `#f59e0b` | 4 states: loading, expired, form, success |

Dark mode: background `#07080f`, 3 radial-gradient blobs, glass card (`backdropFilter: blur(36px)`), semi-transparent border, deep shadow, colored-focus inputs. Light mode: `background.default` background, `background.paper` card, soft color shadows.

### Dashboard (OverviewTab)
- Dynamic greeting by time of day + logged-in user name
- Period summary: income, expenses, and net balance
- Health score gauge (0–100) with SVG arc
- Cash flow chart (income vs expenses by month)
- Expense breakdown by category with donut chart
- Daily expense heat calendar
- Comparison vs previous period with progress bars — hidden on "all", shows "No data" if no prior transactions; dynamic label per active period
- **Income and expense mini cards:** `+X.X% vs prev.` chip shown only if previous period has data (`delta != null`); sub-label "N records / N expenses" with singular/plural and bilingual support; both cards use `CategoryBars` — horizontal bar list (top 5) with color dot, name, exact amount, and bar proportional to the largest category
- Period selector: week, month, quarter, year (with `flexWrap` for small screens)
- "Projection" insight proportional to the active period (uses `daysCount(period)` as divisor)

### Expenses (ExpensesTab)
- Today's expenses with per-transaction detail
- Top categories with progress bars
- Budget vs actual — shows categories from the active budget (`editBudgets`), not hardcoded; "No budgets" message if none configured
- Period summary (total, transactions, daily average, largest expense) — **all reflect the active filter**; progress bars with meaningful relative values (no bar for the count item)
- Daily average calculated with `daysCount(period)` (7/30/90/365 per period)
- Largest expense = maximum of the filtered transactions
- Full list with edit and delete (delete confirmation)
- Filter by category
- **CalendarFilter:** interactive heat map — day and month views with proportional intensity; click filters the list, footer shows filtered total with "(filtered)" label
- Footer total updates in real time when any filter is applied
- Full date and time per transaction

### Income (IncomeTab)
- Total income card with sparkline; `+X.X% vs prev.` chip hidden when no previous period (`dIn = null`)
- Category grid with percentages and donut — real colors from `CATEGORIES.income[k].color` and custom categories; interactive cards to filter by source
- Monthly trend with full legend: income / expenses / net
- **CalendarFilter** in green (success)
- Footer total updates in real time when any filter is applied
- Transaction list with edit and delete; avatars with correct colors per category

### Budgets (BudgetTab)
- Visual health score gauge
- Per-category cards with progress and alerts at 80% and 100%
- Expense distribution donut — **stacks vertically on mobile** (column on xs, row on sm+)
- **"Budget vs Actual" chart:** horizontal bars per category, colored green/yellow/red; bars at 100%+ with diagonal stripe pattern; footer with totals
- Comparison with previous period — dynamic label per active period (week/month/quarter/year)
- Budget CRUD — exclusively from Supabase; selector includes custom categories in addition to native ones

### Goals & Finances (GoalsTab)
- Savings goal CRUD with deadline — form with single name field
- Bank account / card / cash management
- Net worth (assets − debts) in real time
- Investment tracking (AFP, DPF, crypto, etc.) — form with single name field
- Debt and loan tracking with installments — form with single name field (saves in both languages automatically)
- Recurring subscriptions with category selector (native + custom); bilingual "Add" button in empty states
- **3-month forecast** based on real linear trend (OLS slope of last 6 months of net values); 3 states based on available history: "No data" (0 months), "At least 2 months needed" + current average (1 month), real bars with `+trend×i` (2+ months); "Stable trend · N months" note if `|trend| < 1`; projected total = real sum of the 3 months
- **Net worth evolution** reconstructs real history working backward from current `netWorth`

### Settings (SettingsPanel)
- Light/dark theme
- Accent palettes (dots with `flexWrap` to avoid overflow on mobile)
- Comfy/Compact density
- Spanish/English language
- 8 currencies (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL)
- **Favorite Categories:** appear first in the transaction selector
- **My Categories:** CRUD for custom categories (name, type, color) in Supabase

### Responsive Design
- Tab navigation on desktop, fixed `BottomNavigation` on mobile
- Period chips with `flexWrap: "wrap"` — no overflow on iPhone SE (320px)
- Settings drawer: 100% width on mobile, 360px on desktop
- Distribution donut in BudgetTab: column on xs, row on sm+
- Auth forms stacked vertically on small screens
- Touch targets minimum 40×44 px on all action buttons
- Snackbar positioned above `BottomNavigation` on mobile (`bottom: { xs: 72, sm: 24 }`)
- Keyboard accessibility: `CalendarFilter` (day/month cells), "Today's expenses" section (ExpensesTab), and debt/subscription rows (GoalsTab) have `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout con Providers + IBM Plex Sans
│   ├── page.tsx                    # Home → DashboardStudio
│   ├── globals.css                 # Estilos globales (overflow-x: hidden, etc.)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── components/
│       ├── Providers.tsx           # UserContext → Settings → Data → Theme
│       └── DynamicThemeProvider.tsx
├── components/
│   ├── DashboardStudio.jsx         # Shell: AppBar, tabs, BottomNav, inactividad
│   ├── OverviewTab.jsx             # Vista general con gráficos y saludo
│   ├── ExpensesTab.jsx             # Gastos con CRUD y filtros
│   ├── IncomeTab.jsx               # Ingresos con CRUD y filtros
│   ├── BudgetTab.jsx               # Presupuestos
│   ├── GoalsTab.jsx                # Metas, cuentas, inversiones, deudas, subs
│   ├── Charts.jsx                  # Donut, SparkArea, StudioCashflow, HeatCalendar
│   ├── shared.jsx                  # Delta, SummaryCard, NoTransactions, CalendarFilter
│   ├── AddTransactionModal.jsx     # Modal nueva/editar transacción
│   ├── SettingsPanel.jsx           # Drawer de ajustes + categorías personalizadas
│   ├── LoginModal.jsx              # Modal de login in-app
│   └── ErrorBoundary.jsx
├── context/
│   ├── DataContext.jsx             # CRUD: txs, budgets, goals, accounts,
│   │                               #   investments, debts, subscriptions, customCats
│   ├── SettingsContext.jsx         # theme, density, currency, lang, palette + PALETTES export
│   └── UserContext.tsx             # useSupabaseUser() → undefined | User | null
├── data/
│   ├── index.js                    # CATEGORIES, CURRENCIES, I18N (sin datos mock)
│   └── helpers.js                  # filterByPeriod, periodLabel, monthCount, daysCount,
│                                   #   healthScore, recurringList, insightsList,
│                                   #   linearRegressionSlope (OLS slope para series temporales)
├── theme/
│   └── materialTheme.js            # Temas light/dark + paletas de acento
├── hooks/
│   └── useLocalStorage.js
├── lib/
│   ├── supabase.ts                 # Cliente browser (createBrowserClient)
│   └── supabase-server.ts          # Cliente server
└── proxy.ts                        # Protección de rutas (Next.js 16)
supabase/
└── migrations/
    └── schema.sql                  # Esquema completo de DB (todas las tablas aplicadas ✓)
```

## Database (Supabase)

All tables use RLS with `auth.uid() = user_id`.

| Table | Description |
|---|---|
| `transactions` | Transactions (type, category, concept, amount, date) |
| `budgets` | Monthly budgets per category |
| `goals` | Savings goals with target, progress, and deadline |
| `accounts` | Bank accounts / cards / cash |
| `investments` | Investments with return rate |
| `debts` | Loans with installments and remaining months |
| `subscriptions` | Recurring subscriptions |
| `custom_categories` | User-defined categories (name, type, color) |

The complete schema is in `supabase/migrations/schema.sql`.

## Quick Start

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Security

| Measure | Detail |
|---|---|
| HTTP Security Headers | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `next.config.mjs` |
| RLS in Supabase | All tables with `auth.uid() = user_id` |
| Guards in DELETE/UPDATE | Every mutation captures `{ error }` and does `throw error` on failure — local state is never mutated on error |
| Browser-session flag | `gastos_session_alive` in `sessionStorage` (cleared by the browser on close); reopening the browser forces re-login. The session survives normal page reloads |
| Prolonged inactivity expiry | `gastos_last_active` in `localStorage` updated on every user event; if the tab has been inactive for >8 h, the session is closed on focus recovery |
| Amount limit | Maximum 10,000,000 validated on client and with `max` attribute on the input |
| Error feedback | `loadError` in `DataContext` — banner with a Retry button if loading fails |

## Technical Notes

**`proxy.ts` vs `middleware.ts`:** Next.js 16 uses the `proxy.ts` convention. The name `middleware.ts` is deprecated and produces a build warning.

**Supabase redirectTo:** `window.location.origin` may return `https://www.jeshu.cfd` (with www) but Supabase only accepts `https://jeshu.cfd/**`. Always apply `.replace(/^https:\/\/www\./, "https://")` before `redirectTo`.

**Multiple Supabase client instances:** `onAuthStateChange` events do not propagate between separate instances. `LoginModal` uses `window.location.reload()` after login to ensure `DataContext` reloads data.

**No mock data:** All data comes exclusively from Supabase. There are no `generateTransactions()`, `SAVINGS_GOALS`, `ACCOUNTS`, or hardcoded `BUDGETS`.

**Filters in ExpensesTab/IncomeTab:** `filteredTotal` is derived with `useMemo` from the already-filtered list (`expenseTxs`/`incomeTxs`). The footer and summary cards always read that value. The daily average uses `daysCount(period)` (7/30/90/365).

**GoalsTab forecast:** 3 guards based on history: `length === 0` → "No data"; `length === 1` → "At least 2 months needed" message + average of available month; `length >= 2` → OLS trend `linearRegressionSlope(nets)` (least squares over all points, more stable than first-last). The progress bar uses `avgIn > 0 ? barPct : 50` to avoid `NaN%`. If `|trend| < 1`, shows "Stable trend · N months of history" note. Projected total = `next.reduce((s,n) => s+n.net, 0)` (real sum, not `netAvg * 3`).

**GoalsTab net worth evolution:** Reconstructed from current `netWorth` backward: `history[i].value = netWorth - sum(nets[i+1..end])`. Red bars for negative values, green for positive.

**`insightsList` period-aware:** Accepts `period` as last parameter. The period-end projection uses `(totalOut / daysCount(period)) * 30` to normalize to a month-equivalent regardless of the selected period.

**OverviewTab mini cards:** `dIn`/`dOut` are `null` (not `0`) when `prevIn`/`prevOut === 0`, which hides the delta chip entirely. When shown: `"+X.X% vs prev."` with always-explicit sign. Sub-label: "N records" (income) / "N expenses" (expense) with singular/plural and bilingual support. Income categories calculated with `txByCategory(periodTxs, "INGRESO")` mapped to `CATEGORIES.income`; expense categories from the `donut` array.

**OverviewTab — `CategoryBars` replaces `MiniBarLabeled` + small donut:** The previous mini-card charts were unreadable — vertical bars without amounts (income) and an 88px donut without legend (expenses). Both cards now use the same `CategoryBars` component: horizontal bar list (top 5) with color dot, name (`noWrap`), exact amount (`fmtMoney(..., true)`, tabular-nums), and a bar proportional to the largest category in the set (`value / peak`). Follows the approved horizontal-bar pattern for category breakdowns. `MiniBarLabeled` was removed from `Charts.jsx` (no longer used).

**IncomeTab — colors per category:** The static `INCOME_COLORS` map (outdated to 6 categories) was removed. Colors are read directly from `CATEGORIES.income[c.categoria]?.color` for native categories and from `customCats.find(...)?.color` for custom ones. The delta chip uses `dIn = prevIn ? ((totalIn - prevIn) / prevIn) * 100 : null` — `null` hides the chip when there is no previous period with data (same pattern as OverviewTab).

**ExpensesTab — Budget vs actual:** The section uses `Object.keys(editBudgets)` (categories from the active budget loaded from Supabase) instead of hardcoded categories. Shows "No budgets configured" if `editBudgets` is empty. The summary progress bars use meaningful relative values; the count item (`isCount`) does not render `LinearProgress`.

**BudgetTab — dynamic period label:** The previous-period comparison shows "vs previous week/month/quarter/year" based on the active `period`, instead of a fixed "vs last month".

**BudgetTab — custom categories:** `getCatName`/`getCatColor` resolve name and color for both native categories (`CATEGORIES.expense`) and `custom_*` (via `customCats`). Defined before the `donutData` useMemo to avoid temporal dead zone. The "Add budget" selector includes `customCats.filter(cc => cc.tipo === "EGRESO")` alongside native categories.

**GoalsTab — single name field in forms:** Goal, investment, and debt dialogs use a single "Name" field that updates both `es` and `en` simultaneously (`setForm({ ...f, es: v, en: v })`). The DB still receives `label_es` and `label_en` with the same value; `d[lang]` works correctly in either language.

**GoalsTab — category in subscriptions:** The category field in the subscription dialog is a `Select` with all expense categories (native `CATEGORIES.expense` + `customCats` of type EGRESO), each with its color dot. Previously it was a free-text `TextField` with no options.

**GoalsTab — `customCats` in useData:** The `useData()` destructuring includes `customCats` — it was missing and caused a crash when opening the subscription dialog with the new category selector.

**DataContext — numeric types in debts:** `mapDebt` converts `remaining` and `original_months` to `Number` (they arrived as strings from Supabase), preventing broken progress calculations.

**GoalsTab — debt progress bar:** Fallback corrected: `orig = d.original_months || d.remaining || 1` instead of `d.remaining + 1`, which overestimated the total installments when `original_months` was undefined.

**ExpensesTab — custom category name in budget:** The "Budget vs actual" card resolves `custom_*` category names via `customCats` instead of showing the raw key.

**IncomeTab — active filter chip with custom categories:** The chip showing the active category resolves `custom_*` names via `customCats` instead of showing the raw key.

**BudgetTab — amount in manage dialog:** The existing budgets list was showing `amount × monthCount(period)` with a "/month" label — an incorrect double calculation. Now shows `amount` (monthly value) directly.

**DashboardStudio — safe Avatar against empty name:** `displayName?.[0]?.toUpperCase() || "?"` replaces `displayName[0].toUpperCase()` which threw a `TypeError` when the user had no resolved name or email.

**Login / Register — try-catch on Supabase calls:** Both pages wrap `signInWithPassword`/`signUp` in `try/catch/finally`; if Supabase throws a network exception, `setLoading(false)` runs in `finally` and a "Connection error" message appears — the button does not stay stuck.

**GoalsTab — debt progress bar cannot be negative:** `Math.max(0, orig - d.remaining)` prevents negative values when `remaining > original_months`.

**IncomeTab — donut legend with real name:** `incomeDonut` resolves `label` from the source (`CATEGORIES.income[key]?.[lang]` or `customCats.find(...)?.nombre`) instead of passing the raw key `custom_abc123` and relying on a later lookup that failed for custom categories.

**BudgetTab — confirmation when deleting a budget:** Deleting a budget from the "Manage" dialog now shows a confirmation Dialog before executing the delete (consistent with all other deletion flows).

**GoalsTab — Delete buttons disabled during operation:** Delete buttons in goal, account, investment, debt, and subscription dialogs are `disabled` while the async operation is in progress, preventing double-click.

**GoalsTab — goal deadline cannot be in the past:** The goal DatePicker includes `minDate={dayjs()}` — past dates cannot be selected.

**GoalsTab — subscription category resolved:** The subscription card shows the real category name (native or `custom_*`) instead of the raw key.

**ExpensesTab / IncomeTab — delete with try-catch:** The transaction delete confirmation button uses `await` with `try/catch/finally`: shows an error toast on failure and always closes the dialog.

**DashboardStudio — i18n strings:** Login button ("Entrar"/"Sign in") and error banner ("Reintentar"/"Retry", "Error al cargar datos"/"Error loading data") respect the selected language.

**BudgetTab — "Budget vs Actual" footer sums budgeted categories only:** The footer "Total spent" was using `totalOut` (all period expenses), while the individual rows only show spending for categories with an assigned budget. Adding up the rows gave a different total than the footer. Fix: `totalSpentBudgeted = Σ spent[cat] for cat ∈ editBudgets`. The top summary card (Health Score, "Spent") still uses `totalOut` — correct for the global financial health context.

**Auth pages — dark mode was not applying (hydration mismatch):** `isDark = theme.palette.mode === "dark"` was computed on the first render. The server always generates HTML in light mode (no localStorage access), while the client wants dark → React detects the `className` mismatch and leaves it unpatched, permanently keeping the DOM in light mode even though the internal state was dark. Fix: `const [isDark, setIsDark] = useState(false)` + `useEffect(() => setIsDark(theme.palette.mode === "dark"), [theme.palette.mode])` in the 6 affected units: `login`, `register`, `forgot-password`, `reset-password`, `AuthCard`, `AuthErrorAlert`. The first render matches the server HTML (no mismatch), and `useEffect` applies the correct theme after hydration.

**DataContext — token renewal reload fixed:** The `onAuthStateChange` listener no longer calls `load()` on the `SIGNED_IN` event (which Supabase fires when auto-renewing the JWT), preventing the Goals tab from reloading every ~55 minutes. Only loads on `INITIAL_SESSION`.

**DataContext — `load()` not called on mount:** The direct `load()` call in the `useEffect` was removed. `INITIAL_SESSION` always fires when subscribing to `onAuthStateChange` and is the sole source of truth for the initial load. Calling both produced 16 parallel Supabase queries on every mount.

**DataContext — `setEditBudgets` throws error consistently:** The budget upsert now does `if (error) throw error` + `setEditBudgetsState(newBudgets)`, matching all other CRUD functions. Previously it used `if (!error) setState` — Supabase errors were silently swallowed and the caller could not show feedback.

**Auth pages — try/catch/finally on all Supabase calls:** `forgot-password` and `reset-password` wrap `resetPasswordForEmail` / `updateUser` in `try/catch/finally`. Without `finally`, a network error left the button permanently in spinner state since `setLoading(false)` was only called in the explicit error branch, not on exceptions.

**`not-found.tsx` — must be a Client Component:** The page uses `<Button component={Link}>` which passes a function to MUI at prerender time. Next.js rejects this in Server Components. Added `"use client"` and removed the `metadata` export (404 pages are not indexed by search engines).

**CSP — `unsafe-eval` in development only:** `next.config.mjs` now applies `'unsafe-eval'` only when `NODE_ENV !== "production"`. Removed from production — Next.js and MUI/Emotion do not require it in production and its presence weakens the security policy of a financial app.

**`AddTransactionModal` — no icon aliases:** The 50 `const XIcon = Y` declarations were removed. Icons from `@mui/icons-material` are used directly by their import name in `EXPENSE_ICONS` and `INCOME_ICONS`. Data imports (`CATEGORIES`, contexts) were moved to the top import block.

**`AuthErrorAlert` — bilingual expired link detection:** The condition to show the "Request new link" link now checks `error.includes("expiró") || error.includes("expired")`. Previously it only detected the Spanish string — if Supabase returned the message in English the link did not appear.

**Auth pages — light/dark theme:** All use `useTheme()` + `isDark = theme.palette.mode === "dark"`. `darkField` and `cardSx` are defined inside the component (not at module level) to read `isDark` at render time. `Blobs` accepts a `{ isDark }` prop to adjust gradient opacity.

**DataContext — `saveCustomCat` / `deleteCustomCat` throw errors:** Both functions now do `if (error) throw error` before mutating local state. Previously they used `if (!error) setCustomCats(...)` without throw — the try/catch in `SettingsPanel.handleSaveCat`/`handleDeleteCat` never fired, and Supabase errors were silently lost.

**IncomeTab — bilingual delta chip:** The "vs ant." chip now uses `lang === "es" ? "vs ant." : "vs prev."`, consistent with OverviewTab.

**StudioCashflow — net line with its own scale:** The net line (income − expenses) used `yFor()` designed for the 0–max range of bars. When the net was negative, the line rendered outside the SVG (below the month labels). Now uses `yForNet()` which scales to the actual net range (min negative → max positive), always staying inside the `viewBox`.

**OverviewTab — donut center consistent:** The center was showing `totalOut` (all period expenses) but percentages used `donutTotal` (top-6 sum). The center now also uses `donutTotal` — arc ↔ label ↔ center all relative to the same set of visible segments.

**GoalsTab — completed goal does not show a negative number:** When `current > target` (goal exceeded), `left = target - current` was negative and displayed as "-S/X.XX remaining". Fix: `Math.max(0, target - current)` + `"¡Meta cumplida!" / "Goal reached!"` text when `pct >= 1`.

**ExpensesTab — "Budget vs actual" not distorted with active calFilter:** The budget section was using `cats` (derived from `expenseTxs`, calFilter-aware). With a single-day filter active, it showed 0% usage for all categories. Fix: new memo `periodCats = txByCategory(periodTxs.filter(EGRESO))` for that section — always uses the full period, independent of calFilter.

**BudgetTab — "Budget vs Actual" readable labels:** The row header was showing `S/204 / S/800` without context. Now shows `Spent S/204 · limit S/800` (labeled, spent in bold and red if over). The redundant "limit S/800" bottom line was removed. "Exceeded" text changed from "Excedido +S/X" to "Excedido en S/X".

**Budgets — loading and deletion:** `DataContext` initializes `editBudgets` as `{}` and fills it only from Supabase. `deleteBudgetCat(cat)` deletes from the DB before updating the state.

**AddTransactionModal — double-submit prevention:** `saving` state disables the button and shows `CircularProgress`. `handleSubmit` has try-catch to release `saving` if the operation throws an exception.

**Session security — browser-close detection mechanism:** `UserContext.onAuthStateChange` listens for the `SIGNED_IN` event (explicit login — email/password or OAuth) and writes `sessionStorage.setItem("gastos_session_alive", "1")`. The browser automatically clears `sessionStorage` when it closes. On reopen, `DashboardStudio` checks the flag before rendering the dashboard; if missing it calls `handleSignOut()` and redirects to `/login`. Normal page reloads (F5) preserve `sessionStorage` — the session continues as usual. For tabs left open: `gastos_last_active` in `localStorage` is updated on every user event (mousedown/keydown/scroll/etc.); `checkSessionAge` checks on focus recovery (`visibilitychange` + `pageshow` with `event.persisted` for bfcache restores) and signs out if the timestamp exceeds 8 h. All sign-out paths (manual, inactivity, expiry) call `localStorage.removeItem("gastos_last_active")` to prevent an immediate forced-logout loop on the next login.

**CalendarFilter:** In `shared.jsx`. Day view: 7-column grid with `alpha(mainColor, intensity)`; month view: 4×3 grid. Red for EGRESO, green for INGRESO. Click on a cell activates `onFilter({ type, date })`, clicking again clears it. Day/Month mode chips include bilingual `aria-label` for accessibility.

**Date and time on transactions:** `AddTransactionModal` initializes with `dayjs()` (exact time). When changing the date in the `DatePicker`, the time is preserved: `newValue.hour(h).minute(m).second(s)`.

**BudgetTab — toast feedback on budgets:** `saveEdit`, `saveEditExisting`, and `handleAddBudget` show a confirmation toast when updating or adding a budget. They receive `showToast` as a prop from `DashboardStudio`. The "Recurring payments" list capped at 5 items shows a "Show more (N)" button if there are more; "Show less" to collapse.

**SettingsPanel — try-catch on custom categories:** `handleSaveCat` and `handleDeleteCat` wrap calls to `saveCustomCat`/`deleteCustomCat` in `try/catch`; if the operation fails, an error Snackbar is shown instead of staying silent.

**GoalsTab — form validations:** Target/current amount fields with `inputProps={{ min: 0 }}`; investment "Value" field the same. Save button disabled if `value ≤ 0` (investment) or `price ≤ 0` (subscription) or `remaining > original_months` (debt). Debt APR field includes bilingual `helperText` explaining "Tasa efectiva anual / Annual effective rate". Subscription price field shows monthly equivalent when cycle is annual (`≈ X.XX/month`).

**OverviewTab — bilingual delta chip:** The "vs ant." chip in the summary mini cards now switches to "vs prev." when the language is English (`lang === "es" ? "vs ant." : "vs prev."`).

**AddTransactionModal — error toast on save failure:** The `catch` block of `handleSubmit` shows an error toast "Error al guardar. Intenta de nuevo." when `addTx`/`updateTx` throws an exception (network, RLS). Requires the `showToast` prop passed from `DashboardStudio`. Without this the spinner disappeared silently with no feedback.

**BudgetTab — budget delete with correct feedback:** `deleteBudgetCat` in `DataContext` now does `throw error` when Supabase fails, allowing `BudgetTab.deleteBudget` (async with try/catch/finally) to show a success or error toast and close dialogs in `finally`. Previously the dialog closed instantly without waiting for the DB; if it failed, the budget reappeared silently. Consistent with the pattern in `ExpensesTab` and `IncomeTab`.

**GoalsTab — goals without deadline:** Goals without a `deadline` no longer show "0 days". The days calculation returns `null` when `g.deadline` is null, and the line is completely hidden in the UI (`{days !== null && <Typography>...`). `new Date(null)` returns epoch (1970) which resulted in 0 days — an incorrect value.

**DataContext — all CRUD functions throw error:** The 13 CRUD functions (`addTx`, `updateTx`, `deleteTx`, `saveGoal`, `deleteGoal`, `saveAccount`, `deleteAccount`, `saveInvestment`, `deleteInvestment`, `saveDebt`, `deleteDebt`, `saveSubscription`, `deleteSubscription`) now do `if (error) throw error` instead of `if (!error && data)`. This allows component handlers to catch the error and show feedback. Previously all of them failed silently — only `deleteBudgetCat` had `throw`.

**GoalsTab — `showToast` prop required:** `DashboardStudio` now passes `showToast={showToast}` to `GoalsTab`. Without this prop, the 10 CRUD operations in the tab (goals, accounts, investments, debts, subscriptions) gave success or failure with no user feedback.

**GoalsTab — handlers with `try/catch/finally`:** The 5 save handlers (`handleSaveGoal`, `handleSaveAccount`, `handleSaveInvest`, `handleSaveDebt`, `handleSaveSub`) and their delete counterparts have `try/catch/finally` with `setSaving`. Without `finally`, if Supabase threw an exception the spinner stayed active and the dialog could not be closed.

**GoalsTab — guard against division by zero in goal progress:** `const pct = g.target > 0 ? g.current / g.target : 0` prevents `Infinity%` when a goal's target is 0. Previously `Math.round(Infinity * 100)` rendered `"Infinity%"` and `fmtMoney(left)` showed a negative amount in "remaining".

**ExpensesTab / IncomeTab — `showToast` in edit modal:** The `<AddTransactionModal editTx={...}>` mounted when editing a transaction now receives `showToast={showToast}`. Without this prop, errors when saving an edit (network, RLS) were silent — the spinner disappeared without any message.

**ExpensesTab — "Daily average" bar corrected:** The period summary progress bar used the tautological formula `(X / daysCount) / (X / daysCount) = 1`, always 100%. Now uses `filteredTotal / totalBudget` (% of budget spent) if a budget is configured, or a neutral 50% if not.

**ExpensesTab — Top Categories in sync with calFilter:** `cats` is now derived from `expenseTxs` (which already incorporates `calFilter` and `activeCat`) instead of `periodTxs`. Previously, filtering a day in the calendar updated the list and totals but "Top Categories" cards still showed the full month data. Percentages and the total in the Top Categories header use `filteredTotal` to stay consistent with the active view.

**Math corrected in distribution charts:** The percentage denominator in donut/pie charts is always the sum of the displayed segments themselves (`sliceTotal`), not the global total. Previously, if the chart showed only the top-6 categories or only the budgeted ones, percentages never summed to 100%. Applied in `OverviewTab` (Breakdown) and `BudgetTab` (Distribution).

**GoalsTab — weighted average investment return:** Changed from simple average to value-weighted average (`Σ(value × rate) / Σ(value)`). The simple average gave equal weight to all investments regardless of size.

**`linearRegressionSlope` in `helpers.js`:** New utility function that calculates the slope of a time series using ordinary least squares (OLS). Replaces the `(last - first) / (n-1)` calculation in the GoalsTab forecast — the previous slope was unstable when the first or last month was an outlier.

**GoalsTab — yearly subscriptions normalized to monthly:** The subscription monthly total (`subscriptions.reduce(...)`) now applies `cycle === "yearly" ? price / 12 : price` per item. Previously a yearly subscription of S/120 added 120 to the monthly total instead of 10 — "Total monthly" was massively overestimated when yearly subscriptions were present.

**SettingsPanel — deprecated `inputProps` in MUI v9:** The category name `TextField` used `inputProps={{ maxLength: 40 }}` (MUI v4/v5 prop). Changed to `slotProps={{ htmlInput: { maxLength: 40 } }}`, consistent with the rest of the project.

## Deployment

```bash
vercel --prod
```

Environment variables are configured in the Vercel Dashboard.

## License

MIT
