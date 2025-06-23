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