// Check for contacts with active-listing tag
const GHL_API_TOKEN = 'pit-ccfc2ac8-6e3e-42e7-bfe3-82f4471d2d22';
const GHL_LOCATION_ID = 'a1pjpfTVaYjMD8QJgINa';

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
