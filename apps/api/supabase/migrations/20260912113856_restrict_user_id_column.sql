-- user_id を anon / authenticated から隠す（列レベル権限）
--
-- 直前の 20260912113306 で REVOKE SELECT (user_id) を実行したが、これは無効だった。
-- テーブルレベルの GRANT SELECT は全列に及び、列レベルの REVOKE ではその一部を
-- 差し引けない。エラーも出ないため気付きにくい。
-- 正しくはテーブルレベルを剥奪し、公開する列だけ列指定で付け直す。
--
-- ⚠️ 副作用: これらのロールは sound_pins でワイルドカードを使えなくなる。
-- PostgREST の select=* はエラーになる。アプリの読み取りは SECURITY DEFINER の
-- RPC 経由なので影響しないが、Realtime は authenticated で直接購読するため未検証。
--
-- ⚠️ 列を追加したら、下の GRANT にも追記すること。しないと読めない。

BEGIN;

REVOKE SELECT ON public.sound_pins FROM anon, authenticated;

GRANT SELECT (
  id,
  location,
  audio_url,
  audio_file_path,
  audio_duration,
  audio_format,
  weather_temperature,
  weather_condition,
  weather_wind_speed,
  weather_humidity,
  time_tag,
  ai_analysis_result,
  status,
  title,
  device_info,
  created_at,
  updated_at,
  deleted_at
) ON public.sound_pins TO anon, authenticated;

GRANT ALL ON public.sound_pins TO service_role;

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260912113856', 'restrict_user_id_column')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- 検証: supabase/tools/verify_user_id_hidden.sql
