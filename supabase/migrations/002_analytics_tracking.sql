-- Analytics & Stats Tracking for Door County Visitor
-- Track page views, clicks, and engagement for listings

-- =============================================================================
-- Analytics Events Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was interacted with
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  listing_slug TEXT, -- Denormalized for faster queries
  listing_type TEXT, -- eat, stay, do, shop
  
  -- Event details
  event_type TEXT NOT NULL, -- view, click_website, click_phone, click_directions, click_qr
  
  -- Source tracking
  referrer TEXT,
  source TEXT, -- organic, qr, trip_planner, search, featured
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Visitor info (anonymous)
  session_id TEXT,
  visitor_id TEXT, -- Cookie-based anonymous ID
  user_agent TEXT,
  ip_country TEXT,
  ip_region TEXT,
  ip_city TEXT,
  
  -- Device info
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for fast queries
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'view', 
    'click_website', 
    'click_phone', 
    'click_directions', 
    'click_qr',
    'click_menu',
    'click_book',
    'share',
    'save_to_trip'
  ))
);

-- Indexes for common queries
CREATE INDEX idx_analytics_listing ON analytics_events(listing_id, created_at DESC);
CREATE INDEX idx_analytics_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_date ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_source ON analytics_events(source, created_at DESC);

-- =============================================================================
-- Daily Stats Rollup (for fast dashboard queries)
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Counts
  views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  website_clicks INT DEFAULT 0,
  phone_clicks INT DEFAULT 0,
  direction_clicks INT DEFAULT 0,
  qr_scans INT DEFAULT 0,
  saves INT DEFAULT 0,
  shares INT DEFAULT 0,
  
  -- Source breakdown
  views_organic INT DEFAULT 0,
  views_qr INT DEFAULT 0,
  views_trip_planner INT DEFAULT 0,
  views_featured INT DEFAULT 0,
  views_search INT DEFAULT 0,
  
  -- Device breakdown
  views_mobile INT DEFAULT 0,
  views_desktop INT DEFAULT 0,
  views_tablet INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(listing_id, date)
);

CREATE INDEX idx_daily_listing ON analytics_daily(listing_id, date DESC);
CREATE INDEX idx_daily_date ON analytics_daily(date DESC);

-- =============================================================================
-- Weekly Stats Email Queue
-- =============================================================================

CREATE TABLE IF NOT EXISTS stats_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  
  -- Stats period
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- Aggregated stats for the email
  total_views INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  top_sources JSONB, -- [{source: 'qr', count: 45}, ...]
  comparison_pct DECIMAL, -- vs previous week
  
  -- Email status
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMPTZ,
  error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON stats_email_queue(status, created_at);

-- =============================================================================
-- Function to increment daily stats
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_daily_stat(
  p_listing_id UUID,
  p_event_type TEXT,
  p_source TEXT DEFAULT 'organic',
  p_device TEXT DEFAULT 'desktop'
) RETURNS VOID AS $$
DECLARE
  v_date DATE := CURRENT_DATE;
BEGIN
  -- Upsert daily stats
  INSERT INTO analytics_daily (listing_id, date)
  VALUES (p_listing_id, v_date)
  ON CONFLICT (listing_id, date) DO NOTHING;
  
  -- Increment the appropriate counter
  UPDATE analytics_daily
  SET 
    updated_at = NOW(),
    views = views + CASE WHEN p_event_type = 'view' THEN 1 ELSE 0 END,
    website_clicks = website_clicks + CASE WHEN p_event_type = 'click_website' THEN 1 ELSE 0 END,
    phone_clicks = phone_clicks + CASE WHEN p_event_type = 'click_phone' THEN 1 ELSE 0 END,
    direction_clicks = direction_clicks + CASE WHEN p_event_type = 'click_directions' THEN 1 ELSE 0 END,
    qr_scans = qr_scans + CASE WHEN p_event_type = 'click_qr' THEN 1 ELSE 0 END,
    saves = saves + CASE WHEN p_event_type = 'save_to_trip' THEN 1 ELSE 0 END,
    shares = shares + CASE WHEN p_event_type = 'share' THEN 1 ELSE 0 END,
    -- Source breakdown
    views_organic = views_organic + CASE WHEN p_event_type = 'view' AND p_source = 'organic' THEN 1 ELSE 0 END,
    views_qr = views_qr + CASE WHEN p_event_type = 'view' AND p_source = 'qr' THEN 1 ELSE 0 END,
    views_trip_planner = views_trip_planner + CASE WHEN p_event_type = 'view' AND p_source = 'trip_planner' THEN 1 ELSE 0 END,
    views_featured = views_featured + CASE WHEN p_event_type = 'view' AND p_source = 'featured' THEN 1 ELSE 0 END,
    views_search = views_search + CASE WHEN p_event_type = 'view' AND p_source = 'search' THEN 1 ELSE 0 END,
    -- Device breakdown
    views_mobile = views_mobile + CASE WHEN p_event_type = 'view' AND p_device = 'mobile' THEN 1 ELSE 0 END,
    views_desktop = views_desktop + CASE WHEN p_event_type = 'view' AND p_device = 'desktop' THEN 1 ELSE 0 END,
    views_tablet = views_tablet + CASE WHEN p_event_type = 'view' AND p_device = 'tablet' THEN 1 ELSE 0 END
  WHERE listing_id = p_listing_id AND date = v_date;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_email_queue ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (tracking is anonymous)
CREATE POLICY "Allow anonymous event inserts" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Only service role can read events
CREATE POLICY "Service role reads events" ON analytics_events
  FOR SELECT USING (auth.role() = 'service_role');

-- Service role manages daily stats
CREATE POLICY "Service role manages daily" ON analytics_daily
  FOR ALL USING (auth.role() = 'service_role');

-- Service role manages email queue
CREATE POLICY "Service role manages queue" ON stats_email_queue
  FOR ALL USING (auth.role() = 'service_role');
