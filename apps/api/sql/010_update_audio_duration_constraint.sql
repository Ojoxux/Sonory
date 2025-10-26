-- Update audio_duration constraint to allow slightly over 10 seconds
-- The MediaRecorder may record slightly more than 10 seconds due to timing precision

-- Drop the existing check constraint
ALTER TABLE sound_pins
DROP CONSTRAINT IF EXISTS sound_pins_audio_duration_check;

-- Add a new check constraint with a more lenient upper limit (11 seconds to allow for timing variance)
ALTER TABLE sound_pins
ADD CONSTRAINT sound_pins_audio_duration_check
CHECK (audio_duration > 0 AND audio_duration <= 11);
