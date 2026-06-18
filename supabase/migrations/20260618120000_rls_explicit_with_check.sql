-- Migration: make RLS policies explicit (TO authenticated + WITH CHECK)
-- Date: 2026-06-18
--
-- Apply in the Supabase SQL editor (or `supabase db push`).
-- Safe & idempotent: drops each owner-only policy and recreates it with an
-- explicit WITH CHECK clause, restricted to the `authenticated` role.
--
-- Behaviour is equivalent to before — Postgres already used the USING expression
-- as the INSERT/UPDATE check when WITH CHECK was omitted, and `anon` was denied
-- because auth.uid() is NULL. This migration only makes that intent explicit and
-- robust against future policy edits. `custom_categories` already had this form.

begin;

-- transactions
drop policy if exists "own transactions" on transactions;
create policy "own transactions" on transactions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- budgets
drop policy if exists "own budgets" on budgets;
create policy "own budgets" on budgets
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- goals
drop policy if exists "own goals" on goals;
create policy "own goals" on goals
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- accounts
drop policy if exists "own accounts" on accounts;
create policy "own accounts" on accounts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- investments
drop policy if exists "own investments" on investments;
create policy "own investments" on investments
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- debts
drop policy if exists "own debts" on debts;
create policy "own debts" on debts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- subscriptions
drop policy if exists "own subscriptions" on subscriptions;
create policy "own subscriptions" on subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
