# Code structure

🌐 [Español](PROJECT-STRUCTURE.md) · **English**

Where everything goes in `src/`, which layers there are and which rules `npm test` checks. For the data flow and technical decisions, see [ARCHITECTURE.en.md](ARCHITECTURE.en.md). How this structure came about: [ARCHITECTURE-AUDIT.md](ARCHITECTURE-AUDIT.md) (Spanish).

## Tree

The code is organized **by feature** (`features/`), not by file type. Whatever several features use lives outside, in shared folders.

```text
src/
├── app/                  # Next.js routes only: layout, page, error, not-found, manifest, globals.css, fonts/
│   ├── login/ · register/ · forgot-password/ · reset-password/
│   │                     #   page.tsx: a thin entry that renders the screen from features/auth
│   ├── auth/callback/    # Return from the Google/GitHub login (OAuth)
│   └── api/              # client-error, csp-report, rates (daily rates)
├── features/             # One folder per feature (below)
├── components/           # Shared UI, no business rules
│   ├── ui/               #   EmptyState, EmptySection, GradientIcon (+ CategoryAvatar), IconPicker
│   ├── charts/           #   Donut, SparkArea, StudioCashflow, HeatCalendar (own SVG)
│   ├── forms/            #   EntityDialog + useEntityDialog (create / edit / delete)
│   ├── feedback/         #   useToast + Toast (one notice at a time)
│   └── providers/        #   Providers, DynamicThemeProvider, ErrorReporter
├── contexts/             # Global state: DataContext (+ useTableCrud), SettingsContext, UserContext
├── domain/               # Rules several features use: money, period, health, netWorth,
│                         #   categories/ (catalog, suggest)
├── hooks/                # useLocalStorage
├── i18n/                 # Every text, in es and en
├── lib/                  # Infrastructure: supabase/ (client, server, fetchAllRows), rates, reportError, featureFlags
├── theme/                # MUI theme, shared design tokens (tokens.ts), icons, tones and
│                         #   category → name → color → icon
├── types/                # domain.ts (what the app uses) and database.ts (the rows of the 9 tables)
└── proxy.ts              # Session, 2FA and CSP on every request
```

**Each feature** has the folders it needs, always with these names:

```text
features/<feature>/
├── components/   # Screens, cards and dialogs (React + MUI)
├── hooks/        # State and effects of those screens
├── domain/       # Pure rules: no React, no MUI, no Supabase (with tests)
└── data/         # Row ↔ object mapping and writes to Supabase
```

| Feature | What it has |
|---|---|
| `transactions` | Expenses and Income (`ExpensesTab`, `IncomeTab`, `TransactionList`), the add/edit modal, the calendar filter, the trash; aggregations, anomalies and the date filter; the transaction writes |
| `budgets` | The Budget tab and its 9 cards and dialogs; the 80 % and 100 % alerts; budgets per period, recurring payments and upcoming payments |
| `goals` | Goals, forecast and net worth evolution |
| `accounts` | Accounts, transfers and today's balance |
| `investments` · `debts` · `subscriptions` | One card each and its table |
| `categories` | Custom categories |
| `import-export` | CSV import; CSV and JSON export |
| `auth` | Login, sign-up, recovery, 2FA, the in-app login; `useSessionGuard` (inactivity, 8 h, reopened browser); `authApi` |
| `settings` | The Profile and Settings panel, and "Your data" |
| `dashboard` | The app shell (`DashboardStudio`, `AppHeader`, `MainNav`), Overview and Goals, and the Overview insights |

## Layers

```text
UI       app/, features/*/components, components/
State    contexts/, features/*/hooks
Domain   domain/, features/*/domain, types/        no React, MUI or Supabase
Data     features/*/data, lib/supabase/            the only place with queries
```

Data reaches the UI through `useData()` (`contexts/DataContext.tsx`). `DataContext` holds the state of the 9 tables, listens to the session and does the load. Each table is read and written by its feature's `data/` module.

## Rules `npm test` checks

[`src/architecture.test.js`](../src/architecture.test.js) uses [`scripts/dependency-map.mjs`](../scripts/dependency-map.mjs) and fails on any of these violations:

- **Supabase** only in `features/*/data`, `contexts/`, `lib/supabase/`, `proxy.ts` and `app/auth/callback`. The UI uses `authApi` and `useData()`.
- **`components/`** doesn't import from `features/`: shared code doesn't know the features.
- **`lib/`, `domain/`, `types/`, `theme/` and `i18n/`** don't import from `features/`, `components/`, `contexts/` or `hooks/`.
- **Domain code** (`domain/`, `features/*/domain`, `types/`) imports no React, MUI or Supabase.
- **Between features** only `domain/`, `data/` or types are imported. The exceptions are the two that compose other features' screens: `dashboard` (the five tabs) and `settings` (Profile).
- **Imports:** relative within the same feature or folder; with `@/` when crossing from one to another.
- **Import cycles:** none.

