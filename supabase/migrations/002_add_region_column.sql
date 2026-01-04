-- Add region column to distinguish Door County vs nearby areas
-- Run this in Supabase SQL Editor

-- Add region column
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'door_county';

-- Add comment explaining values
COMMENT ON COLUMN listings.region IS 'Location region: door_county (in Door County), nearby (adjacent areas like Algoma, Green Bay)';

-- Create index for filtering by region
CREATE INDEX IF NOT EXISTS idx_listings_region ON listings(region);

-- Update any Algoma listings to be "nearby"
UPDATE listings
SET region = 'nearby'
WHERE LOWER(city) = 'algoma';
