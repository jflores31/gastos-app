# Features

🌐 [Español](FEATURES.md) · **English**

Everything the app does, screen by screen. Summary in the [README](../README.en.md).

## Authentication
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

## Dashboard (OverviewTab)
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

## Expenses (ExpensesTab)
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
- **Account per transaction (optional):** the form has an account selector when there are accounts; its balance includes the transaction, and the list shows it next to the date ("· BCP")
- **Currency per transaction:** the form has a currency selector next to the amount (the one from Settings by default) and shows the equivalent ("≈ S/200"). It saves the amount in PEN plus the currency, what was typed and that day's rate. The list shows what was typed next to the date ("· €50") when the app is set to another currency, and exactly what was typed when it's the same one. Editing opens it in its currency and keeps its rate, unless the currency is changed

## Income (IncomeTab)
- Total income card with sparkline; `+X.X% vs prev.` chip hidden when no previous period (`dIn = null`)
- Category grid with icon, percentages and donut — label, color and icon via `resolveCategoryMeta` (built-in and custom); interactive cards to filter by source
- Monthly trend with full legend: income / expenses / net
- **CalendarFilter** in green (success)
- Footer total updates in real time when any filter is applied
- Transaction list with edit and delete; avatar with each category's icon and color

## Budgets (BudgetTab)
- Visual health score gauge
- Per-category cards with icon, progress and alerts at 80% and 100%
- Expense distribution donut — **stacks vertically on mobile** (column on xs, row on sm+)
- **"Budget vs Actual" chart:** horizontal bars per category, colored green/yellow/red; bars at 100%+ with diagonal stripe pattern; footer with totals
- Comparison with previous period — dynamic label per active period (week/month/quarter/year)
- Budget CRUD — exclusively from Supabase; selector includes custom categories in addition to native ones

## Goals & Finances (GoalsTab)
- Savings goal CRUD with deadline, color and a selectable icon (`IconPicker`) — form with single name field
- Bank accounts / cards / cash with a **calculated balance**: the balance typed in holds from that moment, and the app adds the income and subtracts the expenses linked to the account, plus **transfers** (⇄ button), which move money between accounts without counting as income or expense. The last 5 are listed with their note and can be deleted. Deleting an account leaves its movements without one, without changing the other accounts' balances
- Real-time net worth (`netWorthOf()`): assets (positive account balances + investments) − debts (negative balances + loans)
- Investment tracking (AFP, DPF, crypto, etc.) — form with single name field
- Debt and loan tracking with installments — form with single name field (saves in both languages automatically)
- Recurring subscriptions with category selector (native + custom); bilingual "Add" button in empty states. Each one shows its category's icon and colour instead of a logo (a logo service would learn what you pay for), and the name suggests the category ("Netflix" → Streaming) without replacing one picked by hand
- **3-month forecast** based on real linear trend (OLS slope of last 6 months of net values); 3 states based on available history: "No data" (0 months), "At least 2 months needed" + current average (1 month), real bars with `+trend×i` (2+ months); "Stable trend · N months" note if `|trend| < 1`; projected total = real sum of the 3 months
- **Net worth evolution** reconstructs real history working backward from current `netWorth`

## Profile & Settings (SettingsPanel)
Drawer with **two tabs** that separate Profile from Settings:
- **Profile:** hero with avatar, name and email; **Personal info** (edit first/last name — stored as `first_name`/`last_name` + synced `full_name`); **Favorite Categories** (appear first in the transaction selector) and **My Categories** (CRUD for custom categories — name, type, color and icon — in Supabase); **Two-step verification** (TOTP: turned on with a QR code or the key plus a first code, turned off with a confirmation)
- **Settings:** light/dark theme, accent palettes (dots with `flexWrap` on mobile), Comfy/Compact density, Spanish/English language, 8 currencies (PEN, USD, EUR, MXN, COP, ARS, CLP, BRL). Amounts are always stored in PEN and shown with **today's rates** (`/api/rates`; if the provider doesn't answer, the fixed ones from `CURRENCIES`). Under the currency you see which day they're from and the quote ("1 USD = S/3.85")
- The AppBar **avatar** opens Profile; the **gear** opens Settings (via the `initialTab` prop)
- **Day/night toggle on the login screen** (`AuthThemeToggle`): the user picks the theme before signing in; it persists in `localStorage`

