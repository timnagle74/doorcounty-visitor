import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================================================
// Type Definitions
// =============================================================================

export interface Market {
  id: string;
  slug: string;
  name: string;
  state: string;
  domain: string | null;
  tagline: string | null;
  description: string | null;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  is_active: boolean;
  ghl_location_id: string | null;
}

export interface Community {
  id: string;
  market_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  highlights: string[] | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
  is_featured: boolean;
}

export interface Listing {
  id: string;
  market_id: string;
  community_id: string | null;
  slug: string;
  name: string;
  type: string;
  subcategories: string[] | null;
  description_short: string | null;
  description_full: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: Record<string, string> | null;
  hours_notes: string | null;
  image_primary: string | null;
  image_gallery: string[] | null;
  logo_url: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_tripadvisor: string | null;
  social_yelp: string | null;
  rating_aggregate: number | null;
  rating_count: number;
  restaurant_data: RestaurantData | null;
  lodging_data: LodgingData | null;
  activity_data: ActivityData | null;
  status: 'active' | 'pending' | 'inactive' | 'removed';
  tier: 'free' | 'verified' | 'featured' | 'pro' | 'premium';
  is_verified: boolean;
  ghl_contact_id: string | null;
}

export interface RestaurantData {
  cuisines?: string[];
  priceRange?: string;
  acceptsReservations?: boolean;
  reservationUrl?: string;
  menuUrl?: string;
  hasFishBoil?: boolean;
  dietaryOptions?: string[];
}

export interface LodgingData {
  roomCount?: number;
  priceRange?: string;
  amenities?: string[];
  checkinTime?: string;
  checkoutTime?: string;
  petsAllowed?: boolean;
}

export interface ActivityData {
  duration?: string;
  difficulty?: string;
  equipment?: string[];
  seasonality?: string[];
}

// =============================================================================
// Data Fetching Functions
// =============================================================================

/**
 * Get market by slug
 */
export async function getMarket(slug: string): Promise<Market | null> {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching market:', error);
    return null;
  }
  return data;
}

/**
 * Get all communities for a market
 */
export async function getCommunities(marketSlug: string): Promise<Community[]> {
  const market = await getMarket(marketSlug);
  if (!market) return [];

  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('market_id', market.id)
    .order('sort_order');

  if (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
  return data || [];
}

/**
 * Get a single community by slug
 */
export async function getCommunity(marketSlug: string, communitySlug: string): Promise<Community | null> {
  const market = await getMarket(marketSlug);
  if (!market) return null;

  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('market_id', market.id)
    .eq('slug', communitySlug)
    .single();

  if (error) {
    console.error('Error fetching community:', error);
    return null;
  }
  return data;
}

/**
 * Get all active listings for a market
 */
export async function getListings(marketSlug: string, options?: {
  type?: string;
  types?: string[];
  community?: string;
  tier?: string;
  limit?: number;
}): Promise<Listing[]> {
  const market = await getMarket(marketSlug);
  if (!market) return [];

  let query = supabase
    .from('listings')
    .select('*')
    .eq('market_id', market.id)
    .eq('status', 'active');

  // Filter by single type
  if (options?.type) {
    query = query.eq('type', options.type);
  }

  // Filter by multiple types
  if (options?.types && options.types.length > 0) {
    query = query.in('type', options.types);
  }

  // Filter by community slug
  if (options?.community) {
    const community = await getCommunity(marketSlug, options.community);
    if (community) {
      query = query.eq('community_id', community.id);
    }
  }

  // Filter by tier
  if (options?.tier) {
    query = query.eq('tier', options.tier);
  }

  // Limit results
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  // Order: featured first, then by name
  query = query.order('tier', { ascending: true }).order('name');

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
  return data || [];
}

/**
 * Get a single listing by slug (only active listings shown to public)
 */
export async function getListing(marketSlug: string, listingSlug: string): Promise<Listing | null> {
  const market = await getMarket(marketSlug);
  if (!market) return null;

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('market_id', market.id)
    .eq('slug', listingSlug)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching listing:', error);
    return null;
  }
  return data;
}

/**
 * Get featured listings for homepage
 */
export async function getFeaturedListings(marketSlug: string, limit = 6): Promise<Listing[]> {
  return getListings(marketSlug, { tier: 'featured', limit });
}

/**
 * Search listings
 */
export async function searchListings(marketSlug: string, query: string): Promise<Listing[]> {
  const market = await getMarket(marketSlug);
  if (!market) return [];

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('market_id', market.id)
    .eq('status', 'active')
    .or(`name.ilike.%${query}%,description_short.ilike.%${query}%,city.ilike.%${query}%`)
    .order('tier')
    .limit(20);

  if (error) {
    console.error('Error searching listings:', error);
    return [];
  }
  return data || [];
}
