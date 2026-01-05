# GHL Custom Fields for Business Listings

**Last Updated:** January 5, 2026

This document defines all custom fields needed in GoHighLevel to store business listing data. These fields serve as the master data store, syncing to Supabase for website display.

---

## Architecture

```
GHL Custom Fields (Master)
        ↓
   Webhook Sync
        ↓
Supabase Listings (Website Display)
        ↓
   Astro Pages
```

**Data Flow:**
1. Business submits intake form → GHL contact + custom fields populated
2. Webhook fires → Creates/updates Supabase listing
3. Website displays listing from Supabase
4. Business edits via portal → Updates GHL → Syncs to Supabase

---

## Custom Fields to Create

### Business Information

| Field Name | Key | Type | Options/Notes | Maps to Supabase |
|------------|-----|------|---------------|------------------|
| Business Type | `business_type` | Dropdown | See options below | `type` |
| Subcategories | `subcategories` | Multi-select | See options below | `subcategories` |
| Short Description | `description_short` | Text Area | 150 char limit | `description_short` |
| Full Description | `description_full` | Large Text | No limit | `description_full` |
| Website | `website` | Text | URL | `website` |

**Business Type Options:**
```
-- Stay --
lodging_resort: Resort
lodging_hotel: Hotel/Motel
lodging_bnb: B&B/Inn
lodging_vacation_rental: Vacation Rental
lodging_cabin: Cabin/Cottage
lodging_campground: Campground

-- Eat --
restaurant: Restaurant
cafe: Café/Coffee Shop
bar: Bar/Pub
winery: Winery
brewery: Brewery
distillery: Distillery
bakery: Bakery
food_truck: Food Truck

-- Do --
attraction: Attraction
park: Park
museum: Museum
gallery: Art Gallery
theater: Theater
tour_operator: Tour Operator
outdoor_recreation: Outdoor Recreation
spa_wellness: Spa/Wellness

-- Shop --
shop_retail: Retail Store
shop_gifts: Gifts/Souvenirs
shop_antiques: Antiques
shop_art: Art/Gallery
shop_boutique: Boutique
```

---

### Social Media

| Field Name | Key | Type | Maps to Supabase |
|------------|-----|------|------------------|
| Facebook URL | `social_facebook` | Text | `social_facebook` |
| Instagram Handle | `social_instagram` | Text | `social_instagram` |
| TripAdvisor URL | `social_tripadvisor` | Text | `social_tripadvisor` |
| Yelp URL | `social_yelp` | Text | `social_yelp` |

**Display Logic:**
```html
{{#if contact.social_facebook}}
  <a href="{{contact.social_facebook}}" target="_blank">
    <FacebookIcon />
  </a>
{{/if}}
```

---

### Hours of Operation

| Field Name | Key | Type | Maps to Supabase |
|------------|-----|------|------------------|
| Monday Hours | `hours_monday` | Text | `hours.monday` |
| Tuesday Hours | `hours_tuesday` | Text | `hours.tuesday` |
| Wednesday Hours | `hours_wednesday` | Text | `hours.wednesday` |
| Thursday Hours | `hours_thursday` | Text | `hours.thursday` |
| Friday Hours | `hours_friday` | Text | `hours.friday` |
| Saturday Hours | `hours_saturday` | Text | `hours.saturday` |
| Sunday Hours | `hours_sunday` | Text | `hours.sunday` |
| Hours Notes | `hours_notes` | Text Area | `hours_notes` |

**Format:** `9:00 AM - 5:00 PM` or `Closed`

---

### Images

| Field Name | Key | Type | Notes | Maps to Supabase |
|------------|-----|------|-------|------------------|
| Primary Photo | `image_primary` | Text | URL to main image | `image_primary` |
| Logo | `logo_url` | Text | URL to logo | `logo_url` |
| Gallery Images | `image_gallery` | Large Text | Comma-separated URLs | `image_gallery[]` |

**Note:** For intake, we'll accept:
- Direct image URLs
- Google Drive share links
- Dropbox links
- Ask them to email photos (manual upload)

---

### Restaurant-Specific Fields

