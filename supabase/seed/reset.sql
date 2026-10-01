-- reset.sql — Vacía TODAS las tablas de datos de gastos-app.
--
-- ⚠️  DESTRUCTIVO E IRREVERSIBLE. Borra los datos de TODOS los usuarios.
--     Mantiene el schema y las cuentas de auth.users (solo quedan sin datos).
--     Ejecutar en: Supabase Dashboard → SQL Editor del proyecto.
--
-- Las 9 tablas referencian auth.users, y transactions y transfers también a accounts:
-- se vacían todas en el mismo TRUNCATE, por eso no hace falta CASCADE. Las categorías
-- "de fábrica" viven en el código (src/domain/categories/catalog.ts → CATEGORIES); aquí solo se borran
-- las personalizadas.

-- ─── Paso 1 (opcional): conteo ANTES de borrar ───────────────────────────────
SELECT 'transactions'      AS tabla, count(*) FROM transactions
UNION ALL SELECT 'budgets',           count(*) FROM budgets
UNION ALL SELECT 'goals',             count(*) FROM goals
UNION ALL SELECT 'accounts',          count(*) FROM accounts
UNION ALL SELECT 'transfers',         count(*) FROM transfers
UNION ALL SELECT 'investments',       count(*) FROM investments
UNION ALL SELECT 'debts',             count(*) FROM debts
UNION ALL SELECT 'subscriptions',     count(*) FROM subscriptions
UNION ALL SELECT 'custom_categories', count(*) FROM custom_categories
ORDER BY tabla;

-- ─── Paso 2: vaciar TODAS las tablas ─────────────────────────────────────────
TRUNCATE TABLE
  transactions,
  budgets,
  goals,
  accounts,
  transfers,
  investments,
  debts,
  subscriptions,
  custom_categories
RESTART IDENTITY;

-- ─── Paso 3: verificar que quedó todo en 0 ───────────────────────────────────
SELECT 'transactions'      AS tabla, count(*) FROM transactions
UNION ALL SELECT 'budgets',           count(*) FROM budgets
UNION ALL SELECT 'goals',             count(*) FROM goals
UNION ALL SELECT 'accounts',          count(*) FROM accounts
UNION ALL SELECT 'transfers',         count(*) FROM transfers
UNION ALL SELECT 'investments',       count(*) FROM investments
UNION ALL SELECT 'debts',             count(*) FROM debts
UNION ALL SELECT 'subscriptions',     count(*) FROM subscriptions
UNION ALL SELECT 'custom_categories', count(*) FROM custom_categories
ORDER BY tabla;
