/**
 * Import restaurants from Outscraper JSON export
 *
 * Flow: Outscraper → GHL (as contacts) → Supabase (with GHL contact ID)
 *
 * Usage:
 *   npx tsx scripts/import-restaurants.ts path/to/restaurants.json
 *
 * Expected Outscraper fields:
 *   - name, full_address, city, state, postal_code
 *   - phone, site (website)
 *   - latitude, longitude
 *   - rating, reviews (count)
 *   - type, subtypes (array)
 *   - working_hours (object with day keys)
 *   - photos (array of URLs)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
import 'dotenv/config';

// =============================================================================
// GHL API Functions (duplicated here to work in Node.js context)
// =============================================================================

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

interface GHLContact {
  id: string;
  locationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
  source: string;
}

async function ghlFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiToken = process.env.GHL_API_TOKEN;

  const response = await fetch(`${GHL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GHL API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function findGHLContactByPhone(phone: string): Promise<GHLContact | null> {
  const locationId = process.env.GHL_LOCATION_ID;

  try {
    const response = await ghlFetch<{ contact?: GHLContact }>(
      `/contacts/search/duplicate?locationId=${locationId}&phone=${encodeURIComponent(phone)}`
    );
    return response.contact || null;
  } catch {
    return null;
  }
}

async function createGHLBusinessContact(data: {
  businessName: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  tags: string[];
}): Promise<GHLContact> {
  const locationId = process.env.GHL_LOCATION_ID;

  // Use business name as first name, generate placeholder email if none
  const placeholderEmail = data.email ||
    `${data.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}@placeholder.doorcountyvisitor.com`;

  const payload = {
    locationId,
    firstName: data.businessName,
    lastName: '',
    email: placeholderEmail,
    phone: data.phone || '',
    address1: data.address || '',
    city: data.city || '',
    state: data.state || 'WI',
    website: data.website || '',
    source: 'Outscraper Import',
    tags: data.tags,
  };

  const response = await ghlFetch<{ contact?: GHLContact }>('/contacts/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.contact) {
    throw new Error('Failed to create contact in GHL');
  }

  return response.contact;
}

async function upsertGHLBusinessContact(data: {
  businessName: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  tags: string[];
}): Promise<GHLContact> {
  // Try to find existing by phone first (most reliable for businesses)
  if (data.phone) {
    const existing = await findGHLContactByPhone(data.phone);
    if (existing) {
      console.log(`  Found existing GHL contact for ${data.businessName}`);
      return existing;
    }
  }

  // Create new contact
  return createGHLBusinessContact(data);
}

// =============================================================================
// Main Import Logic
// =============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Make sure .env has both variables set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OutscraperRestaurant {
  name: string;
  full_address?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  state_code?: string;
  postal_code?: number | string;
  phone?: string;
  email?: string;
  site?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviews?: number;
  reviews_count?: number;
  type?: string;
  category?: string;
  subtypes?: string | string[]; // Can be comma-separated string
  categories?: string[];
  working_hours?: Record<string, string[] | string>;
  photos?: string[];
  photo?: string;
  description?: string;
  website_description?: string;
  price_level?: string;
  range?: string; // Outscraper uses "range" for price like "$$"
  place_id?: string;
  google_id?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

function parsePrice(priceLevel: string | undefined, range: string | undefined): string | null {
  const price = range || priceLevel;
  if (!price) return null;
  // Outscraper uses "range" field with values like "$$"
  const priceLower = price.toLowerCase();
  if (priceLower.includes('inexpensive') || price === '$') return '$';
  if (priceLower.includes('moderate') || price === '$$') return '$$';
  if (priceLower.includes('expensive') || price === '$$$') return '$$$';
  if (priceLower.includes('very expensive') || price === '$$$$') return '$$$$';
  return price.replace(/[^$]/g, '') || null;
}

// Helper to normalize subtypes (can be string or array)
function normalizeSubtypes(subtypes: string | string[] | undefined): string[] {
  if (!subtypes) return [];
  if (Array.isArray(subtypes)) return subtypes;
  // Split comma-separated string
  return subtypes.split(',').map(s => s.trim()).filter(Boolean);
}

function parseSubcategories(subtypes: string[] | undefined, category: string | undefined): string[] {
  const subs: string[] = [];
  const all = [...(subtypes || []), category].filter(Boolean).map(s => s!.toLowerCase());

  // Map common restaurant types to our subcategories
  for (const type of all) {
    if (type.includes('fish boil') || type.includes('seafood')) subs.push('fish_boil');
    if (type.includes('fine dining') || type.includes('upscale')) subs.push('fine_dining');
    if (type.includes('cafe') || type.includes('coffee')) subs.push('cafe');
    if (type.includes('bar') || type.includes('pub') || type.includes('supper club')) subs.push('supper_club');
    if (type.includes('waterfront') || type.includes('lakefront')) subs.push('waterfront');
    if (type.includes('pizza')) subs.push('pizza');
    if (type.includes('breakfast') || type.includes('brunch')) subs.push('breakfast');
    if (type.includes('american')) subs.push('american');
    if (type.includes('italian')) subs.push('italian');
    if (type.includes('mexican')) subs.push('mexican');
    if (type.includes('asian') || type.includes('chinese') || type.includes('thai')) subs.push('asian');
    // New categories for food/drink variety
    if (type.includes('brewery') || type.includes('brewpub')) subs.push('brewery');
    if (type.includes('bakery') || type.includes('pastry')) subs.push('bakery');
    if (type.includes('ice cream') || type.includes('frozen yogurt')) subs.push('ice_cream');
    if (type.includes('deli') || type.includes('sandwich')) subs.push('deli');
    if (type.includes('winery') || type.includes('wine bar')) subs.push('winery');
  }

  return [...new Set(subs)];
}

function parseCuisines(subtypes: string[] | undefined): string[] {
  const cuisines: string[] = [];
  const all = (subtypes || []).map(s => s.toLowerCase());

  const cuisineMap: Record<string, string> = {
    'american': 'American',
    'italian': 'Italian',
    'mexican': 'Mexican',
    'chinese': 'Chinese',
    'thai': 'Thai',
    'japanese': 'Japanese',
    'indian': 'Indian',
    'french': 'French',
    'seafood': 'Seafood',
    'steakhouse': 'Steakhouse',
    'pizza': 'Pizza',
    'vegetarian': 'Vegetarian',
    'vegan': 'Vegan',
  };

  for (const type of all) {
    for (const [key, value] of Object.entries(cuisineMap)) {
      if (type.includes(key)) cuisines.push(value);
    }
  }

  return [...new Set(cuisines)].slice(0, 5);
}

function parseHours(workingHours: Record<string, string[] | string> | undefined): Record<string, string> | null {
  if (!workingHours || Object.keys(workingHours).length === 0) return null;

  const hours: Record<string, string> = {};
  const dayMap: Record<string, string> = {
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
    'sunday': 'sunday',
    'mon': 'monday',
    'tue': 'tuesday',
    'wed': 'wednesday',
    'thu': 'thursday',
    'fri': 'friday',
    'sat': 'saturday',
    'sun': 'sunday',
  };

  for (const [key, value] of Object.entries(workingHours)) {
    const normalizedDay = dayMap[key.toLowerCase()];
    if (normalizedDay && value) {
      // Value can be array like ["7AM-3PM"] or string
      const hoursStr = Array.isArray(value) ? value.join(', ') : value;
      if (hoursStr && hoursStr.toLowerCase() !== 'closed') {
        hours[normalizedDay] = hoursStr;
      }
    }
  }

  return Object.keys(hours).length > 0 ? hours : null;
}

async function importRestaurants(filePath: string) {
  // Validate environment variables
  const ghlToken = process.env.GHL_API_TOKEN;
  const ghlLocationId = process.env.GHL_LOCATION_ID;

  if (!ghlToken || !ghlLocationId) {
    console.error('Missing GHL_API_TOKEN or GHL_LOCATION_ID');
    process.exit(1);
  }

  console.log(`Reading file: ${filePath}`);

  const fullPath = resolve(filePath);
  const content = readFileSync(fullPath, 'utf-8');
  const restaurants: OutscraperRestaurant[] = JSON.parse(content);

  console.log(`Found ${restaurants.length} restaurants to import`);
  console.log('Flow: Outscraper → GHL → Supabase\n');

  // Get Door County market ID
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('id')
    .eq('slug', 'door-county')
    .single();

  if (marketError || !market) {
    console.error('Could not find door-county market:', marketError);
    process.exit(1);
  }

  const marketId = market.id;
  console.log(`Using market ID: ${marketId}`);

  // Get communities for mapping
  const { data: communities } = await supabase
    .from('communities')
    .select('id, name, slug')
    .eq('market_id', marketId);

  const communityMap = new Map(
    (communities || []).map(c => [c.name.toLowerCase(), c.id])
  );

  let imported = 0;
  let skipped = 0;
  let ghlErrors = 0;
  let supabaseErrors = 0;

  for (const r of restaurants) {
    if (!r.name) {
      skipped++;
      continue;
    }

    const slug = slugify(r.name);
    const city = r.city || '';
    const communityId = communityMap.get(city.toLowerCase()) || null;
    const phone = r.phone || '';
    const email = r.email || '';
    const website = r.website || r.site || '';
    const address = r.street || r.address || r.full_address?.split(',')[0] || '';
    const state = r.state_code || r.state || 'WI';
    const zip = r.postal_code?.toString() || '';
    const subtypesArray = normalizeSubtypes(r.subtypes);
    const description = r.website_description || r.description || '';

    console.log(`\nProcessing: ${r.name}`);

    // Step 1: Create/upsert in GHL first
    let ghlContactId: string | null = null;

    try {
      // Build tags based on restaurant type
      const tags = ['restaurant', 'imported-listing', 'unclaimed'];
      const allTypes = subtypesArray.map(t => t.toLowerCase()).join(' ');
      const categoryLower = (r.category || '').toLowerCase();

      if (allTypes.includes('fish boil')) tags.push('fish-boil');
      if (allTypes.includes('fine dining')) tags.push('fine-dining');
      if (allTypes.includes('cafe') || allTypes.includes('coffee') || categoryLower.includes('cafe') || categoryLower.includes('coffee')) tags.push('cafe');
      if (allTypes.includes('brewery') || allTypes.includes('brewpub') || categoryLower.includes('brewery')) tags.push('brewery');
      if (allTypes.includes('bakery') || categoryLower.includes('bakery')) tags.push('bakery');
      if (allTypes.includes('ice cream') || categoryLower.includes('ice cream')) tags.push('ice-cream');
      if (allTypes.includes('winery') || allTypes.includes('wine bar')) tags.push('winery');
      if (city) {
        tags.push(city.toLowerCase().replace(/\s+/g, '-'));
      }

      const ghlContact = await upsertGHLBusinessContact({
        businessName: r.name,
        phone,
        email: email || undefined,
        website,
        address,
        city,
        state,
        tags,
      });

      ghlContactId = ghlContact.id;
      console.log(`  ✓ GHL contact: ${ghlContactId}`);
    } catch (error) {
      console.error(`  ✗ GHL error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ghlErrors++;
      // Continue anyway - we can still add to Supabase without GHL link
    }

    // Step 2: Add to Supabase with GHL contact ID
    const listing = {
      market_id: marketId,
      community_id: communityId,
      slug,
      name: r.name,
      type: 'restaurant',
      subcategories: parseSubcategories(subtypesArray, r.type || r.category),
      description_short: description.substring(0, 200) || null,
      description_full: description || null,
      address: address || null,
      city: city || null,
      state,
      zip: zip || null,
      latitude: r.latitude || null,
      longitude: r.longitude || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      hours: parseHours(r.working_hours),
      image_primary: r.photo || r.photos?.[0] || null,
      image_gallery: r.photos?.slice(1, 6) || null,
      rating_aggregate: r.rating || null,
      rating_count: r.reviews || r.reviews_count || 0,
      restaurant_data: {
        cuisines: parseCuisines(subtypesArray),
        priceRange: parsePrice(r.price_level, r.range),
        hasFishBoil: subtypesArray.some(t =>
          t.toLowerCase().includes('fish boil') || t.toLowerCase().includes('seafood')
        ),
      },
      status: 'active',
      tier: 'free',
      is_verified: false,
      ghl_contact_id: ghlContactId, // Link to GHL contact
    };

    const { error } = await supabase
      .from('listings')
      .upsert(listing, { onConflict: 'market_id,slug' });

    if (error) {
      console.error(`  ✗ Supabase error: ${error.message}`);
      supabaseErrors++;
    } else {
      console.log(`  ✓ Supabase listing: ${slug}`);
      imported++;
    }

    // Rate limit: small delay to avoid hammering APIs
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n========================================');
  console.log('Import Complete');
  console.log('========================================');
  console.log(`Successfully imported: ${imported}`);
  console.log(`Skipped (no name): ${skipped}`);
  console.log(`GHL errors: ${ghlErrors}`);
  console.log(`Supabase errors: ${supabaseErrors}`);
}

// Get file path from command line args
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npx tsx scripts/import-restaurants.ts <path-to-json>');
  process.exit(1);
}

importRestaurants(filePath).catch(console.error);
