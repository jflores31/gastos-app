# Finanzas — Personal Finance

Personal finance application to track income, expenses, budgets, goals, and more. Deployed at **[www.jeshu.cfd](https://www.jeshu.cfd)**.

**Version:** `v0.0.1` · [Changelog](CHANGELOG.md) · [Research on similar projects & roadmap (Spanish)](docs/INVESTIGACION.md)

<!-- i18n-selector-start -->
🌐 [Español](README.md) · **English**
<!-- i18n-selector-end -->

## Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack) |
| UI | Material UI (MUI) v9 + `@mui/icons-material` (Rounded variant) |
| Auth + DB | Supabase (email/password; OAuth wired up but disabled) |
| Date Picker | MUI X Date Pickers + dayjs |
| State | React Context + localStorage |
| Language | TypeScript (routes/config) + JSX (components) |
| Tests | Vitest (unit and jsdom component tests) + Playwright (end-to-end) |
| CI | GitHub Actions: lint, typecheck, tests and build |
| Deploy | Vercel → `https://www.jeshu.cfd` |

## Features

### Authentication
- Login with email/password
- Registration with first name, last name, and email — email confirmation required
- Full password recovery flow (forgot → email → reset with expired link detection)
- Double-layer route protection: `src/proxy.ts` (server) + `router.replace` in `DashboardStudio` (client)
- Auto-logout on inactivity after 2 minutes with a 30 s warning, measured across all tabs (an idle tab doesn't sign you out while you're active in another one)
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
- Net worth (assets − debts) in real time
- Investment tracking (AFP, DPF, crypto, etc.) — form with single name field
- Debt and loan tracking with installments — form with single name field (saves in both languages automatically)
- Recurring subscriptions with category selector (native + custom); bilingual "Add" button in empty states
- **3-month forecast** based on real linear trend (OLS slope of last 6 months of net values); 3 states based on available history: "No data" (0 months), "At least 2 months needed" + current average (1 month), real bars with `+trend×i` (2+ months); "Stable trend · N months" note if `|trend| < 1`; projected total = real sum of the 3 months
- **Net worth evolution** reconstructs real history working backward from current `netWorth`

### Profile & Settings (SettingsPanel)
Drawer with **two tabs** that separate Profile from Settings:
- **Profile:** hero with avatar, name and email; **Personal info** (edit first/last name — stored as `first_name`/`last_name` + synced `full_name`); **Favorite Categories** (appear first in the transaction selector) and **My Categories** (CRUD for custom categories — name, type, color and icon — in Supabase)
- **Settings:** light/dark theme, accent palettes (dots with `flexWrap` on mobile), Comfy/Compact density, Spanish/English language, 8 currencies (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL). Amounts are always stored in PEN: forms convert with `toBase()` on save and `fromBase()` on edit (`src/data/index.js`), using fixed rates
- The AppBar **avatar** opens Profile; the **gear** opens Settings (via the `initialTab` prop)
- **Day/night toggle on the login screen** (`AuthThemeToggle`): the user picks the theme before signing in; it persists in `localStorage`

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
    ├── migrations/schema.sql       # Full DB schema (single source of truth, for a new DB)
    ├── migrations/upgrade_0.0.1.sql # 0.0.1 changes for an existing DB (idempotent)
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
│   ├── BudgetTab.jsx               # Budgets
│   ├── GoalsTab.jsx                # Goals, accounts, investments, debts, subscriptions
│   ├── Charts.jsx                  # Donut, SparkArea, StudioCashflow, HeatCalendar
│   ├── shared.jsx                  # StatsCard, EmptyState, NoTransactions, CalendarFilter
│   ├── AddTransactionModal.jsx     # New/edit transaction modal
│   ├── SettingsPanel.jsx           # Profile/settings drawer + custom categories
│   └── LoginModal.jsx              # In-app login modal
├── context/
│   ├── DataContext.jsx             # Loading and CRUD: txs, budgets, goals, accounts,
│   │                               #   investments, debts, subscriptions, customCats
│   ├── SettingsContext.jsx         # theme, density, currency, lang, palette + PALETTES
│   └── UserContext.tsx             # useSupabaseUser() → undefined | User | null
├── data/
│   ├── index.js                    # CATEGORIES, CURRENCIES, I18N, fmtMoney, toBase/fromBase
│   ├── helpers.js                  # filterByPeriod, healthScore, flagAnomalies, recurringList,
│   │                               #   insightsList, linearRegressionSlope…
│   ├── fetchAllRows.js             # Pagination with .range() (Supabase caps responses at 1000 rows)
│   └── *.test.js                   # helpers, currency, fetchAllRows (components: *.test.jsx next to each)
├── theme/
│   ├── materialTheme.js            # Light/dark themes, accents and icon animation
│   ├── icons.js                    # Central MUI Rounded icon set
│   ├── categoryIcons.js            # Category → icon, ICON_CHOICES, resolveCategoryMeta() (+ test)
│   ├── iconTones.js                # Gradients per tone (TONES, TONE_BY_PALETTE)
│   ├── GradientIcon.jsx            # GradientIcon + CategoryAvatar
│   └── IconPicker.jsx              # Icon picker (goals and custom categories)
├── hooks/
│   └── useLocalStorage.js          # Default value on first render; stored value applied after mount
├── lib/
│   ├── reportError.js              # Sends browser errors to /api/client-error
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

The full schema is in `supabase/migrations/schema.sql`.

> **Schema changes on an existing DB:** `schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so it doesn't alter tables that already exist. Each version's changes ship as an idempotent script that must be run in the Supabase SQL Editor **before** deploying. For 0.0.1 it's `supabase/migrations/upgrade_0.0.1.sql`, which adds:
> - the `custom_categories.icon` column;
> - `(user_id, …)` indexes on the tables;
> - RLS policies using `(select auth.uid())`.
>
> Tested on Postgres 16: running it twice doesn't error, and it leaves the DB identical to a fresh `schema.sql` install. With 200,000 transactions, loading one user's data went from ~120 ms (full table scan) to ~1.4 ms (index).

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

# End-to-end tests (Playwright) against the production build
npm run build && npm run test:e2e

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
| HTTP Security Headers | CSP **with a per-request nonce** (`script-src 'self' 'nonce-…' 'strict-dynamic'`, no `'unsafe-inline'`) generated in `proxy.ts`; the rest (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) in `next.config.mjs` |
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

**More than 1000 transactions:** PostgREST caps every response at `max_rows` (1000). `transactions` is fetched with `fetchAllRows()` (`src/data/fetchAllRows.js`), which pages with `.range()` ordered by `fecha` + `id`. It's all or nothing: if a page fails, no partial result is shown.

**Currency:** amounts are always stored in PEN. `fmtMoney(v, currency)` multiplies by the fixed `rate` from `CURRENCIES` for display, and forms convert with `toBase()` on save and `fromBase()` when pre-filling an edit (transactions, budgets, goals, accounts, investments, debts and subscriptions; % rates and months are not converted). The 10,000,000 cap is validated in PEN. Known limit: rounding to 2 PEN decimals can move a COP amount by up to about 5 units.

**Transaction type derived from the category (not the toggle):** in `AddTransactionModal`, the saved `tipo` (INGRESO/EGRESO) is the **selected category's** type (`categoria.type`). Custom categories are shown regardless of the toggle, and saving the toggle's `tipo` recorded a custom income as an expense. The Autocomplete's `onChange` also syncs the toggle. Backfill for old data: `UPDATE transactions t SET tipo = cc.tipo FROM custom_categories cc WHERE t.categoria = 'custom_' || cc.id::text AND t.tipo <> cc.tipo;`.

**Mutations throw on error:** every CRUD function in `DataContext` (transactions, budgets, custom categories, goals, accounts, investments, debts, subscriptions) does `if (error) throw error` before touching local state. Component handlers use `try/catch/finally` and show a success or error toast, which is why `DashboardStudio` passes `showToast` to the tabs and to `AddTransactionModal`.

**Budgets:** `editBudgets` starts as `{}` and is filled only from Supabase; `deleteBudgetCat(cat)` deletes in the DB before updating state. The stored amount is monthly; views multiply it by `monthCount(period)`.

**Numeric types:** the `map*` functions in `DataContext` convert to `Number` the decimals Supabase returns as strings (e.g. debts' `remaining` and `original_months`).

**No mock data:** everything comes from Supabase; there are no sample transactions, goals, accounts or budgets in the code.

**Multiple Supabase client instances:** `onAuthStateChange` events don't propagate between separate instances. `LoginModal` uses `window.location.reload()` after login so `DataContext` reloads.

**"JWT issued at future" error:** shows up when the device clock is ahead of Supabase (1 minute is enough). Supabase rejects the JWT and every query fails. Fix: sync the system clock. The error banner detects this case and shows an actionable message.

### Session and authentication

**Session security:**
- `UserContext` writes `gastos_session_alive` to `sessionStorage` on `SIGNED_IN`; the browser clears it on close and reloads (F5) keep it.
- On mount, `DashboardStudio` checks for it. If it's missing, it asks over `BroadcastChannel("gastos-session")` whether another tab is alive (waiting about 300 ms): if one answers, this is a new tab with the browser still open and it inherits the flag; if not, the browser was reopened and it signs out.
- Inactivity: 2 min with a warning at 30 s. `gastos_last_active` (localStorage, shared across tabs) is updated on every user event and re-read before warning or signing out, so an idle tab doesn't sign out a user who is active in another tab.
- Tab left open for more than 8 h: checked when visibility returns (`visibilitychange`, plus `pageshow` for bfcache).
- Automatic sign-outs use `signOut({ scope: "local" })`, which doesn't revoke the user's sessions on other devices; the "Sign out" button keeps the global scope. All of them clear `gastos_last_active` to avoid a logout loop on the next login.

**OAuth (disabled):** `src/app/auth/callback/route.ts` exchanges the PKCE code and checks that `next` is an internal path. To enable it: create the OAuth apps in Google/GitHub, add client id/secret in Supabase → Auth → Providers, add `https://www.jeshu.cfd/auth/callback` to the redirect URLs and set `OAUTH_ENABLED = true` on the login and register pages. ⚠ Check the session flag first: the exchange happens on the server, so the client never gets `SIGNED_IN` and `gastos_session_alive` wouldn't be written.

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

Each tab: filterByPeriod(txs, period) → helpers.js → Charts.jsx
Category label / color / icon: resolveCategoryMeta()  (theme/categoryIcons.js)
Amounts: stored in PEN → fmtMoney(v, currency) for display; toBase()/fromBase() in forms
```

### Key modules

| Module | Role |
|---|---|
| `DashboardStudio.jsx` | App shell: the only component that consumes all 3 contexts (Settings, User, Data), owns the shared `period`, is the `showToast` channel and enforces session security |
| `DataContext.jsx` | The single source of data and of mutations against Supabase |
| `data/helpers.js` | Pure calculations used by the 4 main tabs (periods, financial health, anomalies, recurring, trends); a bug here hits all of them, which is why it has tests |
| `theme/categoryIcons.js` | Label, color and icon for any category |
| `proxy.ts` | Route guard + per-request nonce CSP |

**`createClient()`** is called inside each CRUD function, but `createBrowserClient` is a singleton, so it doesn't open new connections.

> The README used to include metrics from a [graphify](https://github.com/ananddtyagi/cc-marketplace) graph built on an earlier version. They were removed because they no longer matched the code; the graph can be regenerated locally (`graphify-out/`, ignored by git).

## Deployment

- The GitHub → Vercel integration deploys every push to `main` to production and creates a **preview** for every PR.
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and build on every PR; only merge when it's green.
- If a change touches the schema, first run its upgrade script (for 0.0.1, `supabase/migrations/upgrade_0.0.1.sql`) in the Supabase SQL Editor (see [Database](#database-supabase)).
- Manual deploy: `vercel --prod`. Environment variables are configured in the Vercel Dashboard.

## Troubleshooting

**A feature appears "broken" only in production (www.jeshu.cfd) but works locally.**
This is almost always **browser cache**: after a deployment, the browser can combine stale cached HTML with the new JavaScript chunks, running a mix of versions. The app **does not use a Service Worker or PWA**, so there is no app-level cache to clear — it's the browser's.

- **Fix:** hard refresh with `Ctrl + Shift + R` (Cmd + Shift + R on Mac) or open the site in an **incognito window**.
- Before hunting for the bug in code, confirm the symptom also reproduces **locally** (`npm run dev`) and in **incognito**. If it only happens in production and your local code matches `origin/main`, it's cache.
- Real case (2026-06-16): the calendar date filter (Expenses/Income) showed the chip with the selected date but left the list empty, only in production. The code was correct; a hard refresh fixed it.

## License

MIT
