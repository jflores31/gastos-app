# Database

🌐 [Español](DATABASE.md) · **English**

The whole schema lives in one file, [`supabase/schema.sql`](../supabase/schema.sql). This guide explains what it stores, how to install or upgrade it, which part depends on Supabase and how to move the app and its data to another system.

## Tables

Nine tables, all with `id` (uuid), `user_id` and `updated_at` (kept by a trigger). Amounts are stored in PEN (soles).

| Table | What it stores |
|---|---|
| `transactions` | Income and expenses: `tipo` (`INGRESO`/`EGRESO`), `categoria`, `concepto`, `valor` in PEN and `fecha`. Also the currency it was entered in (`moneda`, `monto_original`, `tasa`), the account (`cuenta_id`, optional) and `deleted_at` when it's in the trash |
| `budgets` | One budget per category (`UNIQUE (user_id, categoria)`), with its `periodo`: `week`, `month` or `year` |
| `goals` | Savings goals: target, progress, deadline, color and icon (an `ICON_CHOICES` key, the selectable icons in `src/theme/categoryIcons.ts`; old goals store a text glyph) |
| `accounts` | Bank accounts, cash and cards (`type`: `bank`, `cash`, `card`), with their balance as of a date (`balance`, `balance_at`) |
| `transfers` | Transfers between two of the user's accounts (`origen`, `destino`, `monto` in PEN, `fecha`, `nota`) |
| `investments` | Investments, with their rate of return |
| `debts` | Loans, with installments and remaining months |
| `subscriptions` | Subscriptions, with their cycle (`monthly`/`yearly`) and category |
| `custom_categories` | The user's own categories (name, type, color and icon) |

**Relationships:**
- `transactions.cuenta_id`, `transfers.origen` and `transfers.destino` point to `accounts` through `(id, user_id)`, so nobody can link anything to another user's account. When an account is deleted, `ON DELETE SET NULL (col)` sets only that column to `NULL`: the transaction or transfer stays.
- `categoria` is text, with no foreign key: a key from the catalog that lives in the code (`CATEGORIES` in `src/domain/categories/catalog.ts`, e.g. `COMIDA`) or `custom_<id>` for a custom category, where `<id>` is the `custom_categories` `id`.

**Constraints** (`CHECK`): valid `tipo`, `valor > 0`, `moneda` among the app's 8 currencies, positive `monto_original` and `tasa`, account `type`, budget `periodo` and custom category `tipo`.

**Outside these tables:** each user's name, avatar and favorite categories are stored in their Supabase Auth profile (`user_metadata`: `first_name`, `last_name`, `full_name`, `avatar_url`, `fav_categories`), not in a table of their own. Keep this in mind when migrating (see [Data](#2-data)). The app doesn't use Supabase Storage: `avatar_url` only exists if an OAuth provider (currently disabled) set it, and it points to that provider's image.

## Install or upgrade

`supabase/schema.sql` does both: it creates what doesn't exist and leaves what's already there unchanged. It can be run more than once.

- **Requirement:** PostgreSQL 15 or later (for single-column `ON DELETE SET NULL`). Supabase uses 15 or 17.
- **In Supabase:** SQL Editor → paste the whole file → **Run**.
- **With psql:** `psql "$DATABASE_URL" -f supabase/schema.sql`.
- **Before upgrading a database that has data:** this query must return 0 in both columns. Otherwise, fix or delete those rows first; if not, the constraints fail and part 1 isn't applied.

  ```sql
  SELECT count(*) FILTER (WHERE tipo NOT IN ('INGRESO', 'EGRESO')) AS tipo_invalido,
         count(*) FILTER (WHERE valor <= 0)                       AS valor_invalido
  FROM transactions;
  ```

The file has two parts, each in its own transaction: if something fails inside one, that part leaves nothing half-done.

| Part | What it does | Depends on |
|---|---|---|
| **1 — Standard PostgreSQL** | Tables, columns added since earlier versions, constraints, foreign keys between tables, indexes and `updated_at` triggers | Nothing: works on any Postgres 15+ |
| **2 — Supabase only** | Links `user_id` to `auth.users`, enables RLS and requires two-step verification from users who turned it on | Supabase's `auth` schema. On another Postgres it fails with `schema "auth" does not exist` and applies nothing; part 1 stays applied |

