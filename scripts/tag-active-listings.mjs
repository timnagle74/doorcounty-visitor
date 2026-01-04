// One-time script to add 'active-listing' tag to all GHL contacts linked to active Supabase listings
// Run with: node scripts/tag-active-listings.mjs

const SUPABASE_URL = 'https://taeckxnjesfrmynzjnht.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZWNreG5qZXNmcm15bnpqbmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjgzNjUsImV4cCI6MjA4MzA0NDM2NX0.R8E2PZYqu3rhr5Ke8m9obu1M4nsnBwCaFj-5T0yZKfE';
const GHL_API_TOKEN = 'pit-ccfc2ac8-6e3e-42e7-bfe3-82f4471d2d22';

async function tagContact(contactId, tags) {
  const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
    body: JSON.stringify({ tags }),
  });
  return response.ok;
}

async function main() {
  // Get all active listings with ghl_contact_id
  console.log('Fetching active listings with GHL contacts...');
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?select=name,ghl_contact_id&status=eq.active&ghl_contact_id=not.is.null`,
    {
      headers: { 'apikey': SUPABASE_ANON_KEY },
    }
  );

  const listings = await response.json();
  console.log(`Found ${listings.length} active listings with GHL contacts\n`);

  let tagged = 0;
  let failed = 0;

  for (const listing of listings) {
    const success = await tagContact(listing.ghl_contact_id, ['active-listing']);
    if (success) {
      console.log(`✓ ${listing.name}`);
      tagged++;
    } else {
      console.log(`✗ ${listing.name}`);
      failed++;
    }
  }

  console.log(`\nDone: ${tagged} tagged, ${failed} failed`);
}

main().catch(console.error);
