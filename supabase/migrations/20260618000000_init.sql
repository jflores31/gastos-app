-- 20260618000000_init.sql — esquema base de gastos-app (las 8 tablas, índices y RLS).
--
-- Migraciones: cada cambio de esquema es un archivo nuevo en supabase/migrations/ con la
-- fecha y hora al principio del nombre (AAAAMMDDHHMMSS_descripcion.sql). Se aplican en
-- orden: con el CLI (`supabase db push`) o copiándolos en Supabase → SQL Editor.
--
-- Idempotente: cada archivo se puede ejecutar más de una vez sin error, en una DB nueva
-- o en una que ya tiene parte de los cambios. Por eso usa CREATE … IF NOT EXISTS,
-- ADD COLUMN IF NOT EXISTS y DROP POLICY IF EXISTS antes de cada CREATE POLICY.
-- Todo va en una transacción: si algo falla, no queda aplicado a medias.
--
-- Historia: aplicado en Supabase el 2026-06-18. La 0.0.1 (2026-09-26) sumó la columna
-- `icon` de custom_categories, los índices por user_id y las políticas con
-- (select auth.uid()); una DB anterior a la 0.0.1 queda al día ejecutando este archivo.
--
-- Políticas RLS con (select auth.uid()): Postgres lo evalúa una vez por consulta en
-- vez de una vez por fila. Índices (user_id, …): cada consulta filtra por user_id vía RLS.

BEGIN;

-- ─── TRANSACTIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id         uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo       text          NOT NULL,
  categoria  text          NOT NULL,
  concepto   text          NOT NULL,
  valor      decimal(10,2) NOT NULL,
  fecha      timestamptz   NOT NULL,
  anomaly    boolean       DEFAULT false,
  created_at timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_user_id_fecha_idx ON transactions (user_id, fecha, id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own transactions" ON transactions;
CREATE POLICY "own transactions" ON transactions
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─── BUDGETS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS budgets (
  id        uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  categoria text          NOT NULL,
  monto     decimal(10,2) NOT NULL,
  UNIQUE(user_id, categoria)
);

-- UNIQUE(user_id, categoria) ya sirve de índice por user_id.
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own budgets" ON budgets;
CREATE POLICY "own budgets" ON budgets
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─── GOALS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goals (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label_es       text          NOT NULL,
  label_en       text          NOT NULL,
  target         decimal(12,2) NOT NULL,
  current_amount decimal(12,2) DEFAULT 0,
  deadline       date,
  color          text          DEFAULT '#7ab87a',
  icon           text          DEFAULT '◉',
  created_at     timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goals_user_id_created_at_idx ON goals (user_id, created_at);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own goals" ON goals;
CREATE POLICY "own goals" ON goals
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─── ACCOUNTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounts (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          text          NOT NULL,
  type          text          NOT NULL CHECK (type IN ('bank', 'cash', 'card')),
  balance       decimal(12,2) DEFAULT 0,
  color         text          DEFAULT '#7ab87a',
  account_limit decimal(12,2),
  created_at    timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounts_user_id_created_at_idx ON accounts (user_id, created_at);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own accounts" ON accounts;
CREATE POLICY "own accounts" ON accounts
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─── INVESTMENTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS investments (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label_es    text          NOT NULL,
  label_en    text          NOT NULL,
  value       decimal(12,2) NOT NULL,
  return_rate decimal(6,2)  DEFAULT 0,
  type        text,
  created_at  timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS investments_user_id_created_at_idx ON investments (user_id, created_at);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own investments" ON investments;
CREATE POLICY "own investments" ON investments
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─── DEBTS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS debts (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label_es        text          NOT NULL,
  label_en        text          NOT NULL,
  balance         decimal(12,2) NOT NULL,
  rate            decimal(6,2)  DEFAULT 0,
  monthly         decimal(10,2) DEFAULT 0,
  remaining       int           DEFAULT 0,
  original_months int           DEFAULT 0,
  created_at      timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debts_user_id_created_at_idx ON debts (user_id, created_at);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own debts" ON debts;
CREATE POLICY "own debts" ON debts
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id         uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text          NOT NULL,
  price      decimal(10,2) NOT NULL,
  cycle      text          DEFAULT 'monthly',
  category   text,
  created_at timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_created_at_idx ON subscriptions (user_id, created_at);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own subscriptions" ON subscriptions;
CREATE POLICY "own subscriptions" ON subscriptions
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─── CUSTOM CATEGORIES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_categories (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre     text        NOT NULL,
  tipo       text        NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
  color      text        NOT NULL DEFAULT '#9e9e9e',
  icon       text,
  created_at timestamptz DEFAULT now()
);

-- Añade la columna en DBs creadas antes de la 0.0.1.
ALTER TABLE custom_categories ADD COLUMN IF NOT EXISTS icon text;

CREATE INDEX IF NOT EXISTS custom_categories_user_id_created_at_idx ON custom_categories (user_id, created_at);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_categories_policy" ON custom_categories;
CREATE POLICY "custom_categories_policy" ON custom_categories
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

COMMIT;
