-- =============================================================================
-- Sonory スキーマスナップショット (SSOT)
-- =============================================================================
-- 生成日: 2026-09-16 / 対象: public スキーマ + Storage バケット
--
-- 実DBで確認した事実だけを書く。ダンプに無いものを書かないこと。
-- 更新手順は AGENTS.md の「スキーマの正は apps/api/supabase/schema.sql」。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 拡張
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 共通トリガー関数
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- -----------------------------------------------------------------------------
-- sound_pins: 位置情報付きの音声ピン
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sound_pins (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id             UUID,

    location            GEOGRAPHY(POINT, 4326) NOT NULL,

    audio_url           TEXT NOT NULL,
    audio_file_path     TEXT,
    audio_duration      REAL NOT NULL
                          CHECK (audio_duration > 0 AND audio_duration <= 11),
    audio_format        VARCHAR(10) NOT NULL
                          CHECK (audio_format IN ('webm', 'mp3', 'wav')),

    weather_temperature REAL,
    weather_condition   VARCHAR(50),
    weather_wind_speed  REAL,
    weather_humidity    REAL,
    time_tag            VARCHAR(10)
                          CHECK (time_tag IN ('朝', '昼', '夕', '夜')),

    ai_analysis_result  JSONB,

    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'processing', 'deleted', 'reported')),

    title               VARCHAR(200),
    device_info         TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sound_pins_location
    ON public.sound_pins USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_sound_pins_status_location
    ON public.sound_pins USING GIST (location)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sound_pins_created_at
    ON public.sound_pins (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sound_pins_status
    ON public.sound_pins (status);

CREATE INDEX IF NOT EXISTS idx_sound_pins_status_created
    ON public.sound_pins (status, created_at DESC)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sound_pins_user_id
    ON public.sound_pins (user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sound_pins_audio_file_path
    ON public.sound_pins (audio_file_path);

CREATE INDEX IF NOT EXISTS idx_sound_pins_ai_analysis_result
    ON public.sound_pins USING GIN (ai_analysis_result);

DROP TRIGGER IF EXISTS update_sound_pins_updated_at ON public.sound_pins;
CREATE TRIGGER update_sound_pins_updated_at
    BEFORE UPDATE ON public.sound_pins
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_sound_pins_user_id'
      AND conrelid = 'public.sound_pins'::regclass
  ) THEN
    ALTER TABLE public.sound_pins
      ADD CONSTRAINT fk_sound_pins_user_id
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- analysis_results: 非同期解析パイプラインの進行状態
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analysis_results (
    message_id    BIGINT PRIMARY KEY,
    audio_id      TEXT NOT NULL,
    status        TEXT NOT NULL
                    CHECK (status IN ('processing', 'completed', 'failed')),
    result        JSONB,
    error_message TEXT,
    error_code    TEXT,
    retry_count   INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    started_at    TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    metadata      JSONB
);

CREATE INDEX IF NOT EXISTS idx_analysis_results_audio_id
    ON public.analysis_results (audio_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_status
    ON public.analysis_results (status);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at
    ON public.analysis_results (created_at DESC);

-- -----------------------------------------------------------------------------
-- pin_reports: 通報記録
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pin_reports (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin_id      UUID NOT NULL REFERENCES public.sound_pins(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason      TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pin_reports_unique_reporter UNIQUE (pin_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_pin_reports_pin_id
    ON public.pin_reports (pin_id);
CREATE INDEX IF NOT EXISTS idx_pin_reports_created_at
    ON public.pin_reports (created_at DESC);

ALTER TABLE public.pin_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.pin_reports FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.pin_reports TO service_role;

-- -----------------------------------------------------------------------------
-- RPC: ピン作成
-- -----------------------------------------------------------------------------
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
  p_audio_file_path TEXT DEFAULT NULL,
  p_ai_analysis_result JSONB DEFAULT NULL
)
RETURNS TABLE (
  id UUID, location TEXT, audio_url TEXT, audio_file_path TEXT,
  audio_duration REAL, audio_format VARCHAR(10),
  weather_temperature REAL, weather_condition VARCHAR(50),
  weather_wind_speed REAL, weather_humidity REAL,
  time_tag VARCHAR(10), ai_analysis_result JSONB, status VARCHAR(20),
  title VARCHAR(200), device_info TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  new_pin_id UUID;
BEGIN
  INSERT INTO public.sound_pins (
    user_id, location, audio_url, audio_file_path, audio_duration, audio_format,
    weather_temperature, weather_condition, weather_wind_speed, weather_humidity,
    time_tag, title, device_info, ai_analysis_result, status
  ) VALUES (
    p_user_id,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_audio_url, p_audio_file_path, p_audio_duration, p_audio_format,
    p_weather_temperature, p_weather_condition, p_weather_wind_speed,
    p_weather_humidity, p_time_tag, p_title, p_device_info, p_ai_analysis_result,
    'active'
  )
  RETURNING public.sound_pins.id INTO new_pin_id;

  RETURN QUERY
  SELECT
    sp.id, ST_AsText(sp.location::geometry) AS location,
    sp.audio_url, sp.audio_file_path, sp.audio_duration, sp.audio_format,
    sp.weather_temperature, sp.weather_condition, sp.weather_wind_speed,
    sp.weather_humidity, sp.time_tag, sp.ai_analysis_result, sp.status,
    sp.title, sp.device_info, sp.created_at, sp.updated_at, sp.deleted_at
  FROM public.sound_pins sp
  WHERE sp.id = new_pin_id;
END;
$function$;

-- -----------------------------------------------------------------------------
-- RPC: 近傍検索（半径指定）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_nearby_pins(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID, location TEXT, audio_url TEXT, audio_file_path TEXT,
  audio_duration REAL, audio_format VARCHAR(10),
  weather_temperature REAL, weather_condition VARCHAR(50),
  weather_wind_speed REAL, weather_humidity REAL,
  time_tag VARCHAR(10), ai_analysis_result JSONB, status VARCHAR(20),
  title VARCHAR(200), device_info TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    sp.id, ST_AsText(sp.location::geometry) AS location,
    sp.audio_url, sp.audio_file_path, sp.audio_duration, sp.audio_format,
    sp.weather_temperature, sp.weather_condition, sp.weather_wind_speed,
    sp.weather_humidity, sp.time_tag, sp.ai_analysis_result, sp.status,
    sp.title, sp.device_info, sp.created_at, sp.updated_at, sp.deleted_at,
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
$function$;

-- -----------------------------------------------------------------------------
-- RPC: 矩形範囲検索（地図のビューポート）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_pins_within_bounds(
  north DOUBLE PRECISION,
  south DOUBLE PRECISION,
  east DOUBLE PRECISION,
  west DOUBLE PRECISION,
  max_results INTEGER DEFAULT 50,
  categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID, location TEXT, audio_url TEXT, audio_file_path TEXT,
  audio_duration REAL, audio_format VARCHAR(10),
  weather_temperature REAL, weather_condition VARCHAR(50),
  weather_wind_speed REAL, weather_humidity REAL,
  time_tag VARCHAR(10), ai_analysis_result JSONB, status VARCHAR(20),
  title VARCHAR(200), device_info TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    sp.id, ST_AsText(sp.location::geometry) AS location,
    sp.audio_url, sp.audio_file_path, sp.audio_duration, sp.audio_format,
    sp.weather_temperature, sp.weather_condition, sp.weather_wind_speed,
    sp.weather_humidity, sp.time_tag, sp.ai_analysis_result, sp.status,
    sp.title, sp.device_info, sp.created_at, sp.updated_at, sp.deleted_at
  FROM public.sound_pins sp
  WHERE
    sp.status = 'active'
    AND sp.location && ST_MakeEnvelope(west, south, east, north, 4326)
    AND ST_Within(sp.location::geometry, ST_MakeEnvelope(west, south, east, north, 4326))
    AND (categories IS NULL OR (sp.ai_analysis_result->>'topic') = ANY(categories))
  ORDER BY sp.created_at DESC
  LIMIT max_results;
END;
$function$;

-- -----------------------------------------------------------------------------
-- RPC: pgmq ラッパー（解析キュー）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.queue_send(
  queue_name TEXT, message JSONB, sleep_seconds INTEGER DEFAULT 0
)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT pgmq_public.send(queue_name, message, sleep_seconds);
$function$;

CREATE OR REPLACE FUNCTION public.queue_read(
  queue_name TEXT, sleep_seconds INTEGER, n INTEGER
)
RETURNS TABLE(
  msg_id BIGINT, read_ct INTEGER, enqueued_at TIMESTAMPTZ,
  vt TIMESTAMPTZ, message JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT * FROM pgmq_public.read(queue_name, sleep_seconds, n);
$function$;

CREATE OR REPLACE FUNCTION public.queue_delete(
  queue_name TEXT, message_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT pgmq_public.delete(queue_name, message_id);
$function$;

-- -----------------------------------------------------------------------------
-- pgmq キュー
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pgmq.meta WHERE queue_name = 'audio-analysis') THEN
    PERFORM pgmq.create('audio-analysis');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- RLS: sound_pins
-- -----------------------------------------------------------------------------
ALTER TABLE public.sound_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public pins are viewable by everyone" ON public.sound_pins;
CREATE POLICY "Public pins are viewable by everyone"
  ON public.sound_pins FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own pins" ON public.sound_pins;
CREATE POLICY "Users can insert their own pins"
  ON public.sound_pins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pins" ON public.sound_pins;
CREATE POLICY "Users can update their own pins"
  ON public.sound_pins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pins" ON public.sound_pins;
CREATE POLICY "Users can delete their own pins"
  ON public.sound_pins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- RLS: analysis_results
-- -----------------------------------------------------------------------------
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 権限
-- -----------------------------------------------------------------------------
REVOKE ALL ON public.sound_pins FROM PUBLIC, anon, authenticated;
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
GRANT INSERT, UPDATE, DELETE ON public.sound_pins TO authenticated;
GRANT ALL ON public.sound_pins TO service_role;

REVOKE ALL ON public.analysis_results FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.analysis_results TO service_role;

REVOKE EXECUTE ON FUNCTION public.find_nearby_pins(
  double precision, double precision, integer, integer
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_nearby_pins(
  double precision, double precision, integer, integer
) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.find_pins_within_bounds(
  double precision, double precision, double precision, double precision,
  integer, text[]
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_pins_within_bounds(
  double precision, double precision, double precision, double precision,
  integer, text[]
) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.create_sound_pin(
  uuid, double precision, double precision, text, real, character varying,
  real, character varying, real, real, character varying, character varying,
  text, text, jsonb
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sound_pin(
  uuid, double precision, double precision, text, real, character varying,
  real, character varying, real, real, character varying, character varying,
  text, text, jsonb
) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.queue_send(text, jsonb, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_read(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_delete(text, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_send(text, jsonb, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_read(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_delete(text, bigint) TO service_role;

-- -----------------------------------------------------------------------------
-- Storage
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sonory-audio',
  'sonory-audio',
  false,
  10485760,  -- 10MB
  ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg',
        'audio/wav', 'audio/x-wav', 'audio/wave']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- マイグレーション履歴への記録
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260607000001', 'reset_auth_schema_to_pre_auth'),
  ('20260912071028', 'auth_rls_policies'),
  ('20260912071029', 'auth_schema'),
  ('20260912113306', 'hide_user_id_from_clients'),
  ('20260912113856', 'restrict_user_id_column'),
  ('20260913145717', 'owner_can_see_own_pins'),
  ('20260913150549', 'create_pin_reports'),
  ('20260914094720', 'enable_realtime_for_sound_pins'),
  ('20260914115424', 'create_sound_pin_accepts_analysis'),
  ('20260916052801', 'create_ci_migration_check_role'),
  ('20260916053854', 'revoke_search_rpc_from_public'),
  ('20260916060248', 'drop_ci_migration_check_role')
ON CONFLICT (version) DO NOTHING;
