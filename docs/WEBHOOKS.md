# Webhook Setup for Supabase ↔ GHL Sync

This document explains how to set up bidirectional sync between Supabase listings and GoHighLevel contacts.

## Overview

The sync works in two directions:
1. **Supabase → GHL**: When a listing is deleted/updated in Supabase, the linked GHL contact is tagged
2. **GHL → Supabase**: When a GHL contact's tags change, the linked Supabase listing is updated

**IMPORTANT**: For sync to work, listings must be linked by having `ghl_contact_id` populated in Supabase.

---

## Current Status (January 4, 2026)

### What's Working
- GHL → Supabase webhook endpoint is deployed and receiving webhooks
- GHL Workflow "Sync Tags to Website" triggers on Contact Changed (Tags field)
- Webhook looks up contact by email if ID not in payload
- Webhook fetches current tags from GHL API (source of truth)

### What's NOT Working Yet
- Most Supabase listings have `ghl_contact_id: null` - they're not linked to GHL contacts
- Need to run linking script to match GHL contacts to Supabase listings

### Next Step When You Return
Run the linking script to populate `ghl_contact_id` in Supabase:
```bash
node scripts/link-ghl-simple.mjs
```

Then test by removing `active-listing` tag from a linked contact (e.g., Dovetail Bar & Grill).

---

## Webhook Endpoints

### Supabase Webhook Endpoint
**URL**: `https://doorcounty-visitor.vercel.app/api/webhooks/supabase`

Handles:
- `DELETE`: Removes `active-listing` tag from GHL contact
- `UPDATE`: When status changes or `ghl_contact_id` is linked, updates tags
- `INSERT`: Tags GHL contact with `active-listing` if status is active

### GHL Webhook Endpoint
**URL**: `https://doorcounty-visitor.vercel.app/api/webhooks/ghl`

**Current Logic** (simplified - based on `active-listing` tag):
| GHL Tag | Effect on Supabase Listing |
|---------|---------------------------|
| `active-listing` present | status → `active` (visible) |
| `active-listing` absent | status → `inactive` (hidden) |
| `claimed` | is_verified → true |
| `premium` | tier → `premium` |

---

## GHL Workflow Setup

A workflow named **"Sync Tags to Website"** has been created:

1. **Trigger**: Contact Changed
   - Filter: Tags field changed

2. **Action**: Webhook
   - URL: `https://doorcounty-visitor.vercel.app/api/webhooks/ghl`
   - Method: POST
   - Body: Contact data including email

**Note**: GHL's "Contact Tag Added/Removed" triggers didn't work reliably. The "Contact Changed" trigger with Tags filter is more robust.

---

## Tag Reference

### GHL Tags That Control Listings

| GHL Tag | Effect on Supabase Listing |
|---------|---------------------------|
| `active-listing` | status = `active` (visible on site) |
| (no `active-listing`) | status = `inactive` (hidden from site) |
| `claimed` | is_verified = true |
| `premium` | tier = `premium` |

### GHL Tags Applied by Supabase Webhook

| Supabase Action | GHL Tags Added | GHL Tags Removed |
|-----------------|----------------|------------------|
| Listing deleted | - | `active-listing` |
| Status → inactive | - | `active-listing` |
| Status → active | `active-listing` | - |
| New active listing | `active-listing` | - |

---

## Environment Variables Required

```env
# Supabase
SUPABASE_URL=https://taeckxnjesfrmynzjnht.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GoHighLevel
GHL_API_TOKEN=pit-your-token
GHL_LOCATION_ID=a1pjpfTVaYjMD8QJgINa

# Optional: Webhook verification
SUPABASE_WEBHOOK_SECRET=your-secret-here
```

---

## Testing Checklist

### Prerequisites
- [ ] Run `node scripts/link-ghl-simple.mjs` to link GHL contacts to Supabase listings
- [ ] Verify some listings have `ghl_contact_id` populated

### Test GHL → Supabase Sync
1. Find a linked listing (has `ghl_contact_id` in Supabase)
2. Remove `active-listing` tag from the GHL contact
3. Check Supabase - listing status should become `inactive`
4. Add `active-listing` tag back
5. Check Supabase - listing status should become `active`

### Test Supabase → GHL Sync
1. Change a listing's status to `inactive` in Supabase
2. Check GHL contact - `active-listing` tag should be removed
3. Change status back to `active`
4. Check GHL contact - `active-listing` tag should be added

---

## Troubleshooting

### Webhook not triggering
- Check GHL Workflow is Published (not Draft)
- Check Workflow trigger is "Contact Changed" with Tags filter
- Check Vercel logs for incoming requests

### "No linked listing found" in logs
- The GHL contact's ID isn't in any Supabase listing's `ghl_contact_id` field
- Run the linking script: `node scripts/link-ghl-simple.mjs`

### "No contact ID in payload"
- The webhook extracts contact ID from email lookup
- Check the contact has an email address in GHL

---

## Listing Status Values

| Status | Visibility | Description |
|--------|------------|-------------|
| `active` | Visible | Normal, visible listing |
| `pending` | Hidden | Awaiting approval |
| `inactive` | Hidden | Temporarily hidden (controlled by `active-listing` tag) |
| `removed` | Hidden | Marked for deletion/removed |
