-- schema.sql — esquema completo de gastos-app (reemplaza a las migraciones fechadas).
--
-- Un solo archivo para dos usos, en Supabase → SQL Editor o con psql:
--   - instalar desde cero: crea las 9 tablas, sus índices, restricciones y triggers;
--   - poner al día una base existente, de cualquier versión anterior: agrega lo que
--     falte (columnas, restricciones, tabla de transferencias, políticas) sin tocar datos.
-- Idempotente: se puede ejecutar más de una vez. Requiere PostgreSQL 15 o superior
-- (ON DELETE SET NULL de una sola columna); Supabase usa 15 o 17.
--
-- Dos partes, cada una en su propia transacción:
--   PARTE 1 — PostgreSQL estándar. Tablas, índices, restricciones y triggers; no depende
--             de Supabase, así que sirve tal cual en cualquier Postgres (Neon, RDS,
--             Railway, uno propio). user_id es el id del usuario que da el sistema de
--             autenticación que se use.
--   PARTE 2 — Solo Supabase. Une user_id con auth.users, activa RLS (cada usuario solo ve
--             sus filas) y exige la verificación en dos pasos (aal2) a quien la activó.
--             Fuera de Supabase falla sin tocar nada (no existe el esquema auth), y la
--             PARTE 1 queda aplicada. Qué reemplazar en otro sistema: docs/DATABASE.md.
--
-- Antes de poner al día una base con datos, esta consulta debe devolver 0 en todo; si no,
-- esas filas harían fallar las restricciones (y con ellas la PARTE 1 entera):
--   SELECT count(*) FILTER (WHERE tipo NOT IN ('INGRESO', 'EGRESO')) AS tipo_invalido,
--          count(*) FILTER (WHERE valor <= 0)                       AS valor_invalido
--   FROM transactions;
--
-- Los montos se guardan en PEN (soles). Historia de los cambios: CHANGELOG.md.

-- ════════════════════════════════════════════════════════════════════════════
-- PARTE 1 — PostgreSQL estándar
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- updated_at: fecha de la última modificación de cada fila, mantenida por un trigger.
-- search_path vacío: la función no puede resolver objetos de otro esquema por accidente.
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
  LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

-- ─── accounts ────────────────────────────────────────────────────────────────
-- Cuentas (banco, efectivo, tarjeta). `balance` es el saldo que se escribió, vigente desde
-- `balance_at`; la app le suma los movimientos posteriores (transacciones con cuenta_id y
-- transferencias). Va primero porque transactions y transfers la referencian.

CREATE TABLE IF NOT EXISTS accounts (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid          NOT NULL,
  name          text          NOT NULL,
  type          text          NOT NULL,
  balance       decimal(12,2) DEFAULT 0,
  balance_at    timestamptz   NOT NULL DEFAULT now(),
  color         text          DEFAULT '#7ab87a',
  account_limit decimal(12,2),
  created_at    timestamptz   DEFAULT now(),
  updated_at    timestamptz   DEFAULT now()
);

-- ─── transactions ────────────────────────────────────────────────────────────
-- Ingresos y egresos. `valor` siempre en PEN; `moneda`, `monto_original` y `tasa` (unidades
-- de la moneda por 1 PEN) guardan cómo se registró cuando fue en otra moneda. `deleted_at`
-- marca las que están en la papelera (la app las borra de verdad a los 30 días).

CREATE TABLE IF NOT EXISTS transactions (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid          NOT NULL,
  tipo           text          NOT NULL,
  categoria      text          NOT NULL,
  concepto       text          NOT NULL,
  valor          decimal(10,2) NOT NULL,
  moneda         text          NOT NULL DEFAULT 'PEN',
  monto_original decimal(14,2),
  tasa           decimal(18,8),
  cuenta_id      uuid,
  fecha          timestamptz   NOT NULL,
  created_at     timestamptz   DEFAULT now(),
  updated_at     timestamptz   DEFAULT now(),
  deleted_at     timestamptz
);

