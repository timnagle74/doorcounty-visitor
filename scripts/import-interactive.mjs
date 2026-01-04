#!/usr/bin/env node
/**
 * Interactive Import Script
 *
 * Imports scraped data into both GHL and Supabase with proper linking.
 * When encountering unknown business types, prompts for classification
 * and learns from responses.
 *
 * Usage: node scripts/import-interactive.mjs [--dry-run] [--limit=N]
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_API_TOKEN = process.env.GHL_API_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Door County market ID (from Supabase)
const MARKET_ID = '5792a2fe-d5f1-47bd-84fb-368d5c2cd20b';

// Valid listing types in our system
const VALID_TYPES = ['restaurant', 'lodging', 'shop', 'activity', 'winery', 'brewery', 'service'];

// Community mapping (city name -> community_id)
const COMMUNITY_MAP = {
  'sturgeon bay': '1fa70355-174e-4a35-b7fa-b7dd07e6539f',
  'egg harbor': '637ecd35-e978-49bd-9db7-8f613463654b',
  'fish creek': '5045be2e-af7e-4085-8ef1-e5c243a117c6',
  'ephraim': '3196ac84-ffd5-44c3-966d-cbaff9a0942e',
  'sister bay': '41b3b8fa-3cea-4400-862a-38d53fb94699',
  'ellison bay': '099e33dd-ce05-4cce-9484-b9a4f627dbf7',
  'baileys harbor': 'ccee10f0-9014-4888-8794-c47e0c402f87',
  'washington': '7afed78c-d2c7-4fbe-9c12-7890082bec77',
  'washington island': '7afed78c-d2c7-4fbe-9c12-7890082bec77',
  'jacksonport': 'dc34f65c-78a2-41a7-85a7-7c7446741578',
  'gills rock': '574773f8-c068-4ba6-b359-b9503353b1d0',
  'forestville': '17157fcb-c3c5-4441-b98c-2a6d6c443bbe',
  'brussels': '17157fcb-c3c5-4441-b98c-2a6d6c443bbe',
  'algoma': '17157fcb-c3c5-4441-b98c-2a6d6c443bbe',
};

// Valid Door County cities/areas (for strict validation)
const VALID_DOOR_COUNTY_CITIES = [
  'sturgeon bay', 'egg harbor', 'fish creek', 'ephraim', 'sister bay',
  'ellison bay', 'baileys harbor', 'washington island', 'jacksonport',
  'gills rock', 'forestville', 'brussels', 'door county',
  'carlsville', 'institute', 'juddville', 'northport', 'rowleys bay',
  'liberty grove', 'sevastopol', 'gibraltar', 'maplewood', 'valmy',
  'washington', 'clay banks', 'nasewaupee', 'gardner'
];

// Nearby cities (not in Door County but close enough to include)
const NEARBY_CITIES = [
  'algoma',      // Kewaunee County, just south
  'kewaunee',    // Kewaunee County
  'green bay',   // Brown County, gateway city
  'de pere',     // Brown County
];

// Helper: Validate if a location is in Door County or nearby area
function isValidDoorCountyLocation(item) {
  // Must be in Wisconsin (check us_state field from Outscraper)
  const state = (item.us_state || item.state || '').toLowerCase().trim();
  if (state && state !== 'wi' && state !== 'wisconsin') {
    return { valid: false, reason: `State is "${item.us_state || item.state}", not Wisconsin` };
  }

  // Check city against valid Door County cities
  const city = (item.city || '').toLowerCase().trim();
  if (!city) {
    return { valid: false, reason: 'No city specified' };
  }

  // Check if it's a Door County city
  const isDoorCounty = VALID_DOOR_COUNTY_CITIES.some(vc =>
    city.includes(vc) || vc.includes(city)
  );

  if (isDoorCounty) {
    return { valid: true, region: 'door_county' };
  }

  // Check if it's a nearby city
  const isNearby = NEARBY_CITIES.some(nc =>
    city.includes(nc) || nc.includes(city)
  );

  if (isNearby) {
    return { valid: true, region: 'nearby' };
  }

  return { valid: false, reason: `City "${item.city}" is not in Door County or nearby area` };
}

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : null;

// File to store learned mappings
const MAPPINGS_FILE = path.join(process.cwd(), 'scripts', 'type-mappings.json');

// Load existing mappings or create default
function loadMappings() {
  if (fs.existsSync(MAPPINGS_FILE)) {
    return JSON.parse(fs.readFileSync(MAPPINGS_FILE, 'utf8'));
  }

  // Default mappings based on known patterns
  return {
    // Category -> type mappings
    categories: {
      // Restaurants
      'restaurant': 'restaurant',
      'cafe': 'restaurant',
      'cafes': 'restaurant',
      'coffee shop': 'restaurant',
      'coffee shops': 'restaurant',
      'bakery': 'restaurant',
      'deli': 'restaurant',
      'ice cream shop': 'restaurant',
      'dessert shop': 'restaurant',
      'hamburger restaurant': 'restaurant',
      'asian fusion restaurant': 'restaurant',
      'new american restaurant': 'restaurant',
      'tex-mex restaurant': 'restaurant',
      'bagel shop': 'restaurant',
      'açaí shop': 'restaurant',
      'restaurants': 'restaurant',
      'bars': 'restaurant',

      // Lodging
      'hotel': 'lodging',
      'hotels': 'lodging',
      'motel': 'lodging',
      'inn': 'lodging',
      'bed & breakfast': 'lodging',
      'lodge': 'lodging',
      'lodging': 'lodging',
      'guest house': 'lodging',
      'cottage': 'lodging',
      'cottage rental': 'lodging',
      'cabin rental agency': 'lodging',
      'camping cabin': 'lodging',
      'campground': 'lodging',
      'vacation home rental agency': 'lodging',
      'indoor lodging': 'lodging',

      // Shops
      'gift shop': 'shop',
      'boutique': 'shop',
      'clothing store': 'shop',
      'antique store': 'shop',
      'furniture store': 'shop',
      'home goods store': 'shop',
      'pottery store': 'shop',
      'candle store': 'shop',
      'leather goods store': 'shop',
      'natural goods store': 'shop',
      'irish goods store': 'shop',
      'popcorn store': 'shop',
      'rock shop': 'shop',
      'picture frame shop': 'shop',
      'art supply store': 'shop',
      'store': 'shop',
      'shopping mall': 'shop',
      'market': 'shop',
      'produce market': 'shop',
      "farmers' market": 'shop',

      // Activities
      'tourist attraction': 'activity',
      'attractions': 'activity',
      'museums': 'activity',
      'state park': 'activity',
      'golf course': 'activity',
      'bowling alley': 'activity',
      'boat rental service': 'activity',

      // Art (map to shop by default)
      'art gallery': 'shop',
      'art dealer': 'shop',
      'artist': 'service',
      'glass blower': 'service',

      // Winery & Brewery
      'winery': 'winery',
      'distillery': 'winery',
      'brewery': 'brewery',

      // Services
      'wedding venue': 'service',
      'gas station': 'service',
    },

    // Subtype -> type mappings (checked if category doesn't match)
    subtypes: {
      'restaurant': 'restaurant',
      'cafe': 'restaurant',
      'coffee shop': 'restaurant',
      'bakery': 'restaurant',
      'bar': 'restaurant',
      'pub': 'restaurant',
      'bar & grill': 'restaurant',
      'pizza restaurant': 'restaurant',
      'seafood restaurant': 'restaurant',
      'breakfast restaurant': 'restaurant',
      'fine dining restaurant': 'restaurant',
      'american restaurant': 'restaurant',
      'italian restaurant': 'restaurant',
      'mexican restaurant': 'restaurant',
      'ice cream shop': 'restaurant',

      'hotel': 'lodging',
      'motel': 'lodging',
      'inn': 'lodging',
      'bed & breakfast': 'lodging',
      'resort hotel': 'lodging',
      'lodge': 'lodging',
      'cottage': 'lodging',
      'campground': 'lodging',

      'gift shop': 'shop',
      'boutique': 'shop',
      'clothing store': 'shop',
      'souvenir store': 'shop',
      'antique store': 'shop',
      'jeweler': 'shop',
      'jewelry store': 'shop',
      'book store': 'shop',

      'tourist attraction': 'activity',
      'museum': 'activity',
      'state park': 'activity',
      'park': 'activity',
      'boat tour agency': 'activity',
      'tour operator': 'activity',
      'marina': 'activity',
      'golf course': 'activity',

      'art gallery': 'shop',
      'photographer': 'service',
      'photography studio': 'service',

      'winery': 'winery',
      'vineyard': 'winery',
      'wine bar': 'winery',
      'distillery': 'winery',

      'brewery': 'brewery',
      'brewpub': 'brewery',
      'beer hall': 'brewery',
    },

    // Skipped categories (don't import)
    skip: [],
  };
}

// Save mappings
function saveMappings(mappings) {
  fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
}

// Create readline interface for user prompts
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Ask user a question
async function askUser(question) {
  const rl = createPrompt();
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Determine listing type with learning
async function determineType(item, mappings) {
  const category = (item.category || '').toLowerCase().trim();
  const subtypes = (item.subtypes || '').toLowerCase();
  const subtypeList = subtypes.split(',').map(s => s.trim()).filter(Boolean);

  // Check if category should be skipped
  if (mappings.skip.includes(category)) {
    return { type: 'SKIP', reason: 'Category marked to skip' };
  }

  // Check category mapping first
  if (category && mappings.categories[category]) {
    return { type: mappings.categories[category], confidence: 'high', source: 'category' };
  }

  // Check subtype mappings
  for (const subtype of subtypeList) {
    if (mappings.subtypes[subtype]) {
      return { type: mappings.subtypes[subtype], confidence: 'medium', source: 'subtype' };
    }
  }

  // Unknown - need to ask user
  console.log('\n' + '='.repeat(60));
  console.log('UNKNOWN BUSINESS TYPE - Need your input');
  console.log('='.repeat(60));
  console.log(`Name: ${item.name}`);
  console.log(`Category: ${category || '(none)'}`);
  console.log(`Subtypes: ${subtypes || '(none)'}`);
  console.log(`City: ${item.city || '(unknown)'}`);
  if (item.website) console.log(`Website: ${item.website}`);
  console.log('');
  console.log('Available types:');
  VALID_TYPES.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log(`  ${VALID_TYPES.length + 1}. SKIP (don't import this business)`);
  console.log(`  ${VALID_TYPES.length + 2}. SKIP ALL with this category`);
  console.log('');

  const answer = await askUser('Enter number (or type name): ');

  let selectedType;
  const num = parseInt(answer);

  if (num >= 1 && num <= VALID_TYPES.length) {
    selectedType = VALID_TYPES[num - 1];
  } else if (num === VALID_TYPES.length + 1) {
    return { type: 'SKIP', reason: 'User skipped' };
  } else if (num === VALID_TYPES.length + 2) {
    // Skip all with this category
    if (category) {
      mappings.skip.push(category);
      saveMappings(mappings);
      console.log(`Added "${category}" to skip list`);
    }
    return { type: 'SKIP', reason: 'Category added to skip list' };
  } else if (VALID_TYPES.includes(answer.toLowerCase())) {
    selectedType = answer.toLowerCase();
  } else {
    console.log('Invalid selection, defaulting to "service"');
    selectedType = 'service';
  }

  // Learn from this selection
  if (category) {
    const learnAnswer = await askUser(`Apply "${selectedType}" to all "${category}" businesses? (y/n): `);
    if (learnAnswer.toLowerCase() === 'y') {
      mappings.categories[category] = selectedType;
      saveMappings(mappings);
      console.log(`Learned: "${category}" -> "${selectedType}"`);
    }
  }

  // Also offer to learn from first subtype
  if (subtypeList.length > 0) {
    const primarySubtype = subtypeList[0];
    if (!mappings.subtypes[primarySubtype]) {
      const learnSubtype = await askUser(`Also apply "${selectedType}" to subtype "${primarySubtype}"? (y/n): `);
      if (learnSubtype.toLowerCase() === 'y') {
        mappings.subtypes[primarySubtype] = selectedType;
        saveMappings(mappings);
        console.log(`Learned: subtype "${primarySubtype}" -> "${selectedType}"`);
      }
    }
  }

  return { type: selectedType, confidence: 'user', source: 'user-input' };
}

// Helper: Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper: Normalize city name for community lookup
function normalizeCity(city) {
  if (!city) return null;
  return city.toLowerCase().trim();
}

// Helper: Extract subcategories from subtypes
function extractSubcategories(item) {
  const subtypes = item.subtypes || '';
  const categories = [];

  const subtypeList = subtypes.split(',').map(s => s.trim().toLowerCase());

  // Restaurant subcategories
  if (subtypeList.some(s => s.includes('pizza'))) categories.push('pizza');
  if (subtypeList.some(s => s.includes('coffee'))) categories.push('coffee_shop');
  if (subtypeList.some(s => s.includes('cafe') && !s.includes('coffee'))) categories.push('cafe');
  if (subtypeList.some(s => s.includes('bakery'))) categories.push('bakery');
  if (subtypeList.some(s => s.includes('bar'))) categories.push('bar');
  if (subtypeList.some(s => s.includes('ice cream'))) categories.push('ice_cream');
  if (subtypeList.some(s => s.includes('breakfast'))) categories.push('breakfast');
  if (subtypeList.some(s => s.includes('seafood'))) categories.push('seafood');
  if (subtypeList.some(s => s.includes('italian'))) categories.push('italian');
  if (subtypeList.some(s => s.includes('mexican'))) categories.push('mexican');
  if (subtypeList.some(s => s.includes('american'))) categories.push('american');
  if (subtypeList.some(s => s.includes('wine'))) categories.push('winery');
  if (subtypeList.some(s => s.includes('brew'))) categories.push('brewery');

  // Shop subcategories
  if (subtypeList.some(s => s.includes('gift'))) categories.push('gift');
  if (subtypeList.some(s => s.includes('antique'))) categories.push('antique');
  if (subtypeList.some(s => s.includes('clothing') || s.includes('boutique'))) categories.push('clothing');
  if (subtypeList.some(s => s.includes('art') || s.includes('gallery'))) categories.push('art');
  if (subtypeList.some(s => s.includes('jewelry') || s.includes('jeweler'))) categories.push('jewelry');

  return categories.length > 0 ? categories : null;
}

// Helper: Parse working hours
function parseHours(workingHours) {
  if (!workingHours || typeof workingHours !== 'object') return null;

  const hours = {};
  const dayMap = {
    'Monday': 'monday',
    'Tuesday': 'tuesday',
    'Wednesday': 'wednesday',
    'Thursday': 'thursday',
    'Friday': 'friday',
    'Saturday': 'saturday',
    'Sunday': 'sunday'
  };

  for (const [day, value] of Object.entries(workingHours)) {
    const key = dayMap[day];
    if (key && value) {
      hours[key] = Array.isArray(value) ? value.join(', ') : value;
    }
  }

  return Object.keys(hours).length > 0 ? hours : null;
}

// Create GHL contact
async function createGHLContact(item, type) {
  const name = item.name;
  const email = item.email || `${generateSlug(name)}@placeholder.doorcountyvisitor.com`;
  const city = item.city || 'Door County';
  const citySlug = generateSlug(city);

  // Build tags array: active-listing, type, city
  const tags = ['active-listing', type, citySlug];

  // Add subcategory tags
  const subcats = extractSubcategories(item);
  if (subcats) {
    tags.push(...subcats.filter(s => !tags.includes(s)));
  }

  const contactData = {
    firstName: name,
    email: email,
    phone: item.phone || undefined,
    address1: item.street || undefined,
    city: city,
    state: 'WI',
    country: 'US',
    website: item.website || undefined,
    source: 'Outscraper Import',
    tags: tags,
    type: 'lead', // Contact type: lead (will change to customer when they pay for premium)
    locationId: GHL_LOCATION_ID,
  };

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create GHL contact: ${name}`);
    console.log(`    Type: ${type}, Tags: ${tags.join(', ')}`);
    return { id: 'dry-run-id' };
  }

  const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contactData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GHL API error: ${response.status} ${text}`);
  }

  const result = await response.json();
  return result.contact;
}

// Create Supabase listing
async function createSupabaseListing(item, ghlContactId, type, region = 'door_county') {
  const name = item.name;
  const slug = generateSlug(name);
  const city = item.city || 'Door County';
  const normalizedCity = normalizeCity(city);
  const communityId = COMMUNITY_MAP[normalizedCity] || null;

  const listingData = {
    market_id: MARKET_ID,
    community_id: communityId,
    slug: slug,
    name: name,
    type: type,
    subcategories: extractSubcategories(item),
    description_short: item.website_description || null,
    description_full: item.website_description || null,
    address: item.street || null,
    city: city,
    state: 'WI',
    zip: item.postal_code ? String(item.postal_code) : null,
    latitude: item.latitude || null,
    longitude: item.longitude || null,
    phone: item.phone || null,
    email: item.email || null,
    website: item.website || null,
    hours: parseHours(item.working_hours),
    image_primary: item.photo || null,
    logo_url: item.logo || null,
    rating_aggregate: item.rating || null,
    rating_count: item.reviews || 0,
    restaurant_data: type === 'restaurant' ? {
      cuisines: [],
      priceRange: item.range || null,
      hasFishBoil: false,
    } : null,
    status: 'active',
    tier: 'free',
    is_verified: false,
    ghl_contact_id: ghlContactId,
    region: region,  // 'door_county' or 'nearby'
  };

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create Supabase listing: ${name}`);
    console.log(`    GHL Contact ID: ${ghlContactId}`);
    return { id: 'dry-run-id' };
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(listingData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase API error: ${response.status} ${text}`);
  }

  const result = await response.json();
  return result[0];
}

// Load and deduplicate scraped data
async function loadScrapedData() {
  const scrapedDir = path.join(process.cwd(), 'scrapedData');
  const files = fs.readdirSync(scrapedDir).filter(f => f.endsWith('.json'));

  const allItems = [];
  const seenNames = new Set();

  for (const file of files) {
    const filePath = path.join(scrapedDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const item of data) {
      if (!item.name) continue;

      // Deduplicate by normalized name
      const normalizedName = item.name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) continue;
      seenNames.add(normalizedName);

      // Skip if no useful data
      if (!item.phone && !item.email && !item.website) continue;

      allItems.push(item);
    }
  }

  console.log(`Loaded ${allItems.length} unique items from ${files.length} files`);
  return allItems;
}

// Main import function
async function main() {
  console.log('=== Interactive Import Script ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  if (LIMIT) console.log(`Limit: ${LIMIT} items`);
  console.log('');

  // Load mappings
  const mappings = loadMappings();
  console.log(`Loaded type mappings (${Object.keys(mappings.categories).length} categories, ${Object.keys(mappings.subtypes).length} subtypes)`);
  console.log('');

  // Load data
  let items = await loadScrapedData();

  // Apply limit
  if (LIMIT) {
    items = items.slice(0, LIMIT);
  }

  console.log(`Processing ${items.length} items...\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      console.log(`${created + skipped + failed + 1}/${items.length}: ${item.name}`);

      // Step 0: Validate location is in Door County or nearby area
      const locationCheck = isValidDoorCountyLocation(item);
      if (!locationCheck.valid) {
        console.log(`  ⊘ Skipped: ${locationCheck.reason}`);
        skipped++;
        continue;
      }

      const region = locationCheck.region; // 'door_county' or 'nearby'
      if (region === 'nearby') {
        console.log(`  Region: Nearby (${item.city})`);
      }

      // Step 1: Determine type (may prompt user)
      const typeResult = await determineType(item, mappings);

      if (typeResult.type === 'SKIP') {
        console.log(`  ⊘ Skipped: ${typeResult.reason}`);
        skipped++;
        continue;
      }

      const type = typeResult.type;
      console.log(`  Type: ${type} (${typeResult.source})`);

      // Step 2: Create GHL contact
      const ghlContact = await createGHLContact(item, type);

      // Step 3: Create Supabase listing with GHL contact ID and region
      await createSupabaseListing(item, ghlContact.id, type, region);

      created++;
      console.log(`  ✓ Created (GHL: ${ghlContact.id})`);

      // Small delay to avoid rate limiting
      if (!DRY_RUN) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      failed++;
      console.log(`  ✗ Failed: ${error.message}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${items.length}`);

  // Save final mappings
  saveMappings(mappings);
  console.log(`\nMappings saved to ${MAPPINGS_FILE}`);
}

main().catch(console.error);
