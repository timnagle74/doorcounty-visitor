// Simple script to link GHL contacts to Supabase listings
// Run with: node scripts/link-ghl-simple.mjs

const SUPABASE_URL = 'https://taeckxnjesfrmynzjnht.supabase.co';
// Use service role key for update permissions
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZWNreG5qZXNmcm15bnpqbmh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ2ODM2NSwiZXhwIjoyMDgzMDQ0MzY1fQ.vrwxYPSI_gKJ3pQgjlxwrWpHkXTlvR6U0Um4yFh5vAQ';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZWNreG5qZXNmcm15bnpqbmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjgzNjUsImV4cCI6MjA4MzA0NDM2NX0.R8E2PZYqu3rhr5Ke8m9obu1M4nsnBwCaFj-5T0yZKfE';
const GHL_API_TOKEN = 'pit-ccfc2ac8-6e3e-42e7-bfe3-82f4471d2d22';
const GHL_LOCATION_ID = 'a1pjpfTVaYjMD8QJgINa';

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
