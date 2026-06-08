-- =============================================================================
-- Sonory: Better Auth 導入を取り消し、認証なし開発用スキーマへ戻す
-- =============================================================================
--
-- 目的:
-- - feature/better-auth-integration で追加された auth テーブル・FK・RLS を除去
-- - sound_pins.user_id を UUID NULL 許可に戻す（apps/api/sql/002 と整合）
-- - 開発データは破棄してクリーンな状態から再開
--
-- 前提:
-- - 既存データの保持は不要（開発段階）
-- - 認証は今後ゼロから作り直す
--
-- 適用後に必要な作業（アプリ側）:
-- - apps/api の ANONYMOUS_USER_ID / ensureAnonymousUserExists を削除
-- - ピン作成時 user_id: null で保存するよう戻す
-- - Supabase Storage の sonory-audio バケット内ファイルは手動削除を推奨
--
-- 確認クエリ（適用後に実行）:
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'sound_pins' AND column_name = 'user_id';
--   -- => uuid, YES
--
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'sound_pins'::regclass AND contype = 'f';
--   -- => fk_sound_pins_user_id が無いこと
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. 開発データの削除
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.analysis_results') IS NOT NULL THEN
    TRUNCATE TABLE public.analysis_results;
  END IF;
END $$;

TRUNCATE TABLE public.sound_pins;

-- -----------------------------------------------------------------------------
-- 2. sound_pins の RLS ポリシーをすべて削除
--    user_id を参照するポリシーがあると ALTER TYPE が失敗するため、先に除去する
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sound_pins'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.sound_pins', pol.policyname);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3. sound_pins の auth 制約を解除し、user_id を UUID NULL に戻す
-- -----------------------------------------------------------------------------
ALTER TABLE public.sound_pins
  DROP CONSTRAINT IF EXISTS fk_sound_pins_user_id;

ALTER TABLE public.sound_pins
  ALTER COLUMN user_id DROP NOT NULL;

-- TEXT 型の better-auth ID は UUID に変換できないため、NULL として戻す
ALTER TABLE public.sound_pins
  ALTER COLUMN user_id TYPE UUID
  USING NULL;

-- インデックスを元の部分インデックス定義に戻す
DROP INDEX IF EXISTS public.idx_sound_pins_user_id;
CREATE INDEX IF NOT EXISTS idx_sound_pins_user_id
  ON public.sound_pins (user_id)
  WHERE user_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. Better Auth テーブルと関連オブジェクトを削除
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- -----------------------------------------------------------------------------
-- 5. sound_pins の RLS ポリシーを初期状態へ戻す
--    （apps/api/sql/003_sound_pins_rls_policies.sql 相当）
-- -----------------------------------------------------------------------------
ALTER TABLE public.sound_pins ENABLE ROW LEVEL SECURITY;

-- 初期ポリシーを再作成
DROP POLICY IF EXISTS "Public pins are viewable by everyone" ON public.sound_pins;
CREATE POLICY "Public pins are viewable by everyone"
  ON public.sound_pins
  FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Service role can insert pins" ON public.sound_pins;
CREATE POLICY "Service role can insert pins"
  ON public.sound_pins
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update pins" ON public.sound_pins;
CREATE POLICY "Service role can update pins"
  ON public.sound_pins
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can delete pins" ON public.sound_pins;
CREATE POLICY "Service role can delete pins"
  ON public.sound_pins
  FOR DELETE
  TO service_role
  USING (true);

-- -----------------------------------------------------------------------------
-- 6. RPC 関数を UUID 前提の定義に戻す
--    （apps/api/sql/008, 009 相当）
-- -----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_sound_pin;

