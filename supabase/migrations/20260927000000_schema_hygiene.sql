-- 20260927000000_schema_hygiene.sql — validaciones en transactions y updated_at (T9).
--
-- Ejecutar en Supabase → SQL Editor ANTES de desplegar el código que lo acompaña.
-- Idempotente y en una transacción: si algo falla, no queda nada aplicado.
--
-- Antes de ejecutarlo, esta consulta debe devolver 0 y 0. Si no, esas filas harían
-- fallar los CHECK (y con ellos todo el archivo); corregirlas o borrarlas primero:
--   SELECT count(*) FILTER (WHERE tipo NOT IN ('INGRESO', 'EGRESO')) AS tipo_invalido,
--          count(*) FILTER (WHERE valor <= 0)                       AS valor_invalido
--   FROM transactions;
--
-- La columna `anomaly` (siempre false; la detección vive en el navegador) se borra en
-- una migración posterior: el código desplegado hoy todavía la escribe.

BEGIN;

-- ─── 1. Validaciones en transactions ─────────────────────────────────────────
-- Hasta ahora solo las validaba el cliente. DROP + ADD para poder reejecutarlo.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_tipo_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_tipo_check CHECK (tipo IN ('INGRESO', 'EGRESO'));
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_valor_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_valor_check CHECK (valor > 0);

-- ─── 2. updated_at en las 8 tablas ───────────────────────────────────────────
-- Fecha de la última modificación, mantenida por un trigger. Las filas existentes
-- toman la fecha en que se ejecuta este archivo. search_path vacío: la función no
-- puede resolver objetos de otro esquema por accidente (recomendación de Supabase).
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
  LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DROP TRIGGER IF EXISTS set_updated_at ON transactions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE budgets ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DROP TRIGGER IF EXISTS set_updated_at ON budgets;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DROP TRIGGER IF EXISTS set_updated_at ON goals;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DROP TRIGGER IF EXISTS set_updated_at ON accounts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE investments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DROP TRIGGER IF EXISTS set_updated_at ON investments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE debts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DROP TRIGGER IF EXISTS set_updated_at ON debts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DROP TRIGGER IF EXISTS set_updated_at ON subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE custom_categories ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DROP TRIGGER IF EXISTS set_updated_at ON custom_categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON custom_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
