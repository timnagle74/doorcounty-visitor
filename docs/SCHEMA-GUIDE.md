# JSON-LD Schema Guide

This document provides schema templates for different business types to maximize SEO and AEO (Answer Engine Optimization) visibility.

## Why Schema Matters for AEO

AI answer engines (ChatGPT, Perplexity, Google AI Overviews) rely on structured data to:
- Understand what a business is and does
- Extract accurate information for answers
- Cite your content as a trusted source

**Goal:** When someone asks "Where should I eat in Fish Creek?", AI engines should cite doorcountyvisitor.com.

---

## Base Organization Schema

Every page should include the organization schema for doorcountyvisitor.com:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://doorcountyvisitor.com/#website",
  "name": "Door County Visitor",
  "url": "https://doorcountyvisitor.com",
  "description": "Your complete guide to Door County, Wisconsin - lodging, dining, attractions, and trip planning.",
  "publisher": {
    "@type": "Organization",
    "@id": "https://doorcountyvisitor.com/#organization",
    "name": "Door County Visitor",
    "url": "https://doorcountyvisitor.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://doorcountyvisitor.com/logo.png",
      "width": 200,
      "height": 200
    }
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://doorcountyvisitor.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

## Restaurant Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": "https://doorcountyvisitor.com/eat/white-gull-inn/#business",
  "name": "The White Gull Inn",
  "description": "Historic Fish Creek inn famous for its traditional Door County fish boil, serving American cuisine since 1896.",
  "url": "https://doorcountyvisitor.com/eat/white-gull-inn",
  "image": [
    "https://doorcountyvisitor.com/images/listings/white-gull-inn-1.jpg",
    "https://doorcountyvisitor.com/images/listings/white-gull-inn-2.jpg"
  ],
  "logo": "https://doorcountyvisitor.com/images/logos/white-gull-inn.png",
  "telephone": "+1-920-868-3517",
  "email": "info@whitegullinn.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "4225 Main Street",
    "addressLocality": "Fish Creek",
    "addressRegion": "WI",
    "postalCode": "54212",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.1234,
    "longitude": -87.2345
  },
  "servesCuisine": ["American", "Seafood"],
  "priceRange": "$$",
  "acceptsReservations": true,
  "menu": "https://whitegullinn.com/menu",
  "hasMenu": {
    "@type": "Menu",
    "url": "https://whitegullinn.com/menu"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "17:00",
      "closes": "21:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "342",
    "bestRating": "5",
    "worstRating": "1"
  },
  "sameAs": [
    "https://www.facebook.com/whitegullinn",
    "https://www.instagram.com/whitegullinn",
    "https://www.tripadvisor.com/Restaurant_Review-..."
  ],
  "isPartOf": {
    "@type": "WebPage",
    "@id": "https://doorcountyvisitor.com/eat/white-gull-inn/#webpage"
  },
  "containedInPlace": {
    "@type": "City",
    "name": "Fish Creek",
    "containedInPlace": {
      "@type": "AdministrativeArea",
      "name": "Door County, Wisconsin"
    }
  }
}
```

---

## Hotel/Lodging Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Hotel",
  "@id": "https://doorcountyvisitor.com/stay/bay-shore-inn/#business",
  "name": "Bay Shore Inn",
  "description": "Waterfront resort in Sturgeon Bay offering suites with stunning views of Green Bay, indoor pool, and private beach access.",
  "url": "https://doorcountyvisitor.com/stay/bay-shore-inn",
  "image": [
    "https://doorcountyvisitor.com/images/listings/bay-shore-inn-1.jpg"
  ],
  "telephone": "+1-920-743-4551",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "4205 Bay Shore Drive",
    "addressLocality": "Sturgeon Bay",
    "addressRegion": "WI",
    "postalCode": "54235",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 44.8567,
    "longitude": -87.3456
  },
  "checkinTime": "15:00",
  "checkoutTime": "11:00",
  "numberOfRooms": 36,
  "petsAllowed": false,
  "priceRange": "$$-$$$",
  "amenityFeature": [
    {
      "@type": "LocationFeatureSpecification",
      "name": "Indoor Pool",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Free WiFi",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Private Beach",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Waterfront",
      "value": true
    }
  ],
  "starRating": {
    "@type": "Rating",
    "ratingValue": "3"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "215"
  }
}
```

---

