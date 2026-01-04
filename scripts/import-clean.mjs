#!/usr/bin/env node
/**
 * Clean Import Script
 *
 * Imports scraped data into both GHL and Supabase with proper linking.
 * Creates GHL contact first, then creates Supabase listing with ghl_contact_id.
 *
 * Usage: node scripts/import-clean.mjs [--dry-run] [--limit=N]
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_API_TOKEN = process.env.GHL_API_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Door County market ID (from Supabase)
const MARKET_ID = '5792a2fe-d5f1-47bd-84fb-368d5c2cd20b';

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
  // Cities that map to Southern Door County
  'forestville': '17157fcb-c3c5-4441-b98c-2a6d6c443bbe',
  'brussels': '17157fcb-c3c5-4441-b98c-2a6d6c443bbe',
  'algoma': '17157fcb-c3c5-4441-b98c-2a6d6c443bbe',
};

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : null;

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

// Helper: Map category to listing type
function mapToListingType(item) {
  const category = (item.category || '').toLowerCase();
  const subtypes = (item.subtypes || '').toLowerCase();

  if (category.includes('restaurant') || category.includes('cafe') || category.includes('coffee')) {
    return 'restaurant';
  }
  if (category.includes('hotel') || category.includes('lodging') || category.includes('inn')) {
    return 'lodging';
  }
  if (category.includes('shop') || category.includes('store') || category.includes('retail')) {
    return 'shop';
  }
  if (category.includes('attraction') || category.includes('museum') || category.includes('park')) {
    return 'activity';
  }

  // Default based on subtypes
  if (subtypes.includes('restaurant') || subtypes.includes('cafe')) return 'restaurant';
  if (subtypes.includes('hotel') || subtypes.includes('inn')) return 'lodging';
  if (subtypes.includes('shop') || subtypes.includes('store')) return 'shop';

  return 'restaurant'; // default
}

// Helper: Extract subcategories from subtypes
function extractSubcategories(item) {
  const subtypes = item.subtypes || '';
  const categories = [];

  const subtypeList = subtypes.split(',').map(s => s.trim().toLowerCase());

  // Restaurant subcategories
  if (subtypeList.some(s => s.includes('pizza'))) categories.push('pizza');
  if (subtypeList.some(s => s.includes('cafe') || s.includes('coffee'))) categories.push('cafe');
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
async function createGHLContact(item) {
  const name = item.name;
  const email = item.email || `${generateSlug(name)}@placeholder.doorcountyvisitor.com`;
  const city = item.city || 'Door County';
  const citySlug = generateSlug(city);
  const type = mapToListingType(item);

  // Build tags array: active-listing, type, city (no 'lead' tag - we use contact type instead)
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
    console.log(`    Tags: ${tags.join(', ')}`);
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
async function createSupabaseListing(item, ghlContactId) {
  const name = item.name;
  const slug = generateSlug(name);
  const city = item.city || 'Door County';
  const normalizedCity = normalizeCity(city);
  const communityId = COMMUNITY_MAP[normalizedCity] || null;
  const type = mapToListingType(item);

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
  console.log('=== Clean Import Script ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  if (LIMIT) console.log(`Limit: ${LIMIT} items`);
  console.log('');

  // Load data
  let items = await loadScrapedData();

  // Apply limit
  if (LIMIT) {
    items = items.slice(0, LIMIT);
  }

  console.log(`Processing ${items.length} items...\n`);

  let created = 0;
  let failed = 0;

  for (const item of items) {
    try {
      console.log(`${created + failed + 1}/${items.length}: ${item.name}`);

      // Step 1: Create GHL contact
      const ghlContact = await createGHLContact(item);

      // Step 2: Create Supabase listing with GHL contact ID
      await createSupabaseListing(item, ghlContact.id);

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
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${items.length}`);
}

main().catch(console.error);
