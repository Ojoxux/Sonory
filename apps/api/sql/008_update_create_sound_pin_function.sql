-- create_sound_pin RPC関数をaudio_file_pathパラメータ対応で更新
DROP FUNCTION IF EXISTS create_sound_pin;

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
AS $$
DECLARE
  new_pin_id UUID;
BEGIN
  -- 新しいサウンドピンをsound_pinsテーブルへ挿入
  INSERT INTO sound_pins (
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
  ) RETURNING sound_pins.id INTO new_pin_id;

  -- 登録したサウンドピン情報を返却
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
  WHERE sp.id = new_pin_id;
END;
$$;

-- 権限: 認証ユーザー・サービスロールに実行許可を付与
GRANT EXECUTE ON FUNCTION create_sound_pin TO authenticated;
GRANT EXECUTE ON FUNCTION create_sound_pin TO service_role;
