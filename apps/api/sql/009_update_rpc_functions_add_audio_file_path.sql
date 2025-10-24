-- Update RPC functions to include audio_file_path in returned data

-- 1. Update find_pins_within_bounds
DROP FUNCTION IF EXISTS find_pins_within_bounds;

CREATE OR REPLACE FUNCTION find_pins_within_bounds(
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
    ST_AsText(sp.location::geometry) as location,
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
  FROM sound_pins sp
  WHERE
    sp.status = 'active'
    AND sp.location && ST_MakeEnvelope(west, south, east, north, 4326)
    AND ST_Within(sp.location::geometry, ST_MakeEnvelope(west, south, east, north, 4326))
    AND (categories IS NULL OR (sp.ai_analysis_result->>'topic') = ANY(categories))
  ORDER BY sp.created_at DESC
  LIMIT max_results;
END;
$$;

GRANT EXECUTE ON FUNCTION find_pins_within_bounds TO authenticated;
GRANT EXECUTE ON FUNCTION find_pins_within_bounds TO service_role;

-- 2. Update find_nearby_pins
DROP FUNCTION IF EXISTS find_nearby_pins;

CREATE OR REPLACE FUNCTION find_nearby_pins(
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    ST_AsText(sp.location::geometry) as location,
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
  FROM sound_pins sp
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

GRANT EXECUTE ON FUNCTION find_nearby_pins TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_pins TO service_role;
