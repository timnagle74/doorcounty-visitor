/**
 * GHL Tag Sync
 * 
 * Syncs tags between Supabase and GoHighLevel
 * Creates matching tags in GHL and keeps them in sync
 * 
 * Usage: node scripts/ghl-tag-sync.mjs
 */

import { createClient } from '@supabase/supabase-js';

// GHL API
const GHL_API_URL = 'https://services.leadconnectorhq.com';
const GHL_API_TOKEN = process.env.GHL_API_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GHL_API_TOKEN || !GHL_LOCATION_ID) {
  console.error('❌ Missing GHL_API_TOKEN or GHL_LOCATION_ID');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// GHL API helper
async function ghlFetch(endpoint, options = {}) {
  const response = await fetch(`${GHL_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Get all tags from GHL
async function getGHLTags() {
  const response = await ghlFetch(`/locations/${GHL_LOCATION_ID}/tags`);
  return response.tags || [];
}

// Create a tag in GHL
async function createGHLTag(name) {
  const response = await ghlFetch(`/locations/${GHL_LOCATION_ID}/tags`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return response.tag;
}

// Main sync function
async function syncTags() {
  console.log('🔄 Starting GHL tag sync...\n');
  
  // Get Supabase tags
  const { data: supabaseTags, error } = await supabase
    .from('tags')
    .select('*');
  
  if (error) {
    console.error('❌ Error fetching Supabase tags:', error.message);
    process.exit(1);
  }
  
  console.log(`📊 Supabase tags: ${supabaseTags.length}`);
  
  // Get GHL tags
  const ghlTags = await getGHLTags();
  console.log(`📊 GHL tags: ${ghlTags.length}`);
  
  // Create a map of GHL tags by name
  const ghlTagMap = {};
  ghlTags.forEach(t => { ghlTagMap[t.name.toLowerCase()] = t; });
  
  // Sync each Supabase tag to GHL
  let created = 0;
  let linked = 0;
  
  for (const tag of supabaseTags) {
    // Create tag name for GHL (with category prefix for organization)
    const ghlTagName = `DCV: ${tag.category} - ${tag.name}`;
    const lookupName = ghlTagName.toLowerCase();
    
    let ghlTag = ghlTagMap[lookupName];
    
    if (!ghlTag) {
      // Create in GHL
      console.log(`  ✚ Creating GHL tag: ${ghlTagName}`);
      ghlTag = await createGHLTag(ghlTagName);
      created++;
    }
    
    // Update Supabase with GHL tag ID
    if (tag.ghl_tag_id !== ghlTag.id) {
      await supabase
        .from('tags')
        .update({ ghl_tag_id: ghlTag.id })
        .eq('id', tag.id);
      linked++;
    }
  }
  
  console.log('\n✅ Sync complete!');
  console.log(`   Created in GHL: ${created}`);
  console.log(`   Linked: ${linked}`);
}

// Sync contacts with tags
async function syncContactTags(listingId) {
  // Get listing with GHL contact ID
  const { data: listing } = await supabase
    .from('listings')
    .select('*, listing_tags(tag_id, tags(ghl_tag_id))')
    .eq('id', listingId)
    .single();
  
  if (!listing?.ghl_contact_id) {
    console.log('No GHL contact ID for listing');
    return;
  }
  
  // Get GHL tag IDs
  const ghlTagIds = listing.listing_tags
    .map(lt => lt.tags?.ghl_tag_id)
    .filter(Boolean);
  
  if (ghlTagIds.length === 0) {
    console.log('No tags to sync');
    return;
  }
  
  // Update contact tags in GHL
  await ghlFetch(`/contacts/${listing.ghl_contact_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      tags: ghlTagIds,
    }),
  });
  
  console.log(`✅ Synced ${ghlTagIds.length} tags to GHL contact`);
}

// Export for use in other scripts
export { syncTags, syncContactTags, getGHLTags, createGHLTag };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncTags().catch(console.error);
}
