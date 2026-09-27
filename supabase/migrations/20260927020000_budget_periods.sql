-- 20260927020000_budget_periods.sql — presupuestos semanales, mensuales o anuales.
--
-- Cada presupuesto guarda su período; los existentes quedan como mensuales. La app lo
-- escala al período que se está viendo y avisa al 80 % y al 100 % de lo gastado en el
-- período del propio presupuesto. Ejecutar ANTES de desplegar el código que lo usa (al
-- guardar un presupuesto se envía `periodo`). Idempotente y en una transacción.

BEGIN;

ALTER TABLE budgets ADD COLUMN IF NOT EXISTS periodo text NOT NULL DEFAULT 'month';
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_periodo_check;
ALTER TABLE budgets ADD CONSTRAINT budgets_periodo_check CHECK (periodo IN ('week', 'month', 'year'));

COMMIT;
