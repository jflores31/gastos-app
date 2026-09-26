-- upgrade_0.0.1.sql — cambios de esquema de la versión 0.0.1 para una DB EXISTENTE.
--
-- Ejecutar en Supabase → SQL Editor ANTES de desplegar la 0.0.1.
-- Idempotente: se puede ejecutar más de una vez sin error.
-- Una DB nueva no lo necesita: supabase/migrations/schema.sql ya incluye todo esto.
--
-- Sin timestamp en el nombre a propósito: igual que schema.sql, el CLI de Supabase
-- lo ignora (ver "Mejoras técnicas" T10 en docs/INVESTIGACION.md).

-- ─── 1. Icono de las categorías personalizadas ────────────────────────────────
-- Guarda la clave de ICON_CHOICES (src/theme/categoryIcons.js), p. ej. "Pets".
ALTER TABLE custom_categories ADD COLUMN IF NOT EXISTS icon text;

-- ─── 2. Índices por usuario ──────────────────────────────────────────────────
-- Cada consulta filtra por user_id vía RLS; sin índice, Postgres recorre la tabla
-- entera. El segundo campo coincide con el ORDER BY de DataContext.load().
-- budgets ya tiene UNIQUE (user_id, categoria), que sirve de índice por user_id.
CREATE INDEX IF NOT EXISTS transactions_user_id_fecha_idx      ON transactions      (user_id, fecha, id);
CREATE INDEX IF NOT EXISTS goals_user_id_created_at_idx         ON goals             (user_id, created_at);
CREATE INDEX IF NOT EXISTS accounts_user_id_created_at_idx      ON accounts          (user_id, created_at);
CREATE INDEX IF NOT EXISTS investments_user_id_created_at_idx   ON investments       (user_id, created_at);
CREATE INDEX IF NOT EXISTS debts_user_id_created_at_idx         ON debts             (user_id, created_at);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_created_at_idx ON subscriptions     (user_id, created_at);
CREATE INDEX IF NOT EXISTS custom_categories_user_id_created_at_idx ON custom_categories (user_id, created_at);

-- ─── 3. RLS: (select auth.uid()) en vez de auth.uid() ────────────────────────
-- Envuelto en un SELECT, Postgres evalúa auth.uid() una vez por consulta y no una
-- vez por fila (recomendación de Supabase para rendimiento de RLS). Mismo acceso:
-- cada usuario solo ve y escribe sus propias filas.
ALTER POLICY "own transactions" ON transactions
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "own budgets" ON budgets
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "own goals" ON goals
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "own accounts" ON accounts
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "own investments" ON investments
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "own debts" ON debts
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "own subscriptions" ON subscriptions
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "custom_categories_policy" ON custom_categories
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
