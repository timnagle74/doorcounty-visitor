// src/lib/schema.ts
// JSON-LD schema generation utilities

const SITE_URL = 'https://doorcountyvisitor.com';

/**
 * Base website schema - include on every page
 */
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'Door County Visitor',
  url: SITE_URL,
  description: 'Your complete guide to Door County, Wisconsin - lodging, dining, attractions, and trip planning.',
  publisher: {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Door County Visitor',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
      width: 200,
      height: 200,
    },
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

/**
 * Type mapping from internal types to Schema.org types
 */
const schemaTypeMap: Record<string, string> = {
  lodging_hotel: 'Hotel',
  lodging_resort: 'Resort',
  lodging_bnb: 'BedAndBreakfast',
  lodging_vacation_rental: 'LodgingBusiness',
  lodging_campground: 'Campground',
  restaurant: 'Restaurant',
  bar: 'BarOrPub',
  cafe: 'CafeOrCoffeeShop',
  winery: 'Winery',
  brewery: 'Brewery',
  distillery: 'Distillery',
  attraction: 'TouristAttraction',
  park: 'Park',
  museum: 'Museum',
  gallery: 'ArtGallery',
  theater: 'PerformingArtsTheater',
  tour_operator: 'TouristInformationCenter',
  outdoor_recreation: 'SportsActivityLocation',
  shop_retail: 'Store',
  shop_gifts: 'Store',
  shop_antiques: 'Store',
  spa_wellness: 'HealthAndBeautyBusiness',
  service_boat: 'LocalBusiness',
  service_bike: 'LocalBusiness',
  service_kayak: 'LocalBusiness',
};

/**
 * URL path mapping for business types
 */
const urlPathMap: Record<string, string> = {
  lodging_hotel: 'stay',
  lodging_resort: 'stay',
  lodging_bnb: 'stay',
  lodging_vacation_rental: 'stay',
  lodging_campground: 'stay',
  restaurant: 'eat',
  bar: 'eat',
  cafe: 'eat',
  winery: 'eat',
  brewery: 'eat',
  distillery: 'eat',
  attraction: 'do',
  park: 'do',
  museum: 'do',
  gallery: 'do',
  theater: 'do',
  tour_operator: 'do',
  outdoor_recreation: 'do',
  shop_retail: 'shop',
  shop_gifts: 'shop',
  shop_antiques: 'shop',
  spa_wellness: 'do',
  service_boat: 'do',
  service_bike: 'do',
  service_kayak: 'do',
};

export interface BusinessListing {
  id: string;
  slug: string;
  name: string;
  type: string;
  description: {
    short: string;
    full?: string;
  };
  location: {
    address: string;
    city: string;
    cityDisplay: string;
    state: string;
    zip: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  hours?: Record<string, string>;
  images: {
    primary: string;
    gallery?: string[];
    logo?: string;
  };
  social?: {
    facebook?: string;
    instagram?: string;
    tripadvisor?: string;
  };
  ratings?: {
    aggregate: number;
    count: number;
  };
  restaurant?: {
    cuisines?: string[];
    priceRange?: string;
    acceptsReservations?: boolean;
    menuUrl?: string;
    hasFishBoil?: boolean;
  };
  lodging?: {
    roomCount?: number;
    priceRange?: string;
    amenities?: string[];
    checkinTime?: string;
    checkoutTime?: string;
    petsAllowed?: boolean;
  };
  listing: {
    status: string;
    tier: string;
    verified: boolean;
  };
}

/**
 * Generate base business schema properties
 */
function generateBaseSchema(listing: BusinessListing): object {
  const urlPath = urlPathMap[listing.type] || 'business';
  const pageUrl = `${SITE_URL}/${urlPath}/${listing.slug}`;

  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaTypeMap[listing.type] || 'LocalBusiness',
    '@id': `${pageUrl}/#business`,
    name: listing.name,
    description: listing.description.full || listing.description.short,
    url: pageUrl,
    image: listing.images.primary,
    telephone: listing.contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.location.address,
      addressLocality: listing.location.cityDisplay,
      addressRegion: listing.location.state,
      postalCode: listing.location.zip,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: listing.location.coordinates.lat,
      longitude: listing.location.coordinates.lng,
    },
  };

  // Add optional fields
  if (listing.contact.email) {
    base.email = listing.contact.email;
  }

  if (listing.images.logo) {
    base.logo = listing.images.logo;
  }

  if (listing.images.gallery && listing.images.gallery.length > 0) {
    base.image = [listing.images.primary, ...listing.images.gallery];
  }

  if (listing.ratings && listing.ratings.count > 0) {
    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: listing.ratings.aggregate.toFixed(1),
      reviewCount: listing.ratings.count,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Social links
  const sameAs: string[] = [];
  if (listing.social?.facebook) sameAs.push(listing.social.facebook);
  if (listing.social?.instagram) sameAs.push(listing.social.instagram);
  if (listing.social?.tripadvisor) sameAs.push(listing.social.tripadvisor);
  if (listing.contact.website) sameAs.push(listing.contact.website);
  if (sameAs.length > 0) {
    base.sameAs = sameAs;
  }

  return base;
}

