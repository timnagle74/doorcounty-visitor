// Quick test script to verify Supabase connection
// Run with: npx tsx scripts/test-supabase.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Supabase connection...\n');

  // Test 1: Markets
  const { data: markets, error: marketsError } = await supabase
    .from('markets')
    .select('*');

  if (marketsError) {
    console.error('❌ Markets error:', marketsError.message);
  } else {
    console.log(`✅ Markets: ${markets?.length || 0} found`);
    markets?.forEach(m => console.log(`   - ${m.name} (${m.slug})`));
  }

  // Test 2: Communities
  const { data: communities, error: communitiesError } = await supabase
    .from('communities')
    .select('*')
    .order('sort_order');

  if (communitiesError) {
    console.error('❌ Communities error:', communitiesError.message);
  } else {
    console.log(`\n✅ Communities: ${communities?.length || 0} found`);
    communities?.forEach(c => console.log(`   - ${c.name}`));
  }

  // Test 3: Categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  if (categoriesError) {
    console.error('❌ Categories error:', categoriesError.message);
  } else {
    console.log(`\n✅ Categories: ${categories?.length || 0} found`);
    categories?.forEach(c => console.log(`   - ${c.slug}: ${c.name}`));
  }

  // Test 4: Listings (should be empty for now)
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('*');

  if (listingsError) {
    console.error('❌ Listings error:', listingsError.message);
  } else {
    console.log(`\n✅ Listings: ${listings?.length || 0} found`);
  }

  console.log('\n✅ Supabase connection successful!');
}

test().catch(console.error);
