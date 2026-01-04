// src/pages/api/webhooks/supabase.ts
// Webhook endpoint for Supabase database changes
// Syncs listing deletions/updates to GHL

import type { APIRoute } from 'astro';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

async function tagGHLContact(contactId: string, tags: string[]): Promise<void> {
  const apiToken = import.meta.env.GHL_API_TOKEN;

  await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
    body: JSON.stringify({ tags }),
  });
}

async function removeGHLContactTags(contactId: string, tagsToRemove: string[]): Promise<void> {
  const apiToken = import.meta.env.GHL_API_TOKEN;

  // First, get the contact's current tags
  const getResponse = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Version': '2021-07-28',
    },
  });

  if (!getResponse.ok) {
    console.error('Failed to fetch contact for tag removal');
    return;
  }

  const contactData = await getResponse.json();
  const currentTags: string[] = contactData.contact?.tags || [];

  // Filter out the tags we want to remove
  const newTags = currentTags.filter(tag => !tagsToRemove.includes(tag));

  // Update the contact with the filtered tags
  await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
    body: JSON.stringify({ tags: newTags }),
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = import.meta.env.SUPABASE_WEBHOOK_SECRET;
    const authHeader = request.headers.get('authorization');

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload: SupabaseWebhookPayload = await request.json();

    // Only handle listings table
    if (payload.table !== 'listings') {
      return new Response(JSON.stringify({ success: true, message: 'Ignored - not listings table' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const record = payload.record || payload.old_record;
    const ghlContactId = record?.ghl_contact_id as string | undefined;

    if (!ghlContactId) {
      return new Response(JSON.stringify({ success: true, message: 'No GHL contact linked' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    switch (payload.type) {
      case 'DELETE':
        // When listing is deleted, just remove active-listing tag
        await removeGHLContactTags(ghlContactId, ['active-listing']);
        console.log(`Removed active-listing from GHL contact ${ghlContactId}`);
        break;

      case 'UPDATE':
        const oldStatus = payload.old_record?.status;
        const newStatus = payload.record?.status;
        const oldGhlId = payload.old_record?.ghl_contact_id as string | undefined;
        const newGhlId = payload.record?.ghl_contact_id as string | undefined;

        // When ghl_contact_id is first linked to an active listing
        if (!oldGhlId && newGhlId && newStatus === 'active') {
          await tagGHLContact(newGhlId, ['active-listing']);
          console.log(`Tagged GHL contact ${newGhlId} as active-listing (newly linked)`);
        }
        // Status changed to inactive - just remove active-listing
        else if (oldStatus === 'active' && newStatus !== 'active') {
          await removeGHLContactTags(ghlContactId, ['active-listing']);
          console.log(`Removed active-listing from GHL contact ${ghlContactId}`);
        }
        // Status changed to active - add active-listing
        else if (oldStatus !== 'active' && newStatus === 'active') {
          await tagGHLContact(ghlContactId, ['active-listing']);
          console.log(`Tagged GHL contact ${ghlContactId} as active-listing`);
        }
        break;

      case 'INSERT':
        // New listing created with active status
        if (payload.record?.status === 'active') {
          await tagGHLContact(ghlContactId, ['active-listing']);
          console.log(`Tagged GHL contact ${ghlContactId} as active-listing (new listing)`);
        }
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Supabase webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
