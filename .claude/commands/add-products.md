# /add-products

Batch-enrich products into the Japan Finds /products content collection.
Accepts links, photos, or pasted text (e.g. Amazon JP order emails).

## Inputs to check
1. `drafts/links.txt` — one URL per line. Ignore blank lines and lines starting with #.
2. `drafts/photos/` — image files (.jpg, .jpeg, .png, .heic). Don't recurse into _originals/.
3. If user pastes a single link, photo, or block of text in chat (e.g. an order confirmation email), process that and skip the folder scan.

## Required reads before processing
1. `src/content/schemas.ts` — get the live Zod schema for the products collection. Output must validate. If you can't find it, stop and ask.
2. Two example YAMLs from `src/content/products/` — one simple, one with a safety_flag if any exist.
3. `docs/brand.md` (or `brand.md` as fallback) — voice rules, banned words, safety flag categories, Product card imagery section.
4. Get the highest existing id with: `grep -rh '^id:' src/content/products/ | grep -oE 'JF-[0-9]{4}' | sort | tail -1`. New ids increment from there.

## Field discipline (CRITICAL)
Write ONLY fields defined in the live schema. Do NOT add synonym duplicates (no writing `name_en` AND `english_name`, no `where_found` AND `where_to_buy`). The schema is the contract. If unsure whether a field belongs, omit it.

## Per-item loop