-- ─── transfers ───────────────────────────────────────────────────────────────
-- Dinero movido entre dos cuentas del usuario: no cuenta como ingreso ni gasto. Si se
-- borra una cuenta, la transferencia queda sin ese lado y el saldo de la otra no cambia.

CREATE TABLE IF NOT EXISTS transfers (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid          NOT NULL,
  origen      uuid,
  destino     uuid,
  monto       decimal(12,2) NOT NULL CHECK (monto > 0),
  fecha       timestamptz   NOT NULL DEFAULT now(),
  nota        text,
  created_at  timestamptz   DEFAULT now(),
  updated_at  timestamptz   DEFAULT now(),
  CONSTRAINT transfers_cuentas_distintas CHECK (origen <> destino)
);

-- ─── budgets ─────────────────────────────────────────────────────────────────
-- Un presupuesto por categoría, para una semana, un mes o un año.

CREATE TABLE IF NOT EXISTS budgets (
  id         uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid          NOT NULL,
  categoria  text          NOT NULL,
  monto      decimal(10,2) NOT NULL,
  periodo    text          NOT NULL DEFAULT 'month',
  updated_at timestamptz   DEFAULT now(),
  UNIQUE (user_id, categoria)
);

-- ─── goals ───────────────────────────────────────────────────────────────────
-- Metas de ahorro. `icon` es una clave de ICON_CHOICES (las metas viejas guardan un glifo).

CREATE TABLE IF NOT EXISTS goals (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid          NOT NULL,
  label_es       text          NOT NULL,
  label_en       text          NOT NULL,
  target         decimal(12,2) NOT NULL,
  current_amount decimal(12,2) DEFAULT 0,
  deadline       date,
  color          text          DEFAULT '#7ab87a',
  icon           text          DEFAULT '◉',
  created_at     timestamptz   DEFAULT now(),
  updated_at     timestamptz   DEFAULT now()
);

-- ─── investments ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS investments (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid          NOT NULL,
  label_es    text          NOT NULL,
  label_en    text          NOT NULL,
  value       decimal(12,2) NOT NULL,
  return_rate decimal(6,2)  DEFAULT 0,
  type        text,
  created_at  timestamptz   DEFAULT now(),
  updated_at  timestamptz   DEFAULT now()
);

-- ─── debts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS debts (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid          NOT NULL,
  label_es        text          NOT NULL,
  label_en        text          NOT NULL,
  balance         decimal(12,2) NOT NULL,
  rate            decimal(6,2)  DEFAULT 0,
  monthly         decimal(10,2) DEFAULT 0,
  remaining       int           DEFAULT 0,
  original_months int           DEFAULT 0,
  created_at      timestamptz   DEFAULT now(),
  updated_at      timestamptz   DEFAULT now()
);

-- ─── subscriptions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id         uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid          NOT NULL,
  name       text          NOT NULL,
  price      decimal(10,2) NOT NULL,
  cycle      text          DEFAULT 'monthly',
  category   text,
  created_at timestamptz   DEFAULT now(),
  updated_at timestamptz   DEFAULT now()
);

-- ─── custom_categories ───────────────────────────────────────────────────────
-- Categorías propias del usuario; en transactions.categoria se guardan como custom_<id>.

