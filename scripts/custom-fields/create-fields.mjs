#!/usr/bin/env node
/**
 * Create GHL Custom Fields from fields.json
 *
 * Usage: node scripts/custom-fields/create-fields.mjs
 *
 * Requires GHL_API_TOKEN environment variable with customFields.write scope
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const GHL_API_TOKEN = process.env.GHL_API_TOKEN;
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Load field definitions
const fieldsPath = path.join(__dirname, 'fields.json');
const fieldData = JSON.parse(fs.readFileSync(fieldsPath, 'utf-8'));

const LOCATION_ID = fieldData.locationId;

async function createCustomField(field, folderId = null) {
  const body = {
    name: field.name,
    dataType: field.dataType || 'TEXT',
    model: 'contact',
  };

  // Add folder if specified
  if (folderId) {
    body.parentId = folderId;
  }

  // Add placeholder if specified
  if (field.placeholder) {
    body.placeholder = field.placeholder;
  }

  // Add options for dropdown/multi-select fields
  if (field.options && field.options.length > 0) {
    body.options = field.options.map(opt => opt.label || opt.value);
  }

  try {
    const response = await fetch(`${GHL_API_BASE}/locations/${LOCATION_ID}/customFields`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`  ❌ Failed to create "${field.name}":`, data.message || data);
      return null;
    }

    console.log(`  ✅ Created: ${field.name} (${data.customField?.id || 'unknown id'})`);
    return data.customField;
  } catch (error) {
    console.error(`  ❌ Error creating "${field.name}":`, error.message);
    return null;
  }
}

async function createFolder(folderName) {
  const body = {
    name: folderName,
    dataType: 'TEXT',
    model: 'contact',
    isFolder: true,
  };

  try {
    const response = await fetch(`${GHL_API_BASE}/locations/${LOCATION_ID}/customFields`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Failed to create folder "${folderName}":`, data.message || data);
      return null;
    }

    console.log(`📁 Created folder: ${folderName} (${data.customField?.id})`);
    return data.customField;
  } catch (error) {
    console.error(`❌ Error creating folder "${folderName}":`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating GHL Custom Fields');
  console.log(`📍 Location: ${LOCATION_ID}`);
  console.log('');

  let totalCreated = 0;
  let totalFailed = 0;

  for (const folder of fieldData.folders) {
    console.log(`\n📁 ${folder.name}`);
    console.log('─'.repeat(40));

    // Create the folder first
    const createdFolder = await createFolder(folder.name);
    const folderId = createdFolder?.id;

    // Create fields within the folder
    for (const field of folder.fields) {
      const result = await createCustomField(field, folderId);
      if (result) {
        totalCreated++;
      } else {
        totalFailed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '═'.repeat(40));
  console.log(`✅ Created: ${totalCreated} fields`);
  console.log(`❌ Failed: ${totalFailed} fields`);
  console.log('═'.repeat(40));
}

main().catch(console.error);
