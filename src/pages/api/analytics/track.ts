/**
 * Analytics Tracking API Endpoint
 * Receives tracking events from the frontend
 */

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json();
    
    const {
      listing_id,
      listing_slug,
      listing_type,
      event_type,
      source,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      session_id,
      visitor_id,
      device_type,
      user_agent,
    } = body;

    // Validate required fields
    if (!listing_slug || !listing_type || !event_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get browser info from user agent
    const browser = parseUserAgent(user_agent || request.headers.get('user-agent') || '');

    // Insert the event
    const { error } = await supabaseAdmin.from('analytics_events').insert({
      listing_id,
      listing_slug,
      listing_type,
      event_type,
      source: source || 'organic',
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      session_id,
      visitor_id,
      device_type,
      user_agent: user_agent || request.headers.get('user-agent'),
      browser: browser.browser,
      os: browser.os,
      // IP-based geo would require a geo lookup service
      // For now, just store the country from headers if available
      ip_country: request.headers.get('cf-ipcountry') || request.headers.get('x-country') || null,
    });

    if (error) {
      console.error('Analytics insert error:', error);
      // Don't return error to client - fail silently
    }

    // Also update daily stats if we have a listing_id
    if (listing_id) {
      await supabaseAdmin.rpc('increment_daily_stat', {
        p_listing_id: listing_id,
        p_event_type: event_type,
        p_source: source || 'organic',
        p_device: device_type || 'desktop',
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Return success anyway - don't break client for analytics failures
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Simple user agent parsing
function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os };
}