**How it was tested** (Postgres 16):
- a new database ends up identical to the one the previous 8 migrations produced (columns, constraints, indexes, policies, triggers, functions and grants), and running it twice changes nothing;
- copies of databases from earlier versions end up with the same schema and no data loss; one with a transaction of value 0 fails until that row is fixed, as the query above warns;
- on a Postgres without Supabase, part 1 creates the 9 tables (saving a transfer and deleting an account were tested: its transactions are left without an account) and part 2 fails without touching anything.

**Performance:** with 200,000 transactions, loading one user's takes ~1.4 ms thanks to the `(user_id, …)` indexes; without them it was ~120 ms (a full table scan).

**Supabase CLI:** `supabase db push` only applies files in `supabase/migrations/`, to the project linked with `supabase link --project-ref <ref>`. To use the CLI, copy `schema.sql` to `supabase/migrations/<YYYYMMDDHHMMSS>_schema.sql`; since it's idempotent, it also works on a database that already has it.

## What depends on Supabase

### In the SQL (part 2)

- **Users:** `user_id` is a foreign key to `auth.users (id)` with `ON DELETE CASCADE`: deleting a user deletes all their rows.
- **Isolation (RLS):** one policy per table (`own <table>`; for `custom_categories`, `custom_categories_policy`) only allows reading and writing rows where `user_id = auth.uid()`.
- **Two-step verification:** one `RESTRICTIVE` `mfa aal2` policy per table calls `public.mfa_satisfied()`, which reads `auth.mfa_factors` and the session level in the token (`aal` in `auth.jwt()`: `aal1` after the password, `aal2` after the code). Users who turned on a TOTP factor only see their rows with `aal2`.

### In the code

The app talks to Supabase from a few places; the rest (tabs, charts, `domain/` rules) receives data already converted by the mappers in `features/*/data` and doesn't know where it comes from. `npm test` enforces it: Supabase may only appear in `features/*/data`, `contexts/`, `lib/supabase/`, `proxy.ts` and `app/auth/callback` (see [PROJECT-STRUCTURE.en.md](PROJECT-STRUCTURE.en.md)).

