# Data Model: Door County Business Listings

This document defines the data structure for business listings in GoHighLevel and how they map to the directory website.

## GHL Contact/Custom Object Structure

Each business listing is stored as a Contact (or Custom Object) in GHL with the following fields:

### Core Fields (All Business Types)

| GHL Field Name | Type | Required | Description | Schema.org Property |
|----------------|------|----------|-------------|---------------------|
| `business_name` | Text | Yes | Official business name | `name` |
| `business_slug` | Text | Yes | URL-friendly identifier | - |
| `business_type` | Dropdown | Yes | Primary category (see below) | `@type` |
| `business_subcategories` | Multi-select | No | Secondary categories | `additionalType` |
| `description_short` | Text | Yes | 1-2 sentence summary (160 chars) | `description` |
| `description_full` | Long Text | No | Full description (500-1000 chars) | `description` |
| `street_address` | Text | Yes | Street address | `address.streetAddress` |
| `city` | Dropdown | Yes | Door County community | `address.addressLocality` |
| `state` | Text | Yes | Default: WI | `address.addressRegion` |
| `zip_code` | Text | Yes | ZIP code | `address.postalCode` |
| `latitude` | Number | Yes | GPS latitude | `geo.latitude` |
| `longitude` | Number | Yes | GPS longitude | `geo.longitude` |
| `phone` | Phone | Yes | Primary phone number | `telephone` |
| `email` | Email | No | Contact email | `email` |
| `website` | URL | No | Business website | `url` |
| `image_primary` | URL | Yes | Main listing image | `image` |
| `images_gallery` | Multi-URL | No | Additional images | `image` (array) |
| `logo` | URL | No | Business logo | `logo` |

### Business Hours

| GHL Field Name | Type | Description |
|----------------|------|-------------|
| `hours_monday` | Text | e.g., "9:00 AM - 5:00 PM" or "Closed" |
| `hours_tuesday` | Text | |
| `hours_wednesday` | Text | |
| `hours_thursday` | Text | |
| `hours_friday` | Text | |
| `hours_saturday` | Text | |
| `hours_sunday` | Text | |
| `hours_notes` | Text | Seasonal closures, special hours |
| `is_seasonal` | Checkbox | Seasonal business flag |
| `season_open` | Date | Season start (if seasonal) |
| `season_close` | Date | Season end (if seasonal) |

### Social & Reviews

| GHL Field Name | Type | Description |
|----------------|------|-------------|
| `facebook_url` | URL | Facebook page |
| `instagram_url` | URL | Instagram profile |
| `tripadvisor_url` | URL | TripAdvisor listing |
| `google_place_id` | Text | Google Maps Place ID |
| `rating_aggregate` | Number | Average rating (1-5) |
| `review_count` | Number | Total review count |

### Listing Status

| GHL Field Name | Type | Description |
|----------------|------|-------------|
| `listing_status` | Dropdown | draft, pending, active, archived |
| `listing_tier` | Dropdown | free, verified, featured, pro |
| `verified_date` | Date | When business was verified |
| `claimed_by` | Contact ID | Business owner contact |
| `last_updated` | Date | Last content update |

---

## Business Type Definitions

### Primary Types (Maps to Schema.org @type)

| Value | Display Name | Schema.org Type |
|-------|--------------|-----------------|
| `lodging_hotel` | Hotel | `Hotel` |
| `lodging_resort` | Resort | `Resort` |
| `lodging_bnb` | Bed & Breakfast | `BedAndBreakfast` |
| `lodging_vacation_rental` | Vacation Rental | `LodgingBusiness` |
| `lodging_campground` | Campground | `Campground` |
| `restaurant` | Restaurant | `Restaurant` |
| `bar` | Bar/Pub | `BarOrPub` |
| `cafe` | Café/Coffee | `CafeOrCoffeeShop` |
| `winery` | Winery | `Winery` |
| `brewery` | Brewery | `Brewery` |
| `distillery` | Distillery | `Distillery` |
| `attraction` | Attraction | `TouristAttraction` |
| `park` | Park | `Park` |
| `museum` | Museum | `Museum` |
| `gallery` | Art Gallery | `ArtGallery` |
| `theater` | Theater | `PerformingArtsTheater` |
| `tour_operator` | Tours & Guides | `TouristInformationCenter` |
| `outdoor_recreation` | Outdoor Recreation | `SportsActivityLocation` |
| `shop_retail` | Retail Shop | `Store` |
| `shop_gifts` | Gift Shop | `Store` |
| `shop_antiques` | Antiques | `Store` |
| `spa_wellness` | Spa & Wellness | `HealthAndBeautyBusiness` |
| `service_boat` | Boat Rental/Charter | `LocalBusiness` |
| `service_bike` | Bike Rental | `LocalBusiness` |
| `service_kayak` | Kayak/Paddleboard | `LocalBusiness` |

### Door County Communities (City field)

| Value | Display Name |
|-------|--------------|
| `baileys_harbor` | Baileys Harbor |
| `carlsville` | Carlsville |
| `egg_harbor` | Egg Harbor |
| `ellison_bay` | Ellison Bay |
| `ephraim` | Ephraim |
| `fish_creek` | Fish Creek |
| `gills_rock` | Gills Rock |
| `jacksonport` | Jacksonport |
| `sister_bay` | Sister Bay |
| `sturgeon_bay` | Sturgeon Bay |
| `washington_island` | Washington Island |
| `southern_door` | Southern Door County |

