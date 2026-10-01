# Architecture

🌐 [Español](ARCHITECTURE.md) · **English**

How the code is organized, how data flows and the technical decisions worth knowing before changing it.

## Project structure

```
.
├── .github/workflows/ci.yml        # CI: lint, typecheck, tests, build and e2e on every PR and push to main
├── e2e/                            # End-to-end tests (Playwright) + playwright.config.ts
│   └── mock-supabase/              # Mock Supabase (Auth + PostgREST) for the logged-in tests
├── .env.example                    # Environment variables (copy to .env.local)
├── CHANGELOG.md                    # Changelog (Spanish)
├── LICENSE                         # GPL-3.0
├── README.md · README.en.md        # Overview, quick start and documentation index
├── docs/                           # Documentation (index in the README); .en.md files are the English version
│   ├── FEATURES.en.md              # Features, screen by screen
│   ├── ARCHITECTURE.en.md          # This file: structure, data flow and technical notes
│   ├── PROJECT-STRUCTURE.en.md     # Where everything goes in src/, layers and the rules npm test checks
│   ├── ARCHITECTURE-AUDIT.md       # Audit and plan of the refactor by feature, with the result (Spanish)
│   ├── DATABASE.en.md              # Schema, how to install it and how to move to another system
│   ├── SECURITY.en.md              # Security measures
│   ├── SECURITY-CSP.md             # Per-request nonce CSP (Spanish)
│   ├── TESTING.md                  # Unit, component and end-to-end tests (Spanish)
│   ├── DEPLOYMENT.en.md            # Deployment, PRs, versions and troubleshooting
│   ├── ICONS.md                    # Icon system and category → icon map (Spanish)
│   └── INVESTIGACION.md            # Similar projects, roadmap and its status (Spanish)
├── public/                         # favicon.svg and the installable app's icons
├── scripts/
│   ├── generate-icons.mjs          # Generates public/icons/
│   └── dependency-map.mjs          # Import graph, layer rules and unused exports (used by architecture.test.js)
├── src/                            # (detail below)
└── supabase/
    ├── config.toml                 # Supabase project settings (local CLI)
    ├── schema.sql                  # Full schema: installs or upgrades any version (idempotent)
    └── seed/reset.sql              # Empties the 9 tables — destructive
```

`src/` is organized by feature (`features/`) and by layer. The full tree, the rules `npm test` checks and how to add a feature are in [PROJECT-STRUCTURE.en.md](PROJECT-STRUCTURE.en.md). In short:

```
src/
├── app/            # Routes only: layout, page, error, api/*, auth/callback and the 4 auth pages (thin entries)
├── features/       # transactions, budgets, goals, accounts, investments, debts, subscriptions, categories,
│                   #   import-export, auth, settings, dashboard — each with components/ hooks/ domain/ data/
├── components/     # Shared UI: ui/, charts/, forms/, feedback/, providers/
├── contexts/       # DataContext (+ useTableCrud), SettingsContext, UserContext
├── domain/         # Shared rules: money, period, health, netWorth, categories/
├── hooks/ · i18n/ · lib/ (supabase/, rates, reportError, featureFlags) · theme/ · types/ (domain, database)
└── proxy.ts        # Auth guard + 2FA + CSP with a per-request nonce (Next.js 16)
```

## Data flow: Supabase → tabs

```
Supabase DB (9 tables, RLS auth.uid() = user_id)
  └── DataProvider: load() — purges the trash and runs 10 queries in parallel (contexts/DataContext.tsx)
        ├── fetchAllRows(transactions) → transactionFromRow() → flagAnomalies() → txs[]   (features/transactions/data)
        ├── goalFromRow / accountFromRow / transferFromRow / investmentFromRow / debtFromRow / subscriptionFromRow
        │                                                                     (features/<feature>/data)
        ├── budgetsFromRows() → editBudgets{} + budgetPeriods{}               (features/budgets/data)
        ├── accountBalance() → accounts[].current (today's balance)           (features/accounts/domain)
        └── unmapped → customCats[]
              │
              └── useData()  (typed: DataValue)
                    ├── OverviewTab · ExpensesTab · IncomeTab · BudgetTab  (txs + editBudgets + customCats)
                    └── GoalsTab  (goals + accounts + transfers + investments + debts + subscriptions)

Writes: useTransactionMutations · useBudgetMutations · useTableCrud(<table>Table)  → throw on failure,
        and only then leave the state untouched
Auth (login, sign-up, 2FA, sign-out): features/auth/data/authApi.ts
Each tab: filterByPeriod(txs, period) → rules in features/*/domain and domain/ → components/charts
Category label / color / icon: resolveCategoryMeta()  (theme/categoryIcons.ts)
Amounts: stored in PEN (+ each transaction's currency, what was typed and the rate) → fmtMoney(v, currency) on display,
         with the day's rates (/api/rates → setLiveRates); toBase()/fromBase() in forms
```

