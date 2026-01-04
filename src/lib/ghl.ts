// src/lib/ghl.ts
// GoHighLevel (GHL) API client for contact/lead management

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

interface GHLConfig {
  locationId: string;
  apiToken: string;
}

interface ContactData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, string>;
}

interface GHLContact {
  id: string;
  locationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
  source: string;
  dateAdded: string;
}

interface GHLResponse<T> {
  contact?: T;
  contacts?: T[];
  error?: string;
}

/**
 * Get GHL configuration from environment variables
 */
function getConfig(): GHLConfig {
  const locationId = import.meta.env.GHL_LOCATION_ID;
  const apiToken = import.meta.env.GHL_API_TOKEN;

  if (!locationId || !apiToken) {
    throw new Error('GHL_LOCATION_ID and GHL_API_TOKEN environment variables are required');
  }

  return { locationId, apiToken };
}

/**
 * Make authenticated request to GHL API
 */
async function ghlFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getConfig();

  const response = await fetch(`${GHL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GHL API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Create or update a contact in GHL
 */
export async function createContact(data: ContactData): Promise<GHLContact> {
  const config = getConfig();

  const payload = {
    locationId: config.locationId,
    firstName: data.firstName,
    lastName: data.lastName || '',
    email: data.email,
    phone: data.phone || '',
    source: data.source || 'Door County Visitor Website',
    tags: data.tags || ['website-lead'],
    customFields: data.customFields ? Object.entries(data.customFields).map(([key, value]) => ({
      key,
      value,
    })) : [],
  };

  const response = await ghlFetch<GHLResponse<GHLContact>>('/contacts/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.contact) {
    throw new Error('Failed to create contact in GHL');
  }

  return response.contact;
}

/**
 * Find a contact by email
 */
export async function findContactByEmail(email: string): Promise<GHLContact | null> {
  const config = getConfig();

  const response = await ghlFetch<GHLResponse<GHLContact>>(
    `/contacts/search/duplicate?locationId=${config.locationId}&email=${encodeURIComponent(email)}`
  );

  return response.contact || null;
}

/**
 * Update an existing contact
 */
export async function updateContact(
  contactId: string,
  data: Partial<ContactData>
): Promise<GHLContact> {
  const payload: Record<string, unknown> = {};

  if (data.firstName) payload.firstName = data.firstName;
  if (data.lastName) payload.lastName = data.lastName;
  if (data.email) payload.email = data.email;
  if (data.phone) payload.phone = data.phone;
  if (data.tags) payload.tags = data.tags;

  const response = await ghlFetch<GHLResponse<GHLContact>>(`/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!response.contact) {
    throw new Error('Failed to update contact in GHL');
  }

  return response.contact;
}

/**
 * Add tags to a contact
 */
export async function addContactTags(contactId: string, tags: string[]): Promise<void> {
  await ghlFetch(`/contacts/${contactId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tags }),
  });
}

/**
 * Create or update contact (upsert)
 * If contact exists by email, update it. Otherwise create new.
 */
export async function upsertContact(data: ContactData): Promise<GHLContact> {
  // First try to find existing contact
  const existing = await findContactByEmail(data.email);

  if (existing) {
    // Merge tags if provided
    const mergedTags = data.tags
      ? [...new Set([...existing.tags, ...data.tags])]
      : existing.tags;

    return updateContact(existing.id, {
      ...data,
      tags: mergedTags,
    });
  }

  // Create new contact
  return createContact(data);
}

/**
 * Submit a newsletter signup
 */
export async function submitNewsletterSignup(email: string, firstName?: string): Promise<GHLContact> {
  return upsertContact({
    email,
    firstName: firstName || 'Visitor',
    source: 'Newsletter Signup',
    tags: ['newsletter', 'website-lead'],
  });
}

/**
 * Submit a contact form inquiry
 */
export async function submitContactForm(data: {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  message?: string;
  subject?: string;
}): Promise<GHLContact> {
  return upsertContact({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    source: 'Contact Form',
    tags: ['contact-form', 'website-lead'],
    customFields: {
      ...(data.message && { message: data.message }),
      ...(data.subject && { subject: data.subject }),
    },
  });
}

/**
 * Submit a business listing claim request
 */
export async function submitListingClaim(data: {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  businessName: string;
  businessSlug: string;
  smsConsent?: boolean;
}): Promise<GHLContact> {
  const tags = ['listing-claim', 'business-owner', 'website-lead'];

  // Add SMS consent tag for A2P compliance tracking
  if (data.smsConsent) {
    tags.push('sms-consent');
  }

  return upsertContact({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    source: 'Listing Claim Request',
    tags,
    customFields: {
      businessName: data.businessName,
      businessSlug: data.businessSlug,
      smsConsentDate: data.smsConsent ? new Date().toISOString() : '',
      smsConsentSource: data.smsConsent ? 'Website Claim Form' : '',
    },
  });
}
