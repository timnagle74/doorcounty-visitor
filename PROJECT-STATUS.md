# Door County Visitor - Project Status

**Last Updated:** January 5, 2026

---

## Project Overview

Building a tourism directory for Door County, Wisconsin with SEO/AEO optimization as a core differentiator.

| Domain | Purpose | Status |
|--------|---------|--------|
| `doorcountyvisitor.com` | Public visitor directory | DNS not yet pointed |
| `doorcounty.io` | Business operations/payments | Future phase |

---

## What's Built

### Infrastructure ✅
- [x] Astro project scaffolded
- [x] Tailwind CSS with Door County theme (lake blue, cherry red, forest green, sand)
- [x] GitHub repo: `timnagle74/doorcounty-visitor`
- [x] Vercel deployment: `doorcounty-visitor.vercel.app`
- [x] Auto-deploy on push to `main`
- [x] Supabase database with listings table
- [x] GHL location configured with Private Integration API

### Components ✅
- [x] `BaseLayout.astro` — SEO meta tags, Open Graph, schema injection
- [x] `Header.astro` — Navigation with mobile menu
- [x] `Footer.astro` — Links and branding
- [x] `Schema.astro` — JSON-LD structured data injection
- [x] `ListingCard.astro` — Listing display component
- [x] `ContactForm.astro` — Contact form component
- [x] `NewsletterSignup.astro` — Newsletter signup

### Pages ✅
- [x] Homepage (`/`)
- [x] `/eat` — Restaurant directory (146 listings)
- [x] `/stay` — Lodging directory
- [x] `/do` — Activities directory
- [x] `/shop` — Shopping directory
- [x] `/contact` — Contact page
- [x] `/privacy` — Privacy policy
- [x] `/terms` — Terms of service

### Data ✅
- [x] Supabase `listings` table — 146 restaurant listings imported
- [x] Supabase `communities` table — 11 Door County communities
- [x] GHL contacts — ~150 contacts imported from Outscraper

### Integrations ✅ (Partial)
- [x] Supabase connected and working
- [x] GHL Private Integration API configured
- [x] GHL MCP server available for API access
- [x] Webhook endpoints created for bidirectional sync
- [x] GHL Workflow "Sync Tags to Website" created
- [ ] **Listings not yet linked** — `ghl_contact_id` needs to be populated

### Schema/AEO Foundation ✅
- [x] `src/lib/schema.ts` — Generators for Restaurant, Hotel, B&B, Attraction, FAQ, Breadcrumb schemas
- [x] Type mapping to Schema.org types
- [x] Website schema on all pages

### Documentation ✅
- [x] `docs/DATA-MODEL.md` — GHL field mapping for all business types
- [x] `docs/SCHEMA-GUIDE.md` — JSON-LD templates and implementation guide
- [x] `docs/WEBHOOKS.md` — Webhook setup and sync documentation
- [x] `docs/SESSION-LOG.md` — Development session notes
- [x] `docs/GHL-CUSTOM-FIELDS.md` — Custom field definitions and sync logic
- [x] `docs/ghl-landing-page.html` — GHL landing page with form embeds

### GHL Custom Fields ✅
- [x] 36 custom fields created via API (`scripts/custom-fields/create-fields.mjs`)
- [x] Field IDs mapped in `scripts/custom-fields/field-ids.json`
- [x] Fields organized by category: Business Info, Social, Hours, Images, Restaurant, Lodging, Activity, Meta

---

## Current Blocker

**GHL ↔ Supabase listings not linked**

Most Supabase listings have `ghl_contact_id: null`. The webhook sync is built and working, but can't match contacts to listings without this link.

**Solution**: Clean reimport — clear both systems, reimport from Outscraper data with `ghl_contact_id` populated from the start.

---

## What's NOT Built Yet

### Features 🔲
- [ ] Individual listing pages (`/eat/[slug]`)
- [ ] Community detail pages (`/communities/[slug]`)
- [ ] Filter/search functionality
- [ ] Map integration
- [ ] Real images (using Google Places photos currently)

### Integrations 🔲
- [ ] Clean reimport with proper GHL linking
- [ ] Domain DNS configuration
- [ ] Supabase database webhook to GHL

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 4.x |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| CRM | GoHighLevel |
| Hosting | Vercel |
| API Integration | GHL MCP Server |

---

## Architecture

