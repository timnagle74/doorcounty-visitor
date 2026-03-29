// Check for contacts with active-listing tag
// Requires: GHL_API_TOKEN and GHL_LOCATION_ID environment variables
const GHL_API_TOKEN = process.env.GHL_API_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

if (!GHL_API_TOKEN || !GHL_LOCATION_ID) {
  console.error('Error: GHL_API_TOKEN and GHL_LOCATION_ID env vars are required');
  process.exit(1);
}

async function main() {
  const response = await fetch(
    `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=100`,
    {
      headers: {
        'Authorization': `Bearer ${GHL_API_TOKEN}`,
        'Version': '2021-07-28',
      },
    }
  );

  const data = await response.json();
  const contactsWithActiveTag = data.contacts.filter(c =>
    c.tags && c.tags.includes('active-listing')
  );

  console.log(`Found ${contactsWithActiveTag.length} contacts with 'active-listing' tag:\n`);
  contactsWithActiveTag.forEach(c => {
    console.log(`- ${c.firstNameRaw || c.firstName}: ${c.tags.join(', ')}`);
  });
}

main().catch(console.error);
