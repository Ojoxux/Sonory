-- sound_pins を Realtime の配信対象に加える
--
-- supabase_realtime publication は存在していたが、テーブルが1つも
-- 登録されていなかった。そのため postgres_changes の購読が成立しても
-- 変更が一切配信されず、地図に新しいピンが出るのはリロード時だけだった。
--
-- Web は INSERT と UPDATE を購読している（useRealtimeStore.ts）。
-- INSERT は新規ピンの即時表示、UPDATE は解析結果の書き戻し反映に使う。

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

-- 適用後は tools/check_realtime.sql を再実行し、
-- public.sound_pins が publication に含まれることを確認する。
