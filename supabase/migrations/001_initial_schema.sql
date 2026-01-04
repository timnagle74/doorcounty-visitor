-- Door County Visitor - Initial Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- =============================================================================
-- MARKETS TABLE (for multi-market scalability)
-- =============================================================================
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- 'door-county', 'traverse-city', etc.
  name TEXT NOT NULL,                   -- 'Door County'
  state TEXT NOT NULL,                  -- 'WI'
  domain TEXT,                          -- 'doorcountyvisitor.com'
  tagline TEXT,
  description TEXT,

  -- Branding
  primary_color TEXT DEFAULT '#1a7a9c',
  accent_color TEXT DEFAULT '#c41e3a',
  logo_url TEXT,

  -- Settings
  is_active BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'America/Chicago',

  -- GHL Integration
  ghl_location_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- COMMUNITIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                   -- 'fish-creek'
  name TEXT NOT NULL,                   -- 'Fish Creek'
  tagline TEXT,
  description TEXT,
  highlights TEXT[],                    -- Array of highlight strings
  image_url TEXT,

  -- Location
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),

  -- Display order
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(market_id, slug)
);

-- =============================================================================
-- LISTINGS TABLE (main business directory)
-- =============================================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,

  -- Basic Info
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                   -- 'restaurant', 'lodging_resort', 'park', etc.
  subcategories TEXT[],                 -- ['fish_boil', 'fine_dining']

  -- Descriptions
  description_short TEXT,
  description_full TEXT,

  -- Location
  address TEXT,
  city TEXT,                            -- Display name: 'Fish Creek'
  state TEXT DEFAULT 'WI',
  zip TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Hours (JSONB for flexibility)
  hours JSONB,                          -- {"monday": "9-5", "tuesday": "9-5", ...}
  hours_notes TEXT,

  -- Images
  image_primary TEXT,
  image_gallery TEXT[],
  logo_url TEXT,

  -- Social Media
  social_facebook TEXT,
  social_instagram TEXT,
  social_tripadvisor TEXT,
  social_yelp TEXT,

  -- Ratings
  rating_aggregate DECIMAL(2, 1),
  rating_count INTEGER DEFAULT 0,

  -- Type-specific data (JSONB for flexibility)
  restaurant_data JSONB,                -- {cuisines, priceRange, hasFishBoil, ...}
  lodging_data JSONB,                   -- {roomCount, amenities, checkinTime, ...}
  activity_data JSONB,                  -- {duration, difficulty, equipment, ...}

  -- Listing Status
  status TEXT DEFAULT 'active',         -- 'active', 'pending', 'inactive'
  tier TEXT DEFAULT 'free',             -- 'free', 'verified', 'featured', 'pro', 'premium'
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- GHL Integration
  ghl_contact_id TEXT,                  -- Link to GHL contact
  ghl_last_sync TIMESTAMPTZ,

  -- Ownership
  owner_user_id UUID,                   -- Link to auth.users when claimed
  claimed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(market_id, slug)
);

-- =============================================================================
-- LISTING CATEGORIES (for flexible categorization)
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                   -- 'eat', 'stay', 'do', 'shop'
  name TEXT NOT NULL,                   -- 'Where to Eat'
  description TEXT,
  icon TEXT,                            -- Icon name or SVG
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(market_id, slug)
);

-- =============================================================================
-- USERS PROFILE (extends Supabase auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,

  -- Role
  role TEXT DEFAULT 'user',             -- 'user', 'business_owner', 'admin'

  -- Business owner specific
  business_name TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_listings_market ON listings(market_id);
CREATE INDEX IF NOT EXISTS idx_listings_community ON listings(community_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_tier ON listings(tier);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_communities_market ON communities(market_id);
CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access for directory data
CREATE POLICY "Public can view active markets" ON markets
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view communities" ON communities
  FOR SELECT USING (true);

CREATE POLICY "Public can view active listings" ON listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Business owners can update their own listings
CREATE POLICY "Owners can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = owner_user_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_markets_updated_at
  BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- SEED DATA: Door County Market
-- =============================================================================
INSERT INTO markets (slug, name, state, domain, tagline, description, ghl_location_id)
VALUES (
  'door-county',
  'Door County',
  'WI',
  'doorcountyvisitor.com',
  'Wisconsin''s Peninsula Paradise',
  'Door County is a peninsula in northeastern Wisconsin known for its cherry orchards, lighthouses, state parks, and charming villages.',
  NULL  -- Add GHL location ID when available
) ON CONFLICT (slug) DO NOTHING;
