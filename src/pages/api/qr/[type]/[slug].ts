/**
 * QR Code Generation API
 * Generates QR codes for listing pages
 * 
 * GET /api/qr/eat/restaurant-slug?format=png|svg&size=300
 */

import type { APIRoute } from 'astro';
import { generateListingQR, generateQRBuffer } from '../../../../lib/qrcode';

export const GET: APIRoute = async ({ params, url }) => {
  const { type, slug } = params;
  
  // Validate listing type
  if (!type || !['eat', 'stay', 'do', 'shop'].includes(type)) {
    return new Response(JSON.stringify({ error: 'Invalid listing type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing listing slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get options from query params
  const format = url.searchParams.get('format') || 'png';
  const size = parseInt(url.searchParams.get('size') || '300', 10);
  const darkColor = url.searchParams.get('color') || '#1e3a5f';
  const download = url.searchParams.get('download') === 'true';

  try {
    const result = await generateListingQR({
      slug,
      type: type as 'eat' | 'stay' | 'do' | 'shop',
      size: Math.min(Math.max(size, 100), 1000), // Clamp between 100-1000
      darkColor,
    });

    if (format === 'svg') {
      return new Response(result.svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          ...(download ? { 'Content-Disposition': `attachment; filename="${slug}-qr.svg"` } : {}),
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });
    }

    if (format === 'json') {
      return new Response(JSON.stringify({
        dataUrl: result.dataUrl,
        svg: result.svg,
        url: result.url,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Default: PNG
    // Convert data URL to buffer
    const base64Data = result.dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        ...(download ? { 'Content-Disposition': `attachment; filename="${slug}-qr.png"` } : {}),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate QR code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
