# Finanzas — Personal Finance

Personal finance application to track income, expenses, budgets, goals, and more. Deployed at **[www.jeshu.cfd](https://www.jeshu.cfd)**.

**Version:** `v0.0.1` · [Changelog](CHANGELOG.md) · [Research on similar projects & roadmap (Spanish)](docs/INVESTIGACION.md)

<!-- i18n-selector-start -->
🌐 [Español](README.md) · **English**
<!-- i18n-selector-end -->

## Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack) + React 19 |
| UI | Material UI (MUI) v9 + `@mui/icons-material` (Rounded variant) + `@mui/material-nextjs` (server-side styles in `<head>`) |
| Auth + DB | Supabase with `@supabase/ssr` 0.12 (email/password; OAuth wired up but disabled) |
| Date Picker | MUI X Date Pickers + dayjs |
| State | React Context + localStorage |
| Language | TypeScript `strict` (routes, data, texts, settings and user contexts) + JSX (components) |
| Tests | Vitest 5 (unit and jsdom component tests) + Playwright (end-to-end) |
| CI | GitHub Actions: lint, typecheck, tests and build |
| Deploy | Vercel → `https://www.jeshu.cfd` |

## Features

### Authentication
- Login with email/password
- Registration with first name, last name, and email — email confirmation required
- Full password recovery flow (forgot → email → reset with expired link detection)
- Double-layer route protection: `src/proxy.ts` (server) + `router.replace` in `DashboardStudio` (client)
- Auto-logout on inactivity (2, 5, 15 or 30 minutes, chosen in Settings; 2 by default) with a warning 30 s before, measured across all tabs (an idle tab doesn't sign you out while you're active in another one)
- Forced logout on browser reopen: `UserContext` writes the `gastos_session_alive` flag to `sessionStorage` on `SIGNED_IN`; `DashboardStudio` checks it on mount. If it's missing, it asks the other tabs over a `BroadcastChannel`: if one answers (new tab while the browser is open) it inherits the flag; if none does (browser reopened) it signs out in this browser only (`scope: "local"`)
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
- Top categories with icon, rank and progress bars
- Budget vs actual — shows categories from the active budget (`editBudgets`), not hardcoded; "No budgets" message if none configured
- Period summary (total, transactions, daily average, largest expense) — **all reflect the active filter**; progress bars with meaningful relative values (no bar for the count item)
- Daily average calculated with `daysCount(period)` (7/30/90/365 per period)
- Largest expense = maximum of the filtered transactions
- Full list with each category's icon, edit and delete (delete confirmation)
- Filter by category with chips that show the icon
- **CalendarFilter:** interactive heat map — day and month views with proportional intensity; click filters the list, footer shows filtered total with "(filtered)" label
- Footer total updates in real time when any filter is applied
- Full date and time per transaction

### Income (IncomeTab)
- Total income card with sparkline; `+X.X% vs prev.` chip hidden when no previous period (`dIn = null`)
- Category grid with icon, percentages and donut — label, color and icon via `resolveCategoryMeta` (built-in and custom); interactive cards to filter by source
- Monthly trend with full legend: income / expenses / net
- **CalendarFilter** in green (success)
- Footer total updates in real time when any filter is applied
- Transaction list with edit and delete; avatar with each category's icon and color

### Budgets (BudgetTab)
- Visual health score gauge
- Per-category cards with icon, progress and alerts at 80% and 100%
- Expense distribution donut — **stacks vertically on mobile** (column on xs, row on sm+)
- **"Budget vs Actual" chart:** horizontal bars per category, colored green/yellow/red; bars at 100%+ with diagonal stripe pattern; footer with totals
- Comparison with previous period — dynamic label per active period (week/month/quarter/year)
- Budget CRUD — exclusively from Supabase; selector includes custom categories in addition to native ones

### Goals & Finances (GoalsTab)
- Savings goal CRUD with deadline, color and a selectable icon (`IconPicker`) — form with single name field
- Bank account / card / cash management
- Real-time net worth (`netWorthOf()`): assets (positive account balances + investments) − debts (negative balances + loans)
- Investment tracking (AFP, DPF, crypto, etc.) — form with single name field
- Debt and loan tracking with installments — form with single name field (saves in both languages automatically)
- Recurring subscriptions with category selector (native + custom); bilingual "Add" button in empty states
- **3-month forecast** based on real linear trend (OLS slope of last 6 months of net values); 3 states based on available history: "No data" (0 months), "At least 2 months needed" + current average (1 month), real bars with `+trend×i` (2+ months); "Stable trend · N months" note if `|trend| < 1`; projected total = real sum of the 3 months
- **Net worth evolution** reconstructs real history working backward from current `netWorth`

### Profile & Settings (SettingsPanel)
Drawer with **two tabs** that separate Profile from Settings:
- **Profile:** hero with avatar, name and email; **Personal info** (edit first/last name — stored as `first_name`/`last_name` + synced `full_name`); **Favorite Categories** (appear first in the transaction selector) and **My Categories** (CRUD for custom categories — name, type, color and icon — in Supabase)
- **Settings:** light/dark theme, accent palettes (dots with `flexWrap` on mobile), Comfy/Compact density, Spanish/English language, 8 currencies (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL). Amounts are always stored in PEN: forms convert with `toBase()` on save and `fromBase()` on edit (`src/data/index.ts`), using fixed rates
- The AppBar **avatar** opens Profile; the **gear** opens Settings (via the `initialTab` prop)
- **Day/night toggle on the login screen** (`AuthThemeToggle`): the user picks the theme before signing in; it persists in `localStorage`

### Privacy, export and installable app
- **Privacy mode:** the eye button in the top bar hides every amount ("S/••••") and is remembered in the browser. Amounts go through `fmt()` from `useSettings()`, which already knows the currency and this mode.
- **Your data (Profile):**
  - transactions download as CSV (UTF-8 with BOM for Excel, amounts in PEN, cells guarded against formulas);
  - everything downloads as a full JSON backup (`src/data/export.ts`).
- **Installable app:** `src/app/manifest.ts` plus the icons in `public/icons/`, generated with `node scripts/generate-icons.mjs`. Chrome, Edge and Android offer "Install app"; iOS offers "Add to Home Screen". No Service Worker, on purpose (see Troubleshooting).

### Faster entry
- **Category suggested from the concept:** when typing the concept of a new transaction with no category chosen yet, it fills in by itself (`suggestCategory()` in `src/data/suggest.ts`):
  - first with the category you used most with that same concept (case and accents don't matter);
  - with no history, with the catalog category whose name or concepts appear in the text ("pago netflix" → Streaming);
  - if two categories tie, nothing is suggested;
  - a category picked by hand is never replaced, and a note under the field says where the suggestion came from.
- **CSV import (Profile → Your data):**
  - **Formats:** the app's own CSV export is recognized automatically; for a bank file or a spreadsheet you pick which column holds the date, the concept and the amount (suggested from the header names).
  - **What it reads:** `,` or `;` separators, `YYYY-MM-DD` or `DD/MM/YYYY` dates, and amounts like `1,234.56`, `1.234,56` or `-S/ 45`.
  - **Type and category:** without a type column, the amount's sign decides income or expense. The category comes from the file, from the concept suggestion, or from a default chosen in the preview.
  - **Preview:** how many rows are new, how many are already recorded (same day, concept, amount and type) and which have errors, with their line number. Already-recorded rows are skipped unless you ask otherwise, so re-importing a file duplicates nothing.
  - **Saving:** `addTxs()` inserts in batches of 500; if one fails, it says how many were saved. Limits: 5 MB and 10,000 rows. Code: `src/data/import.ts` and `ImportDialog.jsx`.

- **Upcoming payments (Budget):** what's due from today until the same day next month (`upcomingPayments()` in `helpers.ts`), so every monthly payment shows up exactly once:
  - **Expenses that repeat for 3+ months:** due on the day you usually pay them. If it's already recorded this month, it moves to next month; if the day passed and it isn't recorded, it shows as "Overdue".
  - **Subscriptions:** one named like a repeated expense (Netflix) merges with it, using the subscription's price. The rest are dated from their last payment (+1 month or +1 year); a monthly one never paid shows as "No date".
  - **Record:** opens the form with the category, concept and amount filled in.

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
.
├── .github/workflows/ci.yml        # CI: lint, typecheck, tests, build and e2e on every PR and push to main
├── e2e/                            # End-to-end tests (Playwright) + playwright.config.ts
│   └── mock-supabase/              # Mock Supabase (Auth + PostgREST) for the logged-in tests
├── .env.example                    # Environment variables (copy to .env.local)
├── CHANGELOG.md                    # Changelog
├── ICONOS_Y_ESTRUCTURA.txt         # Plain-text icon map and structure (Spanish)
├── docs/
│   ├── INVESTIGACION.md            # Similar projects, roadmap and technical improvements (Spanish)
│   ├── SECURITY-CSP.md             # Per-request nonce CSP (Spanish)
│   └── TESTING.md                  # Unit tests with Vitest (Spanish)
├── public/favicon.svg              # App icon
├── src/                            # (detail below)
└── supabase/
    ├── config.toml
    ├── migrations/YYYYMMDDHHMMSS_*.sql # Dated, idempotent migrations, in order (the first is the base schema)
    └── seed/reset.sql              # Empties the 8 tables — destructive
```

```
src/
├── app/
│   ├── layout.tsx                  # Root layout: Providers, fonts, favicon; dynamic rendering (CSP nonce)
│   ├── fonts/                      # IBM Plex Sans + JetBrains Mono (woff2, latin subset, OFL) via next/font/local
│   ├── page.tsx                    # Home → DashboardStudio
│   ├── globals.css                 # Global styles (overflow-x: hidden, reduced motion, etc.)
│   ├── error.tsx · global-error.tsx · not-found.tsx
│   ├── login/ · register/ · forgot-password/ · reset-password/   # page.tsx for each auth screen
│   ├── auth/callback/route.ts      # OAuth PKCE code exchange (OAuth disabled for now)
│   ├── api/client-error/route.ts   # Receives browser errors and writes them to the server logs
│   ├── api/csp-report/route.ts     # Receives CSP violation reports and writes them to the logs
│   └── components/
│       ├── Providers.tsx           # UserContext → Settings → Data → Theme
│       ├── DynamicThemeProvider.tsx
│       ├── ErrorReporter.tsx       # Reports uncaught errors (window.onerror, unhandledrejection)
│       └── auth/                   # AuthCard, AuthErrorAlert, AuthThemeToggle, authStyles
├── components/
│   ├── DashboardStudio.jsx         # Shell: AppBar, tabs, BottomNav, period, toasts, session security
│   ├── OverviewTab.jsx             # Overview with charts and greeting
│   ├── ExpensesTab.jsx             # Expenses with CRUD and filters
│   ├── IncomeTab.jsx               # Income with CRUD and filters
│   ├── BudgetTab.jsx               # Budgets: period metrics + layout
│   ├── budget/                     # One card per file (health, budgets, distribution, comparison,
│   │                               #   budget vs actual, recurring) + Manage dialog
│   ├── GoalsTab.jsx                # Goals: layout of the sections
│   ├── goals/                      # One section per file (goals, accounts, forecast, investments,
│   │                               #   debts, subscriptions, evolution) + useEntityDialog and EntityDialog
│   ├── Charts.jsx                  # Donut, SparkArea, StudioCashflow, HeatCalendar
│   ├── shared.jsx                  # StatsCard, EmptyState, NoTransactions, CalendarFilter
│   ├── AddTransactionModal.jsx     # New/edit transaction modal
│   ├── SettingsPanel.jsx           # Profile/settings drawer (tabs and snackbar)
│   ├── settings/                   # ProfileTab, CustomCategoriesSection, PreferencesTab
│   └── LoginModal.jsx              # In-app login modal
├── context/
│   ├── DataContext.jsx             # Loading and CRUD: txs, budgets, goals, accounts,
│   │                               #   investments, debts, subscriptions, customCats
│   ├── SettingsContext.tsx         # theme, density, currency, lang, palette + PALETTES
│   └── UserContext.tsx             # useSupabaseUser() → undefined | User | null
├── data/
│   ├── index.ts                    # CATEGORIES, CURRENCIES, fmtMoney, toBase/fromBase
│   ├── helpers.ts                  # filterByPeriod, healthScore, flagAnomalies, recurringList,
│   │                               #   upcomingPayments, insightsList, linearRegressionSlope…
│   ├── fetchAllRows.ts             # Pagination with .range() (Supabase caps responses at 1000 rows)
│   ├── export.ts                   # CSV and JSON backup for "Tus datos"
│   ├── suggest.ts                  # Category suggested from the concept (history and catalog)
│   ├── import.ts                   # CSV import: parsing, columns, dates, amounts, duplicates
│   └── *.test.js                   # helpers, currency, fetchAllRows (components: *.test.jsx next to each)
├── i18n/
│   ├── base.ts                     # Short shared texts (t.income, t.save, t.months…)
│   ├── ui.ts                       # Texts by area (t.goalsTab.newGoal, t.common.delete, t.iconNames…)
│   ├── index.ts                    # MESSAGES and messagesFor(lang)
│   └── messages.test.js            # Same keys in es/en; no language ternaries outside i18n/
├── theme/
│   ├── materialTheme.js            # Light/dark themes, accents and icon animation
│   ├── icons.js                    # Central MUI Rounded icon set
│   ├── categoryIcons.js            # Category → icon, ICON_CHOICES, resolveCategoryMeta() (+ test)
│   ├── iconTones.js                # Gradients per tone (TONES, TONE_BY_PALETTE)
│   ├── GradientIcon.jsx            # GradientIcon + CategoryAvatar
│   └── IconPicker.jsx              # Icon picker (goals and custom categories)
├── types.ts                        # Domain types: Transaction, Goal, Account, Period…
├── hooks/
│   └── useLocalStorage.ts          # Default value on first render; stored value applied after mount
├── lib/
│   ├── featureFlags.ts             # OAUTH_ENABLED (login, register and LoginModal)
│   ├── reportError.ts              # Sends browser errors to /api/client-error
│   ├── supabase.ts                 # Browser client (createBrowserClient)
│   └── supabase-server.ts          # Server client
└── proxy.ts                        # Auth guard + per-request nonce CSP (Next.js 16)
```

## Database (Supabase)

All tables use RLS with `auth.uid() = user_id`.

| Table | Description |
|---|---|
| `transactions` | Transactions (type, category, concept, amount in PEN, date) |
| `budgets` | Monthly budgets per category (amount in PEN) |
| `goals` | Savings goals with target, progress, deadline, color and icon (an `ICON_CHOICES` key; older goals store a text glyph) |
| `accounts` | Bank accounts / cards / cash |
| `investments` | Investments with rate of return |
| `debts` | Loans with installments and remaining months |
| `subscriptions` | Recurring subscriptions |
| `custom_categories` | User-defined categories (name, type, color, icon) |

**Migrations:** the schema lives in `supabase/migrations/`, one file per change, with the date at the start of the name (`YYYYMMDDHHMMSS_description.sql`). The first one, `20260618000000_init.sql`, creates the 8 tables with their indexes and RLS policies.

- **How they're applied:** in order, with the CLI (`supabase db push`) or by pasting them into Supabase → SQL Editor. On an existing DB, **before** deploying the code that needs them.
- **Idempotent:** every file can run more than once without errors, on a new DB or on one that already has part of the changes. They use `IF NOT EXISTS`, `DROP POLICY IF EXISTS` before each `CREATE POLICY`, and a transaction (`BEGIN … COMMIT`), so an error leaves nothing half-applied.
- **Tested on Postgres 16:**
  - on a new DB it leaves the same schema as the former `schema.sql` + `upgrade_0.0.1.sql`, and running it twice changes nothing;
  - on the production DB (0.0.1) and on a pre-0.0.1 DB the result is the same;
  - RLS: a user can't insert another user's rows or see them.
- **Performance:** with 200,000 transactions, loading one user's data went from ~120 ms (full table scan) to ~1.4 ms thanks to the 0.0.1 `(user_id, …)` indexes.
- **In tests:** the e2e tests' mock Supabase reads these same files, in the same order.

| Migration | What it does |
|---|---|
| `20260618000000_init.sql` | The 8 tables, `(user_id, …)` indexes and RLS policies with `(select auth.uid())` |
| `20260927000000_schema_hygiene.sql` | `transactions` checks `tipo IN ('INGRESO','EGRESO')` and `valor > 0` in the database; all 8 tables get `updated_at`, kept by a trigger. It includes a query to check beforehand for rows that would fail |

> **Maintenance — wiping the database:** `supabase/seed/reset.sql` empties the 8 tables (`count` → `TRUNCATE` → verification) without touching the schema or the `auth.users` accounts. It is **destructive and irreversible** — run it from the Supabase SQL Editor.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start the dev server
npm run dev

# Unit and component tests (Vitest)
npm run test

# End-to-end tests (Playwright) against the production build and a mock Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e npm run build
npm run test:e2e

# Lint (ESLint) and type check (tsc)
npm run lint
npm run typecheck
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, build and end-to-end tests on every push to `main` and on every PR.

The app will be available at `http://localhost:3000`. Testing details in **[docs/TESTING.md](docs/TESTING.md)**.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Security

| Measure | Detail |
|---|---|
| HTTP Security Headers | CSP **with a per-request nonce** (`script-src 'self' 'nonce-…' 'strict-dynamic'`, no `'unsafe-inline'`; emotion's `<style>` tags carry the nonce too) generated in `proxy.ts`, with violations reported to `/api/csp-report`; the rest (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) in `next.config.mjs` |
| RLS in Supabase | All tables with owner-only policies `FOR ALL TO authenticated USING / WITH CHECK (auth.uid() = user_id)` |
| Password policy | `minimum_password_length = 8` in `supabase/config.toml` |
| Guards in DELETE/UPDATE | Every mutation captures `{ error }` and does `throw error` on failure — local state is never mutated on error |
| Browser-session flag | `gastos_session_alive` in `sessionStorage` (cleared by the browser on close); reopening the browser forces re-login. The session survives normal page reloads. A tab opened by hand asks over `BroadcastChannel("gastos-session")` whether another tab is alive and, if one answers, inherits the session instead of signing out |
| Scoped automatic sign-outs | Inactivity, 8 h max age and reopened browser use `signOut({ scope: "local" })` (other devices' sessions are not revoked). Before an inactivity logout the shared `gastos_last_active` is re-read so an idle tab doesn't sign out a user who is active in another tab |
| Prolonged inactivity expiry | `gastos_last_active` in `localStorage` updated on every user event; if the tab has been inactive for >8 h, the session is closed on focus recovery |
| Amount limit | Maximum 10,000,000 (in PEN, the base currency) validated on client and with `max` attribute on the input |
| Error feedback | `loadError` in `DataContext` — banner with a Retry button if loading fails |
| Errors visible in production | Browser errors (Next error boundaries, data-loading failures, uncaught errors) are sent by `reportError()` to `/api/client-error`, which writes them as one `[client-error]` JSON line in the server logs (Vercel → Logs). Only the pathname is sent (no query string), with a size cap and at most 10 reports per page. The route accepts reports without a session so the auth pages are covered. Production keeps `console.error` and `console.warn` |

> Per-request nonce CSP architecture (`proxy.ts` flow, dynamic rendering, how to verify): **[docs/SECURITY-CSP.md](docs/SECURITY-CSP.md)**.

## Technical Notes

### Data and Supabase

**Data loading:** `DataContext.load()` runs on the first `onAuthStateChange` event that carries `session.user` (`INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED` or `USER_UPDATED`) and is deduplicated by `session.user.id`, so periodic token refreshes don't re-run the 8 queries. It isn't called on mount (that duplicated the queries). On failure the flag is reset so the next event retries. This removed the "you have to refresh twice" bug, where an `INITIAL_SESSION` without a usable session was never retried. The queries rely on RLS (`select("*")` with no `.eq("user_id")`).

**More than 1000 transactions:** PostgREST caps every response at `max_rows` (1000). `transactions` is fetched with `fetchAllRows()` (`src/data/fetchAllRows.ts`), which pages with `.range()` ordered by `fecha` + `id`. It's all or nothing: if a page fails, no partial result is shown.

**Currency:** amounts are always stored in PEN. `fmtMoney(v, currency)` multiplies by the fixed `rate` from `CURRENCIES` for display, and forms convert with `toBase()` on save and `fromBase()` when pre-filling an edit (transactions, budgets, goals, accounts, investments, debts and subscriptions; % rates and months are not converted). The 10,000,000 cap is validated in PEN. Known limit: rounding to 2 PEN decimals can move a COP amount by up to about 5 units.

**Transaction type derived from the category (not the toggle):** in `AddTransactionModal`, the saved `tipo` (INGRESO/EGRESO) is the **selected category's** type (`categoria.type`). Custom categories are shown regardless of the toggle, and saving the toggle's `tipo` recorded a custom income as an expense. The Autocomplete's `onChange` also syncs the toggle. Backfill for old data: `UPDATE transactions t SET tipo = cc.tipo FROM custom_categories cc WHERE t.categoria = 'custom_' || cc.id::text AND t.tipo <> cc.tipo;`.

**Mutations throw on error:**
- Every CRUD function in `DataContext` does `if (error) throw error` before touching local state.
- **Session user:** they use the session user's id, kept in a ref from `onAuthStateChange` and read with `requireUserId()`, instead of calling `supabase.auth.getUser()` (a request to the Auth server) before every write. RLS still validates the JWT on the server.
- **No session:** `requireUserId()` throws "No hay sesión activa", so the UI shows an error instead of a false "saved".
- **Shared CRUD:** goals, accounts, investments, debts, subscriptions and custom categories use `useTableCrud()`, which updates by `id` or inserts, and deletes by `id` + `user_id`. `optionalColumns` retries without a new column if the DB doesn't have it yet (`PGRST204`). Transactions and budgets have their own functions.
- **In the components:** handlers use `try/catch/finally` and show a success or error toast, which is why `DashboardStudio` passes `showToast` to the tabs and to `AddTransactionModal`.

**Budgets:** `editBudgets` starts as `{}` and is filled only from Supabase; `deleteBudgetCat(cat)` deletes in the DB before updating state. The stored amount is monthly; views multiply it by `monthCount(period)`.

**Numeric types:** the `map*` functions in `DataContext` convert to `Number` the decimals Supabase returns as strings (e.g. debts' `remaining` and `original_months`).

**No mock data:** everything comes from Supabase; there are no sample transactions, goals, accounts or budgets in the code.

**Multiple Supabase client instances:** `onAuthStateChange` events don't propagate between separate instances. `LoginModal` uses `window.location.reload()` after login so `DataContext` reloads.

**"JWT issued at future" error:** shows up when the device clock is ahead of Supabase (1 minute is enough). Supabase rejects the JWT and every query fails. Fix: sync the system clock. The error banner detects this case and shows an actionable message.

### Session and authentication

**Session security:**
- `UserContext` writes `gastos_session_alive` to `sessionStorage` on `SIGNED_IN`; the browser clears it on close and reloads (F5) keep it.
- On mount, `DashboardStudio` checks for it. If it's missing, it asks over `BroadcastChannel("gastos-session")` whether another tab is alive (waiting about 300 ms): if one answers, this is a new tab with the browser still open and it inherits the flag; if not, the browser was reopened and it signs out.
- Inactivity: 2 min by default (configurable in Settings: 2, 5, 15 or 30, stored in `gastos-idle-minutes`), with a warning 30 s before. The value is synced across tabs through the `storage` event, so a tab still holding the old value doesn't sign out early. `gastos_last_active` (localStorage, shared across tabs) is updated on every user event and re-read before warning or signing out, so an idle tab doesn't sign out a user who is active in another tab.
- Tab left open for more than 8 h: checked when visibility returns (`visibilitychange`, plus `pageshow` for bfcache).
- Automatic sign-outs use `signOut({ scope: "local" })`, which doesn't revoke the user's sessions on other devices; the "Sign out" button keeps the global scope. All of them clear `gastos_last_active` to avoid a logout loop on the next login.

**OAuth (disabled):** `src/app/auth/callback/route.ts` exchanges the PKCE code and checks that `next` is an internal path. To enable it: create the OAuth apps in Google/GitHub, add client id/secret in Supabase → Auth → Providers, add `https://www.jeshu.cfd/auth/callback` to the redirect URLs and set `OAUTH_ENABLED = true` in `src/lib/featureFlags.ts` (used by the login and register pages and `LoginModal`). ⚠ Check the session flag first: the exchange happens on the server, so the client never gets `SIGNED_IN` and `gastos_session_alive` wouldn't be written.

**Supabase `redirectTo`:** `window.location.origin` may return `https://www.jeshu.cfd` (with www), but Supabase only accepts `https://jeshu.cfd/**`. Apply `.replace(/^https:\/\/www\./, "https://")` before `redirectTo`.

**`proxy.ts` vs `middleware.ts`:** Next.js 16 uses the `proxy.ts` convention; `middleware.ts` is deprecated and warns at build time.

**CSP:** built per request in `src/proxy.ts` (`buildCsp`) with a nonce and `'strict-dynamic'`; `'unsafe-eval'` is only added outside production. Details in [docs/SECURITY-CSP.md](docs/SECURITY-CSP.md).

**Auth pages:**
- They all use `useTheme()` and `isDark`, with `darkField`/`cardSx` defined inside the component and `Blobs` receiving `{ isDark }`.
- `isDark` starts as `false` and is applied in a `useEffect`, so the first render matches the server HTML (avoids the hydration mismatch).
- The Supabase calls (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`) are wrapped in `try/catch/finally`, so the button never stays stuck on a spinner.
- `AuthErrorAlert` detects the expired link in Spanish and English (`"expiró"` / `"expired"`).

### Icons and theme

**Icon system:**
- Category icons come from a single map, `src/theme/categoryIcons.js`.
- `resolveCategoryMeta(categoria, customCats, lang, tipo)` returns label, color and icon for both built-in and custom (`custom_<id>`) categories. The transaction picker, lists, filter chips and budgets use it, and it replaces the `customCats` lookups that used to be repeated in every tab.
- Lists render `CategoryAvatar` (a squircle with the category color's gradient) and headers use `GradientIcon` with a semantic tone (`TONE_BY_PALETTE`).
- Goals and custom categories pick an icon with `IconPicker` and store its key (e.g. `"Flight"`). Older goals with a text glyph still render.
- If the `custom_categories.icon` column doesn't exist yet, `saveCustomCat` gets `PGRST204` and saves without the icon.

**Theme without hydration mismatch:** `useLocalStorage` uses the default value on the first render (server and hydration) and applies the stored one right after mount. Reading it in the `useState` initializer made a stored dark theme produce different classNames than the server HTML, which React doesn't patch up.

### Calculations and charts

**Filters (Expenses/Income):** `filteredTotal` is derived with `useMemo` from the already-filtered list. The footer and summary cards read it, and the daily average uses `daysCount(period)` (7/30/90/365).
- **Top categories:** follows `calFilter` and the active category.
- **"Budget vs actual":** uses the full-period `periodCats`, so a one-day filter doesn't show 0 %.
- **"Daily average" bar:** shows the % of budget spent, or a neutral 50 % when there's no budget.

**Distributions:** donut percentages use the sum of the displayed slices as the denominator, so they always add up to 100 % (Overview and Budgets). The Overview donut center uses that same total.

**Mini cards and deltas (Overview/Income):**
- `dIn`/`dOut` are `null` (not `0`) when the previous period has no data, and the chip is then hidden. When shown, the sign is always explicit and the text is bilingual (`vs ant.` / `vs prev.`).
- `CategoryBars` (top 5 as horizontal bars with the exact amount) replaced the unreadable mini charts.

**`insightsList`:** takes the `period`; the projection normalizes to a month-equivalent with `(totalOut / daysCount(period)) * 30`.

**StudioCashflow:** the net line has its own scale (`yForNet`) so it stays inside the SVG when the net is negative.

**Budgets:**
- The comparison with the previous period has a dynamic label (week/month/quarter/year).
- The "Budget vs Actual" footer sums only budgeted categories, and each row reads "Spent S/X · limit S/Y".
- Deleting a budget asks for confirmation, and every action gives toast feedback.
- "Recurring payments" shows 5 with "Show more / Show less".

**Forecast (Goals):** uses 3 guards based on history: 0 months → "No data"; 1 month → "At least 2 months needed"; 2 or more → OLS trend via `linearRegressionSlope(nets)`, more stable than first-to-last. If `|trend| < 1` it shows "Stable trend". The projected total is the real sum of the 3 months.

**Net worth and investments (Goals):** net-worth evolution is rebuilt backward from the current `netWorth`. The average investment return is weighted by value. The monthly subscriptions total normalizes yearly ones (`price / 12`).

**Goals and debts:**
- **Goals:** a single "Name" field saves `label_es` and `label_en`, and the deadline can't be in the past. Goals without a deadline show no day count. A `target = 0` doesn't divide by zero. An exceeded goal says "Goal reached!" instead of a negative remainder.
- **Debts:** progress is never negative and uses `original_months || remaining || 1`.
- **Forms:** they have validation (minimums, price > 0, remaining ≤ total installments, a hint for "TEA"), and delete buttons are disabled while the operation runs.

### Languages (i18n)

- **Every text lives in `src/i18n/`**, in Spanish and English. Components get them as `t` from `useSettings()`: `t.save`, `t.goalsTab.newGoal`, `t.common.delete`.
- **Texts with data are functions,** so plurals and word order stay in the dictionary. For example, `t.overviewTab.expenseRecords(n)` gives "1 expense" or "3 expenses", and `t.common.vsPreviousPeriod(period)` gives "vs previous quarter".
- **Outside React** (e.g. `healthLabel` and `insightsList` in `helpers.ts`): `messagesFor(lang)`.
- **Accessible names are translated too:** `aria-label`s, the 43 icon names in the picker (`t.iconNames`) and the palettes (`t.palettes`).
- **Rule:** no `lang === "es" ? … : …`. `messages.test.js` fails if one appears outside `src/i18n/`, or if a key is missing in one language.
- **Category names** stay in `CATEGORIES` (`src/data/index.ts`), with `es` and `en` on each.

### Forms and UI

**`AddTransactionModal`:**
- `saving` prevents double submission and shows a spinner.
- A failed save shows an error toast.
- The date starts at the exact current time, and the DatePicker keeps the time when the day changes.

**Custom categories:**
- They're resolved everywhere through `resolveCategoryMeta`, so the raw `custom_…` key is never shown.
- In the subscription dialog, the category is a `Select` with built-in and custom expense categories.
- `SettingsPanel` wraps save and delete in `try/catch` with a Snackbar, and uses `slotProps.htmlInput` (MUI v9) instead of `inputProps`.

**Other:**
- The `DashboardStudio` avatar is safe with an empty name (`displayName?.[0]?.toUpperCase() || "?"`).
- The "Sign in" button and error banner texts are bilingual.
- **Dialogs:** MUI sets `padding-top: 0` on a `DialogContent` that follows a `DialogTitle`, with a selector more specific than `sx`. The padding is applied with `"&&": { pt }`; without it the first field's floating label is clipped.
- `not-found.tsx` is a Client Component (it uses `<Button component={Link}>`).
- Transaction deletion uses `try/catch/finally`.

**CalendarFilter (`shared.jsx`):**
- **Views:** day (7-column grid with `alpha(mainColor, intensity)`) and month (4×3 grid).
- **Colors:** red for EGRESO and green for INGRESO.
- **Interaction:** a click filters and a second click clears. The Day/Month chips have bilingual `aria-label`s.

## Architecture

### Data flow: Supabase → tabs

```
Supabase DB (8 tables, RLS auth.uid() = user_id)
  └── DataProvider.load() — Promise.all of 8 queries (DataContext.jsx)
        ├── fetchAllRows(transactions) → mapRow() → flagAnomalies() → txs[]
        ├── mapGoal() / mapAccount() / mapInvestment() / mapDebt() / mapSubscription()
        └── unmapped → customCats[], editBudgets{}
              │
              └── useData()
                    ├── OverviewTab · ExpensesTab · IncomeTab · BudgetTab  (txs + editBudgets + customCats)
                    └── GoalsTab  (goals + accounts + investments + debts + subscriptions)

Each tab: filterByPeriod(txs, period) → helpers.ts → Charts.jsx
Category label / color / icon: resolveCategoryMeta()  (theme/categoryIcons.js)
Amounts: stored in PEN → fmtMoney(v, currency) for display; toBase()/fromBase() in forms
```

### Key modules

| Module | Role |
|---|---|
| `DashboardStudio.jsx` | App shell: the only component that consumes all 3 contexts (Settings, User, Data), owns the shared `period`, is the `showToast` channel and enforces session security |
| `DataContext.jsx` | The single source of data and of mutations against Supabase |
| `data/helpers.ts` | Pure calculations used by the tabs (periods, financial health, anomalies, recurring, trends, net worth); a bug here hits all of them, which is why it has tests |
| `components/goals/useEntityDialog.js` | State and handlers of the Goals tab's create/edit/delete dialogs (goals, accounts, investments, debts, subscriptions) |
| `theme/categoryIcons.js` | Label, color and icon for any category |
| `proxy.ts` | Route guard + per-request nonce CSP |

**`createClient()`** is called inside each CRUD function, but `createBrowserClient` is a singleton, so it doesn't open new connections.

> The README used to include metrics from a [graphify](https://github.com/ananddtyagi/cc-marketplace) graph built on an earlier version. They were removed because they no longer matched the code; the graph can be regenerated locally (`graphify-out/`, ignored by git).

## Deployment

- The GitHub → Vercel integration deploys every push to `main` to production and creates a **preview** for every PR.
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, build and the end-to-end tests on every PR; only merge when it's green.
- If a change touches the schema, first run its new migrations from `supabase/migrations/` in the Supabase SQL Editor (see [Database](#database-supabase)).
- Manual deploy: `vercel --prod`. Environment variables are configured in the Vercel Dashboard.

### How to merge a PR

Merging into `main` ships the change to production. The steps, on the PR's page on GitHub:

1. **Review:** the *Files changed* tab shows the diff. The Vercel preview (linked from the PR's checks) lets you try the change with real data before merging.
2. **Wait for green CI:** the *CI* check on the latest commit must show ✓.
3. **Migrate the DB if needed:** if the PR adds a `supabase/migrations/upgrade_*.sql`, run it in the Supabase SQL Editor **before** merging. The scripts are idempotent.
4. **Take it out of draft:** a *Draft* PR can't be merged. Click **Ready for review** at the bottom of the PR conversation.
5. **Merge:** **Merge pull request** → **Confirm merge**. Vercel deploys `main` within a minute or two.
6. **Optional:** **Delete branch** removes the PR's branch.

From the terminal, with [GitHub CLI](https://cli.github.com/): `gh pr ready <number>`, then `gh pr merge <number> --merge`.

### Versions and releases

- **Where the version lives:**
  - in `package.json`;
  - in the **Version** line of both READMEs;
  - in [`CHANGELOG.md`](CHANGELOG.md). Each change is noted under `## [Unreleased]` until a version is published.
- **History:** numbering restarted at `0.0.1`, and the `v1.x` history (tags and releases) was discarded.
- **Publishing a version** (e.g. `0.0.2`):
  1. On a branch:
     - `npm version 0.0.2 --no-git-tag-version`, which updates `package.json` and `package-lock.json`;
     - in the CHANGELOG, rename `## [Unreleased]` to `## [0.0.2]`;
     - update the **Version** line in both READMEs.
  2. Open the PR and merge it.
  3. On GitHub, go to **Releases** → **Draft a new release**:
     - tag `v0.0.2` on `main` (the tag is created when you publish);
     - title `v0.0.2`;
     - for the notes, that version's section of the CHANGELOG;
     - **Publish release**.
- **Deleting a release:** in **Releases**, open the release and click the trash icon (**Delete**).
  - Deleting a release **does not delete its tag**. Delete the tag separately, from the **Tags** tab or with `git push origin --delete vX.Y.Z`.
  - If you delete the tag first, the release doesn't go away: it becomes a draft, and you still have to delete it.

## Troubleshooting

**A feature appears "broken" only in production (www.jeshu.cfd) but works locally.**
This is almost always **browser cache**: after a deployment, the browser can combine stale cached HTML with the new JavaScript chunks, running a mix of versions. The app **does not use a Service Worker or PWA**, so there is no app-level cache to clear — it's the browser's.

- **Fix:** hard refresh with `Ctrl + Shift + R` (Cmd + Shift + R on Mac) or open the site in an **incognito window**.
- Before hunting for the bug in code, confirm the symptom also reproduces **locally** (`npm run dev`) and in **incognito**. If it only happens in production and your local code matches `origin/main`, it's cache.
- Real case (2026-06-16): the calendar date filter (Expenses/Income) showed the chip with the selected date but left the list empty, only in production. The code was correct; a hard refresh fixed it.

## License

MIT
