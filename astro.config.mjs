// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Production canonical URL — used for canonical tags, Open Graph, sitemap.
  // The site is served from the `japan` subdomain (apex is a separate hub).
  site: 'https://japan.allstarsteven.com',
  // Inline all CSS into the page — removes render-blocking stylesheet requests.
  build: { inlineStylesheets: 'always' },
});