CREATE TABLE IF NOT EXISTS custom_categories (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL,
  nombre     text        NOT NULL,
  tipo       text        NOT NULL,
  color      text        NOT NULL DEFAULT '#9e9e9e',
  icon       text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─── Columnas agregadas después de la primera versión ────────────────────────
-- En una base nueva no hacen nada (las tablas de arriba ya las traen); en una anterior
-- las agregan. Las filas existentes toman el valor por defecto: transacciones en PEN,
-- presupuestos mensuales, saldos vigentes desde hoy.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS moneda text NOT NULL DEFAULT 'PEN';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS monto_original decimal(14,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tasa decimal(18,8);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cuenta_id uuid;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
-- Siempre valía false: la detección de gastos inusuales vive en la app (flagAnomalies).
ALTER TABLE transactions DROP COLUMN IF EXISTS anomaly;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS balance_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS periodo text NOT NULL DEFAULT 'month';
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE investments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE debts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE custom_categories ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE custom_categories ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ─── Restricciones ───────────────────────────────────────────────────────────
-- DROP + ADD: así se pueden volver a ejecutar y quedan iguales en una base nueva y en una
-- anterior.

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_tipo_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_tipo_check CHECK (tipo IN ('INGRESO', 'EGRESO'));
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_valor_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_valor_check CHECK (valor > 0);
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_moneda_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_moneda_check CHECK (moneda IN ('PEN', 'USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP', 'BRL'));
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_monto_original_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_monto_original_check CHECK (monto_original > 0);
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_tasa_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_tasa_check CHECK (tasa > 0);
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check CHECK (type IN ('bank', 'cash', 'card'));
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_periodo_check;
ALTER TABLE budgets ADD CONSTRAINT budgets_periodo_check CHECK (periodo IN ('week', 'month', 'year'));
ALTER TABLE custom_categories DROP CONSTRAINT IF EXISTS custom_categories_tipo_check;
ALTER TABLE custom_categories ADD CONSTRAINT custom_categories_tipo_check CHECK (tipo IN ('INGRESO', 'EGRESO'));

-- Referencias a cuentas con (id, user_id): nadie puede asociar una transacción o una
-- transferencia a la cuenta de otro usuario. Al borrar la cuenta, solo esa columna queda en
-- NULL (la fila sigue, con su user_id).
CREATE UNIQUE INDEX IF NOT EXISTS accounts_id_user_id_idx ON accounts (id, user_id);
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_cuenta_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_cuenta_id_fkey
  FOREIGN KEY (cuenta_id, user_id) REFERENCES accounts (id, user_id) ON DELETE SET NULL (cuenta_id);
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_origen_fkey;
ALTER TABLE transfers ADD CONSTRAINT transfers_origen_fkey
  FOREIGN KEY (origen, user_id) REFERENCES accounts (id, user_id) ON DELETE SET NULL (origen);
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_destino_fkey;
ALTER TABLE transfers ADD CONSTRAINT transfers_destino_fkey
  FOREIGN KEY (destino, user_id) REFERENCES accounts (id, user_id) ON DELETE SET NULL (destino);

-- ─── Índices ─────────────────────────────────────────────────────────────────
-- Cada consulta filtra por user_id. budgets no necesita uno: lo cubre su UNIQUE.

CREATE INDEX IF NOT EXISTS transactions_user_id_fecha_idx ON transactions (user_id, fecha, id);
-- Parcial: la papelera y su vaciado a los 30 días.
CREATE INDEX IF NOT EXISTS transactions_user_id_deleted_at_idx ON transactions (user_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_cuenta_id_idx ON transactions (cuenta_id) WHERE cuenta_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transfers_user_id_fecha_idx ON transfers (user_id, fecha);
CREATE INDEX IF NOT EXISTS transfers_origen_idx ON transfers (origen) WHERE origen IS NOT NULL;
CREATE INDEX IF NOT EXISTS transfers_destino_idx ON transfers (destino) WHERE destino IS NOT NULL;
CREATE INDEX IF NOT EXISTS accounts_user_id_created_at_idx ON accounts (user_id, created_at);
CREATE INDEX IF NOT EXISTS goals_user_id_created_at_idx ON goals (user_id, created_at);
CREATE INDEX IF NOT EXISTS investments_user_id_created_at_idx ON investments (user_id, created_at);
CREATE INDEX IF NOT EXISTS debts_user_id_created_at_idx ON debts (user_id, created_at);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_created_at_idx ON subscriptions (user_id, created_at);
CREATE INDEX IF NOT EXISTS custom_categories_user_id_created_at_idx ON custom_categories (user_id, created_at);

-- ─── Triggers de updated_at ──────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_updated_at ON transactions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON transfers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON accounts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON budgets;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON goals;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON investments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON debts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON custom_categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON custom_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- PARTE 2 — Solo Supabase: usuarios, RLS y verificación en dos pasos
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── user_id → auth.users ────────────────────────────────────────────────────
-- Borrar un usuario de Supabase Auth borra sus filas.

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_user_id_fkey;
ALTER TABLE transfers ADD CONSTRAINT transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_id_fkey;
ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_fkey;
ALTER TABLE budgets ADD CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
ALTER TABLE goals ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_user_id_fkey;
ALTER TABLE investments ADD CONSTRAINT investments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_user_id_fkey;
ALTER TABLE debts ADD CONSTRAINT debts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE custom_categories DROP CONSTRAINT IF EXISTS custom_categories_user_id_fkey;
ALTER TABLE custom_categories ADD CONSTRAINT custom_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- ─── RLS: cada usuario solo ve y escribe sus filas ───────────────────────────
-- (select auth.uid()): Postgres lo evalúa una vez por consulta, no una vez por fila.

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own transactions" ON transactions;
CREATE POLICY "own transactions" ON transactions FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own transfers" ON transfers;
CREATE POLICY "own transfers" ON transfers FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own accounts" ON accounts;
CREATE POLICY "own accounts" ON accounts FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own budgets" ON budgets;
CREATE POLICY "own budgets" ON budgets FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own goals" ON goals;
CREATE POLICY "own goals" ON goals FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own investments" ON investments;
CREATE POLICY "own investments" ON investments FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own debts" ON debts;
CREATE POLICY "own debts" ON debts FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own subscriptions" ON subscriptions;
CREATE POLICY "own subscriptions" ON subscriptions FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_categories_policy" ON custom_categories;
CREATE POLICY "custom_categories_policy" ON custom_categories FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- ─── Verificación en dos pasos ───────────────────────────────────────────────
-- Quien activó un factor TOTP solo ve y escribe sus filas con una sesión aal2 (después de
-- escribir el código): con solo la contraseña la base no le devuelve nada, ni siquiera
-- usando la API de Supabase directamente. Quien no la activó no nota nada. Una política
-- RESTRICTIVE por tabla se combina con AND con las de arriba. SECURITY DEFINER porque el
-- rol authenticated no puede leer auth.mfa_factors.

CREATE OR REPLACE FUNCTION public.mfa_satisfied() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
      OR NOT EXISTS (
        SELECT 1 FROM auth.mfa_factors f
        WHERE f.user_id = auth.uid() AND f.status = 'verified'
      )
$$;
REVOKE ALL ON FUNCTION public.mfa_satisfied() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mfa_satisfied() TO authenticated;

DROP POLICY IF EXISTS "mfa aal2" ON transactions;
CREATE POLICY "mfa aal2" ON transactions AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));
DROP POLICY IF EXISTS "mfa aal2" ON transfers;
CREATE POLICY "mfa aal2" ON transfers AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));
DROP POLICY IF EXISTS "mfa aal2" ON accounts;
CREATE POLICY "mfa aal2" ON accounts AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));
DROP POLICY IF EXISTS "mfa aal2" ON budgets;
CREATE POLICY "mfa aal2" ON budgets AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));
DROP POLICY IF EXISTS "mfa aal2" ON goals;
CREATE POLICY "mfa aal2" ON goals AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));
DROP POLICY IF EXISTS "mfa aal2" ON investments;
CREATE POLICY "mfa aal2" ON investments AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));
DROP POLICY IF EXISTS "mfa aal2" ON debts;
CREATE POLICY "mfa aal2" ON debts AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));
DROP POLICY IF EXISTS "mfa aal2" ON subscriptions;
CREATE POLICY "mfa aal2" ON subscriptions AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));
DROP POLICY IF EXISTS "mfa aal2" ON custom_categories;
CREATE POLICY "mfa aal2" ON custom_categories AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));

COMMIT;