---

## Type-Specific Fields

### Restaurants & Dining

| GHL Field Name | Type | Description | Schema.org |
|----------------|------|-------------|------------|
| `cuisine_types` | Multi-select | American, Seafood, Italian, etc. | `servesCuisine` |
| `price_range` | Dropdown | $, $$, $$$, $$$$ | `priceRange` |
| `accepts_reservations` | Checkbox | Takes reservations | `acceptsReservations` |
| `reservation_url` | URL | OpenTable, Resy, etc. | `reservations` |
| `menu_url` | URL | Online menu link | `hasMenu` |
| `has_fish_boil` | Checkbox | Offers fish boil | - |
| `dietary_options` | Multi-select | Vegetarian, Vegan, GF | - |

### Lodging

| GHL Field Name | Type | Description | Schema.org |
|----------------|------|-------------|------------|
| `room_count` | Number | Number of rooms/units | `numberOfRooms` |
| `price_range_low` | Currency | Starting price | `priceRange` |
| `price_range_high` | Currency | Max price | `priceRange` |
| `amenities` | Multi-select | Pool, WiFi, Pet-friendly, etc. | `amenityFeature` |
| `check_in_time` | Text | e.g., "3:00 PM" | `checkinTime` |
| `check_out_time` | Text | e.g., "11:00 AM" | `checkoutTime` |
| `booking_url` | URL | Direct booking link | `url` |
| `pets_allowed` | Checkbox | Pet-friendly | `petsAllowed` |
| `waterfront` | Checkbox | On water | - |

### Attractions & Activities

| GHL Field Name | Type | Description | Schema.org |
|----------------|------|-------------|------------|
| `admission_adult` | Currency | Adult admission price | `offers` |
| `admission_child` | Currency | Child admission price | `offers` |
| `admission_free` | Checkbox | Free admission | `isAccessibleForFree` |
| `duration_typical` | Text | e.g., "2-3 hours" | - |
| `age_appropriate` | Multi-select | All ages, Adults, Families | `audience` |
| `accessibility` | Multi-select | Wheelchair, etc. | `accessibilityFeature` |

---

## JSON Export Structure

When exporting from GHL for the static site, listings are transformed to this JSON structure:

```json
{
  "id": "ghl_contact_id",
  "slug": "white-gull-inn",
  "name": "The White Gull Inn",
  "type": "restaurant",
  "subcategories": ["fish_boil", "fine_dining"],
  "description": {
    "short": "Historic Fish Creek inn famous for its traditional Door County fish boil.",
    "full": "Since 1896, The White Gull Inn has been..."
  },
  "location": {
    "address": "4225 Main Street",
    "city": "fish_creek",
    "cityDisplay": "Fish Creek",
    "state": "WI",
    "zip": "54212",
    "coordinates": {
      "lat": 45.1234,
      "lng": -87.2345
    }
  },
  "contact": {
    "phone": "+1-920-868-3517",
    "email": "info@whitegullinn.com",
    "website": "https://whitegullinn.com"
  },
  "hours": {
    "monday": "5:00 PM - 9:00 PM",
    "tuesday": "5:00 PM - 9:00 PM",
    "wednesday": "5:00 PM - 9:00 PM",
    "thursday": "5:00 PM - 9:00 PM",
    "friday": "5:00 PM - 9:00 PM",
    "saturday": "5:00 PM - 9:00 PM",
    "sunday": "5:00 PM - 9:00 PM",
    "notes": "Fish boil Wednesday, Friday, Saturday, Sunday"
  },
  "images": {
    "primary": "https://...",
    "gallery": ["https://...", "https://..."],
    "logo": "https://..."
  },
  "social": {
    "facebook": "https://facebook.com/whitegullinn",
    "instagram": "https://instagram.com/whitegullinn",
    "tripadvisor": "https://tripadvisor.com/..."
  },
  "ratings": {
    "aggregate": 4.7,
    "count": 342
  },
  "restaurant": {
    "cuisines": ["American", "Seafood"],
    "priceRange": "$$",
    "acceptsReservations": true,
    "reservationUrl": "https://...",
    "menuUrl": "https://whitegullinn.com/menu",
    "hasFishBoil": true,
    "dietaryOptions": ["Vegetarian", "Gluten-Free"]
  },
  "listing": {
    "status": "active",
    "tier": "featured",
    "verified": true,
    "verifiedDate": "2024-06-15",
    "lastUpdated": "2025-01-02"
  }
}
```

---

## GHL Custom Fields Setup

To set up these fields in GHL:

1. Go to **Settings > Custom Fields**
2. Create a new folder called "Business Listing"
3. Add each field according to the tables above
4. Use consistent field keys (snake_case)

### Recommended Field Groups

1. **Basic Info** - name, slug, type, descriptions
2. **Location** - address, city, coordinates
3. **Contact** - phone, email, website, social
4. **Hours** - daily hours, seasonal info
5. **Media** - images, logo
6. **Type-Specific** - restaurant fields, lodging fields, etc.
7. **Listing Meta** - status, tier, verification

---

## Sync Workflow

1. **Business creates/updates in GHL** → Webhook fires
2. **n8n receives webhook** → Transforms data to JSON structure
3. **n8n generates JSON-LD schema** → Based on business type
4. **n8n updates JSON file** → In GitHub repo
5. **GitHub Action triggers** → Vercel rebuild
6. **Static page regenerated** → With fresh data and schema
