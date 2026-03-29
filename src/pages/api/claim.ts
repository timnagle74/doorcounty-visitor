// src/pages/api/claim.ts
// Dedicated API endpoint for business listing claim and new-listing intake

import type { APIRoute } from 'astro';
import { upsertContact, createOpportunity } from '../../lib/ghl';

// GHL field IDs from scripts/custom-fields/field-ids.json
const FIELD_LISTING_STATUS = '5sOxv4tBwlJZK0G7lyUp';
const FIELD_INTAKE_COMPLETED = 'nZOqXdoykXm58vAR32r9';
const FIELD_BUSINESS_TYPE = 'Rv4Ij1S1OSuDSK53kdYR';
const FIELD_DESCRIPTION_SHORT = 'BFdDDHvUWA34Y6ffnl5b';
const FIELD_LISTING_TIER = '308R59T07Eh16lWpQ507';

export const prerender = false;

interface ClaimExistingPayload {
  type: 'claim-existing';
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  jobTitle?: string;
  businessName: string;
  businessSlug: string;
  smsConsent: boolean;
}

interface NewListingPayload {
  type: 'new-listing';
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  jobTitle?: string;
  businessName: string;
  businessType: string;
  city: string;
  address?: string;
  website?: string;
  descriptionShort?: string;
  smsConsent: boolean;
}

type ClaimPayload = ClaimExistingPayload | NewListingPayload;

function validateBase(data: ClaimPayload): string | null {
  if (!data.firstName?.trim()) return 'First name is required';
  if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'A valid email is required';
  if (!data.phone?.trim()) return 'Phone number is required';
  if (!data.smsConsent) return 'SMS consent is required to receive listing updates';
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  let body: ClaimPayload;

  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid request body' }, 400);
  }

  const baseError = validateBase(body);
  if (baseError) return json({ success: false, error: baseError }, 400);

  try {
    if (body.type === 'claim-existing') {
      if (!body.businessName?.trim() || !body.businessSlug?.trim()) {
        return json({ success: false, error: 'Business information is required' }, 400);
      }

      const tags = ['listing-claim', 'business-owner', 'website-lead', 'sms-consent'];

      const contact = await upsertContact({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        source: 'Claim Existing Listing',
        tags,
        customFields: {
          [FIELD_LISTING_STATUS]: 'pending',
          [FIELD_INTAKE_COMPLETED]: 'false',
        },
      });

      // Create pipeline opportunity — stage: Claim Submitted
      const pipelineId = import.meta.env.GHL_LISTINGS_PIPELINE_ID;
      const stageId = import.meta.env.GHL_CLAIM_SUBMITTED_STAGE_ID;
      if (pipelineId && stageId) {
        await createOpportunity({
          pipelineId,
          pipelineStageId: stageId,
          contactId: contact.id,
          name: `${body.businessName} — Claim Submitted`,
        }).catch((err) => console.error('[claim] Opportunity creation failed:', err));
      } else {
        console.warn('[claim] GHL_LISTINGS_PIPELINE_ID or GHL_CLAIM_SUBMITTED_STAGE_ID not set — skipping opportunity creation');
      }

    } else if (body.type === 'new-listing') {
      if (!body.businessName?.trim()) return json({ success: false, error: 'Business name is required' }, 400);
      if (!body.businessType?.trim()) return json({ success: false, error: 'Business type is required' }, 400);
      if (!body.city?.trim()) return json({ success: false, error: 'City/community is required' }, 400);

      const tags = ['new-listing', 'intake-requested', 'business-owner', 'website-lead', 'sms-consent'];

      const contact = await upsertContact({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        source: 'New Listing Intake Form',
        tags,
        customFields: {
          [FIELD_BUSINESS_TYPE]: body.businessType,
          [FIELD_DESCRIPTION_SHORT]: body.descriptionShort || '',
          [FIELD_LISTING_STATUS]: 'pending',
          [FIELD_LISTING_TIER]: 'free',
          [FIELD_INTAKE_COMPLETED]: 'false',
        },
      });

      // Create pipeline opportunity — stage: New Listing Submitted
      const pipelineId = import.meta.env.GHL_LISTINGS_PIPELINE_ID;
      const stageId = import.meta.env.GHL_NEW_LISTING_STAGE_ID;
      if (pipelineId && stageId) {
        await createOpportunity({
          pipelineId,
          pipelineStageId: stageId,
          contactId: contact.id,
          name: `${body.businessName} — New Listing`,
        }).catch((err) => console.error('[claim] Opportunity creation failed:', err));
      } else {
        console.warn('[claim] GHL_LISTINGS_PIPELINE_ID or GHL_NEW_LISTING_STAGE_ID not set — skipping opportunity creation');
      }

    } else {
      return json({ success: false, error: 'Unknown submission type' }, 400);
    }

    return json({ success: true });

  } catch (err) {
    console.error('[claim] Error:', err);

    if (err instanceof Error && err.message.includes('environment variables are required')) {
      return json({ success: false, error: 'Service temporarily unavailable. Please try again.' }, 503);
    }

    return json({ success: false, error: 'Something went wrong. Please try again.' }, 500);
  }
};

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
