-- Trip Planner Tags & Preferences
-- Adds tagging system for personalized trip recommendations

-- =============================================================================
-- Tags Table (normalized for many-to-many)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tag info
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- preference, season, amenity, cuisine, activity, audience
  
  -- Display
  emoji TEXT,
  description TEXT,
  
  -- GHL sync
  ghl_tag_id TEXT, -- Maps to GHL tag for SmartList filtering
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed preference tags
INSERT INTO tags (name, slug, category, emoji, description) VALUES
  -- Preferences (what you love)
  ('Nature & Outdoors', 'nature-outdoors', 'preference', '🌲', 'Parks, trails, nature preserves'),
  ('Wine & Dining', 'wine-dining', 'preference', '🍷', 'Wineries, fine dining, culinary experiences'),
  ('Arts & Culture', 'arts-culture', 'preference', '🎨', 'Galleries, museums, theater, music'),
  ('Shopping', 'shopping', 'preference', '🛍️', 'Boutiques, antiques, local artisan goods'),
  ('Beaches & Water', 'beaches-water', 'preference', '🏖️', 'Beaches, kayaking, boating, swimming'),
  ('Scenic Views', 'scenic-views', 'preference', '📸', 'Lookouts, sunsets, photography spots'),
  ('History & Heritage', 'history-heritage', 'preference', '🏛️', 'Historic sites, lighthouses, museums'),
  ('Local Favorites', 'local-favorites', 'preference', '⭐', 'Beloved by locals, hidden gems'),
  
  -- Audience
  ('Kid-Friendly', 'kid-friendly', 'audience', '👨‍👩‍👧', 'Great for children and families'),
  ('Pet-Friendly', 'pet-friendly', 'audience', '🐕', 'Welcomes dogs and pets'),
  ('Romantic', 'romantic', 'audience', '💕', 'Perfect for couples'),
  ('Solo Traveler', 'solo-traveler', 'audience', '🎒', 'Great for solo adventures'),
  ('Group-Friendly', 'group-friendly', 'audience', '👥', 'Good for large groups'),
  ('Accessible', 'accessible', 'audience', '♿', 'ADA accessible, mobility-friendly'),
  
  -- Seasons
  ('Winter Activity', 'winter', 'season', '❄️', 'Available in winter'),
  ('Spring Activity', 'spring', 'season', '🌸', 'Best in spring'),
  ('Summer Activity', 'summer', 'season', '☀️', 'Summer favorite'),
  ('Fall Activity', 'fall', 'season', '🍂', 'Great for fall colors'),
  ('Year-Round', 'year-round', 'season', '📅', 'Open all year'),
  
  -- Amenities
  ('Outdoor Seating', 'outdoor-seating', 'amenity', '🪑', 'Patio or outdoor dining'),
  ('Fireplace', 'fireplace', 'amenity', '🔥', 'Cozy fireplace'),
  ('Waterfront', 'waterfront', 'amenity', '🌊', 'On the water'),
  ('Live Music', 'live-music', 'amenity', '🎵', 'Live entertainment'),
  ('Reservations', 'reservations', 'amenity', '📞', 'Accepts reservations'),
  ('Takeout', 'takeout', 'amenity', '📦', 'Takeout available'),
  ('Delivery', 'delivery', 'amenity', '🚗', 'Delivery available'),
  ('Free Parking', 'free-parking', 'amenity', '🅿️', 'Free parking on-site'),
  ('WiFi', 'wifi', 'amenity', '📶', 'Free WiFi'),
  
  -- Cuisine types
  ('American', 'american', 'cuisine', '🍔', 'American cuisine'),
  ('Seafood', 'seafood', 'cuisine', '🦞', 'Fresh seafood'),
  ('Fish Boil', 'fish-boil', 'cuisine', '🐟', 'Traditional Door County fish boil'),
  ('Pizza', 'pizza', 'cuisine', '🍕', 'Pizza'),
  ('Fine Dining', 'fine-dining', 'cuisine', '🍽️', 'Upscale dining'),
  ('Casual', 'casual', 'cuisine', '🍴', 'Casual dining'),
  ('Breakfast', 'breakfast', 'cuisine', '🥞', 'Breakfast & brunch'),
  ('Coffee & Bakery', 'coffee-bakery', 'cuisine', '☕', 'Coffee shops & bakeries'),
  ('Ice Cream', 'ice-cream', 'cuisine', '🍦', 'Ice cream & desserts'),
  ('Swedish', 'swedish', 'cuisine', '🇸🇪', 'Swedish/Scandinavian cuisine'),
  ('Belgian', 'belgian', 'cuisine', '🇧🇪', 'Belgian cuisine'),
  
  -- Activities
  ('Hiking', 'hiking', 'activity', '🥾', 'Hiking trails'),
  ('Kayaking', 'kayaking', 'activity', '🛶', 'Kayaking & paddling'),
  ('Biking', 'biking', 'activity', '🚴', 'Biking trails'),
  ('Fishing', 'fishing', 'activity', '🎣', 'Fishing spots'),
  ('Golf', 'golf', 'activity', '⛳', 'Golf courses'),
  ('Spa', 'spa', 'activity', '💆', 'Spa & wellness'),
  ('Tours', 'tours', 'activity', '🚌', 'Guided tours'),
  ('Boat Tours', 'boat-tours', 'activity', '⛵', 'Boat & sailing tours')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- Listing Tags Junction Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS listing_tags (
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  
  -- Auto-tagged vs manual
  source TEXT DEFAULT 'manual', -- manual, auto, ghl_sync
  confidence DECIMAL, -- For auto-tagged items
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (listing_id, tag_id)
);