## Key modules

| Module | Role |
|---|---|
| `features/dashboard/components/DashboardStudio.tsx` | App shell: composes `AppHeader`, `MainNav`, the 5 tabs, the toast and the dialogs; holds the active tab and the shared `period` |
| `features/auth/hooks/useSessionGuard.ts` | Session security: inactivity with a warning, 8 h max age, reopened browser (`BroadcastChannel`) |
| `contexts/DataContext.tsx` | State of the 9 tables, loaded once per user, plus the writes; the only door to the data |
| `features/*/data/` | Row ↔ object of each table and its writes; `authApi.ts` for Supabase Auth |
| `features/*/domain/` · `domain/` | Pure calculations (periods, financial health, anomalies, recurring, budgets, net worth, CSV); a bug here hits every tab, which is why they have tests |
| `components/forms/useEntityDialog.ts` | State and handlers of the create/edit/delete dialogs (goals, accounts, investments, debts, subscriptions) |
| `theme/categoryIcons.ts` | Label, color and icon for any category |
| `proxy.ts` | Route guard + CSP with a per-request nonce |

**`createClient()`** is called on every operation (`authApi`, `DataContext`), but `createBrowserClient` is a singleton: it doesn't open new connections.

> The README used to include metrics from a graph generated with [graphify](https://github.com/ananddtyagi/cc-marketplace) on an older version. They were removed because they no longer matched the code. The current dependency map comes from `node scripts/dependency-map.mjs`.

## Technical notes

### Data and Supabase

**Data loading:** `DataContext.load()` runs on the first `onAuthStateChange` event that carries `session.user` (`INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED` or `USER_UPDATED`) and is deduplicated by `session.user.id`, so periodic token refreshes don't re-run the loading queries. It isn't called on mount (that duplicated the queries). On failure the flag is reset so the next event retries. This removed the "you have to refresh twice" bug, where an `INITIAL_SESSION` without a usable session was never retried. The queries rely on RLS (`select("*")` with no `.eq("user_id")`).

**More than 1000 transactions:** PostgREST caps every response at `max_rows` (1000). `transactions` is fetched with `fetchAllRows()` (`src/lib/supabase/fetchAllRows.ts`), which pages with `.range()` ordered by `fecha` + `id`. It's all or nothing: if a page fails, no partial result is shown.

**Currency:** amounts are always stored in PEN. `fmtMoney(v, currency)` multiplies by the rate for display, and forms convert with `toBase()` on save and `fromBase()` when pre-filling an edit (budgets, goals, accounts, investments, debts and subscriptions; % rates and months are not converted). The 10,000,000 cap is validated in PEN. Known limit: rounding to 2 PEN decimals can move a COP amount by up to about 5 units.

- **Today's rates:**
  - `src/lib/rates.ts` fetches them from [open.er-api.com](https://open.er-api.com) (free, no key, updated daily) on the server, cached for 12 h;
  - the browser only talks to `/api/rates` (behind the login), so the CSP stays `'self'` and the provider never sees who is asking;
  - if the provider fails or answers something odd (another base, a missing rate, 0), the fixed ones from `CURRENCIES` are used, as they are until the answer arrives: server rendering always uses the fixed ones;
  - `RATES_API_URL` points it at another provider with the same format (the e2e tests use the mock Supabase);
  - the free no-key access asks for attribution where the rates are shown: Settings links "Rates By Exchange Rate API" next to the date.
- **Transactions:** they also store `moneda` (currency), `monto_original` (what was typed) and `tasa` (units of that currency per 1 PEN, that day's); in PEN the last two stay `null`. So a transaction in the app's current currency shows exactly what was typed (`fmtTx()`), and one in another currency shows what was typed next to it (`txOriginal()`). When importing a CSV, duplicates are compared by what was typed, so importing a dollar file again on another day (at another rate) still detects them.
- **Known limits (with the app in a currency other than PEN):**
  - totals add up `valor` in PEN and convert it at today's rate, like Cashew: a dollar total can differ by a few cents from the sum of what was typed in each row if the rate moved since;
  - budgets, goals, accounts, investments, debts and subscriptions only store the PEN amount, so in dollars they show at today's rate: a $100 budget can show as $96 if the dollar went up. Storing the currency in those tables too would be another schema change.

**Transaction type derived from the category (not the toggle):** in `AddTransactionModal`, the saved `tipo` (INGRESO/EGRESO) is the **selected category's** type (`categoria.type`). Custom categories are shown regardless of the toggle, and saving the toggle's `tipo` recorded a custom income as an expense. The Autocomplete's `onChange` also syncs the toggle. Backfill for old data: `UPDATE transactions t SET tipo = cc.tipo FROM custom_categories cc WHERE t.categoria = 'custom_' || cc.id::text AND t.tipo <> cc.tipo;`.

**Mutations throw on error:**
- Every CRUD function in `DataContext` does `if (error) throw error` before touching local state.
- **Session user:** they use the session user's id, kept in a ref from `onAuthStateChange` and read with `requireUserId()`, instead of calling `supabase.auth.getUser()` (a request to the Auth server) before every write. RLS still validates the JWT on the server.
- **No session:** `requireUserId()` throws "No hay sesión activa", so the UI shows an error instead of a false "saved".
- **Shared CRUD:** goals, accounts, investments, debts, subscriptions and custom categories use `useTableCrud()`, which updates by `id` or inserts, and deletes by `id` + `user_id`. `optionalColumns` retries without a new column if the DB doesn't have it yet (`PGRST204`). Transactions and budgets have their own functions.
- **In the components:** handlers use `try/catch/finally` and show a success or error toast, which is why `DashboardStudio` passes `showToast` to the tabs and to `AddTransactionModal`.

**Budgets:** `editBudgets` starts as `{}` and is filled only from Supabase; `deleteBudgetCat(cat)` deletes in the DB before updating state. Each budget stores its period (`budgetPeriods`: week, month or year) and views scale it to the period on screen with `budgetFor()`.

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

**CSP:** built per request in `src/proxy.ts` (`buildCsp`) with a nonce and `'strict-dynamic'`; `'unsafe-eval'` is only added outside production. Details in [SECURITY-CSP.md](SECURITY-CSP.md) (Spanish).

**Auth pages:**
- They all use `useTheme()` and `isDark`, with `darkField`/`cardSx` defined inside the component and `Blobs` receiving `{ isDark }`.
- `isDark` starts as `false` and is applied in a `useEffect`, so the first render matches the server HTML (avoids the hydration mismatch).
- The Supabase calls (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`) are wrapped in `try/catch/finally`, so the button never stays stuck on a spinner.
- `AuthErrorAlert` detects the expired link in Spanish and English (`"expiró"` / `"expired"`).

### Icons and theme

**Icon system:**
- Category icons come from a single map, `src/theme/categoryIcons.ts`.
- `resolveCategoryMeta(categoria, customCats, lang, tipo)` returns label, color and icon for both built-in and custom (`custom_<id>`) categories. The transaction picker, lists, filter chips and budgets use it, and it replaces the `customCats` lookups that used to be repeated in every tab.
- Lists render `CategoryAvatar` (a squircle with the category color's gradient) and headers use `GradientIcon` with a semantic tone (`TONE_BY_PALETTE`).
- Goals and custom categories pick an icon with `IconPicker` and store its key (e.g. `"Flight"`). Older goals with a text glyph still render.
- If the `custom_categories.icon` column doesn't exist yet, `saveCustomCat` gets `PGRST204` and saves without the icon.

**Theme without hydration mismatch:** `useLocalStorage` uses the default value on the first render (server and hydration) and applies the stored one right after mount. Reading it in the `useState` initializer made a stored dark theme produce different classNames than the server HTML, which React doesn't patch up.

### Calculations and charts

**Filters (Expenses/Income):** both use `useTxFilters` (`features/transactions/hooks`). A day or month picked in the calendar replaces the period, and the category chip applies on top of either. It returns the list, newest first, and its total (`filteredTotal`). The footer and summary cards read that total, and the daily average uses `daysCount(period)` (7/30/90/365).
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
- **Outside React** (e.g. `healthLabel` in `domain/health.ts` and `insightsList` in `features/dashboard/domain/insights.ts`): `messagesFor(lang)`.
- **Accessible names are translated too:** `aria-label`s, the 43 icon names in the picker (`t.iconNames`) and the palettes (`t.palettes`).
- **Rule:** no `lang === "es" ? … : …`. `messages.test.js` fails if one appears outside `src/i18n/`, or if a key is missing in one language.
- **Category names** stay in `CATEGORIES` (`src/domain/categories/catalog.ts`), with `es` and `en` on each.

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

**CalendarFilter (`features/transactions/components/CalendarFilter.tsx`):**
- **Views:** day (7-column grid with `alpha(mainColor, intensity)`) and month (4×3 grid).
- **Colors:** red for EGRESO and green for INGRESO.
- **Interaction:** a click filters and a second click clears. The Day/Month chips have bilingual `aria-label`s.