### If input is a LINK:
1. Extract ASIN if Amazon JP URL (10-char alphanumeric in /dp/<ASIN>/). Keep it as fallback identifier.
2. Fetch the page. If fetch fails (Amazon JP reliably returns 503 — don't waste time retrying), proceed directly to web-search fallback using ASIN or product name from URL slug.
3. Extract: product name (Japanese + romanization), brand, category, price in yen, ingredients/specs.
4. Extract primary product image URL. Verify against brand.md "Product card imagery" quality bar. If fails, save YAML with image: null and flag for manual upload.
5. Download image. Convert to .webp. Resize to match existing card dimensions (check files in public/products/). Strip EXIF. Save to `public/products/<slug>.webp`.
6. Set confidence per the **Confidence levels** section below — identification is the gating factor, so a web-search fallback can still be HIGH when the product is correctly identified.

### If input is a PHOTO:
1. View the image. Confirm exactly one product in frame. If multiple or unidentifiable, skip and log.
2. Identify: brand, product name (Japanese + romanization), category. Identification is HIGH if name/brand clearly readable on the package, MED if category clear but specifics inferred, LOW if guessing — this identification certainty drives overall confidence (see **Confidence levels**).
3. Web-search for retailer details: price, ingredients, where to buy. Cite source URLs.
4. The user's photo IS the final product image. Convert to .webp, resize, strip EXIF, save to `public/products/<slug>.webp`. Move original to `drafts/photos/_originals/<slug>.<ext>`.

### If input is PASTED TEXT (order email, etc.):
1. Parse line by line. Each line item with a product name + price = one product.
2. For each parsed item, run web-search to find authoritative product page (Rakuten, brand site, Yodobashi, publisher catalog — anything that isn't Amazon).
3. Enrich from web-search results. Set confidence per the **Confidence levels** section below.
4. Image: extract from email if present and passes quality bar; otherwise null + flag for manual upload.

### Common to all input types:
1. Hybrid input: if user provides BOTH a photo AND a URL or product name in the same invocation:
   - Use the photo as the final product image (don't download the retailer's image, even on successful fetch).
   - Use the URL/name to identify the product and target web searches.
   - This is the preferred path for products on bot-protected retailers (Amazon JP, Yodobashi).
2. For where_to_buy: list ALL retailers mentioned anywhere in web-search results, brand pages, product listings, or anywhere else the intern encounters the product. Be comprehensive, not minimal. If the user mentions retailers in the invocation (e.g. 'sold at Yodobashi and Amazon JP'), include those plus anything else found. Even if a retailer's page couldn't be fetched (blocked site), it's still valid to include in where_to_buy if the product is verified sold there.
3. Evaluate against brand.md safety flag categories: voltage (anything plug-in), perishability (cream/raw/soft-serve), common allergens (dairy/peanuts/wheat/shellfish/soy — only flag when non-obvious). Write callout copy in brand voice. Direct, specific, no hedging.
4. Write copy in brand voice: present tense, witty/dry, useful first. Banned words from brand.md are blockers — rewrite if you hit one.
5. Generate id: JF-XXXX, zero-padded 4 digits, max existing id + 1.
6. Generate slug from product name (lowercase, hyphens, no special chars, max 50 chars).
7. Check `src/content/products/<slug>.yaml` and `drafts/_review/<slug>.yaml` for collision. On collision append -2, -3 etc. Never overwrite.
8. Image field in YAML uses relative URL path: `image: /products/<slug>.webp`
9. Skip runtime schema validation. Do NOT set up a temp js-yaml + zod validator per run. Trust the field-discipline rule, write the YAML, and let Astro validate against the schema at build time when Vercel deploys — that's sufficient. If a build ever fails due to bad YAML, we'll re-introduce runtime validation.
10. HIGH confidence → write to `src/content/products/<slug>.yaml`. MED or LOW → write to `drafts/_review/<slug>.yaml` with a `_notes` field stating why.
11. Auto-commit (HIGH only): immediately after an item is written to `src/content/products/`, automatically `git add` its files (YAML + image), commit, AND push to main without asking. Commit message format: `Add [product name] (JF-XXXX)`. In batch runs, commit each item separately (one commit per product) so they can be reverted individually if needed. MED/LOW items in `drafts/_review/` are NOT auto-committed — those stay local for user review.

## Confidence levels
- HIGH: product correctly identified. EITHER photo input with brand/name clearly visible on package, OR retailer page fetched successfully with full product detail. Identification is the gating factor, not data completeness.
- MED: identification has guesses (photo unclear, web-search uncertain), OR some key data fields couldn't be sourced anywhere.
- LOW: mostly inference, low source agreement, or guessing.

Important: if photo identification is HIGH but some data fields came from web search instead of an authoritative retailer page (e.g. on a blocked site), overall confidence is still HIGH. Don't drop to MED just because the retailer page wasn't fetched — knowing what the product is matters more than every field being from an authoritative source.

HIGH → live to src/content/products/. MED or LOW → drafts/_review/.

## End-of-batch report
- Total items found (split by source) / processed / skipped
- HIGH confidence count (committed to live products folder)
- MED/LOW count (in _review/)
- Skipped items with reason
- Images flagged for manual replacement (failed quality bar or null)
- Safety flags raised, grouped by category
- Web-search citations for spot-checking

## Rules
- One item at a time. Don't parallelize — voice consistency matters more than speed.
- After every 5 items, briefly self-check the last 5 against voice exemplars. Flag drift if you see it.
- Never overwrite existing files. Always collision-check.
- If schema can't be read, STOP. Don't guess at field names.
- If user provides both a photo AND link for the same product, use link/text for data + photo as the image.
- Amazon JP fetch will fail with 503. Don't retry. Go straight to web-search fallback by ASIN.

## Failure handling
- Page fetch fails (non-Amazon) → log, try web-search fallback by product name.
- Image fails quality bar → save YAML without image, flag for manual upload.
- Multiple products in photo → skip, log filename + reason.
- Product unidentifiable → skip, log.
- Slug collision unresolvable after 3 attempts → skip, log.

### Known bot-protected sites
Known bot-protected sites: amazon.co.jp, yodobashi.com, biccamera.com, jp.daisonet.com. For these domains:
- Make exactly ONE WebFetch attempt with a 20-second timeout.
- If it fails, immediately offer alternatives to the user (provide product name, paste photo, or skip).
- Do NOT attempt curl variants, HTTP/1.1 retries, or other fetch methods — they all fail on these sites and waste 3-5 minutes per product.
- jp.daisonet.com fails SILENTLY, not with a 503/hard block: it serves a cookie-gated account/session shell (JS-rendered) that looks like a normal 200 page but carries no product name, price, or specs. Treat any daisonet fetch that lacks a clear product name AND price as a FAILED fetch — do not extract from it, and do not write a YAML from it. Fall back to product name/photo + web-search, listing Daiso under where_to_buy.
- If the user already provided a product name and photo in the invocation, skip the WebFetch attempt entirely and go straight to photo-as-image + web-search-for-data path.
