# Door County Visitor Directory

A modern, SEO/AEO-optimized tourism directory for Door County, Wisconsin.

**Live Sites:**
- `doorcountyvisitor.com` - Public visitor directory
- `doorcounty.io` - Business operations platform

## Tech Stack

- **Frontend:** Astro (static site generation)
- **Styling:** Tailwind CSS
- **Data Source:** GoHighLevel (via API/webhooks)
- **Deployment:** Vercel
- **Automation:** n8n (GHL sync, schema generation)

## Project Structure

```
doorcounty-visitor/
├── src/
│   ├── components/       # Reusable UI components
│   ├── layouts/          # Page layouts
│   ├── pages/            # Route pages
│   │   ├── index.astro   # Homepage
│   │   ├── stay/         # Lodging directory
│   │   ├── eat/          # Restaurant directory
│   │   ├── do/           # Activities & attractions
│   │   ├── shop/         # Shopping directory
│   │   └── [community]/  # Community pages (Fish Creek, etc.)
│   ├── content/          # Markdown content (guides, articles)
│   ├── data/             # JSON data files (listings, categories)
│   └── styles/           # Global styles
├── public/               # Static assets
├── docs/                 # Documentation
│   ├── DATA-MODEL.md     # GHL field mapping
│   ├── SCHEMA-GUIDE.md   # JSON-LD schema templates
│   └── WORKFLOWS.md      # n8n automation docs
└── scripts/              # Build/sync scripts
```

## Quick Start

### Prerequisites

- Node.js 18+ (`node --version`)
- Git (`git --version`)
- GHL account with Private Integration API key

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/doorcounty-visitor.git
cd doorcounty-visitor

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your API keys to .env
# Then start development server
npm run dev
```

### Environment Variables

```env
# GoHighLevel
GHL_API_KEY=your_private_integration_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com

# Site
SITE_URL=https://doorcountyvisitor.com
```

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Sync data from GHL
npm run sync
```

## Deployment

This project is configured for Vercel deployment:

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

## Data Flow

```
GHL (Source of Truth)
    ↓ Webhook on create/update
n8n (Middleware)
    ↓ Transform + generate schema
JSON files in /src/data/
    ↓ Build trigger
Astro generates static pages
    ↓ Deploy
Vercel CDN (doorcountyvisitor.com)
```

## SEO/AEO Features

- **JSON-LD Schema:** LocalBusiness, Restaurant, Hotel, TouristAttraction per listing
- **FAQ Schema:** On category and community pages
- **Sitemap:** Auto-generated with lastmod dates
- **Meta Tags:** Dynamic per page
- **Core Web Vitals:** Optimized for performance

## License

Private - All rights reserved.
