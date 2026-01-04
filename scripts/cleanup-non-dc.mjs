#!/usr/bin/env node
/**
 * Remove non-Door County listings from Supabase and GHL
 * Run with: node scripts/cleanup-non-dc.mjs [--dry-run]
 */
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_API_TOKEN = process.env.GHL_API_TOKEN;

const DRY_RUN = process.argv.includes('--dry-run');

// Valid Door County cities/areas (lowercase)
const VALID_CITIES = [
  'sturgeon bay', 'egg harbor', 'fish creek', 'ephraim', 'sister bay',
  'ellison bay', 'baileys harbor', 'washington island', 'jacksonport',
  'gills rock', 'forestville', 'brussels', 'algoma', 'door county',
  'carlsville', 'institute', 'juddville', 'northport', 'rowleys bay',
  'liberty grove', 'sevastopol', 'gibraltar', 'maplewood', 'valmy'
];

function isValidDoorCountyCity(city) {
  if (!city) return false;
  const normalizedCity = city.toLowerCase().trim();
  return VALID_CITIES.some(vc => normalizedCity.includes(vc) || vc.includes(normalizedCity));
}

async function findBadListings() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=id,name,city,state,ghl_contact_id&limit=1000`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  const listings = await response.json();

  return listings.filter(l => {
    // If state is explicitly not WI, it's bad
    if (l.state && l.state !== 'WI') return true;

    // If city doesn't match Door County area, it's bad
    if (!isValidDoorCountyCity(l.city)) return true;

    return false;
  });
}

async function deleteGHLContact(contactId) {
  if (!contactId) return;

  const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28',
    },
  });

  if (!response.ok && response.status !== 404) {
    console.log(`  Warning: GHL delete failed (${response.status})`);
  }
}

async function deleteSupabaseListing(id) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase delete failed: ${response.status}`);
  }
}

async function main() {
  console.log('=== Cleanup Non-Door County Listings ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  const badListings = await findBadListings();

  console.log(`Found ${badListings.length} non-Door County listings to remove:\n`);

  let deleted = 0;
  let failed = 0;

  for (const listing of badListings) {
    console.log(`- ${listing.name} | ${listing.city}, ${listing.state}`);

    if (DRY_RUN) {
      console.log('  [DRY RUN] Would delete from Supabase and GHL');
      deleted++;
      continue;
    }

    try {
      // Delete from GHL first
      if (listing.ghl_contact_id) {
        await deleteGHLContact(listing.ghl_contact_id);
        console.log(`  Deleted GHL contact: ${listing.ghl_contact_id}`);
      }

      // Then delete from Supabase
      await deleteSupabaseListing(listing.id);
      console.log(`  Deleted Supabase listing: ${listing.id}`);

      deleted++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Deleted: ${deleted}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${badListings.length}`);
}

main().catch(console.error);
