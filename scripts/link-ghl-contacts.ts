// Script to link GHL contacts to Supabase listings by matching names
// Run with: npx tsx scripts/link-ghl-contacts.ts

// Requires: SUPABASE_URL, SUPABASE_KEY, GHL_API_TOKEN, GHL_LOCATION_ID environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const GHL_API_TOKEN = process.env.GHL_API_TOKEN!;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!;

if (!SUPABASE_URL || !SUPABASE_KEY || !GHL_API_TOKEN || !GHL_LOCATION_ID) {
  console.error('Error: SUPABASE_URL, SUPABASE_KEY, GHL_API_TOKEN, and GHL_LOCATION_ID env vars are required');
  process.exit(1);
}

interface GHLContact {
  id: string;
  firstName: string;
  firstNameRaw: string;
}

interface SupabaseListing {
  id: string;
  name: string;
  ghl_contact_id: string | null;
}

// Normalize name for comparison
function normalizeName(name: string): string {
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

async function fetchAllGHLContacts(): Promise<GHLContact[]> {
  const allContacts: GHLContact[] = [];
  let hasMore = true;
  let startAfterId: string | undefined;

  while (hasMore) {
    const url = new URL('https://services.leadconnectorhq.com/contacts/');
    url.searchParams.set('locationId', GHL_LOCATION_ID);
    url.searchParams.set('limit', '100');
    if (startAfterId) {
      url.searchParams.set('startAfterId', startAfterId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Version': '2021-07-28',
      },
    });

    const data = await response.json();
    const contacts = data.contacts || [];
    allContacts.push(...contacts);

    if (contacts.length < 100) {
      hasMore = false;
    } else {
      startAfterId = contacts[contacts.length - 1].id;
    }
  }

  return allContacts;
}

async function fetchSupabaseListings(): Promise<SupabaseListing[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?select=id,name,ghl_contact_id`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
      },
    }
  );
  return response.json();
}

async function updateListingWithGHLId(listingId: string, ghlContactId: string): Promise<boolean> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ ghl_contact_id: ghlContactId }),
    }
  );
  return response.ok;
}

async function main() {
  console.log('Fetching GHL contacts...');
  const ghlContacts = await fetchAllGHLContacts();
  console.log(`Found ${ghlContacts.length} GHL contacts`);

  console.log('\nFetching Supabase listings...');
  const listings = await fetchSupabaseListings();
  console.log(`Found ${listings.length} Supabase listings`);

  // Build a map of normalized names to GHL contacts
  const ghlMap = new Map<string, GHLContact>();
  for (const contact of ghlContacts) {
    const name = contact.firstNameRaw || contact.firstName;
    if (name) {
      const normalized = normalizeName(name);
      ghlMap.set(normalized, contact);
    }
  }

  console.log('\nMatching listings to GHL contacts...\n');

  let matched = 0;
  let alreadyLinked = 0;
  let unmatched = 0;

  for (const listing of listings) {
    if (listing.ghl_contact_id) {
      alreadyLinked++;
      continue;
    }

    const normalizedListingName = normalizeName(listing.name);
    const ghlContact = ghlMap.get(normalizedListingName);

    if (ghlContact) {
      const success = await updateListingWithGHLId(listing.id, ghlContact.id);
      if (success) {
        console.log(`✓ Linked: "${listing.name}" → ${ghlContact.id}`);
        matched++;
      } else {
        console.log(`✗ Failed to link: "${listing.name}"`);
        unmatched++;
      }
    } else {
      console.log(`? No match: "${listing.name}"`);
      unmatched++;
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Already linked: ${alreadyLinked}`);
  console.log(`Newly matched: ${matched}`);
  console.log(`Unmatched: ${unmatched}`);
}

main().catch(console.error);