To see the map: `node scripts/dependency-map.mjs` (`--areas` groups by folder, `--unused` lists unused exports).

## Where things go

| I want to add… | It goes in |
|---|---|
| A screen, card or dialog of a feature | `features/<f>/components/` |
| A calculation rule (amounts, dates, alerts) | `features/<f>/domain/`, with its test; in `domain/` if several features use it |
| A new column or table | `supabase/schema.sql`, `types/database.ts` and the feature's `data/` (`fromRow` / `toRow`); `database.test.ts` checks they match |
| A Supabase Auth call | `features/auth/data/authApi.ts` |
| A text | `i18n/` (es and en); `messages.test.js` checks both are there |
| An icon or a category color | `theme/` (see [ICONS.md](ICONS.md)) |
| A component several features use | `components/` (no business logic) |
| Styles | a `*.styles.ts` next to the component, or `theme/tokens.ts` if several features use them (see [Styles](#styles)) |
| A new tab | its feature in `features/`, plus an entry in `dashboard/components/MainNav.tsx` and `DashboardStudio.tsx` |

## Styles

Styles don't go in the JSX: the component imports its `sx` from a styles file.

| What | Where |
|---|---|
| What several features use: card shadows, the card with a coloured top border, a dialog's column of fields, the Expense / Income switch, the browser bar colours | `theme/tokens.ts` |
| The palette, the accents and the MUI component settings | `theme/materialTheme.ts` |
| A component's big `sx` (5 or more props, or with selectors like `&:hover`) and its colours | `Component.styles.ts` next to the component; one per feature (`budgets.styles.ts`) for many small components |
| Layout one-liners (`display: "flex"`, `gap`, `mb`) | inline, in the `sx` |
| What isn't MUI (the auth `Link`s, `global-error`) | a CSS Module (`*.module.css`) |
| Global classes (the `components/charts` SVGs, `.delta`) | `app/globals.css` |

- **Names:** `xxxSx`, or a function when it depends on the theme or the state (`accentSwatchSx(grad, selected)`).
- **Same CSS when moving a style:** shorthands keep their order (`borderTopColor` after `borderTop`, which resets it).
- **Lint rule:** `*.jsx` and `*.tsx` files (outside `theme/` and the tests) can't have colour literals (`#hex`, `rgb()`, `hsl()`) or `style={{}}`. `src/stylesLint.test.js` checks the rule.
- **The `style=""` attributes in the HTML** come from MUI, not from the code; that's why the CSP still allows them ([SECURITY-CSP.md](SECURITY-CSP.md#estilos-style-con-nonce-atributos-style-inline), in Spanish).

## How to add a feature

1. **Folder:** create `features/<name>/` with the subfolders you need (`components`, `domain`, `data`…).
2. **Rules first:** pure functions go in `domain/`, with a `*.test.ts` next to them.
3. **Data:** for a new table:
   - add it to `supabase/schema.sql` (the mock needs nothing: it reads that file);
   - put its row in `types/database.ts`;
   - write `data/<table>.ts` with a `TableSpec`;
   - add the state in `DataContext` with `useTableCrud`;
   - add the table to `database.test.ts`.
4. **UI:** components read with `useData()` and `useSettings()`. Texts go in `i18n/` and icons in `theme/icons.ts`.
5. **Mounting:** the screen is mounted from `dashboard` (a tab) or from `settings` (Profile).
6. **Check:** `npm run lint`, `npm run typecheck`, `npm test` (includes the rules above) and `npm run test:e2e`.

## TypeScript

- **In TypeScript:** `allowJs` stays on. The logic, types, contexts, hooks, data layer and shared UI are in TS.
- **In `.jsx`:** screens and cards stay that way, and move to TS when they're touched for another reason.
- **Exception:** `GradientIcon` stays `.jsx` (its props are in JSDoc, so the `.tsx` files that use it are checked). The reason is explained in [ARCHITECTURE-AUDIT.md](ARCHITECTURE-AUDIT.md#migración-js--ts).
- **When migrating a file:** only types are added. The JS TypeScript emits must stay the same as before.

## Tests

- **Unit and component:** next to the code (`*.test.ts`, `*.test.jsx`), with Vitest.
- **End-to-end:** in `e2e/`, with Playwright and a mock Supabase.
- **More detail:** [TESTING.md](TESTING.md) (Spanish).
