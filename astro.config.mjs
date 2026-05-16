// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Used for canonical URLs, Open Graph tags and the sitemap.
  // UPDATE this to the production URL after the Vercel deploy (Phase 7).
  site: 'https://japan-finds.vercel.app',
  // Inline all CSS into the page — removes render-blocking stylesheet requests.
  build: { inlineStylesheets: 'always' },
});