## Bed & Breakfast Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BedAndBreakfast",
  "@id": "https://doorcountyvisitor.com/stay/blacksmith-inn/#business",
  "name": "Blacksmith Inn On the Shore",
  "description": "Award-winning Baileys Harbor B&B with lakefront rooms, gourmet breakfast, and personalized service.",
  "url": "https://doorcountyvisitor.com/stay/blacksmith-inn",
  "image": "https://doorcountyvisitor.com/images/listings/blacksmith-inn.jpg",
  "telephone": "+1-920-839-9222",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "8152 Highway 57",
    "addressLocality": "Baileys Harbor",
    "addressRegion": "WI",
    "postalCode": "54202",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.0678,
    "longitude": -87.1234
  },
  "checkinTime": "15:00",
  "checkoutTime": "11:00",
  "numberOfRooms": 15,
  "amenityFeature": [
    {
      "@type": "LocationFeatureSpecification",
      "name": "Gourmet Breakfast Included",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Lakefront",
      "value": true
    }
  ]
}
```

---

## Tourist Attraction Schema

```json
{
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  "@id": "https://doorcountyvisitor.com/do/peninsula-state-park/#business",
  "name": "Peninsula State Park",
  "description": "3,776-acre state park featuring Eagle Bluff Lighthouse, 20 miles of hiking trails, camping, and stunning Green Bay views.",
  "url": "https://doorcountyvisitor.com/do/peninsula-state-park",
  "image": "https://doorcountyvisitor.com/images/listings/peninsula-state-park.jpg",
  "telephone": "+1-920-868-3258",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "9462 Shore Road",
    "addressLocality": "Fish Creek",
    "addressRegion": "WI",
    "postalCode": "54212",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.1456,
    "longitude": -87.2234
  },
  "isAccessibleForFree": false,
  "publicAccess": true,
  "touristType": ["Hikers", "Campers", "Families", "Nature Lovers"],
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "06:00",
    "closes": "23:00"
  },
  "offers": {
    "@type": "Offer",
    "name": "Daily Vehicle Admission",
    "price": "13.00",
    "priceCurrency": "USD",
    "description": "Wisconsin residents. Non-residents $16."
  }
}
```

---

## Winery Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Winery",
  "@id": "https://doorcountyvisitor.com/eat/door-peninsula-winery/#business",
  "name": "Door Peninsula Winery",
  "description": "Award-winning winery offering tastings, tours, and Door County's famous cherry wines.",
  "url": "https://doorcountyvisitor.com/eat/door-peninsula-winery",
  "image": "https://doorcountyvisitor.com/images/listings/door-peninsula-winery.jpg",
  "telephone": "+1-920-743-7431",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "5806 Highway 42",
    "addressLocality": "Sturgeon Bay",
    "addressRegion": "WI",
    "postalCode": "54235",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 44.8901,
    "longitude": -87.3678
  },
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Sunday",
      "opens": "10:00",
      "closes": "17:00"
    }
  ]
}
```

---

## FAQ Schema (For Category Pages)

Use this on pages like `/eat/` or `/stay/fish-creek/`:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the best restaurants in Fish Creek?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Fish Creek is home to many excellent restaurants including The White Gull Inn (famous for fish boils), Wild Tomato Pizza, and The Cookery. Most are within walking distance of downtown."
      }
    },
    {
      "@type": "Question",
      "name": "Do Fish Creek restaurants require reservations?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "During peak summer season (June-August), reservations are highly recommended for popular restaurants, especially for fish boil nights. Many restaurants accept reservations through their websites or by phone."
      }
    },
    {
      "@type": "Question",
      "name": "What is a Door County fish boil?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Door County fish boil is a traditional Scandinavian-inspired meal featuring locally caught whitefish, potatoes, and onions cooked in a large kettle over an open fire. The dramatic 'boilover' is created by adding kerosene to the fire, causing flames to shoot up and water to overflow."
      }
    }
  ]
}
```

---

## BreadcrumbList Schema

Include on all listing pages:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://doorcountyvisitor.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Restaurants",
      "item": "https://doorcountyvisitor.com/eat"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Fish Creek",
      "item": "https://doorcountyvisitor.com/eat/fish-creek"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "The White Gull Inn",
      "item": "https://doorcountyvisitor.com/eat/white-gull-inn"
    }
  ]
}
```

---

## Implementation in Astro

Create a reusable component for schema injection:

```astro
---
// src/components/Schema.astro
interface Props {
  schema: object | object[];
}

const { schema } = Astro.props;
const schemas = Array.isArray(schema) ? schema : [schema];
---

{schemas.map((s) => (
  <script type="application/ld+json" set:html={JSON.stringify(s)} />
))}
```

Usage in a listing page:

```astro
---
import Schema from '../components/Schema.astro';
import { generateRestaurantSchema, generateBreadcrumbSchema } from '../lib/schema';

const listing = await getListingBySlug(Astro.params.slug);
const restaurantSchema = generateRestaurantSchema(listing);
const breadcrumbSchema = generateBreadcrumbSchema(listing);
---

<html>
  <head>
    <Schema schema={[restaurantSchema, breadcrumbSchema]} />
  </head>
  <body>
    <!-- Page content -->
  </body>
</html>
```

---

## Testing Schema

1. **Google Rich Results Test:** https://search.google.com/test/rich-results
2. **Schema.org Validator:** https://validator.schema.org/
3. **Test AI extraction:** Ask ChatGPT/Perplexity questions about your listings

---

## Schema Checklist

For each listing, verify:

- [ ] Correct `@type` for business category
- [ ] `@id` is unique URL with fragment
- [ ] Name, description, and address are accurate
- [ ] Coordinates are precise
- [ ] Phone number is in E.164 format (+1-XXX-XXX-XXXX)
- [ ] Images are absolute URLs
- [ ] Opening hours use 24-hour format
- [ ] `sameAs` includes social profiles
- [ ] `aggregateRating` is present if reviews exist
- [ ] Type-specific fields (menu, amenities, etc.) are populated
