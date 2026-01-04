#!/usr/bin/env node
/**
 * Test Import - 5 specific items from different files
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_API_TOKEN = process.env.GHL_API_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const MARKET_ID = '5792a2fe-d5f1-47bd-84fb-368d5c2cd20b';

const COMMUNITY_MAP = {
  'sturgeon bay': '1fa70355-174e-4a35-b7fa-b7dd07e6539f',
  'egg harbor': '86e82d90-9fd0-4ddf-bb8c-c13e940cdf51',
  'fish creek': '5045be2e-af7e-4085-8ef1-e5c243a117c6',
  'ephraim': '3196ac84-ffd5-44c3-966d-cbaff9a0942e',
  'sister bay': '41b3b8fa-3cea-4400-862a-38d53fb94699',
  'ellison bay': '099e33dd-ce05-4cce-9484-b9a4f627dbf7',
  'baileys harbor': 'ccee10f0-9014-4888-8794-c47e0c402f87',
  'washington island': 'b620dbd2-35c6-4ebb-b3f0-74f34e5f6a2b',
};

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

function mapToListingType(item) {
  const category = (item.category || '').toLowerCase();
  const subtypes = (item.subtypes || '').toLowerCase();
  if (category.includes('winer') || subtypes.includes('winer')) return 'winery';
  if (category.includes('brew') || subtypes.includes('brew')) return 'brewery';
  if (category.includes('boat')) return 'activity';
  if (category.includes('cafe') || subtypes.includes('cafe')) return 'restaurant';
  if (category.includes('bar') || subtypes.includes('bar')) return 'restaurant';
  return 'restaurant';
}

function extractSubcategories(item) {
  const subtypes = (item.subtypes || '').toLowerCase();
  const cats = [];
  if (subtypes.includes('pizza')) cats.push('pizza');
  if (subtypes.includes('cafe') || subtypes.includes('coffee')) cats.push('cafe');
  if (subtypes.includes('bakery')) cats.push('bakery');
  if (subtypes.includes('bar')) cats.push('bar');
  if (subtypes.includes('seafood')) cats.push('seafood');
  return cats.length > 0 ? cats : null;
}

function parseHours(wh) {
  if (!wh || typeof wh !== 'object') return null;
  const hours = {};
  const dayMap = {
    Monday: 'monday',
    Tuesday: 'tuesday',
    Wednesday: 'wednesday',
    Thursday: 'thursday',
    Friday: 'friday',
    Saturday: 'saturday',
    Sunday: 'sunday',
  };
  for (const [day, value] of Object.entries(wh)) {
    const key = dayMap[day];
    if (key && value) hours[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  return Object.keys(hours).length > 0 ? hours : null;
}

// Specific items to import (5 from different files)
const targetNames = [
  'Bridge Up Brewing Company',
  'Anchored Roots Vineyard & Winery',
  'Sister Bay Boat Rental',
  'Harbor Fish Market & Grille',
  'The Gnoshery',
];

async function main() {
  const scrapedDir = path.join(process.cwd(), 'scrapedData');
  const files = fs.readdirSync(scrapedDir).filter((f) => f.endsWith('.json'));

  const items = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(scrapedDir, file), 'utf8'));
    for (const item of data) {
      if (targetNames.includes(item.name)) {
        items.push(item);
      }
    }
  }

  console.log('Found', items.length, 'items to import\n');

  for (const item of items) {
    const name = item.name;
    const email = item.email || generateSlug(name) + '@placeholder.doorcountyvisitor.com';
    const city = item.city || 'Door County';
    const citySlug = generateSlug(city);
    const type = mapToListingType(item);
    const tags = ['lead', 'active-listing', type, citySlug];
    const subcats = extractSubcategories(item);
    if (subcats) tags.push(...subcats.filter((s) => !tags.includes(s)));

    console.log('Creating:', name);
    console.log('  Tags:', tags.join(', '));

    // Create GHL contact
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
      locationId: GHL_LOCATION_ID,
    };

    const ghlRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GHL_API_TOKEN}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    if (!ghlRes.ok) {
      console.log('  GHL Error:', await ghlRes.text());
      continue;
    }

    const ghlContact = (await ghlRes.json()).contact;
    console.log('  GHL ID:', ghlContact.id);

    // Create Supabase listing
    const slug = generateSlug(name);
    const normalizedCity = city.toLowerCase().trim();
    const communityId = COMMUNITY_MAP[normalizedCity] || null;

    const listingData = {
      market_id: MARKET_ID,
      community_id: communityId,
      slug: slug,
      name: name,
      type: type,
      subcategories: extractSubcategories(item),
      description_short: item.website_description || null,
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
      restaurant_data:
        type === 'restaurant'
          ? { cuisines: [], priceRange: item.range || null, hasFishBoil: false }
          : null,
      status: 'active',
      tier: 'free',
      is_verified: false,
      ghl_contact_id: ghlContact.id,
    };

    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(listingData),
    });

    if (!sbRes.ok) {
      console.log('  Supabase Error:', await sbRes.text());
      continue;
    }

    console.log('  ✓ Done\n');
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('=== Complete ===');
}

main().catch(console.error);
