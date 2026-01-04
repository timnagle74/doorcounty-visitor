-- Door County Visitor - Seed Sample Listings
-- Run this after 002_seed_communities.sql

DO $seed$
DECLARE
  dc_market_id UUID;
  fish_creek_id UUID;
  sturgeon_bay_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO dc_market_id FROM markets WHERE slug = 'door-county';
  SELECT id INTO fish_creek_id FROM communities WHERE slug = 'fish-creek' AND market_id = dc_market_id;
  SELECT id INTO sturgeon_bay_id FROM communities WHERE slug = 'sturgeon-bay' AND market_id = dc_market_id;

  -- Insert sample listings
  INSERT INTO listings (
    market_id, community_id, slug, name, type, subcategories,
    description_short, description_full,
    address, city, state, zip, latitude, longitude,
    phone, email, website,
    hours, hours_notes,
    image_primary,
    social_facebook, social_instagram, social_tripadvisor,
    rating_aggregate, rating_count,
    restaurant_data,
    status, tier, is_verified
  )
  VALUES
    -- The White Gull Inn (Restaurant)
    (
      dc_market_id, fish_creek_id,
      'white-gull-inn',
      'The White Gull Inn',
      'restaurant',
      ARRAY['fish_boil', 'fine_dining', 'american'],
      'Historic Fish Creek inn famous for its traditional Door County fish boil, serving American cuisine since 1896.',
      'Since 1896, The White Gull Inn has been welcoming guests to Fish Creek with warm hospitality and exceptional cuisine. Our traditional Door County fish boil, held Wednesday, Friday, Saturday, and Sunday evenings, is a must-experience event featuring locally-caught whitefish cooked over an open fire with the dramatic ''boilover'' finale. Beyond fish boil nights, enjoy our full dinner menu featuring fresh, locally-sourced ingredients in our charming dining room.',
      '4225 Main Street', 'Fish Creek', 'WI', '54212', 45.1234, -87.2345,
      '+1-920-868-3517', 'info@whitegullinn.com', 'https://whitegullinn.com',
      '{"monday": "5:00 PM - 9:00 PM", "tuesday": "5:00 PM - 9:00 PM", "wednesday": "5:00 PM - 9:00 PM", "thursday": "5:00 PM - 9:00 PM", "friday": "5:00 PM - 9:00 PM", "saturday": "5:00 PM - 9:00 PM", "sunday": "5:00 PM - 9:00 PM"}'::jsonb,
      'Fish boil: Wed, Fri, Sat, Sun evenings. Reservations recommended.',
      '/images/listings/white-gull-inn.jpg',
      'https://www.facebook.com/whitegullinn',
      'https://www.instagram.com/whitegullinn',
      'https://www.tripadvisor.com/Restaurant_Review-g59929-d435267-Reviews-White_Gull_Inn-Fish_Creek_Door_County_Wisconsin.html',
      4.7, 342,
      '{"cuisines": ["American", "Seafood"], "priceRange": "$$", "acceptsReservations": true, "menuUrl": "https://whitegullinn.com/menus/", "hasFishBoil": true, "dietaryOptions": ["Vegetarian", "Gluten-Free Options"]}'::jsonb,
      'active', 'featured', true
    ),

    -- Bay Shore Inn (Lodging)
    (
      dc_market_id, sturgeon_bay_id,
      'bay-shore-inn',
      'Bay Shore Inn',
      'lodging_resort',
      ARRAY['waterfront', 'family_friendly'],
      'Waterfront resort in Sturgeon Bay offering suites with stunning views of Green Bay, indoor pool, and private beach access.',
      'Bay Shore Inn offers the perfect Door County retreat on the shores of Green Bay. Our spacious suites feature fully-equipped kitchens, fireplaces, and private balconies overlooking the water. Enjoy our heated indoor pool, whirlpool, and private sandy beach. Located just minutes from downtown Sturgeon Bay, we''re your ideal home base for exploring all of Door County.',
      '4205 Bay Shore Drive', 'Sturgeon Bay', 'WI', '54235', 44.8567, -87.3456,
      '+1-920-743-4551', 'info@bayshoreinn.net', 'https://www.bayshoreinn.net',
      NULL,
      'Check-in: 3:00 PM, Check-out: 11:00 AM. Office hours: 8 AM - 8 PM',
      '/images/listings/bay-shore-inn.jpg',
      'https://www.facebook.com/bayshoreinn',
      NULL,
      'https://www.tripadvisor.com/Hotel_Review-g60398-d114350-Reviews-Bay_Shore_Inn-Sturgeon_Bay_Door_County_Wisconsin.html',
      4.5, 215,
      NULL,
      'active', 'verified', true
    ),

    -- Peninsula State Park (Activity)
    (
      dc_market_id, fish_creek_id,
      'peninsula-state-park',
      'Peninsula State Park',
      'park',
      ARRAY['hiking', 'biking', 'camping', 'lighthouse'],
      'Wisconsin''s most popular state park featuring 3,776 acres of forests, bluffs, and shoreline along Green Bay.',
      'Peninsula State Park is Door County''s crown jewel, encompassing 3,776 acres of diverse terrain along Green Bay. Explore over 20 miles of hiking and biking trails, visit the historic Eagle Bluff Lighthouse, swim at Nicolet Beach, or camp under the stars. The park offers golf at one of Wisconsin''s most scenic courses, observation towers with panoramic views, and endless opportunities for kayaking, fishing, and wildlife watching.',
      '9462 Shore Road', 'Fish Creek', 'WI', '54212', 45.1456, -87.2234,
      '+1-920-868-3258', NULL, 'https://dnr.wisconsin.gov/topic/parks/peninsula',
      '{"monday": "6:00 AM - 11:00 PM", "tuesday": "6:00 AM - 11:00 PM", "wednesday": "6:00 AM - 11:00 PM", "thursday": "6:00 AM - 11:00 PM", "friday": "6:00 AM - 11:00 PM", "saturday": "6:00 AM - 11:00 PM", "sunday": "6:00 AM - 11:00 PM"}'::jsonb,
      'Vehicle admission required. Hours may vary seasonally.',
      '/images/listings/peninsula-state-park.jpg',
      'https://www.facebook.com/WisconsinStateParks',
      NULL,
      NULL,
      4.8, 1250,
      NULL,
      'active', 'free', true
    )

  ON CONFLICT (market_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    subcategories = EXCLUDED.subcategories,
    description_short = EXCLUDED.description_short,
    description_full = EXCLUDED.description_full,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    website = EXCLUDED.website,
    hours = EXCLUDED.hours,
    hours_notes = EXCLUDED.hours_notes,
    image_primary = EXCLUDED.image_primary,
    rating_aggregate = EXCLUDED.rating_aggregate,
    rating_count = EXCLUDED.rating_count,
    restaurant_data = EXCLUDED.restaurant_data,
    tier = EXCLUDED.tier,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

END $seed$;
