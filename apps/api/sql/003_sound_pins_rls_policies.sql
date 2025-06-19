-- Enable Row Level Security
ALTER TABLE sound_pins ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active pins
CREATE POLICY "Public pins are viewable by everyone" 
ON sound_pins FOR SELECT 
USING (status = 'active');

-- Policy: Users can create pins (when auth is implemented)
-- For now, allow all inserts through service role
CREATE POLICY "Service role can insert pins" 
ON sound_pins FOR INSERT 
TO service_role
WITH CHECK (true);

-- Policy: Users can update their own pins (when auth is implemented)
-- For now, allow service role to update
CREATE POLICY "Service role can update pins" 
ON sound_pins FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Soft delete only (set deleted_at, don't actually delete)
-- For now, allow service role to delete
CREATE POLICY "Service role can delete pins" 
ON sound_pins FOR DELETE 
TO service_role
USING (true); 