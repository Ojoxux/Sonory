-- Create RPC function for finding nearby pins
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
  audio_duration REAL,
  audio_format VARCHAR(10),
  weather_temperature REAL,
  weather_condition VARCHAR(50),
  weather_wind_speed REAL,
  weather_humidity REAL,
  time_tag VARCHAR(10),
  ai_transcription TEXT,
  ai_emotion VARCHAR(50),
  ai_topic VARCHAR(100),
  ai_language VARCHAR(10),
  ai_confidence REAL,
  ai_summary TEXT,
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
    sp.*,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_nearby_pins TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_pins TO service_role;

/**
 * Find nearby pins filtered by specific IDs
 * Used for location-based search with pre-filtered results
 */
CREATE OR REPLACE FUNCTION find_nearby_pins_by_ids(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER,
  pin_ids UUID[]
)
RETURNS SETOF sound_pins AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM sound_pins
  WHERE id = ANY(pin_ids)
    AND status = 'active'
    AND ST_DWithin(
      location::geography,
      ST_MakePoint(lng, lat)::geography,
      radius_meters
    )
  ORDER BY ST_Distance(
    location::geography,
    ST_MakePoint(lng, lat)::geography
  ) ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_nearby_pins_by_ids TO authenticated;

-- Create RPC function for creating pins with PostGIS location
CREATE OR REPLACE FUNCTION create_sound_pin(
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
  p_device_info TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  location TEXT,
  audio_url TEXT,
  audio_duration REAL,
  audio_format VARCHAR(10),
  weather_temperature REAL,
  weather_condition VARCHAR(50),
  weather_wind_speed REAL,
  weather_humidity REAL,
  time_tag VARCHAR(10),
  ai_transcription TEXT,
  ai_emotion VARCHAR(50),
  ai_topic VARCHAR(100),
  ai_language VARCHAR(10),
  ai_confidence REAL,
  ai_summary TEXT,
  status VARCHAR(20),
  title VARCHAR(200),
  device_info TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_pin_id UUID;
BEGIN
  INSERT INTO sound_pins (
    user_id,
    location,
    audio_url,
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
  ) RETURNING sound_pins.id INTO new_pin_id;

  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    ST_AsText(sp.location::geometry) as location,
    sp.audio_url,
    sp.audio_duration,
    sp.audio_format,
    sp.weather_temperature,
    sp.weather_condition,
    sp.weather_wind_speed,
    sp.weather_humidity,
    sp.time_tag,
    sp.ai_transcription,
    sp.ai_emotion,
    sp.ai_topic,
    sp.ai_language,
    sp.ai_confidence,
    sp.ai_summary,
    sp.status,
    sp.title,
    sp.device_info,
    sp.created_at,
    sp.updated_at,
    sp.deleted_at
  FROM sound_pins sp
  WHERE sp.id = new_pin_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_sound_pin TO authenticated;
GRANT EXECUTE ON FUNCTION create_sound_pin TO service_role;