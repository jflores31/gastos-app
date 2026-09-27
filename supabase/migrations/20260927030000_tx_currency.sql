-- 20260927030000_tx_currency.sql — moneda original de cada transacción.
--
-- `valor` sigue en PEN (la base de todos los totales). Además se guarda en qué moneda se
-- registró, el monto en esa moneda y la tasa de ese día (unidades de la moneda por 1 PEN,
-- de /api/rates). Las transacciones existentes quedan en PEN, sin monto_original ni tasa.
-- Ejecutar ANTES de desplegar el código que las escribe. Idempotente y en una transacción.

BEGIN;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS moneda text NOT NULL DEFAULT 'PEN';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS monto_original decimal(14,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tasa decimal(18,8);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_moneda_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_moneda_check
  CHECK (moneda IN ('PEN', 'USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP', 'BRL'));
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_monto_original_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_monto_original_check CHECK (monto_original > 0);
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_tasa_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_tasa_check CHECK (tasa > 0);

COMMIT;
