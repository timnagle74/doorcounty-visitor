#!/usr/bin/env node
/**
 * Add region column and update Algoma listings
 * Note: The column must first be added via Supabase Dashboard SQL Editor
 * This script then updates the Algoma listings to 'nearby'
 *
 * Run with: node scripts/add-region-column.mjs
 */
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Nearby cities to update
const NEARBY_CITIES = ['algoma', 'kewaunee', 'green bay', 'de pere'];

async function main() {
  console.log('=== Update Region for Nearby Cities ===\n');

  for (const city of NEARBY_CITIES) {
    // Find listings with this city
    const searchResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?city=ilike.%25${city}%25&select=id,name,city,region`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const listings = await searchResponse.json();

    if (listings.length === 0) {
      console.log(`${city}: No listings found`);
      continue;
    }

    console.log(`${city}: Found ${listings.length} listings`);

    // Update each listing to region = 'nearby'
    for (const listing of listings) {
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/listings?id=eq.${listing.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ region: 'nearby' }),
        }
      );

      if (updateResponse.ok) {
        console.log(`  ✓ Updated: ${listing.name}`);
      } else {
        const error = await updateResponse.text();
        console.log(`  ✗ Failed: ${listing.name} - ${error}`);
      }
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
