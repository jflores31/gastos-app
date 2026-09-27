-- 20260927010100_trash.sql — papelera de transacciones (borrado lógico).
--
-- Borrar una transacción la marca con deleted_at en vez de eliminarla: se puede
-- deshacer al instante o restaurar desde la Papelera durante 30 días. Pasado ese plazo,
-- la app la elimina de verdad al cargar los datos. Ejecutar ANTES de desplegar el código
-- que lo usa: ese código filtra por deleted_at y sin la columna no carga las transacciones.
-- Idempotente y en una transacción.

BEGIN;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- La lista normal filtra deleted_at IS NULL con el índice (user_id, fecha, id) que ya
-- existe; este índice parcial sirve a la Papelera y al vaciado de las de más de 30 días.
CREATE INDEX IF NOT EXISTS transactions_user_id_deleted_at_idx
  ON transactions (user_id, deleted_at) WHERE deleted_at IS NOT NULL;

COMMIT;
