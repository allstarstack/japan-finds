# Japan Finds — Project State

**Last updated:** 2026-05-26 (late) — Phase A.9 shipped. PR #29 merged. STAY infrastructure live, map architecture complete, 136 stays render as zero pins until D7 enrichment.

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
- **Phase B-3 cheat sheets — fully shipped via PRs #6, #7, #8:** /cheat-sheets live with 9 sheets, schema, verify-status CLI, 301 redirect.
- **Phase D D1 (PR #9):** Places API integration end-to-end. 609/615 place_ids, 537 hours, 605 cached photos (~$41 cost). Open-now badges, 3:2 hero photos, "Photo via Google" attribution.
- **Phase D D2 (PR #10):** Japan Events 2026 cheat sheet.
- **Phase D D5a/b:** All 455 products enriched via ChatGPT regular chat. 215/455 image hit rate. YAMLs written, 193/215 images downloaded + webp-converted.
- **Phase D D5c Pass 2 (PRs #23/#24/#25/#26):** Editorial review complete. 114 safety_callouts shipped + render component live. Catalog 362 → 356 unique slugs (7 kills, 1 swap).
- **Phase A.9 (PR #29 — MERGED 2026-05-26 — squash commit `79ab00d`):** Full map architecture completed. STAY infrastructure (Zod schema + content collection + 136-YAML seed imported from Gemini DR + Meta thinking research, deduped + categorized into 9 chips: Onsen ryokan 63, Design hotel 22, Machiya & kominka 11, Glamping 9, Resort 7, Capsule & novelty 7, Mountain lodge 6, Heritage hotel 6, Temple stay 5) + clickable map legend with mode-switching toolbar.
  - **6 commits squashed:** (C1) schema + 136 YAMLs; (C2) STAY markers + legend cluster with Aizome Indigo `#3B4F81`; (C3) clickable legend + 13-cluster /places reorder; (C4) UX corrections — click-to-focus on legend rows + anchor-link popup CTAs (`/places#<slug>` with 2-second Egg Sando Yellow `:target` glow) + "More about this place →" relabel; (C5) mode/cluster rebuild — toolbar consolidated to 3 chips (WHERE / EAT / STAY) matching legend taxonomy + nav, mode-switching scopes legend to active source, single `?mode=` + optional `?cluster=` URL scheme; (C6) empty-state for zero-marker sources (currently only STAY).
  - **Zero Lighthouse regressions** across all 4 audit rounds vs main baseline.
  - **136 stays render as zero pins** on /map — YAML data is live, lat/lng populates via D7.

### Pending PRs (open, unmerged as of 2026-05-26 evening)
- **Phase D D6 — Location filter for /eat and /places.** Shipped on `phase-d-d6-location-filter`, PR open and pending merge. /eat: 5 city chips. /places: 10 JNTO-region chips. URL params `?where=`, `?region=`. Lighthouse 100/100/100. Worth merging soon — feature is complete and not blocking anything.
- **Search + newest-first sort** (`feature/search-and-sort`). Pushed 2026-05-22, PR pending. Two commits: newest-first sort on /products + client-side search box atop /products and /places grids. Also worth merging soon.

## What's in flight
- _(none — Phase A.9 just merged. Next session opens fresh on Quick-Add slash commands.)_

## What's ready to do (small)
- **Merge the two pending PRs** (D6 location filter + Search/sort) before starting any new workstream. Both are feature-complete, low risk, and merging them clears the deck.
- **Two untracked files at repo root (pre-D5):** `product_list.txt`, `products_roster.csv`. Decide whether to add to gitignore or commit.
- **D5 artifacts at repo root + `batches/`:** `products_enriched_master.json`, `generate_batches.py`, `strip_markdown.py`, `merge_batches.py`, `batches/batch_*.txt`, `batches/outputs/batch_*.json`. Probably gitignore the batch files and decide on the scripts.
- **Phase A.9 spec artifacts:** `docs/build/PHASE_A9_BUILD_SPEC.md` + `docs/build/stays_seed.csv` are committed and can stay (record of how the workstream ran).
- **Two pre-existing /map a11y findings** (surfaced during Phase A.9 Lighthouse): (1) Mapbox vendor logo target-size override needed in global CSS, (2) Header.astro brand-link aria-label vs visible text mismatch. Both 5-min fixes. Land as a separate small PR when convenient.

## What's queued

### Strategic / architectural (top of stack)

- **Quick-Add slash commands — `/add-places`, `/add-eats`, `/add-stays`.** Mirror the existing `/add-products` command in `.claude/commands/`. URL input → scrape/extract → schema-mapped YAML → image fetch + webp → commit on feature branch. **Highest priority per Steven 2026-05-26 — current manual workflow is blocking content posting cadence.** Needs `cat .claude/commands/add-products.md` paste to spec the parallel implementations. One CC session, one branch, three new slash commands.

- **D7 — Stay lat/lng enrichment.** Parallels D1 for /places. Run `enrich_with_places_api.py` (or stays-adapted version) against the 136 stay YAMLs to populate `place_id`, `lat`, `lng`, `photo_cache_path`. Cost estimate: ~$10 (136 × $0.07 Place Details Essentials). **Auto-mode OFF in CC** for this session (paid API + supervised mode reminder). Until D7 runs, /map's STAY mode shows the empty-state message and zero pins.

- **Phase A.10 — Map UX consolidation.** Fold the 3 toolbar chips (WHERE / EAT / STAY) into the legend panel header. Current state has chips top-left and legend bottom-left — diagonal eye-jump between two related controls. Major sites (Google Maps, Airbnb, Yelp, Apple Maps) consolidate source + cluster filters into one spatial anchor. Tradeoff: one extra tap if legend is collapsed, but the unified mental model is worth it. Detailed first-principles brief in chat history 2026-05-26.

### Strategic / architectural (next tier)

- **Per-item pages (`/products/<slug>`, `/places/<slug>`, `/eat/<slug>`, `/stay/<slug>`).** Today every product/place/restaurant/stay exists ONLY as a card on the single listing page — no detail routes. Needed for: direct-link strategy (share/link one specific item), SEO (indexable per-item URLs vs monolithic pages), future webshop integration, Pagefind search viability. Scale: ~1,267 pages total (380 products + 333 places + 282 eat + 136 stays + 136 stays once D7 ships). The biggest remaining workstream for japan-finds proper.

- **ManyChat conditional email capture + /products & /places default flows.** Wire ManyChat email capture (conditional) with default flows for /products + /places landing pages. The audience those pages were optimized for (newest-first + instant search) arrives from ManyChat — capture/flow layer is the next link in that funnel.

- **Refactor /map.astro to use MapView.astro component.** Currently ~70% logic duplication between the two map implementations. Queued followup commit (0b97ad3) already exists. Defer until immediate-stack items above ship.

### Phase D continued

- **D3: Steven photo override on top-N cards (manual pace, ongoing).** D1 shipped site-wide Google-sourced hero photos. D3 = Steven's IG/Reels photos override on highest-leverage cards. Top 20-30 paced 5-10/week.

### Phase D — site-wide eval pass (later, after Quick-Add + D7 + A.10 ship)

Structured 3–5 hour task:
1. Performance baseline — Lighthouse on every page, mobile + desktop.
2. Banned-words pass — `rg -i "ultimate|hidden gem|magical|authentic|unforgettable|discover|curated|uncover|delve|explore|must-see|wanderlust|journey|embark" src/`.
3. Accessibility audit — axe DevTools on each page.
4. Brand voice review (Claude task) — screenshots + brand.md → prioritized fixes.
5. UX pattern audit (Claude task) — screenshots → consistency report.
6. Content quality audit — manual walk-through on mobile.
7. 2–3 friend user tests — screen-recorded.

### D1 / D5 known follow-ups (small, deferrable)
- **Matsuyama Castle re-enrichment.** Matched to "Chojyaganaru Station" instead of the castle. Fix: edit YAML, delete place_id fields, re-run enrich script. ~3 min, ~$0.10.
- **Hero photo brand-coherence outcome check.** Now overdue per the original 1-week-post-D1 gate (D1 merged 2026-05-19). Look at live site with Google photos in place across /eat and /places. If brand drifts generic-aggregator, roll back to color blocks + accelerate D3.

### Background queue
- **136 stays seed vet.** Manual cull of the 136-row stays seed list once D7 makes them visible on the map. Build a kill list, batch delete YAMLs.
- 21 v2-deferred product items review (probably folded into D5c)
- Verification pass for 141 previously enriched products — flip fill_type "creator_fill" → "verified" (folded into D5c)
- "Browse the catalog" homepage CTA → brand voice revision ("See the finds" or "Browse the finds"; "catalog" reads corporate)
- Cuisine chip single-select alignment across pages (/products single-select, /eat multi-select, /places mixed — align to single-select everywhere)
- Sub-chip behavior decision on /products (FOOD/DRINK/SWEET below KONBINI RUN etc.)
- "Finds" naming — confirmed KEEP as the products section's nav label
- Cross-linking /eat ↔ /places by neighborhood — **partial overlap with D6; revisit after D6 merges**
- "Experts agree" overlay for /eat (post-launch curation) — hand-curate top 30 Steven endorses
- Unused `--color-tokyo-red-dark` token prune in global.css
- POSSIBLE_MISSING_FLAGS audit (102 slugs) — post-launch flag correctness review
- Scenic transport as LineString routes on /map. Future polish: render scenic trains as LineString features along their rail routes.

## Active decisions log

### Phase A.9 (2026-05-26)
- **9 stay chips** (consolidated from research-phase 12): `city_hotel` folded into `design_hotel` (OMOs are design-led; "city hotel" failed the distinct-intent first-principles test). `floating_ryokan` (guntû singleton) folded into `resort`. Display label rewrites: `design_boutique → Design hotel`, `glamping_cabin → Glamping`, `temple_lodging → Temple stay`. Internal slug for `capsule_themed` retained; display label is "Capsule & novelty."
- **STAY marker color: Aizome Indigo `#3B4F81`** — Japanese indigo dye, culturally aligned with stay content (KAI Tsugaru aizome, KAI Akiu indigo salon), distinct from all 24 existing cluster colors, AA contrast on Rice White. Not added to brand.md — map cluster colors are their own extended palette by necessity (25+ clusters exceeded brand palette long ago). Brand palette stays for brand surfaces only.
- **Toolbar taxonomy collapsed: SEE/DO/EAT/STAY → WHERE/EAT/STAY.** SEE and DO were vibe descriptors masquerading as taxonomy, splitting one conceptual source (/places content type) into two pseudo-sources. WHERE matches nav + legend.
- **Mode-switching toolbar, not co-filter.** Click WHERE → only /places markers + legend collapses to only WHERE section (EAT and STAY sections hide entirely). Matches the pattern from Google Maps, Airbnb, Yelp, TripAdvisor, Apple Maps. Single mode-switching primary filter + scoped sub-filters within active mode.
- **Click-to-focus on legend rows, not click-to-hide.** Single-select within source. Click same row to clear. Matches existing /places and /eat chip rail convention.
- **Group headers (Where/Eat/Stay) are non-interactive labels** — source-level filtering is the job of the toolbar chips, not the legend.
- **Popup CTA labels: "More about this place →" / "More about this restaurant →"** (no "/" in user-facing copy). Destination: anchor link `/places#<slug>` and `/eat#<slug>` with 2-second `:target` highlight. Same label survives when per-item routes ship later — only the href swaps.
- **URL scheme: `?mode=<source>` + optional `?cluster=<slug>`.** Replaces earlier multi-param drafts. Legacy URLs (`?places=anime`, etc.) auto-rewrite on init.
- **Empty-state for zero-marker sources** — STAY shows "9 stay categories curated. Locations being verified — pins appear soon." Generalizable to any source via `EMPTY_STATE_MESSAGE` entry.

### Map migration (2026-05-26)
- Public maps migrated to self-hosted Mapbox GL JS. Unified `/map` standalone shows /places + /eat + /stay content with visual differentiation by source. CSV generation retained for ad-hoc needs.

### Cost kill (2026-05-24)
- Enrichment script defaults to photos-only. Re-run with `--hours` only when hours actually need refresh (~4x more expensive).
- Live "open now" status dropped from /places and /eat cards (cached hours go stale). `OpenNowBadge.astro` deleted as dead code. Schema fields retained.

### Pre-Phase-C (carried)
- **Photo strategy reversed 2026-05-19** to Google Places API hero photos with required attribution + brand-coherence outcome gate. Steven's IG/Reels override via D3.
- **Restaurant curation framing:** "Steven isn't a foodie. Aggregates Tabelog Hyakumeiten. Honest about it."
- **Nav order:** Where · Eat · Finds · Cheat Sheets · Shop Waitlist · Partner.

### Phase C / B-3 / Brand decisions (2026-05-18)
- 282 Tabelog Hyakumeiten restaurants. Shokudo Hyakumeiten = its own genre chip + map cluster.
- 13 cuisine chips ordered specialty-first + 4 planning flags as 2 radio dimensions.
- Tokyo Signal Red row: "Alerts, accents, card color blocks."
- Ink Black confirmed as primary button color.
- `.chip--red` uses ink text (5.59:1 AA). `.chip--green` uses darkened variant `#3f7548` + white text (5:1 AA).
- Subtle text token `--color-ink-60` defined in brand.md for low-emphasis text on Rice White.

### Strategy decisions (2026-05-19)
- **Photo strategy reversed pending outcome check.** Outcome gate now overdue — needs the live-site brand-coherence review (see follow-ups).

### Phase D D1 closing decisions (2026-05-19)
- Pin description format: brand-voice two-line dense. /eat: `{cuisine} · {price} · {neighborhood}, {city}` then `{year} Tabelog Hyakumeiten. {reservation_status}.`
- 13-cluster legend labels humanized: Animals, Anime, Base towns, Culture & history, Food markets, Nature, Onsen & ryokan, Parks, Quirky museums, Scenic, Scenic transport, Theme parks, Workshops & crafts.
- Hero photo aspect ratio: `aspect-ratio: 3 / 2` + `overflow: hidden`.

### D5 decisions (2026-05-19)
- **ChatGPT regular chat won 4-tool bake-off.** Image hit rate 80% (vs 53% / 13% / 7%), voice quality, schema compliance.
- **Deep-research modes (Gemini DR, etc.) are categorically wrong for structured data extraction** — produce prose research reports regardless of JSON schema instructions.
- **25-product batches** held quality. 5-parallel manual ChatGPT workflow is the sweet spot.

## Files in Claude project
- `brand.md` — locked brand spec.
- `preferences.md` — Steven's working preferences.
- `PROJECT_STATE.md` — this file.

## Files in repo (`docs/build/`)
- `PHASE_A9_BUILD_SPEC.md` — Phase A.9 build spec (committed, can stay as record)
- `stays_seed.csv` — 136-row stays seed CSV that fed the import script (committed)

## Files on Desktop (upload per chat as needed)
- `PROMPT_v2_1.md` — D5 final enrichment prompt
- `PHASE_D_PRIORITIZATION.md` — Phase D strategy doc v2
- `stays_merged.json` — Phase A.9 reference: 136 stays with audit fields (`_sources`, `_merged_from`, `primary_cat`). Reference only, not committed.
- `01_Travel_Cheat_Sheets_Source_of_Truth_v1.docx` — B-3 research source

## Conversation handoff rules
- New chat = paste this doc at top + state workstream + paste relevant Desktop files (or rely on project-files auto-load).
- Update this doc immediately after any decision reversal — don't wait for "after the next milestone."
- Decisions get marked as "locked" only after Steven explicit confirmation.
- Don't replay decisions across chats — reference the log above.
- One chat = one workstream; one branch per chat.

### For Quick-Add next chat (immediate next session)
Claude Code session. First action: paste contents of `.claude/commands/add-products.md` into the chat so the parallel `/add-places`, `/add-eats`, `/add-stays` commands can mirror the existing pattern. Auto-mode is FINE for this workstream (no paid API in the command itself — image scraping + YAML writes + git commit are all unsupervised-safe). One branch (`feat/quick-add-commands` or similar). Three new slash command files, possibly a shared helper module if patterns repeat.

### For D7 next chat (after Quick-Add ships)
Claude Code session. **Auto-mode OFF in CC** (paid Google Places API ~$10 for 136 stays). Adapt existing `enrich_with_places_api.py` to read `src/content/stays/*.yaml` and populate `place_id`, `lat`, `lng`, `photo_cache_path` (defaults to photos-only per Cost-Kill decision). Verify pin count matches 136 in build log after run. Push to branch, PR, merge — STAY markers go live on /map.

### For Phase A.10 next chat (after D7)
Map UX consolidation. Fold the 3 toolbar chips into the legend panel header. Single control surface, one spatial anchor. Tradeoff is one extra tap when legend collapsed — accept for the unified mental model.
