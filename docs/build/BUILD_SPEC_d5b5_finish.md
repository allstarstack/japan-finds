# D5b.5 Finish — CC Handoff

Context: D5b YAML enrichment shipped 455 products with new fields (description, image, safety_flags, english_name, japanese_name, subcategory, price_range_jpy, where_to_buy, enrichment_*). This task wires those fields into the render layer.

## State coming in
- Schema (`src/content/schemas.ts`) updated with D5b fields, all nullable+optional
- All 455 YAMLs have enrichment fields written
- Image field set to `/products/{slug}.webp` for 193 products with successful downloads, null for the other 262
- ProductCard partially updated but has bugs

## Bugs to fix
1. **Image src broken**: ProductCard uses `entry.slug` which is undefined in this Astro setup. Use `d.image` directly — it already contains the full path.
2. **Safety flags display raw enums**: "caffeine_high", "alcohol", etc. — these violate brand voice. Either map to human-readable labels per brand.md tone examples, or hide for now and reintroduce later.
3. **Card heights inconsistent**: cards with images are taller than cards without. Add CSS to either reserve space for missing images or accept variable heights — your call.

## Decisions for you to make (state assumption, move)
- Safety flags: hide for now OR build the enum→label map (e.g., "caffeine_high" → "Caffeine"). My instinct: hide for v1, add back when there's time to do voice properly.
- Card heights: probably accept variable heights since hiding the image entirely (rather than showing empty space) is honest to the content.
- Description fallback: component falls back to `what_it_is` when `description` is missing. Keep this — non-enriched products still need to render.

## Files in play
- `src/components/v2/ProductCard.astro` — main component
- `src/content/products/*.yaml` — data (don't touch, just consume)
- `src/content/schemas.ts` — already updated

## Test cases
- `boss-coffee-rainbow-mountain-blend.yaml`: enriched + has image → should show image, description, no safety section
- `c-c-lemon.yaml`: enriched + no image → no broken icon, description shows
- Any unenriched product: falls back to `what_it_is`, renders cleanly

## Branch
Already on `phase-d-d5b-5-render`. Commit + push when done.
