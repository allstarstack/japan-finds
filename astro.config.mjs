// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Strip the trailing "--- / Last verified: …" footer from cheat-sheet
 * markdown bodies (BUILD_SPEC_cheat_sheets.md §4). The sheet pages render
 * that footer from frontmatter `last_verified`, so leaving the source line
 * in would double it up. mdast transform: drop a trailing thematicBreak +
 * paragraph pair when the paragraph opens with "Last verified:". A no-op on
 * every other document, so it's safe to run project-wide.
 * @returns {(tree: any) => void}
 */
function remarkStripVerifiedFooter() {
  return (tree) => {
    const c = tree.children;
    if (!Array.isArray(c) || c.length < 2) return;
    const last = c[c.length - 1];
    const prev = c[c.length - 2];
    const text = last?.type === 'paragraph' ? last.children?.[0] : null;
    if (
      prev?.type === 'thematicBreak' &&
      text?.type === 'text' &&
      /^Last verified:/i.test(text.value)
    ) {
      c.splice(c.length - 2, 2);
    }
  };
}

// https://astro.build/config
export default defineConfig({
  // Production canonical URL — used for canonical tags, Open Graph, sitemap.
  // The site is served from the `japan` subdomain (apex is a separate hub).
  site: 'https://japan.allstarsteven.com',
  // Inline all CSS into the page — removes render-blocking stylesheet requests.
  build: { inlineStylesheets: 'always' },
  // Cheat-sheet footer strip — see remarkStripVerifiedFooter above.
  markdown: { remarkPlugins: [remarkStripVerifiedFooter] },
});
