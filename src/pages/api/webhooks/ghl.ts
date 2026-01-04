// src/pages/api/webhooks/ghl.ts
// Webhook endpoint for GHL contact changes
// Syncs contact deletions/tag changes to Supabase

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

interface GHLWebhookPayload {
  type?: string;
  locationId?: string;
  id?: string; // contact ID (flat format)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  // Nested format from workflow webhooks
  contact?: {
    id: string;
    tags?: string[];
    firstName?: string;
    [key: string]: unknown;
  };
  // Other fields may be present
  [key: string]: unknown;
}

function getSupabaseAdmin() {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Look up contact ID by email from GHL API
 */
async function lookupContactIdByEmail(email: string): Promise<string | null> {
  const apiToken = import.meta.env.GHL_API_TOKEN;
  const locationId = import.meta.env.GHL_LOCATION_ID;

  if (!apiToken || !locationId) {
    console.error('GHL credentials not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${GHL_API_BASE}/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Version': '2021-07-28',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to lookup contact by email ${email}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.contact?.id || null;
  } catch (error) {
    console.error('Error looking up contact by email:', error);
    return null;
  }
}

/**
 * Fetch current contact tags from GHL API
 * This ensures we always have the latest state
 */
async function fetchGHLContactTags(contactId: string): Promise<string[]> {
  const apiToken = import.meta.env.GHL_API_TOKEN;

  if (!apiToken) {
    console.error('GHL_API_TOKEN not configured');
    return [];
  }

  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Version': '2021-07-28',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch GHL contact ${contactId}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.contact?.tags || [];
  } catch (error) {
    console.error('Error fetching GHL contact:', error);
    return [];
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // GHL sends webhooks with specific headers - verify if needed
    const payload: GHLWebhookPayload = await request.json();

    // Log the full payload to understand the structure
    console.log('GHL webhook received - full payload:', JSON.stringify(payload, null, 2));

    // Handle multiple GHL payload formats - they vary by trigger type
    // GHL uses different field names depending on the trigger/action
    const p = payload as Record<string, unknown>;
    let contactId = payload.contact?.id
      || payload.id
      || p['contact_id']
      || p['contactId']
      || p['Contact Id']
      || p['contact Id'];

    // Debug: log all keys in the payload to help identify the correct field
    const payloadKeys = Object.keys(payload);
    console.log('GHL webhook - all payload keys:', payloadKeys);
    console.log('GHL webhook - full payload:', JSON.stringify(payload, null, 2));

    // If no contact ID but we have email, look up the contact in GHL by email
    const email = payload.email || p['email'] as string;
    if (!contactId && email) {
      console.log('No contact ID, but found email:', email, '- looking up contact');
      contactId = await lookupContactIdByEmail(email);
    }

    if (!contactId) {
      console.log('No contact ID found in payload. Keys received:', payloadKeys);
      return new Response(JSON.stringify({
        success: true,
        message: 'No contact ID in payload',
        keys: payloadKeys.join(', ')
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch current tags from GHL API (source of truth)
    // This ensures we always have the latest state, not stale webhook data
    const tags = await fetchGHLContactTags(contactId as string);

    console.log('Extracted contactId:', contactId, 'tags:', tags);

    const supabase = getSupabaseAdmin();

    // Find the listing linked to this GHL contact
    const { data: listing, error: findError } = await supabase
      .from('listings')
      .select('id, name, status, tier, is_verified')
      .eq('ghl_contact_id', contactId)
      .single();

    if (findError || !listing) {
      console.log(`No listing found for GHL contact ${contactId}`);
      return new Response(JSON.stringify({ success: true, message: 'No linked listing found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updates: Record<string, unknown> = {};
    const changes: string[] = [];

    // active-listing tag controls visibility
    if (tags.includes('active-listing')) {
      if (listing.status !== 'active') {
        updates.status = 'active';
        changes.push('status → active');
      }
    } else {
      // No active-listing tag = inactive
      if (listing.status === 'active') {
        updates.status = 'inactive';
        changes.push('status → inactive');
      }
    }

    // claimed tag controls is_verified
    if (tags.includes('claimed')) {
      updates.is_verified = true;
      changes.push('is_verified → true');
    }

    // premium tag controls tier
    if (tags.includes('premium')) {
      updates.tier = 'premium';
      changes.push('tier → premium');
    } else if (tags.includes('claimed') && !tags.includes('premium')) {
      // Claimed but not premium = free tier
      if (listing.tier !== 'free') {
        updates.tier = 'free';
        changes.push('tier → free');
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', listing.id);

      if (updateError) {
        console.error('Failed to update listing:', updateError);
      } else {
        console.log(`Listing ${listing.name} updated: ${changes.join(', ')}`);
      }
    }

    // Handle contact deletion event
    if (payload.type === 'ContactDelete' || payload.type === 'contact.delete') {
      // GHL contact was deleted - mark listing as removed
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          status: 'removed',
          ghl_contact_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', listing.id);

      if (updateError) {
        console.error('Failed to handle contact deletion:', updateError);
      } else {
        console.log(`Listing ${listing.name} marked as removed (GHL contact deleted)`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GHL webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
