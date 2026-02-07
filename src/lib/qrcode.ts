/**
 * QR Code Generator for Door County Visitor
 * Generates QR codes for listing pages with tracking
 */

import QRCode from 'qrcode';

const SITE_URL = import.meta.env.SITE_URL || 'https://doorcountyvisitor.com';

export interface QRCodeOptions {
  /** Listing slug */
  slug: string;
  /** Listing type (eat, stay, do, shop) */
  type: 'eat' | 'stay' | 'do' | 'shop';
  /** Size in pixels */
  size?: number;
  /** Include logo in center */
  withLogo?: boolean;
  /** Dark color (hex) */
  darkColor?: string;
  /** Light color (hex) */
  lightColor?: string;
}

export interface QRCodeResult {
  /** Data URL for PNG image */
  dataUrl: string;
  /** SVG string */
  svg: string;
  /** The tracked URL */
  url: string;
}

/**
 * Generate a QR code for a listing
 */
export async function generateListingQR(options: QRCodeOptions): Promise<QRCodeResult> {
  const {
    slug,
    type,
    size = 300,
    darkColor = '#1e3a5f', // dc-lake-800
    lightColor = '#ffffff',
  } = options;

  // Build URL with tracking param
  const url = `${SITE_URL}/${type}/${slug}?ref=qr`;

  // Generate PNG as data URL
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: 'M',
  });

  // Generate SVG string
  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: size,
    margin: 2,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: 'M',
  });

  return {
    dataUrl,
    svg,
    url,
  };
}

/**
 * Generate a simple QR code for any URL
 */
export async function generateQR(url: string, size: number = 300): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generate QR code as buffer (for file download)
 */
export async function generateQRBuffer(url: string, size: number = 300): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}
