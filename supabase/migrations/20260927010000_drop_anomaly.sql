-- 20260927010000_drop_anomaly.sql — borra transactions.anomaly.
--
-- La columna siempre valía false: la detección de gastos inusuales vive en el navegador
-- (flagAnomalies en src/data/helpers.ts). El código dejó de escribirla con
-- 20260927000000_schema_hygiene.sql; ejecutar esto solo con ese código ya desplegado.
-- Idempotente.

BEGIN;

ALTER TABLE transactions DROP COLUMN IF EXISTS anomaly;

COMMIT;
