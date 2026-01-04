# Session Log

Development session notes and progress tracking.

---

## Session: January 4, 2026

### Goal
Set up bidirectional sync between GHL contacts and Supabase listings using the `active-listing` tag.

### What We Did

1. **Tested GHL MCP service** - confirmed it works for reading/writing contacts

2. **Discovered MCP can't create workflows** - GHL API doesn't support workflow creation, must be done manually in GHL UI

3. **Created GHL Workflow: "Sync Tags to Website"**
   - Trigger: Contact Changed (with Tags field filter)
   - Action: Webhook POST to `https://doorcounty-visitor.vercel.app/api/webhooks/ghl`
   - Note: "Contact Tag Added/Removed" triggers didn't work reliably

4. **Updated webhook code** (`src/pages/api/webhooks/ghl.ts`)
   - Added `lookupContactIdByEmail()` - GHL doesn't send contact ID in webhook payload
   - Added `fetchGHLContactTags()` - fetches current tags from GHL API as source of truth
   - Simplified logic: `active-listing` tag present = active, absent = inactive

5. **Tested the webhook** - receiving requests, processing correctly

### Problem Found

Most Supabase listings have `ghl_contact_id: null` - not linked to GHL contacts. The webhook works but returns "No linked listing found" because there's no match.

### Decision Made

**Clean reimport approach**: Clear both GHL and Supabase, reimport from Outscraper data with `ghl_contact_id` populated from the start.

### Next Steps

1. Write a clean import script that:
   - Reads scraped data from `scrapedData/`
   - Creates each contact in GHL (gets back the ID)
   - Inserts into Supabase with `ghl_contact_id` populated
   - Adds `active-listing` tag to GHL contact

2. Clear existing data (GHL contacts + Supabase listings)

3. Run the import script

4. Test the full sync:
   - Remove `active-listing` tag in GHL → listing becomes inactive in Supabase
   - Add `active-listing` tag in GHL → listing becomes active in Supabase

### Files Modified
- `src/pages/api/webhooks/ghl.ts` - added email lookup and tag fetching
- `docs/WEBHOOKS.md` - updated documentation

### Commands to Resume
```bash
# When ready to do clean import:
# 1. Clear data (script TBD)
# 2. Run import
node scripts/import-clean.mjs  # (to be created)
```

---

## Session Template

```markdown
## Session: [Date]

### Goal
[What we're trying to accomplish]

### What We Did
1. ...

### Problems/Blockers
- ...

### Decisions Made
- ...

### Next Steps
1. ...

### Files Modified
- ...

### Commands to Resume
```bash
# ...
```
```