| Field Name | Key | Type | Options | Maps to Supabase |
|------------|-----|------|---------|------------------|
| Cuisine Types | `restaurant_cuisines` | Multi-select | See below | `restaurant_data.cuisines` |
| Price Range | `restaurant_price` | Dropdown | $, $$, $$$, $$$$ | `restaurant_data.priceRange` |
| Has Fish Boil | `has_fish_boil` | Checkbox | - | `restaurant_data.hasFishBoil` |
| Takes Reservations | `accepts_reservations` | Checkbox | - | `restaurant_data.acceptsReservations` |
| Menu URL | `menu_url` | Text | - | `restaurant_data.menuUrl` |

**Cuisine Options:**
```
American, Seafood, Italian, Mexican, Asian, Mediterranean,
Breakfast/Brunch, Pizza, BBQ, Fine Dining, Casual, Farm-to-Table,
Vegetarian-Friendly, Gluten-Free Options
```

---

### Lodging-Specific Fields

| Field Name | Key | Type | Options | Maps to Supabase |
|------------|-----|------|---------|------------------|
| Number of Rooms | `lodging_rooms` | Number | - | `lodging_data.roomCount` |
| Price Range | `lodging_price` | Dropdown | $, $$, $$$, $$$$ | `lodging_data.priceRange` |
| Check-in Time | `checkin_time` | Text | e.g., "3:00 PM" | `lodging_data.checkinTime` |
| Check-out Time | `checkout_time` | Text | e.g., "11:00 AM" | `lodging_data.checkoutTime` |
| Pets Allowed | `pets_allowed` | Checkbox | - | `lodging_data.petsAllowed` |
| Amenities | `lodging_amenities` | Multi-select | See below | `lodging_data.amenities` |

**Amenity Options:**
```
WiFi, Pool, Hot Tub, Fireplace, Full Kitchen, Kitchenette,
Air Conditioning, Lake View, Waterfront, Beach Access,
Pet Friendly, Breakfast Included, Restaurant On-site,
Fitness Center, Spa, Boat Dock, Fire Pit, Grill/BBQ
```

---

### Activity-Specific Fields

| Field Name | Key | Type | Options | Maps to Supabase |
|------------|-----|------|---------|------------------|
| Duration | `activity_duration` | Text | e.g., "2 hours" | `activity_data.duration` |
| Difficulty | `activity_difficulty` | Dropdown | Easy, Moderate, Challenging | `activity_data.difficulty` |
| Equipment Provided | `equipment_provided` | Checkbox | - | `activity_data.equipment` |
| Seasons Available | `seasonal_availability` | Multi-select | Spring, Summer, Fall, Winter | `activity_data.seasons` |

---

### Listing Meta Fields

| Field Name | Key | Type | Options | Maps to Supabase |
|------------|-----|------|---------|------------------|
| Listing Tier | `listing_tier` | Dropdown | free, verified, featured, premium | `tier` |
| Listing Status | `listing_status` | Dropdown | pending, active, inactive | `status` |
| Supabase Listing ID | `supabase_listing_id` | Text | UUID | Links records |
| Intake Completed | `intake_completed` | Checkbox | - | Internal tracking |
| Last Portal Access | `last_portal_access` | Date | - | Internal tracking |

---

## GHL Setup Instructions

### Step 1: Navigate to Custom Fields
1. Go to **Settings** > **Custom Fields**
2. Click **+ Add Field** for each field below

### Step 2: Create Fields by Category

Create folders for organization:
- `📁 Business Info`
- `📁 Social Media`
- `📁 Hours`
- `📁 Images`
- `📁 Restaurant`
- `📁 Lodging`
- `📁 Activity`
- `📁 Listing Meta`

### Step 3: Field Configuration

For each field:
1. **Name**: Display name (e.g., "Business Type")
2. **Key**: Internal key (e.g., `business_type`) — this is used in API/webhooks
3. **Type**: Select appropriate type
4. **Options**: For dropdowns/multi-select, add all options

---

## Webhook Payload Example

When a contact is updated, GHL sends this to our webhook:

```json
{
  "contact_id": "abc123",
  "email": "owner@business.com",
  "company_name": "Door County Winery",
  "customField": {
    "business_type": "winery",
    "description_short": "Award-winning wines with stunning bay views",
    "website": "https://doorcountywinery.com",
    "social_facebook": "https://facebook.com/dcwinery",
    "social_instagram": "@doorcountywinery",
    "hours_monday": "10:00 AM - 6:00 PM",
    "hours_tuesday": "10:00 AM - 6:00 PM",
    "image_primary": "https://...",
    "restaurant_price": "$$",
    "listing_tier": "verified",
    "listing_status": "active"
  }
}
```

