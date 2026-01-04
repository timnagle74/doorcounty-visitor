-- Door County Visitor - Seed Communities Data
-- Run this after 001_initial_schema.sql

-- Get the Door County market ID
DO $$
DECLARE
  dc_market_id UUID;
BEGIN
  SELECT id INTO dc_market_id FROM markets WHERE slug = 'door-county';

  -- Insert communities
  INSERT INTO communities (market_id, slug, name, tagline, description, highlights, sort_order, is_featured)
  VALUES
    (dc_market_id, 'fish-creek', 'Fish Creek', 'The heart of Door County',
     'In many ways, Fish Creek is the hub of Door County. A good portion of the region''s top restaurants, shops, and outdoor attractions are in or near this quaint-yet-bustling town.',
     ARRAY['Peninsula State Park', 'Downtown shopping', 'Fish boils', 'Sunset concerts'],
     1, true),

    (dc_market_id, 'sister-bay', 'Sister Bay', 'Door County''s dining destination',
     'Sister Bay has gained a reputation for being the food, dining, and beverage hub of the county. Options include supper clubs, pubs and taverns, waterfront dining, seafood, bakeries, pizza, craft beer, breakfast spots, and way more.',
     ARRAY['Restaurants & cafés', 'Beach swimming', 'Al Johnson''s goat roof', 'Marina'],
     2, true),

    (dc_market_id, 'ephraim', 'Ephraim', 'Charming and picturesque',
     'The idyllic setting of Ephraim offers the famously graffitied Anderson Dock, access to Peninsula State Park, and tons of water sports and activities. Historic white buildings, old-timey shops, and a peaceful waterfront make this village unforgettable.',
     ARRAY['Anderson Dock', 'Wilson''s ice cream', 'Kayaking', 'Historic village'],
     3, true),

    (dc_market_id, 'sturgeon-bay', 'Sturgeon Bay', 'Gateway to Door County',
     'As the largest city and county seat, Sturgeon Bay offers urban amenities while maintaining small-town charm. Explore maritime history, working shipyards, a vibrant downtown, and excellent dining.',
     ARRAY['Downtown shops', 'Maritime museum', 'Shipyards', 'Wineries'],
     4, true),

    (dc_market_id, 'baileys-harbor', 'Baileys Harbor', 'Art and nature in harmony',
     'A near-perfect confluence of art and nature, Baileys Harbor is home to thousands of acres of beautiful, protected lands. Find plenty of space for hiking, biking, and paddling, plus independent restaurants, a brewery, and three historic lighthouses.',
     ARRAY['The Ridges Sanctuary', 'Lighthouses', 'Cana Island', 'Craft beverages'],
     5, true),

    (dc_market_id, 'egg-harbor', 'Egg Harbor', 'Family fun on the water',
     'Egg Harbor is considered one of the busier and more family-friendly villages in Door County. Enjoy the beach, marina, and parks, plus a great selection of restaurants and shops.',
     ARRAY['Family beach', 'Marina', 'Shopping', 'Alpine Golf Course'],
     6, true),

    (dc_market_id, 'ellison-bay', 'Ellison Bay', 'Authentic and unhurried',
     'Located near the tip of the peninsula, Ellison Bay offers a quieter, more authentic Door County experience. Find excellent dining, charming shops, and easy access to Newport State Park and Washington Island.',
     ARRAY['Wickman House', 'Newport State Park access', 'Village shops', 'Local galleries'],
     7, false),

    (dc_market_id, 'washington-island', 'Washington Island', 'An island escape',
     'Start with a 30-minute ferry ride across Death''s Door strait to reach this unique island community. Explore by car, bike, or UTV. Don''t miss Schoolhouse Beach with its smooth stones, the lavender farm, and the option to continue to Rock Island State Park.',
     ARRAY['Ferry crossing', 'Schoolhouse Beach', 'Lavender fields', 'Rock Island'],
     8, false),

    (dc_market_id, 'jacksonport', 'Jacksonport', 'On the quiet side',
     'Located on the ''quiet'' side of the peninsula, Jacksonport is a small town with unexpectedly big attractions. Cave Point County Park and Whitefish Dunes State Park are nearby, plus eclectic restaurants and shops.',
     ARRAY['Cave Point', 'Whitefish Dunes', 'Cherry orchards', 'Lakeside dining'],
     9, false),

    (dc_market_id, 'gills-rock', 'Gills Rock', 'At the tip of the thumb',
     'Gills Rock is the last stop at the tip of the peninsula before the highway heads back south or you continue north to the Washington Island Ferry. Stop here for coastal scenery, the maritime museum, and views of Death''s Door passage.',
     ARRAY['Washington Island Ferry', 'Maritime museum', 'Death''s Door views', 'Fishing charters'],
     10, false),

    (dc_market_id, 'southern-door', 'Southern Door County', 'Rural charm and Belgian heritage',
     'Southern Door County, including Brussels and Forestville, offers a quieter feel with rustic farms, countryside views, and signs of Belgian heritage. Outdoor enthusiasts enjoy hiking, biking, snowshoeing, and ATVing on less-traveled trails.',
     ARRAY['Belgian heritage', 'Rural farms', 'Quiet trails', 'Local festivals'],
     11, false)

  ON CONFLICT (market_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    highlights = EXCLUDED.highlights,
    sort_order = EXCLUDED.sort_order,
    is_featured = EXCLUDED.is_featured;

END $$;

-- Insert default categories for Door County
DO $$
DECLARE
  dc_market_id UUID;
BEGIN
  SELECT id INTO dc_market_id FROM markets WHERE slug = 'door-county';

  INSERT INTO categories (market_id, slug, name, description, sort_order)
  VALUES
    (dc_market_id, 'eat', 'Where to Eat', 'Restaurants, fish boils, cafés, and dining experiences', 1),
    (dc_market_id, 'stay', 'Where to Stay', 'Hotels, resorts, B&Bs, cabins, and vacation rentals', 2),
    (dc_market_id, 'do', 'Things to Do', 'Activities, attractions, parks, and experiences', 3),
    (dc_market_id, 'shop', 'Where to Shop', 'Boutiques, galleries, antiques, and local shops', 4)
  ON CONFLICT (market_id, slug) DO NOTHING;

END $$;
