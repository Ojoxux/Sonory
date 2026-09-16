-- RLS を auth.uid() ベースの所有権モデルへ移行する (Issue #117)

BEGIN;

GRANT SELECT ON public.sound_pins TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sound_pins TO authenticated;

DROP POLICY IF EXISTS "Service role can insert pins" ON public.sound_pins;
DROP POLICY IF EXISTS "Service role can update pins" ON public.sound_pins;
DROP POLICY IF EXISTS "Service role can delete pins" ON public.sound_pins;

DROP POLICY IF EXISTS "Public pins are viewable by everyone" ON public.sound_pins;
CREATE POLICY "Public pins are viewable by everyone"
  ON public.sound_pins FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can insert their own pins"
  ON public.sound_pins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pins"
  ON public.sound_pins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pins"
  ON public.sound_pins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260912071028', 'auth_rls_policies')
ON CONFLICT (version) DO NOTHING;

COMMIT;
