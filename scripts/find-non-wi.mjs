#!/usr/bin/env node
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function findNonWI() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=id,name,city,state&limit=1000`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  const listings = await response.json();

  // Valid Door County cities/areas
  const validCities = [
    'sturgeon bay', 'egg harbor', 'fish creek', 'ephraim', 'sister bay',
    'ellison bay', 'baileys harbor', 'washington island', 'jacksonport',
    'gills rock', 'forestville', 'brussels', 'algoma', 'door county',
    'carlsville', 'institute', 'juddville', 'northport', 'rowleys bay',
    'liberty grove', 'sevastopol', 'gibraltar'
  ];

  const badListings = listings.filter(l => {
    // If state is explicitly not WI
    if (l.state && l.state !== 'WI') return true;

    // If city doesn't match Door County area
    if (l.city) {
      const normalizedCity = l.city.toLowerCase().trim();
      const isValid = validCities.some(vc => normalizedCity.includes(vc) || vc.includes(normalizedCity));
      if (!isValid) return true;
    }

    return false;
  });

  console.log(`Total listings: ${listings.length}`);
  console.log(`Non-Door County listings: ${badListings.length}\n`);

  if (badListings.length > 0) {
    console.log('Listings to remove:');
    for (const l of badListings) {
      console.log(`- ${l.name} | ${l.city}, ${l.state} | ID: ${l.id}`);
    }
  }

  return badListings;
}

findNonWI().catch(console.error);
