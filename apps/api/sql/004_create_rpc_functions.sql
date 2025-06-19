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