```
Current:
Supabase (listings table) → Astro SSR → Vercel

Sync (in progress):
GHL Contact tags changed
    ↓ Workflow webhook
Vercel API endpoint (/api/webhooks/ghl)
    ↓ Updates Supabase
Listing status changes (active/inactive)

Reverse sync:
Supabase listing changes
    ↓ Database webhook (TBD)
Vercel API endpoint (/api/webhooks/supabase)
    ↓ Updates GHL tags
```

---

## Key Files

```
doorcounty-visitor/
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ListingCard.astro
│   │   └── ContactForm.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── eat/index.astro
│   │   ├── stay/index.astro
│   │   ├── contact.astro
│   │   └── api/webhooks/
│   │       ├── ghl.ts         ← GHL → Supabase sync
│   │       └── supabase.ts    ← Supabase → GHL sync
│   └── lib/
│       ├── schema.ts
│       ├── supabase.ts
│       └── ghl.ts
├── scripts/
│   ├── link-ghl-simple.mjs    ← Links existing data
│   ├── import-clean.mjs       ← TBD: Clean reimport
│   └── custom-fields/
│       ├── fields.json        ← Custom field definitions
│       ├── field-ids.json     ← Created field IDs mapping
│       └── create-fields.mjs  ← Script to create fields via API
├── docs/
│   ├── WEBHOOKS.md
│   ├── SESSION-LOG.md
│   └── DATA-MODEL.md
└── scrapedData/               ← Outscraper import data
```

---

## Next Steps (Priority Order)

### Immediate: Fix Data Linking
1. Write clean import script (`scripts/import-clean.mjs`)
2. Clear GHL contacts and Supabase listings
3. Reimport with `ghl_contact_id` populated
4. Test bidirectional sync

### Phase 1: Complete Core Features
1. Individual listing pages (`/eat/[slug]`)
2. Community pages (`/communities/[slug]`)
3. Search/filter functionality

### Phase 2: Domain & Polish
1. Point `doorcountyvisitor.com` to Vercel
2. Optimize images
3. Refine mobile experience

### Phase 3: Business Portal System
1. ~~**GHL Custom Fields Setup**~~ ✅ — 36 custom fields created via API
2. **Business Intake Form** (`/claim`) — Full listing submission form
3. **Magic Link Auth** (`/login` + `/api/auth/magic-link`) — Passwordless business login
4. **Listing Manager** (`/manage`) — Edit existing listing with pre-populated data
5. **Webhook: Form → Draft Listing** — Auto-create Supabase listing from intake
6. **GHL Workflow: Send Magic Link** — Triggered by login request

### Phase 4: Monetization
1. Set up `doorcounty.io`
2. Payment integration (Stripe)
3. Tiered listing features
4. Business analytics dashboard

---

## Commands

```bash
# Development
npm run dev          # Start dev server at localhost:4321

# Build
npm run build        # Production build
npm run preview      # Preview production build

# Deploy
git push             # Auto-deploys to Vercel

# Scripts
node scripts/link-ghl-simple.mjs   # Link existing data
node scripts/import-clean.mjs      # Clean reimport (TBD)
```

---

## Links

- **Live Site:** https://doorcounty-visitor.vercel.app
- **GitHub:** https://github.com/timnagle74/doorcounty-visitor
- **Vercel Dashboard:** https://vercel.com/tim-nagles-projects/doorcounty-visitor
- **Supabase Dashboard:** https://supabase.com/dashboard/project/taeckxnjesfrmynzjnht
- **GHL Location:** a1pjpfTVaYjMD8QJgINa

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://taeckxnjesfrmynzjnht.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# GoHighLevel
GHL_API_TOKEN=pit-...
GHL_LOCATION_ID=a1pjpfTVaYjMD8QJgINa
```

---

## Strategic Context

### Why Custom Build vs SmartDirectoryAI
SmartDirectoryAI runs on HighLevel which lacks native schema markup. For AEO (Answer Engine Optimization), proper structured data is essential. This custom build has schema as a first-class citizen.

### Competitive Advantage
- **Destination Door County** (doorcounty.com) has 5.4M visits/year but likely same SEO limitations
- **Our edge:** Proper JSON-LD schema makes us the source AI engines cite
- **Target:** When someone asks ChatGPT "Where should I eat in Fish Creek?", we want to be the cited source

### Market Size
- $651M annual tourism economic impact
- 800-1,500+ tourism-related businesses
- 1,500+ vacation rentals alone

### Revenue Model (Future)
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic listing |
| Verified | $29/mo | Enhanced listing, photos, hours |
| Featured | $49/mo | Category page placement |
| Pro | $99/mo | Homepage rotation, analytics |
| Premium | $199/mo | Full GHL sub-account, CRM |