CREATE INDEX idx_listing_tags_listing ON listing_tags(listing_id);
CREATE INDEX idx_listing_tags_tag ON listing_tags(tag_id);

-- =============================================================================
-- Add coordinates to listings table
-- =============================================================================

ALTER TABLE listings 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS place_id TEXT, -- Google Place ID
  ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2, 1),
  ADD COLUMN IF NOT EXISTS google_reviews_count INT,
  ADD COLUMN IF NOT EXISTS yelp_rating DECIMAL(2, 1),
  ADD COLUMN IF NOT EXISTS yelp_reviews_count INT,
  ADD COLUMN IF NOT EXISTS price_level INT, -- 1-4 ($-$$$$)
  ADD COLUMN IF NOT EXISTS hours JSONB, -- Operating hours
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_email TEXT,
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free', -- free, verified, featured, premium
  ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT;

-- Spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_tier ON listings(tier);

-- =============================================================================
-- Function to find nearby listings
-- =============================================================================

CREATE OR REPLACE FUNCTION nearby_listings(
  lat DECIMAL,
  lng DECIMAL,
  radius_miles DECIMAL DEFAULT 5,
  listing_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  type TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_miles DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.slug,
    l.type,
    l.latitude,
    l.longitude,
    -- Haversine formula for distance
    (3959 * acos(
      cos(radians(lat)) * cos(radians(l.latitude)) * 
      cos(radians(l.longitude) - radians(lng)) + 
      sin(radians(lat)) * sin(radians(l.latitude))
    ))::DECIMAL AS distance_miles
  FROM listings l
  WHERE 
    l.latitude IS NOT NULL 
    AND l.longitude IS NOT NULL
    AND l.status = 'active'
    AND (listing_type IS NULL OR l.type = listing_type)
    AND (3959 * acos(
      cos(radians(lat)) * cos(radians(l.latitude)) * 
      cos(radians(l.longitude) - radians(lng)) + 
      sin(radians(lat)) * sin(radians(l.latitude))
    )) <= radius_miles
  ORDER BY distance_miles;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read tags
CREATE POLICY "Public read tags" ON tags FOR SELECT USING (true);

-- Anyone can read listing tags
CREATE POLICY "Public read listing_tags" ON listing_tags FOR SELECT USING (true);

-- Service role manages tags
CREATE POLICY "Service role manages tags" ON tags FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages listing_tags" ON listing_tags FOR ALL USING (auth.role() = 'service_role');
