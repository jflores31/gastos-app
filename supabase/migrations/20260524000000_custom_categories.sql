-- Applied: 2026-05-24 ✓

CREATE TABLE custom_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
  color text NOT NULL DEFAULT '#9e9e9e',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_categories_policy" ON custom_categories
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