## Privacy, export and installable app
- **Privacy mode:** the eye button in the top bar hides every amount ("S/••••") and is remembered in the browser. Amounts go through `fmt()` from `useSettings()`, which already knows the currency and this mode.
- **Your data (Profile):**
  - transactions download as CSV (UTF-8 with BOM for Excel, amounts in PEN next to each one's currency, typed amount, rate and account, cells guarded against formulas); when imported, the account is matched by name;
  - everything downloads as a full JSON backup (`src/features/import-export/domain/export.ts`).
- **Trash (Profile → Your data):**
  - deleting a transaction asks for no confirmation: it goes to the trash (`deleted_at`) and a notice offers "Undo" for 6 seconds;
  - from the trash you restore or delete permanently (with a confirmation), one by one or all at once;
  - after 30 days they're removed: `DataContext` deletes them when it loads the data;
  - trashed transactions don't count in any total, export or import.
- **Installable app:** `src/app/manifest.ts` plus the icons in `public/icons/`, generated with `node scripts/generate-icons.mjs`. Chrome, Edge and Android offer "Install app"; iOS offers "Add to Home Screen". No Service Worker, on purpose (see [Troubleshooting](DEPLOYMENT.en.md#troubleshooting)).

## Faster entry
- **Category suggested from the concept:** when typing the concept of a new transaction with no category chosen yet, it fills in by itself (`suggestCategory()` in `src/domain/categories/suggest.ts`):
  - first with the category you used most with that same concept (case and accents don't matter);
  - with no history, with the catalog category whose name or concepts appear in the text ("pago netflix" → Streaming);
  - if two categories tie, nothing is suggested;
  - a category picked by hand is never replaced, and a note under the field says where the suggestion came from.
- **CSV import (Profile → Your data):**
  - **Formats:** the app's own CSV export is recognized automatically; for a bank file or a spreadsheet you pick which column holds the date, the concept and the amount (suggested from the header names).
  - **What it reads:** `,` or `;` separators, `YYYY-MM-DD` or `DD/MM/YYYY` dates, and amounts like `1,234.56`, `1.234,56` or `-S/ 45`.
  - **Type and category:** without a type column, the amount's sign decides income or expense. The category comes from the file, from the concept suggestion, or from a default chosen in the preview.
  - **Preview:** how many rows are new, how many are already recorded (same day, concept, amount and type) and which have errors, with their line number. Already-recorded rows are skipped unless you ask otherwise, so re-importing a file duplicates nothing.
  - **Saving:** `addTxs()` inserts in batches of 500; if one fails, it says how many were saved. Limits: 5 MB and 10,000 rows. Code: `src/features/import-export/domain/csvImport.ts` and `ImportDialog.jsx`.

- **Upcoming payments (Budget):** what's due from today until the same day next month (`upcomingPayments()` in `features/budgets/domain/recurring.ts`), so every monthly payment shows up exactly once:
  - **Expenses that repeat for 3+ months:** due on the day you usually pay them. If it's already recorded this month, it moves to next month; if the day passed and it isn't recorded, it shows as "Overdue".
  - **Subscriptions:** one named like a repeated expense (Netflix) merges with it, using the subscription's price. The rest are dated from their last payment (+1 month or +1 year); a monthly one never paid shows as "No date".
  - **Record:** opens the form with the category, concept and amount filled in.

## Budgets by period
- **Period:** each budget is weekly, monthly or yearly, chosen in "Gestionar" when creating or editing it.
- **Scaled to the period being viewed:** `budgetFor()` uses `monthCount`'s months (week 0.25, quarter 3, year 12), so a monthly budget looks as it always did. The card of a budget whose period isn't the one on screen also shows its own amount ("S/100/semana").
- **Alerts at 80 % and 100 %:** `budgetAlerts()` measures spending in the budget's own period (this week, month or year):
  - the Budget tab shows a strip at the top with the ones at their limit;
  - saving, editing or importing an expense that crosses a threshold shows a notice ("Llegaste al 85 % del presupuesto de Salud y farmacias");
  - anything already over the line when the data loads doesn't notify.

## Responsive Design
- Tab navigation on desktop, fixed `BottomNavigation` on mobile
- Period chips with `flexWrap: "wrap"` — no overflow on iPhone SE (320px)
- Settings drawer: 100% width on mobile, 360px on desktop
- Distribution donut in BudgetTab: column on xs, row on sm+
- Auth forms stacked vertically on small screens
- Touch targets minimum 40×44 px on all action buttons
- Snackbar positioned above `BottomNavigation` on mobile (`bottom: { xs: 72, sm: 24 }`)
- Keyboard accessibility: `CalendarFilter` (day/month cells), "Today's expenses" section (ExpensesTab), and debt/subscription rows (GoalsTab) have `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space)