CREATE OR REPLACE FUNCTION public.create_sound_pin(
  p_user_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_audio_url TEXT,
  p_audio_duration REAL,
  p_audio_format VARCHAR(10),
  p_weather_temperature REAL DEFAULT NULL,
  p_weather_condition VARCHAR(50) DEFAULT NULL,
  p_weather_wind_speed REAL DEFAULT NULL,
  p_weather_humidity REAL DEFAULT NULL,
  p_time_tag VARCHAR(10) DEFAULT NULL,
  p_title VARCHAR(200) DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL,
  p_audio_file_path TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  location TEXT,
  audio_url TEXT,
  audio_file_path TEXT,
  audio_duration REAL,
  audio_format VARCHAR(10),
  weather_temperature REAL,
  weather_condition VARCHAR(50),
  weather_wind_speed REAL,
  weather_humidity REAL,
  time_tag VARCHAR(10),
  ai_analysis_result JSONB,
  status VARCHAR(20),
  title VARCHAR(200),
  device_info TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pin_id UUID;
BEGIN
  INSERT INTO public.sound_pins (
    user_id,
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
    title,
    device_info,
    status
  ) VALUES (
    p_user_id,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_audio_url,
    p_audio_file_path,
    p_audio_duration,
    p_audio_format,
    p_weather_temperature,
    p_weather_condition,
    p_weather_wind_speed,
    p_weather_humidity,
    p_time_tag,
    p_title,
    p_device_info,
    'active'
  )
  RETURNING public.sound_pins.id INTO new_pin_id;

  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    ST_AsText(sp.location::geometry) AS location,
    sp.audio_url,
    sp.audio_file_path,
    sp.audio_duration,
    sp.audio_format,
    sp.weather_temperature,
    sp.weather_condition,
    sp.weather_wind_speed,
    sp.weather_humidity,
    sp.time_tag,
    sp.ai_analysis_result,
    sp.status,
    sp.title,
    sp.device_info,
    sp.created_at,
    sp.updated_at,
    sp.deleted_at
  FROM public.sound_pins sp
  WHERE sp.id = new_pin_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sound_pin TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sound_pin TO service_role;

DROP FUNCTION IF EXISTS public.find_pins_within_bounds;

CREATE OR REPLACE FUNCTION public.find_pins_within_bounds(
  north DOUBLE PRECISION,
  south DOUBLE PRECISION,
  east DOUBLE PRECISION,
  west DOUBLE PRECISION,
  max_results INTEGER DEFAULT 50,
  categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  location TEXT,
  audio_url TEXT,
  audio_file_path TEXT,
  audio_duration REAL,
  audio_format VARCHAR(10),
  weather_temperature REAL,
  weather_condition VARCHAR(50),
  weather_wind_speed REAL,
  weather_humidity REAL,
  time_tag VARCHAR(10),
  ai_analysis_result JSONB,
  status VARCHAR(20),
  title VARCHAR(200),
  device_info TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    ST_AsText(sp.location::geometry) AS location,
    sp.audio_url,
    sp.audio_file_path,
    sp.audio_duration,
    sp.audio_format,
    sp.weather_temperature,
    sp.weather_condition,
    sp.weather_wind_speed,
    sp.weather_humidity,
    sp.time_tag,
    sp.ai_analysis_result,
    sp.status,
    sp.title,
    sp.device_info,
    sp.created_at,
    sp.updated_at,
    sp.deleted_at
  FROM public.sound_pins sp
  WHERE
    sp.status = 'active'
    AND sp.location && ST_MakeEnvelope(west, south, east, north, 4326)
    AND ST_Within(sp.location::geometry, ST_MakeEnvelope(west, south, east, north, 4326))
    AND (categories IS NULL OR (sp.ai_analysis_result->>'topic') = ANY(categories))
  ORDER BY sp.created_at DESC
  LIMIT max_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_pins_within_bounds TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_pins_within_bounds TO service_role;

DROP FUNCTION IF EXISTS public.find_nearby_pins;

CREATE OR REPLACE FUNCTION public.find_nearby_pins(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  location TEXT,
  audio_url TEXT,
  audio_file_path TEXT,
  audio_duration REAL,
  audio_format VARCHAR(10),
  weather_temperature REAL,
  weather_condition VARCHAR(50),
  weather_wind_speed REAL,
  weather_humidity REAL,
  time_tag VARCHAR(10),
  ai_analysis_result JSONB,
  status VARCHAR(20),
  title VARCHAR(200),
  device_info TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    ST_AsText(sp.location::geometry) AS location,
    sp.audio_url,
    sp.audio_file_path,
    sp.audio_duration,
    sp.audio_format,
    sp.weather_temperature,
    sp.weather_condition,
    sp.weather_wind_speed,
    sp.weather_humidity,
    sp.time_tag,
    sp.ai_analysis_result,
    sp.status,
    sp.title,
    sp.device_info,
    sp.created_at,
    sp.updated_at,
    sp.deleted_at,
    ST_Distance(
      sp.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_meters
  FROM public.sound_pins sp
  WHERE
    sp.status = 'active'
    AND ST_DWithin(
      sp.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT max_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_nearby_pins TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_pins TO service_role;

COMMIT;