---

## Supabase Sync Logic

```javascript
// Transform GHL custom fields to Supabase listing
function ghlToSupabase(contact) {
  const cf = contact.customField || {};

  return {
    ghl_contact_id: contact.contact_id,
    name: contact.company_name,
    slug: slugify(contact.company_name),
    type: cf.business_type,
    description_short: cf.description_short,
    description_full: cf.description_full,
    website: cf.website,
    phone: contact.phone,
    email: contact.email,
    address: contact.address1,
    city: contact.city,
    state: contact.state || 'WI',
    zip: contact.postal_code,

    // Social
    social_facebook: cf.social_facebook,
    social_instagram: cf.social_instagram,
    social_tripadvisor: cf.social_tripadvisor,
    social_yelp: cf.social_yelp,

    // Hours
    hours: {
      monday: cf.hours_monday,
      tuesday: cf.hours_tuesday,
      wednesday: cf.hours_wednesday,
      thursday: cf.hours_thursday,
      friday: cf.hours_friday,
      saturday: cf.hours_saturday,
      sunday: cf.hours_sunday,
    },
    hours_notes: cf.hours_notes,

    // Images
    image_primary: cf.image_primary,
    logo_url: cf.logo_url,
    image_gallery: cf.image_gallery?.split(',').map(s => s.trim()),

    // Type-specific (stored as JSONB)
    restaurant_data: cf.business_type?.includes('restaurant') ||
                     ['cafe', 'bar', 'winery', 'brewery'].includes(cf.business_type)
      ? {
          cuisines: cf.restaurant_cuisines,
          priceRange: cf.restaurant_price,
          hasFishBoil: cf.has_fish_boil,
          acceptsReservations: cf.accepts_reservations,
          menuUrl: cf.menu_url,
        }
      : null,

    lodging_data: cf.business_type?.startsWith('lodging_')
      ? {
          roomCount: cf.lodging_rooms,
          priceRange: cf.lodging_price,
          checkinTime: cf.checkin_time,
          checkoutTime: cf.checkout_time,
          petsAllowed: cf.pets_allowed,
          amenities: cf.lodging_amenities,
        }
      : null,

    // Status
    status: cf.listing_status || 'pending',
    tier: cf.listing_tier || 'free',
  };
}
```

---

## Display Logic for Conditional Fields

### Social Icons (show only if populated)

```astro
---
const { listing } = Astro.props;
const socials = [
  { url: listing.social_facebook, icon: 'facebook', label: 'Facebook' },
  { url: listing.social_instagram, icon: 'instagram', label: 'Instagram' },
  { url: listing.social_tripadvisor, icon: 'tripadvisor', label: 'TripAdvisor' },
  { url: listing.social_yelp, icon: 'yelp', label: 'Yelp' },
].filter(s => s.url);
---

{socials.length > 0 && (
  <div class="flex gap-3">
    {socials.map(social => (
      <a href={social.url} target="_blank" rel="noopener" aria-label={social.label}>
        <Icon name={social.icon} class="w-5 h-5" />
      </a>
    ))}
  </div>
)}
```

### Hours Display (skip closed/empty days)

```astro
---
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const hours = listing.hours || {};
---

<div class="space-y-1">
  {days.map(day => {
    const value = hours[day];
    if (!value) return null;
    return (
      <div class="flex justify-between text-sm">
        <span class="capitalize">{day}</span>
        <span class={value.toLowerCase() === 'closed' ? 'text-gray-400' : ''}>
          {value}
        </span>
      </div>
    );
  })}
  {listing.hours_notes && (
    <p class="text-sm text-gray-500 mt-2">{listing.hours_notes}</p>
  )}
</div>
```

---

## Next Steps

1. [ ] Create all custom fields in GHL (Settings > Custom Fields)
2. [ ] Build intake form that populates these fields
3. [ ] Update webhook to transform GHL fields to Supabase
4. [ ] Build portal `/manage` page that displays and edits these fields
5. [ ] Test full round-trip: Intake → GHL → Supabase → Website → Portal Edit → GHL → Supabase
