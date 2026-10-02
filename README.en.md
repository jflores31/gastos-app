# Finanzas — Personal Finance

Personal finance application to track income, expenses, budgets, goals, and more. Deployed at **[www.jeshu.cfd](https://www.jeshu.cfd)**.

**Version:** `v0.0.2` · [Changelog (Spanish)](CHANGELOG.md) · License [GPL-3.0](LICENSE)

<!-- i18n-selector-start -->
🌐 [Español](README.md) · **English**
<!-- i18n-selector-end -->

## What it does

- **Record:** income and expenses with their category (suggested from the description), their currency (8, converted with the day's rates) and, optionally, their account. Imports and exports CSV, and deleted items go to a trash with "Undo".
- **Understand:** a summary by week, month, quarter or year, with financial health, cash flow, spending by category, a spending calendar and a comparison with the previous period.
- **Plan:** weekly, monthly or yearly budgets with alerts at 80% and 100%, and upcoming payments based on repeated expenses and subscriptions.
- **Net worth:** savings goals, accounts with a calculated balance and transfers between them, investments, debts, subscriptions and a 3-month forecast.
- **Account and privacy:** email login, two-step verification (TOTP), sign-out on inactivity and when the browser is reopened, a privacy mode that hides amounts, light or dark theme, Spanish or English, and an installable app.

Screen-by-screen details in **[docs/FEATURES.en.md](docs/FEATURES.en.md)**. Amounts are stored in PEN: with the app in another currency, totals are converted at today's rate ([known limits](docs/ARCHITECTURE.en.md#data-and-supabase)).

## Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack) + React 19 |
| UI | Material UI (MUI) v9 + `@mui/icons-material` (Rounded variant) + `@mui/material-nextjs` (server-side styles in `<head>`) |
| Auth + DB | Supabase with `@supabase/ssr` 0.12 (email/password; OAuth wired up but disabled). The schema is standard PostgreSQL except for users, RLS and two-step verification ([how to migrate](docs/DATABASE.en.md#moving-to-another-system)) |
| Date Picker | MUI X Date Pickers + dayjs |
| State | React Context + localStorage |
| Language | TypeScript `strict` (routes, data, texts, settings and user contexts) + JSX (components) |
| Tests | Vitest 5 (unit and jsdom component tests) + Playwright (end-to-end) |
| CI | GitHub Actions: lint, typecheck, tests, build and end-to-end |
| Deploy | Vercel → `https://www.jeshu.cfd`, with Speed Insights (Core Web Vitals from real users) |

## Quick start

1. **Dependencies and environment variables:**

   ```bash
   npm install
   cp .env.example .env.local   # fill in the Supabase project's URL and anon key
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Database:** run [`supabase/schema.sql`](supabase/schema.sql) in Supabase → SQL Editor. It works for a new database and to upgrade an existing one, and it can be run more than once. Details in [docs/DATABASE.en.md](docs/DATABASE.en.md).

3. **Dev server:** `npm run dev` → `http://localhost:3000`.

**Checking a change** (the same thing CI runs on every PR and push to `main`):

```bash
npm run lint && npm run typecheck   # ESLint and tsc
npm test                            # Vitest: unit and component tests

# End-to-end (Playwright) against the production build and a mock Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e npm run build
npm run test:e2e
```

Testing details in **[docs/TESTING.md](docs/TESTING.md)** (Spanish).

## Documentation

| Document | Contents |
|---|---|
| [Features](docs/FEATURES.en.md) | Everything the app does, screen by screen |
| [Architecture](docs/ARCHITECTURE.en.md) | Code structure, data flow, key modules and technical notes |
| [Code structure](docs/PROJECT-STRUCTURE.en.md) | Where everything goes in `src/`, the layers, the rules `npm test` checks and how to add a feature |
| [Architecture audit](docs/ARCHITECTURE-AUDIT.md) (Spanish) | The refactor by feature and layer: starting point, plan, findings and result |
| [Database](docs/DATABASE.en.md) | Tables, how to install or upgrade the schema, what depends on Supabase and how to move to another system |
| [Security](docs/SECURITY.en.md) · [CSP](docs/SECURITY-CSP.md) (Spanish) | Security measures and the per-request nonce Content-Security-Policy |
| [Tests](docs/TESTING.md) (Spanish) | Unit, component and end-to-end tests, and the mock Supabase |
| [Deployment and versions](docs/DEPLOYMENT.en.md) | Vercel, how to merge a PR, how to publish a version and troubleshooting |
| [Icons](docs/ICONS.md) (Spanish) | Icon system and category → icon map |
| [Research and roadmap](docs/INVESTIGACION.md) (Spanish) | Similar projects, product ideas and technical improvements, with their status |
| [Changelog](CHANGELOG.md) (Spanish) | What changed in each version |

## License

[GNU General Public License v3.0](LICENSE) (`GPL-3.0-only`). Copyright © 2026 jflores31.

- You may use, study, modify and redistribute it. Anyone who distributes the app, or a modified version, must do so under GPL-3.0 too, with its source code.
- Offering it as a web service, without distributing it, doesn't require publishing the code (the AGPL-3.0 would).
- It comes with no warranty (sections 15 and 16 of the license).
- The fonts in `src/app/fonts/` (IBM Plex Sans and JetBrains Mono) keep their SIL OFL 1.1 license, and the npm dependencies keep theirs (MIT, Apache-2.0, BSD, ISC, LGPL-3.0 and CC-BY-4.0), all compatible with GPL-3.0.
