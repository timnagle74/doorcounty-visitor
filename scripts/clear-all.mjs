#!/usr/bin/env node
/**
 * Clear all data from GHL contacts and Supabase listings
 * Usage: node scripts/clear-all.mjs
 */

import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_API_TOKEN = process.env.GHL_API_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

async function fetchAllGHLContacts() {
  console.log('Fetching all GHL contacts...');
  let allContacts = [];
  let startAfterId = null;
  let hasMore = true;

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
        'Version': '2021-07-28'
      }
    });

    const data = await response.json();

    if (data.contacts && data.contacts.length > 0) {
      allContacts = allContacts.concat(data.contacts);
      console.log(`  Fetched ${allContacts.length} contacts so far...`);

      // Use the last contact's ID for pagination
      const lastContact = data.contacts[data.contacts.length - 1];
      startAfterId = lastContact.id;

      if (data.contacts.length < 100) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`Total GHL contacts found: ${allContacts.length}`);
  return allContacts;
}

async function deleteGHLContact(contactId) {
  const url = `https://services.leadconnectorhq.com/contacts/${contactId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to delete contact ${contactId}: ${response.status} ${text}`);
  }

  return true;
}

async function deleteAllGHLContacts() {
  const contacts = await fetchAllGHLContacts();

  if (contacts.length === 0) {
    console.log('No GHL contacts to delete.');
    return;
  }

  console.log(`\nDeleting ${contacts.length} GHL contacts...`);

  let deleted = 0;
  let failed = 0;

  for (const contact of contacts) {
    try {
      await deleteGHLContact(contact.id);
      deleted++;
      if (deleted % 10 === 0) {
        console.log(`  Deleted ${deleted}/${contacts.length} contacts...`);
      }
    } catch (error) {
      console.error(`  Failed to delete ${contact.id}: ${error.message}`);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nGHL contacts deleted: ${deleted}, failed: ${failed}`);
}

async function deleteAllSupabaseListings() {
  console.log('\nFetching Supabase listings...');

  // First, get all listing IDs
  const listResponse = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=id`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });

  const listings = await listResponse.json();
  console.log(`Found ${listings.length} Supabase listings.`);

  if (listings.length === 0) {
    console.log('No Supabase listings to delete.');
    return;
  }

  console.log(`Deleting ${listings.length} Supabase listings...`);

  // Delete all listings using a single query
  const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    }
  });

  if (deleteResponse.ok) {
    console.log(`Successfully deleted all Supabase listings.`);
  } else {
    const text = await deleteResponse.text();
    console.error(`Failed to delete Supabase listings: ${deleteResponse.status} ${text}`);
  }
}

async function main() {
  console.log('=== Clearing All Data ===\n');

  // Delete GHL contacts first
  await deleteAllGHLContacts();

  // Then delete Supabase listings
  await deleteAllSupabaseListings();

  console.log('\n=== Done ===');
}

main().catch(console.error);
