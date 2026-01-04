#!/usr/bin/env node
/**
 * Generate PWA icons from SVG source
 * Run with: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const iconsDir = join(rootDir, 'public', 'icons');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Read the SVG source
const svgPath = join(iconsDir, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  Created: icon-${size}x${size}.png`);
  }

  // Also create apple-touch-icon at root
  const appleTouchPath = join(rootDir, 'public', 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('  Created: apple-touch-icon.png');

  console.log('Done!');
}

generateIcons().catch(console.error);