| Piece | Files | What it uses from Supabase |
|---|---|---|
| Clients | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` | `@supabase/ssr` (`createBrowserClient`, `createServerClient`) with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Route protection and CSP | `src/proxy.ts`, `src/features/auth/domain/mfa.ts` | The session in cookies (`getUser`, `getSession`) and its `aal`; the CSP allows `*.supabase.co` and the `NEXT_PUBLIC_SUPABASE_URL` origin |
| Login, sign-up and password | `src/features/auth/data/authApi.ts`, used by the `features/auth` screens (and `LoginModal`); `src/app/auth/callback` | `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`, `exchangeCodeForSession` (OAuth, disabled) |
| Session state | `contexts/UserContext.tsx`, `contexts/DataContext.tsx`, `features/auth/hooks/useSessionGuard.ts` (through `authApi`) | `onAuthStateChange`, `getUser`, `signOut` |
| Profile | `features/settings/components/ProfileTab.jsx` (saves with `authApi.updateUser`); `user_metadata` is read by `SettingsPanel`, `AppHeader`, `OverviewTab` and `AddTransactionModal` | `user_metadata` (name, avatar, favorites) and `updateUser` to save it |
| Two-step verification | `features/auth/components/TwoFactorSection.jsx` and `LoginPage.tsx`, through `authApi.mfa` | `auth.mfa`: `enroll`, `challengeAndVerify`, `listFactors`, `unenroll` |
| Data | `contexts/DataContext.tsx` (load), `contexts/useTableCrud.ts`, `features/*/data/` (each table's mappers and writes), `lib/supabase/fetchAllRows.ts`; typed rows in `types/database.ts` | PostgREST through supabase-js: `.from(table)` with `select`, `insert`, `update` and `delete`; pagination with `.range()` (PostgREST caps responses at 1000 rows); `PGRST204`, PostgREST's error for a column that doesn't exist, to save without it when the database isn't up to date |
| End-to-end tests | `e2e/mock-supabase/` | A mock Supabase: imitates Auth, PostgREST and MFA, and reads the tables from `schema.sql` |

> ⚠ **The queries rely on RLS.** Data loading (`select("*")`) and the 30-day trash purge (`delete().lt("deleted_at", …)`) don't filter by `user_id`: the database limits each query to the session's user. Without RLS, or with a connection that bypasses it, loading would return everyone's rows and the purge would delete everyone's old trash. On another system, those queries need their per-user filter, or a layer that enforces it.

## Moving to another system

Three things move separately: the database, the data (users included) and the code that talks to Supabase. How much work each takes depends on the destination.

| Destination | Database | Users and login | Code |
|---|---|---|---|
| **Another Supabase project**, hosted or self-hosted (Docker) | All of `schema.sql` | Copied with the `auth` schema (passwords and two-step verification included), following Supabase's guide for copying a project | Unchanged: only the environment variables |
| **Another managed Postgres** (Neon, RDS, Railway…) + another login system | Part 1 of `schema.sql` plus a replacement for part 2 | Imported into the new system | The pieces in the table above change |
| **Another database** (not Postgres) | The schema must be translated (types, `CHECK`, single-column `SET NULL` foreign keys) | Same as above | Same as above, plus `DataContext` and every `features/*/data` |

### 1. Database

1. Run `supabase/schema.sql` on the new database. Part 1 creates everything standard; part 2 fails without applying anything when there's no `auth` schema, as expected.
2. Replace what part 2 did:
   - **Users:** a foreign key from each `user_id` to the new system's users table, with `ON DELETE CASCADE` if deleting a user should delete their data.
   - **Isolation:** RLS policies using the new system's function for the current user, or a backend that adds `WHERE user_id = …` to **every** query (see the warning above).
   - **Two-step verification:** if the new system offers it, require it where data is read too, not only on the login screen.

### 2. Data

- **App tables:** with the Supabase connection string (Project Settings → Database), export only the `public` schema's data and import it into the new database **after** part 1 of `schema.sql`. `pg_dump` orders tables by their foreign keys: `accounts` before `transactions` and `transfers`, which reference it; the others don't depend on each other:

  ```bash
  pg_dump "$SUPABASE_DB_URL" --data-only --schema=public --no-owner -f data.sql
  psql "$NEW_DB_URL" -f data.sql
  ```

  `pg_dump` must be the same major version as Supabase's Postgres, or newer.

- **Users:** they live in `auth.users`, outside `public`. For each one, bring:
  - the `id`: every app row has it in `user_id`. If the new system can import users with their `id`, keep it and nothing else changes; if not, replace the old `id` with the new one in all 9 tables;
  - the email and password: Supabase stores it as a bcrypt hash (`encrypted_password`). If the new system doesn't accept bcrypt hashes, each user will have to set a new password;
  - the profile (`raw_user_meta_data`, a JSON object): name, avatar and favorite categories. In the new system it goes in each user's profile or in a table of its own (e.g. `profiles`), and the files that read `user_metadata` (see [In the code](#in-the-code)) read it from there instead.

  ```sql
  -- Contains password hashes: keep the result as a secret and delete it when done.
  SELECT id, email, encrypted_password, raw_user_meta_data, created_at FROM auth.users;
  ```

- **Two-step verification:** TOTP secrets travel with `auth.mfa_factors` only between Supabase instances. On another system, users who had it on will have to turn it on again.
- **The app's JSON backup** (Profile → Your data): has one user's data, but not the trash or the profile, and the app can't import it yet. It's a backup, not a migration path.

### 3. Code

Change the pieces in the [In the code](#in-the-code) table. Data access is in `DataContext.tsx` and the `features/*/data/` modules, and authentication in `features/auth/data/authApi.ts`, `proxy.ts` and `UserContext.tsx`. If the new system doesn't expose a PostgREST-like API, those `data/` modules switch to calling the app's own routes (e.g. in `src/app/api/`) that query the database with the session's user. Also update:
- the CSP in `src/proxy.ts` (`connect-src` and `img-src` allow `*.supabase.co`);
- the environment variables (`.env.example`, Vercel);
- the end-to-end tests' mock Supabase, or replace it with one for the new system.

### 4. Verification

After migrating, in the app:
- [ ] login, sign-up and password recovery work, and two-step verification asks for the code;
- [ ] each tab's totals match the ones from before the migration;
- [ ] a user can't see or change another user's rows (test with two accounts);
- [ ] deleting an account leaves its transactions without an account, and the trash purge only touches that user's rows;
- [ ] `npm run test:e2e` passes against the new environment, or against its mock.

## Maintenance

**Emptying the database:** `supabase/seed/reset.sql` empties the 9 tables (count → `TRUNCATE` → check) without touching the schema or the `auth.users` accounts. It's **destructive and irreversible**: it deletes every user's data.

**History:** until September 2026 the schema was applied with 8 dated migrations in `supabase/migrations/`, from `20260618000000_init.sql` to `20260927050000_mfa_aal2.sql`. `schema.sql` replaces them and upgrades a database left at any of them. They remain in the git history (`git log --stat -- supabase/migrations`), and what each one changed is in the [CHANGELOG](../CHANGELOG.md) (Spanish).
