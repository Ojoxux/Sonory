-- 認証 (Issue #117) のスキーマ変更

BEGIN;

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
  id UUID, user_id UUID, location TEXT, audio_url TEXT, audio_file_path TEXT,
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
    time_tag, title, device_info, status
  ) VALUES (
    p_user_id,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_audio_url, p_audio_file_path, p_audio_duration, p_audio_format,
    p_weather_temperature, p_weather_condition, p_weather_wind_speed,
    p_weather_humidity, p_time_tag, p_title, p_device_info,
    'active'
  )
  RETURNING public.sound_pins.id INTO new_pin_id;

  RETURN QUERY
  SELECT
    sp.id, sp.user_id, ST_AsText(sp.location::geometry) AS location,
    sp.audio_url, sp.audio_file_path, sp.audio_duration, sp.audio_format,
    sp.weather_temperature, sp.weather_condition, sp.weather_wind_speed,
    sp.weather_humidity, sp.time_tag, sp.ai_analysis_result, sp.status,
    sp.title, sp.device_info, sp.created_at, sp.updated_at, sp.deleted_at
  FROM public.sound_pins sp
  WHERE sp.id = new_pin_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_sound_pin(
  uuid, double precision, double precision, text, real, character varying,
  real, character varying, real, real, character varying, character varying,
  text, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sound_pin(
  uuid, double precision, double precision, text, real, character varying,
  real, character varying, real, real, character varying, character varying,
  text, text
) TO authenticated, service_role;

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

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260912071029', 'auth_schema')
ON CONFLICT (version) DO NOTHING;

COMMIT;