/**
 * Generate opening hours specification
 */
function generateOpeningHours(hours: Record<string, string>): object[] | undefined {
  const dayMapping: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  const specs: object[] = [];

  for (const [day, value] of Object.entries(hours)) {
    if (day === 'notes' || !value || value.toLowerCase() === 'closed') continue;

    const schemaDay = dayMapping[day];
    if (!schemaDay) continue;

    // Parse hours like "9:00 AM - 5:00 PM"
    const match = value.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (match) {
      const opens = convertTo24Hour(match[1]);
      const closes = convertTo24Hour(match[2]);
      
      specs.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: schemaDay,
        opens,
        closes,
      });
    }
  }

  return specs.length > 0 ? specs : undefined;
}

/**
 * Convert 12-hour time to 24-hour format
 */
function convertTo24Hour(time12: string): string {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
  if (!match) return time12;

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Generate restaurant-specific schema
 */
export function generateRestaurantSchema(listing: BusinessListing): object {
  const base = generateBaseSchema(listing);
  
  const restaurant: Record<string, unknown> = {
    ...base,
    '@type': 'Restaurant',
  };

  if (listing.restaurant) {
    if (listing.restaurant.cuisines) {
      restaurant.servesCuisine = listing.restaurant.cuisines;
    }
    if (listing.restaurant.priceRange) {
      restaurant.priceRange = listing.restaurant.priceRange;
    }
    if (listing.restaurant.acceptsReservations !== undefined) {
      restaurant.acceptsReservations = listing.restaurant.acceptsReservations;
    }
    if (listing.restaurant.menuUrl) {
      restaurant.menu = listing.restaurant.menuUrl;
      restaurant.hasMenu = {
        '@type': 'Menu',
        url: listing.restaurant.menuUrl,
      };
    }
  }

  if (listing.hours) {
    const openingHours = generateOpeningHours(listing.hours);
    if (openingHours) {
      restaurant.openingHoursSpecification = openingHours;
    }
  }

  return restaurant;
}

/**
 * Generate lodging-specific schema
 */
export function generateLodgingSchema(listing: BusinessListing): object {
  const base = generateBaseSchema(listing);
  
  const lodging: Record<string, unknown> = {
    ...base,
    '@type': schemaTypeMap[listing.type] || 'LodgingBusiness',
  };

  if (listing.lodging) {
    if (listing.lodging.roomCount) {
      lodging.numberOfRooms = listing.lodging.roomCount;
    }
    if (listing.lodging.priceRange) {
      lodging.priceRange = listing.lodging.priceRange;
    }
    if (listing.lodging.checkinTime) {
      lodging.checkinTime = listing.lodging.checkinTime;
    }
    if (listing.lodging.checkoutTime) {
      lodging.checkoutTime = listing.lodging.checkoutTime;
    }
    if (listing.lodging.petsAllowed !== undefined) {
      lodging.petsAllowed = listing.lodging.petsAllowed;
    }
    if (listing.lodging.amenities && listing.lodging.amenities.length > 0) {
      lodging.amenityFeature = listing.lodging.amenities.map(amenity => ({
        '@type': 'LocationFeatureSpecification',
        name: amenity,
        value: true,
      }));
    }
  }

  return lodging;
}

/**
 * Generate attraction-specific schema
 */
export function generateAttractionSchema(listing: BusinessListing): object {
  const base = generateBaseSchema(listing);
  
  return {
    ...base,
    '@type': schemaTypeMap[listing.type] || 'TouristAttraction',
    publicAccess: true,
  };
}

/**
 * Generate schema based on business type
 */
export function generateListingSchema(listing: BusinessListing): object {
  if (listing.type.startsWith('restaurant') || listing.type === 'bar' || listing.type === 'cafe') {
    return generateRestaurantSchema(listing);
  }

  if (listing.type.startsWith('lodging')) {
    return generateLodgingSchema(listing);
  }

  if (['winery', 'brewery', 'distillery'].includes(listing.type)) {
    return {
      ...generateBaseSchema(listing),
      '@type': schemaTypeMap[listing.type],
    };
  }

  if (['attraction', 'park', 'museum', 'gallery', 'theater'].includes(listing.type)) {
    return generateAttractionSchema(listing);
  }

  // Default to LocalBusiness
  return generateBaseSchema(listing);
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate FAQ schema for category pages
 */
export function generateFAQSchema(
  questions: Array<{ question: string; answer: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}
