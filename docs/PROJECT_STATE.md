# Japan Finds — Project State

**Last updated:** 2026-05-26 — D5c Pass 2 fully shipped. PRs #23, #24, #25, #26 merged. Catalog 362 → 356 unique slugs with 114 safety_callouts written and rendering.

## What this is
The traveling state doc. Drop this at the top of any new Claude chat to give it full context in ~500 tokens instead of replaying conversation history. Update after major milestones — and AFTER any decision reversal, immediately.

## Site state
- **URL:** japan.allstarsteven.com
- **Stack:** Astro 6 + vanilla CSS + Vercel
- **Repo:** github.com/allstarstack/japan-finds
- **Local path:** ~/Desktop/builds/japan-finds
- **Brand spec:** `brand.md` (in Claude project files) — source of truth for voice, palette, type, banned content

## What's shipped
- **Phase A:** Scaffolding, brand system, base components, fonts self-hosted, /products skeleton.
- **Phase B-1:** Catalog launch. 384 products live on /products. 13 chips. Lighthouse 99/96/100/100 mobile.
- **Phase B-2:** Places launch. 335 places live on /places. 12 primary chips + 4 planning flags. Public Google My Map.
- **Enrichment merge (PR #3):** 141 product YAMLs enriched. 5 catalog dupes deleted. Effective catalog: 379 products.
- **Phase C (PR #4):** /eat live. 282 Tabelog Hyakumeiten restaurants. 13 cuisine chips + 4 planning flags as 2 radio dimensions. Color-block cards, no photos, no detail pages. Restaurants Google My Map wired. Lighthouse 99/100/100/100 mobile.
- **Cleanup PR #5:** PLACES_MAP_URL to env var. btn--primary repainted Ink Black. Chip a11y fixes.
- **Phase B-3 cheat sheets — fully shipped via PRs #6, #7, #8:** /cheat-sheets live with 9 sheets, schema, verify-status CLI, 301 redirect. 12 text changes across 6 sheets via verify-pass. Homepage cleanup retargeted §03 card and §04 tile grid. Final Lighthouse Desktop 100/100/100/100, Mobile 99/100/100/100.
- **Phase D D1 (PR #9 — MERGED 2026-05-19):** Places API integration end-to-end. Enrichment script resolved 609/615 place_ids, 537 hours, 605 cached photos (49MB, ~$41 cost). Site UI renders open-now badges (Asia/Tokyo, recomputed 60s), 3:2 hero photos with overflow-hidden, "Photo via Google" attribution, direct Maps URLs. Both Google My Maps re-imported with brand-voice two-line pin descriptions across 13 clusters. Prebuild hook runs in Vercel with 90-day staleness revalidation.
- **Phase D D2 (PR #10 — MERGED 2026-05-19):** Japan Events 2026 cheat sheet. 10th cheat sheet live at /cheat-sheets/japan-events-2026 — evergreen marquee events (Gion Matsuri, Sumida Fireworks, hanami, sumo basho, Sapporo Snow Festival, Awa Odori, etc.), dates updated annually. Pure content workstream.
- **Phase D D5a — LLM product enrichment run (2026-05-19 evening):** All 455 products in product_list.txt enriched via ChatGPT regular chat (winning tool from 4-tool bake-off). Output: `products_enriched_master.json` with description, english/japanese names, category, subcategory, price range, where_to_buy, image_url, image_source, safety_flags, source_url, confidence, notes for each product. Results: 215/455 image hit rate (47%), 139/455 safety_flag coverage, confidence split 23% high / 41% medium / 36% low. Total run: 19 batches of ~25, 5-parallel browser-tab workflow, ~3 hours including pilot, tool selection, and prompt iteration.
- **Phase D D5b — YAML write + image processing (2026-05-20):** 3 commits on `phase-d-d5b-yaml-write` ready to push.
  - `c4f8c9b` Wrote LLM enrichment to 455 YAMLs (additive — NEW field names only, zero existing field touched). New fields: `description`, `english_name`, `japanese_name`, `subcategory`, `price_range_jpy`, `where_to_buy`, `safety_flags`, `enrichment_confidence`, `enrichment_source_url`, `enrichment_date`, `image`. Slug match 455/455 (453 NFKD-slugify + 2 manual override for Häagen-Dazs / Sanrio-Pokémon). Round-trip parse check confirmed on dry-run; re-run guard verified.
  - `c29b7a0` Downloaded 193/215 product images (89.8% hit rate), webp-converted via Pillow. Per-host throttle 1 req/sec, Chrome UA, magic-byte format validation. 22 failures captured in `docs/d5/d5_images_failed.txt`: 8 HTTP 403 (Nestle KitKat CDN), 7 AVIF (no Pillow plugin), 4 MUJI network errors, 2 HTTP 404, 1 error page disguised as image. All 22 handed off to D3 manual override.
  - `d2f1bc5` Wrote 362-slug D5c editorial review queue at `docs/d5/d5_review_queue.txt`: LOW 164 + MEDIUM 188 + HIGH-with-notes 10. HIGH-with-notes group is mostly POSSIBLE_DUPLICATE_OF pairs (alfort, muhi, tuna-mayo, yuzu-kosho) — actionable consolidation candidates for D5c.
- **Phase D D6 — Location filter for /eat and /places (shipped on `phase-d-d6-location-filter`, pending PR/merge):** Single-select location chip row above the existing cuisine/category rail on both pages. /eat carries 5 city chips (Tokyo 148, Osaka 70, Kyoto 45, Fukuoka 3, Elsewhere 16) with "Elsewhere" pinned last as a rollup. /places carries 10 JNTO-region chips (Kanto 57 down to Hokuriku Shinetsu 14), derived from prefecture via `src/data/regions.js` (all 47 prefectures mapped; Yamanashi → Kanto per Fuji day-trip intent; multi-prefecture rows take the first prefecture). Chip labels regenerate from data at build time — counts use the same standard-tier convention as the visible rows, so label and filtered count never drift. URL params: `?where=<slug>` on /eat, `?region=<slug>` on /places — different names by design (different scales, no cross-page sharing). `replaceState` matches the existing rail convention; `popstate` listener keeps the rail and URL coherent on browser back/forward. Both chip rows wrapped in a shared sticky container so the two-row layout sticks as a unit on mobile (375–414px verified — all rows use `overflow-x: auto`). Combined filters AND together (Tokyo + ramen, Kansai + onsen_ryokan). LocationChipRow component generalised with `isRollup?` so any future rollup chip on any page pins to the end of its row. CLI Lighthouse held a11y/best-practices/SEO at 100/100/100 across all four runs; CLS 0 and TBT 0ms confirm no regression from D6 itself (any perf delta vs baseline is LCP hero-image noise, verified in DevTools). Pre-launch data hygiene: zero orphan prefectures across 333 place YAMLs; `Hiroshima/Ehime` vs `Ehime/Hiroshima` on the two shimanami-kaido files confirmed as authored split, not duplicate.
- **Search + newest-first sort (`feature/search-and-sort` — pushed 2026-05-22, PR pending):** Two-phase build from `docs/build/SEARCH_AND_SORT.md` to make /products and /places usable as ManyChat landing pages (recent-video viewers see the new item on top; specific-item seekers search instantly). Two clean commits.
  - **Phase A — newest-first sort (commit `5eaee83`):** /products grid defaults to descending by `id` (JF-#### is zero-padded, so a string compare sorts numerically — newest on top, e.g. JF-0463 Daiso Wash Bag first). /places kept alphabetical: it has no chronological key (bulk backlog import, no `id`/date field — entry id is just the filename slug), so "newest-first" is undefined there (Steven's call). /eat untouched. Verified no dependency on the old sort — filtering is attribute-based, no pagination, no sitemap integration, no related/prev/next widgets.
  - **Phase B — client-side search (commit `0d97a51`):** Sticky search box atop each grid filters the in-page cards as you type. **Chosen over Pagefind** (which the spec named): items have no per-item routes, so Pagefind's page-level results can't return individual cards without generating ~713 pages (see queued item). Reuses the existing rail-filter `apply()` — each card carries a `data-search` blob (name EN/JP, brand, category, subcategory, description, where), token-AND substring match, composes with the chip filters, shares the count + empty-state. Shared `SearchBox.astro` (Rice White / Ink Black / Concrete Gray, Inter body + IBM Plex Mono placeholder, full-width mobile / 600px desktop). `name_jp`/`brand` indexed only when shown (Yawataya display guard). On /places an active query also reveals base-tier cards so "Search 333 places" stays honest. No new dependency, no build step. Lighthouse not run (CLI absent); safe by construction — no new network request or JS bundle (folded into the already-inlined rail scripts), no CLS (input in the already-reserved sticky header), labeled `type=search` input.
- **D5c Pass 2 — editorial review complete (PRs #23/#24/#25/#26, shipped 2026-05-26):** 114 safety_callouts shipped, render component live (PR #26). Catalog 362 → 356 unique slugs (7 kills, 1 swap: pasmo-passport → tourist-pasmo). PR #23 DO_NOT_RECOMMEND (4 kills, 5 edits incl. 3 callouts). PR #24 HIGH_PRIORITY+LOW_CONFIDENCE (2 kills, 1 swap, 8 callouts, 1 product-identity rewrite on muhi-insect-bite-cream). PR #25 SAFETY_CALLOUT_WRITE_QUEUE (103 callouts, brand-voice ChatGPT pass). PR #26 ProductCard render — Tokyo Red 3px accent strip with IBM Plex Mono "SAFETY" caption, conditional on `safety_callout` presence, 16.5:1 contrast on Rice White (AAA). Schema fix uncovered the Astro 6 content-layer cache landmine at `node_modules/.astro/data-store.json` (not invalidated on schema change).

## What's in flight
- _(none — D5b complete 2026-05-20; D2.5 is the next workstream per locked sequencing)_

## What's ready to do (small)
- **Local cleanup post-D1-merge:** `git checkout main && git pull origin main && git branch -D phase-d-d1-places-api`
- **Two untracked files at repo root (pre-D5):** `product_list.txt`, `products_roster.csv`. Decide whether to add to gitignore or commit.
- **D5 artifacts to gitignore or commit:** new files now at repo root and under `batches/` — `products_enriched_master.json`, `generate_batches.py`, `strip_markdown.py`, `merge_batches.py`, `batches/batch_*.txt`, `batches/outputs/batch_*.json`. Probably gitignore the batch files (intermediate) and decide on the scripts + master file.

## What's queued

### Strategic / architectural (queued)

- **Per-item product/place pages (`/products/<slug>`, `/places/<slug>`).** Today every product and place exists ONLY as a card on the single /products or /places page — there are no detail routes. Needed for: **direct-link strategy** (share/link one specific item), **SEO** (indexable per-item URLs instead of two monolithic pages), and the **future webshop**. Also the prerequisite that would make Pagefind viable for search — the client-side filter shipped in Search Phase B precisely because these routes don't exist (~713 pages: 380 products + 333 places).
- **ManyChat conditional email capture + /products & /places default flows.** Wire ManyChat email capture (conditional) with default flows for the /products and /places landing pages — the audience those two pages were just optimized for (newest-first + instant search) arrives from ManyChat, so the capture/flow layer is the next link in that funnel.
- **Refactor /map.astro to use MapView.astro component with sourceFilter='all' + showCategoryFilters prop.** Currently ~70% logic duplication between the two map implementations. Defer until post-Phase-C ship.

### Phase D continued (per PHASE_D_PRIORITIZATION.md v2 on Desktop)

- **D3: Steven photo override on top-N cards (manual pace, ongoing).** D1 shipped site-wide Google-sourced hero photos. D3 = Steven's IG/Reels photos override on highest-leverage cards. Top 20-30 paced 5-10/week. **Now even higher leverage given D5's 47% image rate** — D3 fills the gap on the 240 products without enrichment image URLs. Begin after D2 ships.

- **D6: Location filter for /eat and /places — queued.** Closes real UX gap from D1 spot-check: traveler planning Kyoto trip has no way to filter /eat or /places to local results without leaving the site for Google My Maps. /fp brief below. Start by running the data-distribution diagnostic before designing the chip set.

### D6 — /fp first-principles brief (carried)

**Real goal:** A traveler can answer "what's worth eating / visiting **here**?" without leaving japan.allstarsteven.com.

**Assumptions:**
- Most Japan trips are city-anchored or named-destination-anchored ("3 days Tokyo + 2 days Kyoto" or "weekend in Hakone"), not prefecture- or region-anchored.
- Data already supports this: /eat carries `city`, /places carries `prefecture` + `address_or_area`.
- Mobile-first; must work on existing two-row sticky chip rail architecture.
- Location is a SECONDARY filter — cuisine (/eat) and category (/places) stay primary.

**Irreducible constraints:**
- Can't show 47 prefectures as chips (overwhelm).
- Can't only show 5 megacities (misses Hakone, Nara, Hiroshima, Kamakura).
- Must integrate cleanly with existing chip rail, not introduce a new UI primitive.

**Cleanest version (preliminary, pending data diagnostic):** single chip row at top of /eat and /places, single-select, default "All Japan." Chips derived from actual data distribution: prefectures with 10+ rows get their own chip; named destinations with 3+ rows (Hakone, Atami, etc.) get their own chip; long-tail rolls up to region or "Other." Counts in chip labels: "Tokyo (42)." URL persistence: `?where=tokyo`. Cross-page consistency.

**Required diagnostic before designing the chip set:**
```
python3 -c "
import json, yaml, os
from collections import Counter
eat_cities = Counter(r.get('city','') for r in json.load(open('src/data/restaurants.json')))
print('=== /eat by city ==='); [print(f'  {c:25s} {n}') for c, n in eat_cities.most_common()]
place_prefs = Counter()
for f in os.listdir('src/content/places'):
    if not f.endswith('.yaml'): continue
    d = yaml.safe_load(open(f'src/content/places/{f}'))
    place_prefs[d.get('prefecture','')] += 1
print('=== /places by prefecture ==='); [print(f'  {p:25s} {n}') for p, n in place_prefs.most_common()]"
```
Run at start of D6 chat. Output determines whether chip set is city-based, prefecture-based, or destination-mapped.

**Out of scope for D6 v1:** Mapbox/Leaflet embedded map, hierarchical chip nesting, geolocation auto-detection, multi-select location filtering.

### Phase D — site-wide eval pass (later, after D2 ships)
After D2 ships and before Shop launches. Structured 3–5 hour task:
1. Performance baseline — Lighthouse on every page, mobile + desktop.
2. Banned-words pass — `rg -i "ultimate|hidden gem|magical|authentic|unforgettable|discover|curated|uncover|delve|explore|must-see|wanderlust|journey|embark" src/`.
3. Accessibility audit — axe DevTools on each page.
4. Brand voice review (Claude task) — screenshots + brand.md → prioritized fixes.
5. UX pattern audit (Claude task) — screenshots of /products /places /eat /cheat-sheets → consistency report.
6. Content quality audit — manual walk-through on mobile.
7. 2–3 friend user tests — screen-recorded.

### D1 known follow-ups (small, deferrable)
- **Matsuyama Castle re-enrichment.** `src/content/places/matsuyama-castle.yaml` matched to "Chojyaganaru Station" (ropeway base) rather than the castle. Fix: edit YAML, change `name` to "Matsuyama Castle", delete place_id/lat/lng/hours/cache fields, re-run enrich script. ~3 min, ~$0.10.
- **Hero photo brand-coherence outcome check (~2026-05-26).** Look at live site with Google photos in place across all /eat and /places cards. Per pre-Phase-C reversal: if photos visibly drift brand toward generic-aggregator aesthetic, roll back to color blocks + accelerate D3. If brand still feels distinctive, continue. Re-evaluation gate.

### Background queue
- 21 v2-deferred product items review (probably folded into D5c)
- Verification pass for 141 previously enriched products — flip fill_type "creator_fill" → "verified" (folded into D5c)
- Quick-Add Phase 0 (15-min build) — manual stub workflow
- "Browse the catalog" homepage CTA → brand voice revision ("See the finds" or "Browse the finds"; "catalog" reads corporate)
- Cuisine chip single-select alignment across pages (/products single-select, /eat multi-select, /places mixed — align to single-select everywhere)
- Sub-chip behavior decision on /products (FOOD/DRINK/SWEET below KONBINI RUN etc.)
- "Finds" naming — confirmed KEEP as the products section's nav label
- Cross-linking /eat ↔ /places by neighborhood — **partial overlap with D6; revisit after D6 ships**
- "Experts agree" overlay for /eat (post-launch curation) — hand-curate top 30 Steven endorses
- Unused `--color-tokyo-red-dark` token prune in global.css
- POSSIBLE_MISSING_FLAGS audit (102 slugs) — post-launch flag correctness review including frozen-mikan (wrong dairy/egg flags) and tea-set-gift (gluten flag verification)
- Scenic transport as LineString routes on /map. Currently scenic trains (like Saphir Odoriko) are list-only because they have no single lat/lng. Future polish: render them as LineString features along their rail routes. Adds ~30 min editorial work per entry to capture route coordinates.

## Active decisions log

### Cost kill (2026-05-24)
- Enrichment script (`enrich_with_places_api.py`) defaults to photos-only as of 2026-05-24. Re-run with `--hours` only when hours actually need refresh — costs ~4x more (Place Details Enterprise SKU vs Essentials).
- Live "open now" status dropped from BOTH `/places` and `/eat` cards (cached hours go stale; the existing Google Maps link on each card carries users to current hours). The shared `OpenNowBadge.astro` component was deleted as dead code. `time_sensitive`/`hours` schema fields retained (no Zod change).

### Pre-Phase-C (carried)
- **Photo strategy reversed 2026-05-19** to Google Places API hero photos with required attribution + brand-coherence outcome gate. Steven's IG/Reels override via D3.
- **Restaurant curation framing:** "Steven isn't a foodie. Aggregates Tabelog Hyakumeiten. Honest about it."
- **Map architecture:** TWO separate Google My Maps — Japan Map (places) and Restaurants Map.
- **Nav order:** Where · Eat · Finds · Cheat Sheets · Shop Waitlist · Partner.

### Phase C (2026-05-18)
- 282 Tabelog Hyakumeiten restaurants. Shokudo Hyakumeiten = its own genre chip + map cluster.
- 13 cuisine chips ordered specialty-first + 4 planning flags as 2 radio dimensions.
- Flag-chip radio fix (commit a29bfee): within-dimension mutually exclusive; cross-dimension AND.
- Konbini Blue exemption on Yakitori card (subdomain, not hub).
- 9-cluster restaurants map taxonomy; v4 10-cluster CSV folded into D1.

### Phase B-3 (2026-05-18)
- Sheet 10 dropped → restored as Phase D D2. Japan Events 2026 specifically (events are time-anchored, can't live as a /places chip).
- Verify-before-publish pattern proven (YAML frontmatter + `npm run verify-status` CLI).
- Three-PR pattern: architecture / verify-pass content / homepage cleanup.

### Brand decisions (2026-05-18)
- Tokyo Signal Red row: "Alerts, accents, card color blocks."
- Ink Black confirmed as primary button color.
- `.chip--red` uses ink text (5.59:1 AA).
- `.chip--green` uses darkened variant #3f7548 + white text (5:1 AA).
- Subtle text token `--color-ink-60` defined in brand.md for low-emphasis text on Rice White.

### Strategy decisions (2026-05-19 morning/afternoon)
- **Photo strategy reversed pending outcome check.** Google Places API hero photos cached locally as primary. Steven's IG/Reels override via D3. Outcome gate: 1 week post-D1-merge live-site review.
- **D1 scope locked:** places + restaurants (URL swap + hero photos + open-now badges + 10-cluster restaurants map re-import). All shipped.

### Phase D D1 closing decisions (2026-05-19)
- **Pin description format for Google My Maps:** Brand-voice two-line dense format. /eat: `{cuisine} · {price} · {neighborhood}, {city}` then `{year} Tabelog Hyakumeiten. {reservation_status}.` /places: `{original_category or labelized public_label} · {locality} · {planning_flags}`. Reservation values explicitly mapped. Hyakumeiten kept untranslated; "Tabelog" prefix anchors the term.
- **Cluster legend labels humanized** (13 categories): Animals, Anime, Base towns, Culture & history, Food markets, Nature, Onsen & ryokan, Parks, Quirky museums, Scenic, Scenic transport, Theme parks, Workshops & crafts.
- **Street addresses with postal codes auto-trim** to prefecture-level via regex. Affects 41 of 332 /places rows.
- **planning_flags separator handled both `,` and `;`** — script splits on both regex `[,;]`.
- **"Base towns" 13th cluster** added for 22 rows whose `original_category` is "Base Town" with empty `public_label`. Fallback logic + manual layer-label edit in My Maps UI.
- **Hero photo aspect ratio enforced via `aspect-ratio: 3 / 2` + `overflow: hidden`** on `.rc-media` and `.plc-media`.

### D5 decisions (2026-05-19 evening)
- **Tool selection:** Bake-off across 4 tools (Meta thinking chat search, Meta contemplating chat search, Gemini Deep Research, ChatGPT regular chat) on the same 15-product pilot. **ChatGPT regular chat won decisively** on every dimension that mattered: image hit rate (80% vs 53% / 13% / ~7%), voice quality, ambiguous-input handling, source URL credibility, schema compliance. Key tool-category finding: **deep-research modes (Gemini DR, etc.) are categorically wrong for structured data extraction** — they produce prose research reports regardless of JSON schema instructions. Logged for future tool selection.
- **Prompt evolution:** v1 → v2 added Wikipedia anti-pattern + structural voice anchor (highest-leverage fix). v2 → v2.1 added hard rule forbidding markdown link syntax on URL fields. v2's anti-pattern fixed the Wikipedia voice drift completely (0/15 → 15/15 voice pass rate). v2.1's markdown rule did NOT hold against ChatGPT's auto-wrapping behavior at scale — handled via post-process script instead.
- **Batch size at scale:** 25 products per batch. ChatGPT's own recommendation was 15 ("best quality"), but 25 held quality throughout the run with no observable degradation. Saved ~30 min vs the 31-batch alternative.
- **Parallel workflow:** 5 ChatGPT tabs at once, 4 waves (5/5/5/4). ~3 hours total wall-clock from prompt finalization to master file aggregation. No rate-limit issues observed.
- **Post-process over prompt-fight:** When v2.1 didn't fully prevent markdown URL wrapping in ChatGPT output, chose to handle it downstream (`strip_markdown.py` regex sweep) rather than escalate prompt language. Right call — saved time and avoided prompt bloat.
- **Manual file workflow over automation:** Considered API automation but went with manual paste-and-save workflow because (a) tool quality risk on API + web_search vs interactive ChatGPT was unknown, (b) one-time job didn't justify script build time, (c) parallel tabs compressed wall-clock enough.

## D5 first-run learnings (real, worth tracking)

- **Pilot image rate (80% on 15 products) was misleading.** Full-catalog rate landed at 47%. The pilot was alphabetically first + well-known brands (Anessa, Alfort, Anker) — high recognizability. The long tail of 455 products includes obscure regional foods, ambiguous category inputs, niche SKUs that simply don't have findable manufacturer image URLs. **Future enrichment runs at scale: assume image rate ~50% as baseline, not 80%.**
- **TextEdit defaults to RTF and breaks JSON.** Macbook's built-in TextEdit saves as Rich Text Format by default, producing `.json.rtf` files or `.json` files with RTF formatting metadata inside. JSON parsers fail. Fix: TextEdit → Settings → New Document → Plain text. Or use VS Code, which has no such default. **For future Steven-doing-file-IO workflows: always confirm plain-text editor up front.**
- **`textutil` conversion has side effects.** macOS `textutil` strips RTF formatting but can replace ASCII spaces with non-breaking spaces (`\xa0`), which Python's JSON parser rejects as not-whitespace. Fix: post-conversion, normalize Unicode whitespace to ASCII. **Add to any future RTF-to-JSON conversion pipeline.**
- **ChatGPT auto-wraps URLs in markdown link syntax inside JSON strings.** Despite explicit v2.1 prompt rule, ChatGPT consistently returned `"image_url": "[https://...](https://...)"`. This is model-side trained behavior, not a UI artifact. **Don't fight it with stronger prompt language — strip downstream with regex.**
- **ChatGPT can prefix JSON output with reference markers like `([Files][1])([Files][2])...` when "Search" mode is on.** Breaks JSON parsing. Fix: regex find `\[\s*\{` to locate real array start, strip preceding chars.
- **ChatGPT can append trailing text after the JSON array closes.** Use `json.JSONDecoder().raw_decode()` to truncate at end of first valid array.
- **Batch processing across 19 chats: zero context-drift issues observed.** Fresh chat per batch worked cleanly. Voice quality stayed consistent batch-to-batch (no quality fall-off at batch 15-19 vs batch 02). v2.1 prompt's voice anchor held throughout.
- **5-parallel is the sweet spot for manual ChatGPT workflow.** Faster than sequential, no rate-limit issues, cognitive load tractable. 3-parallel was conservative; 7+ parallel would have been chaos.
- **Spot-checking 2-3 products per batch as outputs land** caught zero issues in this run, but the pattern is right — would have caught any drift early.

### CC working defaults (for D5b session)
- **Input:** `products_enriched_master.json` at `~/Desktop/builds/japan-finds/` root
- **For each product in array:**
  - Download `image_url` (if non-null), convert to .webp, save to `/public/products/{slug}.webp`
  - On download failure or null image_url, leave the YAML field blank — D3 manual override will fill later
  - Map JSON fields to YAML: `description` → `description`, `english_name` → `english_name`, `japanese_name` → `japanese_name`, `category` → `category`, `subcategory` → `subcategory`, `price_range_jpy` → `price_range_jpy`, `where_to_buy` → `where_to_buy`, `safety_flags` → `safety_flags`, `confidence` → `enrichment_confidence`, `source_url` → `enrichment_source_url`
  - Add `enrichment_date: 2026-05-19` to each enriched YAML
- **Flag for editorial review:** any product where `confidence` is `low` OR `notes` is non-null. Probably write these slugs to a separate `D5_review_queue.txt` file at repo root so Steven can work through them iteratively.

## Files in Claude project
- `brand.md` — locked brand spec.
- `preferences.md` — Steven's working preferences.
- `PROJECT_STATE.md` — this file.

## Files on Desktop (upload per chat as needed)
- `PROMPT_v2_1.md` — D5 final enrichment prompt (winning version with Wikipedia anti-pattern + JSON hard rules including markdown URL ban)
- `PHASE_D_PRIORITIZATION.md` — Phase D strategy doc v2
- `01_Travel_Cheat_Sheets_Source_of_Truth_v1.docx` — B-3 research source

## Files at repo root (japan-finds/)
- `product_list.txt` — 455 product names from /products YAMLs (input to D5)
- `docs/d5/products_enriched_master.json` — D5 output, 455 enriched product records (input to D5b CC session)
- `generate_batches.py` — splits product_list.txt into batch_NN.txt files
- `strip_markdown.py` — strips markdown link wrapping from URL fields in batch JSON outputs
- `merge_batches.py` — merges per-batch JSON outputs into master file with stats
- `batches/` — 19 batch_NN.txt input files + `outputs/` subfolder with 19 batch_NN.json cleaned output files

### Archived (safe to delete from Desktop)
- `BUILD_SPEC_d1_places_api.md` — D1 spec, shipped
- `restaurants_google_mymaps_import_v4.csv` — folded into D1, superseded
- `BUILD_SPEC_cheat_sheets.md` — B-3 archive
- `VERIFY_RESULTS.md` variants — B-3 verify pass archives
- Old Phase C artifacts (CSVs and dedupe reports)
- `enrich_with_place_ids.py` — early D1 script base, superseded
- `PROMPT_product_enrichment.md` (v1) and intermediate v2 — v2.1 supersedes both

## Conversation handoff rules
- New chat = paste this doc at top + state workstream + paste relevant Desktop files (or rely on project-files auto-load).
- Update this doc immediately after any decision reversal — don't wait for "after the next milestone." Stale decision logs cause downstream context errors.
- Decisions get marked as "locked" only after Steven explicit confirmation. Recommendations going into a session live under "CC working defaults" — Steven can override at any step.
- Don't replay decisions across chats — reference the log above.
- One chat = one workstream; one branch per chat.
- **For D5b next chat:** Claude Code session. Input: `products_enriched_master.json`. Read CC working defaults block above. First action: load master file, count `confidence: low|medium` rows, confirm with Steven before running the YAML write.
- **For D6 next chat:** start by running the data-distribution diagnostic in the D6 brief above. Don't design the chip set before seeing the output.
