// Sync tags: Add active-listing to all linked active listings, remove old redundant tags
// Run with: node scripts/sync-tags.mjs

const SUPABASE_URL = 'https://taeckxnjesfrmynzjnht.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZWNreG5qZXNmcm15bnpqbmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjgzNjUsImV4cCI6MjA4MzA0NDM2NX0.R8E2PZYqu3rhr5Ke8m9obu1M4nsnBwCaFj-5T0yZKfE';
const GHL_API_TOKEN = 'pit-ccfc2ac8-6e3e-42e7-bfe3-82f4471d2d22';
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Tags to remove (redundant)
const TAGS_TO_REMOVE = ['listing-inactive', 'listing-removed', 'sync-deleted', 'unclaimed', 'imported-listing'];

async function getContact(contactId) {
  const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    headers: {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28',
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.contact;
}

async function updateContactTags(contactId, newTags) {
  const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
    body: JSON.stringify({ tags: newTags }),
  });
  return response.ok;
}

async function main() {
  // Get all active listings with ghl_contact_id
  console.log('Fetching active listings with GHL contacts...\n');
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?select=name,ghl_contact_id&status=eq.active&ghl_contact_id=not.is.null`,
    { headers: { 'apikey': SUPABASE_ANON_KEY } }
  );

  const listings = await response.json();
  console.log(`Found ${listings.length} active listings with GHL contacts\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const listing of listings) {
    const contact = await getContact(listing.ghl_contact_id);
    if (!contact) {
      console.log(`✗ ${listing.name} - contact not found`);
      failed++;
      continue;
    }

    const currentTags = contact.tags || [];

    // Remove redundant tags, add active-listing if missing
    let newTags = currentTags.filter(tag => !TAGS_TO_REMOVE.includes(tag));

    if (!newTags.includes('active-listing')) {
      newTags.push('active-listing');
    }

    // Check if anything changed
    const tagsChanged = newTags.length !== currentTags.length ||
      !newTags.every(t => currentTags.includes(t));

    if (tagsChanged) {
      const success = await updateContactTags(listing.ghl_contact_id, newTags);
      if (success) {
        const removed = currentTags.filter(t => TAGS_TO_REMOVE.includes(t));
        const added = !currentTags.includes('active-listing') ? ['active-listing'] : [];
        console.log(`✓ ${listing.name}${removed.length ? ` (-${removed.join(', ')})` : ''}${added.length ? ` (+${added.join(', ')})` : ''}`);
        updated++;
      } else {
        console.log(`✗ ${listing.name} - update failed`);
        failed++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already correct, ${failed} failed`);
}

main().catch(console.error);
