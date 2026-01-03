import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://doorcountyvisitor.com',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/admin/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  output: 'static',
  build: {
    format: 'directory',
  },
  vite: {
    define: {
      'import.meta.env.SITE_URL': JSON.stringify('https://doorcountyvisitor.com'),
    },
  },
});
