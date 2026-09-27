-- 20260927050000_mfa_aal2.sql — la verificación en dos pasos también protege los datos.
--
-- Quien activó la verificación en dos pasos (un factor TOTP verificado en auth.mfa_factors)
-- solo ve y escribe sus filas con una sesión aal2, es decir, después de escribir el código.
-- Con solo la contraseña (aal1) la base no le devuelve nada: la app pide el código, y
-- tampoco se puede saltar yendo directo a la API de Supabase. Quien no la activó sigue
-- igual.
--
-- Una política RESTRICTIVE por tabla: Postgres la combina con AND con las "own …" que ya
-- existen. La condición vive en una función SECURITY DEFINER porque el rol authenticated
-- no puede leer auth.mfa_factors. Idempotente y en una transacción.

BEGIN;

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

DROP POLICY IF EXISTS "mfa aal2" ON budgets;
CREATE POLICY "mfa aal2" ON budgets AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));

DROP POLICY IF EXISTS "mfa aal2" ON goals;
CREATE POLICY "mfa aal2" ON goals AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));

DROP POLICY IF EXISTS "mfa aal2" ON accounts;
CREATE POLICY "mfa aal2" ON accounts AS RESTRICTIVE FOR ALL TO authenticated
  USING ((select public.mfa_satisfied())) WITH CHECK ((select public.mfa_satisfied()));

DROP POLICY IF EXISTS "mfa aal2" ON transfers;
CREATE POLICY "mfa aal2" ON transfers AS RESTRICTIVE FOR ALL TO authenticated
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
