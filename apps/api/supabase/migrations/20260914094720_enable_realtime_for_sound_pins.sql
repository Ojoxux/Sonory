-- sound_pins を Realtime の配信対象に加える

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sound_pins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sound_pins;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260914094720', 'enable_realtime_for_sound_pins')
ON CONFLICT (version) DO NOTHING;

COMMIT;

