/**
 * Analytics Tracking Library for Door County Visitor
 * Client-side tracking utilities
 */

export type EventType = 
  | 'view'
  | 'click_website'
  | 'click_phone'
  | 'click_directions'
  | 'click_qr'
  | 'click_menu'
  | 'click_book'
  | 'share'
  | 'save_to_trip';

export type TrackingSource = 
  | 'organic'
  | 'qr'
  | 'trip_planner'
  | 'search'
  | 'featured';

export interface TrackingEvent {
  listingId?: string;
  listingSlug: string;
  listingType: 'eat' | 'stay' | 'do' | 'shop';
  eventType: EventType;
  source?: TrackingSource;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// Get or create a visitor ID (stored in localStorage)
function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  
  let visitorId = localStorage.getItem('dcv_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('dcv_visitor_id', visitorId);
  }
  return visitorId;
}

// Get or create a session ID (stored in sessionStorage)
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('dcv_session_id');
  if (!sessionId) {
    sessionId = 's_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('dcv_session_id', sessionId);
  }
  return sessionId;
}

// Detect device type
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

// Parse UTM params from URL
function getUtmParams(): { source?: string; medium?: string; campaign?: string } {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || params.get('ref') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
  };
}

// Determine tracking source from URL
function getTrackingSource(): TrackingSource {
  if (typeof window === 'undefined') return 'organic';
  
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  
  if (ref === 'qr') return 'qr';
  if (ref === 'trip') return 'trip_planner';
  if (ref === 'featured') return 'featured';
  if (ref === 'search') return 'search';
  
  return 'organic';
}

/**
 * Track an analytics event
 */
export async function track(event: TrackingEvent): Promise<void> {
  try {
    const utm = getUtmParams();
    
    const payload = {
      listing_slug: event.listingSlug,
      listing_type: event.listingType,
      listing_id: event.listingId,
      event_type: event.eventType,
      source: event.source || getTrackingSource(),
      referrer: event.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
      utm_source: event.utmSource || utm.source,
      utm_medium: event.utmMedium || utm.medium,
      utm_campaign: event.utmCampaign || utm.campaign,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      device_type: getDeviceType(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    // Send to tracking endpoint
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Use keepalive for page unload events
      keepalive: true,
    });
  } catch (error) {
    // Silently fail - don't break the user experience for analytics
    console.debug('Analytics tracking failed:', error);
  }
}

/**
 * Track a page view
 */
export function trackPageView(listingSlug: string, listingType: 'eat' | 'stay' | 'do' | 'shop', listingId?: string): void {
  track({
    listingSlug,
    listingType,
    listingId,
    eventType: 'view',
  });
}

/**
 * Track a click event
 */
export function trackClick(
  listingSlug: string, 
  listingType: 'eat' | 'stay' | 'do' | 'shop',
  clickType: 'website' | 'phone' | 'directions' | 'menu' | 'book',
  listingId?: string
): void {
  track({
    listingSlug,
    listingType,
    listingId,
    eventType: `click_${clickType}` as EventType,
  });
}

/**
 * Track a share event
 */
export function trackShare(listingSlug: string, listingType: 'eat' | 'stay' | 'do' | 'shop', listingId?: string): void {
  track({
    listingSlug,
    listingType,
    listingId,
    eventType: 'share',
  });
}

/**
 * Track save to trip planner
 */
export function trackSaveToTrip(listingSlug: string, listingType: 'eat' | 'stay' | 'do' | 'shop', listingId?: string): void {
  track({
    listingSlug,
    listingType,
    listingId,
    eventType: 'save_to_trip',
  });
}
