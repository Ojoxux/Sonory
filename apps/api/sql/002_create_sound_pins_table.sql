-- Create sound_pins table
CREATE TABLE IF NOT EXISTS sound_pins (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User identification (optional for future authentication)
    user_id UUID,
    
    -- Geographic location using PostGIS geography type
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    -- Audio data
    audio_url TEXT NOT NULL,
    audio_duration REAL NOT NULL CHECK (audio_duration > 0 AND audio_duration <= 10),
    audio_format VARCHAR(10) NOT NULL CHECK (audio_format IN ('webm', 'mp3', 'wav')),
    
    -- Context data
    weather_temperature REAL,
    weather_condition VARCHAR(50),
    weather_wind_speed REAL,
    weather_humidity REAL,
    time_tag VARCHAR(10) CHECK (time_tag IN ('朝', '昼', '夕', '夜')),
    
    -- AI analysis results (nullable, filled after async processing)
    ai_transcription TEXT,
    ai_emotion VARCHAR(50),
    ai_topic VARCHAR(100),
    ai_language VARCHAR(10),
    ai_confidence REAL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    ai_summary TEXT,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'deleted', 'reported')),
    
    -- Metadata
    title VARCHAR(200),
    device_info TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create spatial index for location queries
CREATE INDEX idx_sound_pins_location ON sound_pins USING GIST (location);

-- Create index for time-based queries
CREATE INDEX idx_sound_pins_created_at ON sound_pins (created_at DESC);

-- Create index for user queries
CREATE INDEX idx_sound_pins_user_id ON sound_pins (user_id) WHERE user_id IS NOT NULL;

-- Create index for status filtering
CREATE INDEX idx_sound_pins_status ON sound_pins (status);

-- Create composite index for common query patterns
CREATE INDEX idx_sound_pins_status_created ON sound_pins (status, created_at DESC) WHERE status = 'active';

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sound_pins_updated_at BEFORE UPDATE ON sound_pins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 