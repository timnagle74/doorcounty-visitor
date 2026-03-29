// Simple script to link GHL contacts to Supabase listings
// Run with: node scripts/link-ghl-simple.mjs

// Requires: SUPABASE_URL, SUPABASE_KEY, GHL_API_TOKEN, GHL_LOCATION_ID environment variables
// Use service role key for update permissions (SUPABASE_KEY)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GHL_API_TOKEN = process.env.GHL_API_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !GHL_API_TOKEN || !GHL_LOCATION_ID) {
  console.error('Error: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GHL_API_TOKEN, and GHL_LOCATION_ID env vars are required');
  process.exit(1);
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  // Fetch GHL contacts
  console.log('Fetching GHL contacts...');
  const ghlResponse = await fetch(
    `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=100`,
    {
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Version': '2021-07-28',
      },
    }
  );

  if (!ghlResponse.ok) {
    console.error('GHL API error:', await ghlResponse.text());
    return;
  }

  const ghlData = await ghlResponse.json();
  const ghlContacts = ghlData.contacts || [];
  console.log(`Found ${ghlContacts.length} GHL contacts`);

  // Fetch Supabase listings
  console.log('Fetching Supabase listings...');
  const supabaseResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?select=id,name,ghl_contact_id`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    }
  );

  const listings = await supabaseResponse.json();
  console.log(`Found ${listings.length} Supabase listings`);

  // Build GHL map by normalized name
  const ghlMap = new Map();
  for (const contact of ghlContacts) {
    const name = contact.firstNameRaw || contact.firstName;
    if (name) {
      ghlMap.set(normalizeName(name), contact);
    }
  }

  console.log('\nMatching and updating...\n');

  let matched = 0;
  let unmatched = 0;

  for (const listing of listings) {
    if (listing.ghl_contact_id) continue;

    const normalizedName = normalizeName(listing.name);
    const ghlContact = ghlMap.get(normalizedName);

    if (ghlContact) {
      // Update Supabase
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/listings?id=eq.${listing.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ ghl_contact_id: ghlContact.id }),
        }
      );

      if (updateResponse.ok) {
        console.log(`✓ ${listing.name} → ${ghlContact.id}`);
        matched++;
      } else {
        console.log(`✗ Failed: ${listing.name}`);
      }
    } else {
      unmatched++;
    }
  }

  console.log(`\nMatched: ${matched}, Unmatched: ${unmatched}`);
}

main().catch(console.error);
