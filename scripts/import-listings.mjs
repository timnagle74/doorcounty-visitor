/**
 * Import Listings from Scraped Data
 * 
 * Imports Outscraper data into Supabase with:
 * - Coordinates (lat/long)
 * - Auto-generated tags based on type/category
 * - Google ratings
 * 
 * Usage: node scripts/import-listings.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Tag mapping based on business type/category
const TAG_MAPPING = {
  // Type to tags
  'Restaurant': ['casual'],
  'American restaurant': ['american', 'casual'],
  'Seafood restaurant': ['seafood'],
  'Fine dining restaurant': ['fine-dining'],
  'Breakfast restaurant': ['breakfast'],
  'Cafe': ['coffee-bakery', 'casual'],
  'Coffee shop': ['coffee-bakery'],
  'Bar': ['casual'],
  'Bar & grill': ['american', 'casual'],
  'Brewery': ['wine-dining'],
  'Winery': ['wine-dining'],
  'Wine bar': ['wine-dining'],
  'Ice cream shop': ['ice-cream'],
  'Bakery': ['coffee-bakery'],
  'Pizza restaurant': ['pizza', 'casual'],
  
  // Lodging
  'Hotel': ['year-round'],
  'Resort hotel': ['year-round'],
  'Motel': ['year-round'],
  'Bed & breakfast': ['romantic', 'year-round'],
  'Inn': ['romantic', 'year-round'],
  'Lodge': ['nature-outdoors', 'year-round'],
  'Cottage rental': ['year-round'],
  'Campground': ['nature-outdoors', 'summer'],
  
  // Activities
  'Tourist attraction': ['scenic-views'],
  'State park': ['nature-outdoors', 'hiking', 'year-round'],
  'Nature preserve': ['nature-outdoors', 'hiking'],
  'Museum': ['arts-culture', 'history-heritage'],
  'Art gallery': ['arts-culture', 'shopping'],
  'Gift shop': ['shopping'],
  'Boat rental service': ['beaches-water', 'kayaking', 'summer'],
  'Spa': ['spa', 'romantic'],
};

// Category to listing type mapping
const CATEGORY_TO_TYPE = {
  'restaurants': 'eat',
  'cafes': 'eat',
  'coffee shops': 'eat',
  'bars': 'eat',
  'hotels': 'stay',
  'attractions': 'do',
  'museums': 'do',
  'Art gallery': 'shop',
  'Gift shop': 'shop',
  'Bed & breakfast': 'stay',
  'Brewery': 'eat',
  'Motel': 'stay',
  'Inn': 'stay',
  'Boat rental service': 'do',
  'Campground': 'stay',
  'Cottage rental': 'stay',
  'Lodge': 'stay',
  'Lodging': 'stay',
  'Cottage': 'stay',
  'Ice cream shop': 'eat',
};

function getListingType(category, type) {
  if (CATEGORY_TO_TYPE[category]) return CATEGORY_TO_TYPE[category];
  if (CATEGORY_TO_TYPE[type]) return CATEGORY_TO_TYPE[type];
  
  // Fallback based on keywords
  const combined = `${category} ${type}`.toLowerCase();
  if (combined.includes('restaurant') || combined.includes('cafe') || combined.includes('bar') || combined.includes('food')) return 'eat';
  if (combined.includes('hotel') || combined.includes('inn') || combined.includes('lodge') || combined.includes('camp')) return 'stay';
  if (combined.includes('shop') || combined.includes('gallery') || combined.includes('store')) return 'shop';
  return 'do';
}

function generateSlug(name, city) {
  const base = `${name}-${city || 'door-county'}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base.substring(0, 100);
}

function getTagsForBusiness(type, category) {
  const tags = new Set();
  
  // Add tags based on type
  if (TAG_MAPPING[type]) {
    TAG_MAPPING[type].forEach(t => tags.add(t));
  }
  
  // Add tags based on category
  if (TAG_MAPPING[category]) {
    TAG_MAPPING[category].forEach(t => tags.add(t));
  }
  
  // Default tags
  tags.add('year-round'); // Most businesses are year-round
  
  return Array.from(tags);
}

async function importListings() {
  console.log('📦 Loading scraped data...');
  
  const scrapedDir = path.join(__dirname, '..', 'scrapedData');
  const files = fs.readdirSync(scrapedDir).filter(f => f.endsWith('.json'));
  
  console.log(`📁 Found ${files.length} JSON files`);
  
  // Load all listings
  const allListings = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(scrapedDir, file), 'utf-8'));
    allListings.push(...data);
    console.log(`  ✓ ${file}: ${data.length} listings`);
  }
  
  console.log(`\n📊 Total: ${allListings.length} listings`);
  
  // Get existing tags
  const { data: tags } = await supabase.from('tags').select('id, slug');
  const tagMap = {};
  tags?.forEach(t => { tagMap[t.slug] = t.id; });
  console.log(`🏷️  Loaded ${Object.keys(tagMap).length} tags`);
  
  // Process and insert listings
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const listing of allListings) {
    try {
      const listingType = getListingType(listing.category, listing.type);
      const slug = generateSlug(listing.name, listing.city);
      
      const listingData = {
        name: listing.name,
        slug,
        type: listingType,
        category: listing.category || listing.type,
        description: listing.description || null,
        address: listing.full_address || listing.address,
        city: listing.city || 'Door County',
        state: 'WI',
        postal_code: listing.postal_code,
        phone: listing.phone,
        website: listing.website,
        latitude: listing.latitude,
        longitude: listing.longitude,
        place_id: listing.place_id,
        google_rating: listing.rating,
        google_reviews_count: listing.reviews,
        price_level: listing.price_level,
        hours: listing.working_hours ? JSON.stringify(listing.working_hours) : null,
        status: 'active',
      };
      
      // Upsert listing
      const { data: upserted, error } = await supabase
        .from('listings')
        .upsert(listingData, { onConflict: 'slug' })
        .select('id')
        .single();
      
      if (error) {
        console.error(`❌ Error inserting ${listing.name}:`, error.message);
        errors++;
        continue;
      }
      
      // Add tags
      const tagSlugs = getTagsForBusiness(listing.type, listing.category);
      const tagInserts = tagSlugs
        .filter(slug => tagMap[slug])
        .map(slug => ({
          listing_id: upserted.id,
          tag_id: tagMap[slug],
          source: 'auto',
        }));
      
      if (tagInserts.length > 0) {
        await supabase
          .from('listing_tags')
          .upsert(tagInserts, { onConflict: 'listing_id,tag_id' });
      }
      
      inserted++;
      
      if (inserted % 100 === 0) {
        console.log(`  ✓ Processed ${inserted} listings...`);
      }
    } catch (err) {
      console.error(`❌ Error processing ${listing.name}:`, err.message);
      errors++;
    }
  }
  
  console.log('\n✅ Import complete!');
  console.log(`   Inserted/Updated: ${inserted}`);
  console.log(`   Errors: ${errors}`);
}

// Run import
importListings().catch(console.error);
