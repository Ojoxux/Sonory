-- クライアントから user_id を見えなくする

BEGIN;

DROP FUNCTION IF EXISTS public.find_nearby_pins_by_ids(
  double precision, double precision, integer, uuid[]
);

DROP FUNCTION IF EXISTS public.create_sound_pin(
  uuid, double precision, double precision, text, real, character varying,
  real, character varying, real, real, character varying, character varying,
  text, text
);

CREATE FUNCTION public.create_sound_pin(
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
    sp.id, ST_AsText(sp.location::geometry) AS location,
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

DROP FUNCTION IF EXISTS public.find_nearby_pins(
  double precision, double precision, integer, integer
);

CREATE FUNCTION public.find_nearby_pins(
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

GRANT EXECUTE ON FUNCTION public.find_nearby_pins(
  double precision, double precision, integer, integer
) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.find_pins_within_bounds(
  double precision, double precision, double precision, double precision,
  integer, text[]
);

CREATE FUNCTION public.find_pins_within_bounds(
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

GRANT EXECUTE ON FUNCTION public.find_pins_within_bounds(
  double precision, double precision, double precision, double precision,
  integer, text[]
) TO anon, authenticated, service_role;

REVOKE SELECT (user_id) ON public.sound_pins FROM anon, authenticated;

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260912113306', 'hide_user_id_from_clients')
ON CONFLICT (version) DO NOTHING;

COMMIT;
