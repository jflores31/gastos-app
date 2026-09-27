-- 20260927040000_accounts_transfers.sql — saldo calculado y transferencias entre cuentas.
--
-- El saldo que se escribe en una cuenta pasa a ser el saldo a una fecha (balance_at). Lo
-- que la app muestra es ese saldo más los movimientos posteriores: las transacciones
-- asociadas a la cuenta (cuenta_id) y las transferencias. Las cuentas existentes quedan con
-- su saldo a la fecha de esta migración, así que nada cambia hasta que se asocie algo.
--
-- Las transferencias van en su propia tabla: mueven dinero entre dos cuentas sin contar
-- como ingreso ni gasto. Las claves foráneas usan (id, user_id), así nadie puede asociar
-- una transacción o una transferencia a la cuenta de otro usuario. Si se borra una cuenta,
-- sus transacciones quedan sin cuenta y sus transferencias sin ese lado: el saldo de la
-- otra cuenta no cambia.
--
-- Requiere Postgres 15 o superior (ON DELETE SET NULL de una sola columna); los proyectos
-- de Supabase ya lo son (`SHOW server_version;`). Ejecutar ANTES de desplegar el código que
-- lo usa. Idempotente y en una transacción: si algo falla, no queda nada a medias.

BEGIN;

-- ─── 1. Saldo a una fecha ────────────────────────────────────────────────────

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS balance_at timestamptz NOT NULL DEFAULT now();

-- Destino de las claves foráneas (id, user_id) de abajo.
CREATE UNIQUE INDEX IF NOT EXISTS accounts_id_user_id_idx ON accounts (id, user_id);

-- ─── 2. Cuenta de cada transacción (opcional) ────────────────────────────────

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cuenta_id uuid;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_cuenta_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_cuenta_id_fkey
  FOREIGN KEY (cuenta_id, user_id) REFERENCES accounts (id, user_id) ON DELETE SET NULL (cuenta_id);
CREATE INDEX IF NOT EXISTS transactions_cuenta_id_idx ON transactions (cuenta_id) WHERE cuenta_id IS NOT NULL;

-- ─── 3. Transferencias ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transfers (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  origen      uuid,
  destino     uuid,
  monto       decimal(12,2) NOT NULL CHECK (monto > 0),
  fecha       timestamptz   NOT NULL DEFAULT now(),
  nota        text,
  created_at  timestamptz   DEFAULT now(),
  updated_at  timestamptz   DEFAULT now(),
  CONSTRAINT transfers_cuentas_distintas CHECK (origen <> destino),
  CONSTRAINT transfers_origen_fkey FOREIGN KEY (origen, user_id) REFERENCES accounts (id, user_id) ON DELETE SET NULL (origen),
  CONSTRAINT transfers_destino_fkey FOREIGN KEY (destino, user_id) REFERENCES accounts (id, user_id) ON DELETE SET NULL (destino)
);

CREATE INDEX IF NOT EXISTS transfers_user_id_fecha_idx ON transfers (user_id, fecha);
-- Para las claves foráneas al borrar una cuenta.
CREATE INDEX IF NOT EXISTS transfers_origen_idx ON transfers (origen) WHERE origen IS NOT NULL;
CREATE INDEX IF NOT EXISTS transfers_destino_idx ON transfers (destino) WHERE destino IS NOT NULL;

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own transfers" ON transfers;
CREATE POLICY "own transfers" ON transfers
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_updated_at ON transfers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transfers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
