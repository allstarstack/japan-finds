# Build Spec: Search + Newest-First Sort

**Goal:** Make /products and /places usable as ManyChat landing pages. People from a recent video see the new item at the top; people looking for a specific item can search instantly.

**Scope:** /products and /places ONLY. Do not modify /eat (curated editorial, intentionally not chronological).

**Branch:** feature/search-and-sort, off latest main.

## Phase A: Newest-first sort

1. Audit current sort on /products and /places. What field, what order? Document before changing.
2. Verify all items in `src/content/products/` and `src/content/places/` use consistent id format (e.g. JF-0001 to JF-0463 for products). Flag any outliers.
3. Change default sort to descending by `id`. Newest first.
4. Verify nothing else depends on the previous sort (pagination, related-items widgets, sitemap order, SEO-sensitive URL patterns).
5. Commit when sort is verified working in dev preview.

## Phase B: Pagefind search

1. Install `@pagefind/default-ui` or the Astro-recommended Pagefind integration.
2. Configure to index `src/content/products/` and `src/content/places/` separately (two indexes, since each page searches only its own collection).
3. Index fields: name (English + Japanese), brand, category, subcategory, description, where_to_buy.
4. Add search input UI at the top of /products and /places:
   - Sticky to top of grid on scroll
   - Full-width on mobile, max ~600px width on desktop
   - Placeholder copy matches brand voice: "Search 463 products" / "Search 333 places" (use real counts)
   - Empty state when no matches: short, brand-voice copy ("Nothing matches. Try a brand name or category.")
5. Styling: match brand.md typography (Inter 400 for body, IBM Plex Mono 500 for the count/placeholder if appropriate). Palette: Rice White background, Ink Black text, Concrete Gray border. Mobile-first.
6. Verify Lighthouse a11y/perf doesn't drop from current 100/100/100.
7. Commit when search works in dev preview on both pages.

## Process rules

- Mobile-first, single 1200px desktop breakpoint.
- Show me a design preview (screenshots or live dev URL) before committing each phase.
- Don't push to main. Create feature/search-and-sort branch off current main.
- If schema needs to change to support sort or indexing, update src/content/schemas.ts FIRST before touching data (existing working pattern: schema co-edit).
- Do Phase A entirely before starting Phase B. Two clean commits, two reviews.
- Flag any decisions that aren't obvious from this spec — don't guess.

## Done means

- /products grid defaults to newest-first
- /places grid defaults to newest-first
- /eat is unchanged
- Both pages have working search at the top of the grid
- Both pages render correctly on mobile and at 1200px desktop
- Lighthouse scores hold at current levels
- Two commits on feature/search-and-sort branch, ready to PR

