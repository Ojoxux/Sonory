-- 所有者は自分のピンを status に関わらず閲覧できるようにする

BEGIN;

DROP POLICY IF EXISTS "Public pins are viewable by everyone" ON public.sound_pins;
CREATE POLICY "Public pins are viewable by everyone"
  ON public.sound_pins FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260913145717', 'owner_can_see_own_pins')
ON CONFLICT (version) DO NOTHING;

COMMIT;
