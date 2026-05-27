# Japan Finds — Project State

**Last updated:** 2026-05-27 (afternoon) — PR #32 merged: /stay launch bundle shipped (/stay list page + /add-stays slash command + /places "Onsen & Ryokan" → "Onsen Towns" rename). Next workstream: D7 stay lat/lng enrichment.

## What this is
The traveling state doc. Drop this at the top of any new Claude chat to give it full context in ~500 tokens instead of replaying conversation history. Update after major milestones — and AFTER any decision reversal, immediately.

## Site state
- **URL:** japan.allstarsteven.com
- **Stack:** Astro 6 + vanilla CSS + Vercel
- **Repo:** github.com/allstarstack/japan-finds
- **Local path:** ~/Desktop/builds/japan-finds
- **Brand spec:** `brand.md` (in Claude project files) — source of truth for voice, palette, type, banned content

## What's shipped (most recent first)
- **PR #32 — /stay launch bundle (merged 2026-05-27):** Three commits. (1) /places "Onsen & Ryokan" → "Onsen Towns" rename, display-label only, slug `onsen_ryokan` untouched. (2) New /stay list page at `src/pages/stay.astro` with StayCard component, StayFilterRail component (extracted, not inline), 9-chip rail in content-gravity order, 10-region location filter mirroring D6, alphabetical sort (matches /places until search-and-sort PR merges), color-block hero cards (no photos until D7), Header.astro nav entry for "Stay" between Eat and Finds, price tier chip styled with yen glyphs on Concrete Gray. (3) New `.claude/commands/add-stays.md` slash command mirroring /add-places, no Hyakumeiten gate (no equivalent quality policy for stays), category-fit prompt for ambiguous entries → drafts/_review/.
- **Prebuild hook leak fix (2026-05-27, merged in PR #31):** `npm run enrich:refresh` removed from the `prebuild` script in package.json. Confirmed leak: $90.62 over 7 days from prebuild hook calling paid Google Places API on every Vercel build despite UI no longer using hours. Fix: prebuild now only clears the Astro cache + regenerates geojson. The `enrich:refresh` script remains as a manual command for deliberate refresh runs.
- **PR #31 (cleanup + small fixes, merged 2026-05-27):** popup CTA scroll-margin-top bumped 80px → 220px so anchor-linked cards clear the sticky chip rail. Two pre-existing /map a11y findings fixed: Mapbox vendor logo target-size, Header.astro brand-link aria-label vs visible text mismatch. Scratch artifacts gitignored. Historical BUILD_SPEC_*.md docs committed to docs/build/. Plus the prebuild leak fix above.
- **PR #30 — Quick-Add /add-eats (merged 2026-05-27):** new `.claude/commands/add-eats.md` slash command. Accepts EITHER a Google Maps URL OR a Tabelog URL as equal-class inputs. Hyakumeiten gate with evidence-citation wording + override prompt feeding a `policy_exception` string field on the live restaurants.json entry. Existing `/add-places.md` left untouched (already more mature than the spec described).
- **Phase A.9 (PR #29 — merged 2026-05-26 — squash commit `79ab00d`):** Full map architecture completed. STAY infrastructure (Zod schema + content collection + 136-YAML seed deduped from Gemini DR + Meta thinking research, categorized into 9 chips: Onsen ryokan 63, Design hotel 22, Machiya & kominka 11, Glamping 9, Resort 7, Capsule & novelty 7, Mountain lodge 6, Heritage hotel 6, Temple stay 5) + clickable map legend with mode-switching toolbar (WHERE / EAT / STAY). 6 commits squashed. STAY marker color: Aizome Indigo `#3B4F81`. 136 stays render as zero pins until D7 lat/lng enrichment runs.
- **Phase D D5c Pass 2 (PRs #23/#24/#25/#26):** Editorial review complete. 114 safety_callouts shipped. Catalog 362 → 356 unique slugs.
- **Phase D D5a/b:** All 455 products enriched via ChatGPT regular chat. 215/455 image hit rate.
- **Phase D D2 (PR #10):** Japan Events 2026 cheat sheet.
- **Phase D D1 (PR #9):** Places API integration. 609/615 place_ids, 537 hours, 605 cached photos.
- **Phase B-3 cheat sheets (PRs #6, #7, #8):** /cheat-sheets live with 9 sheets.
- **Earlier Phase A/B/C work:** scaffolding, brand system, 384 products on /products, 335 places on /places, 282 Tabelog Hyakumeiten restaurants on /eat, self-hosted Mapbox GL JS unified /map.

### Pending PRs (open, unmerged)
- **Phase D D6 — Location filter for /eat and /places** (`phase-d-d6-location-filter`). /eat: 5 city chips. /places: 10 JNTO-region chips. URL params `?where=`, `?region=`. Feature-complete, Lighthouse 100/100/100. Worth merging soon. Note: /stay already uses the same region taxonomy via its own implementation in PR #32; merging this unifies the implementation across pages.
- **Search + newest-first sort** (`feature/search-and-sort`). Newest-first sort on /products + client-side search box atop /products and /places grids. /stay was shipped without these and will inherit them when this merges (alphabetical sort is a placeholder). Worth merging soon.

## What's in flight
- _(none — /stay launch shipped. Next session opens on D7 stay enrichment.)_

## What's queued

### Strategic / architectural (top of stack — next workstream)

- **D7 — Stay lat/lng enrichment.** Parallels D1 for /places. Run enrichment against the 136 stay YAMLs to populate `place_id`, `lat`, `lng`, `photo_cache_path`. Cost: ~$10 (136 × $0.07). **Auto-mode OFF in CC** (paid API + supervised mode reminder). Until D7 runs, /map's STAY mode shows the empty-state message and zero pins AND /stay cards render as color blocks instead of photos. Template fall-through already in place: cards swap to photo-mode per-entry as enrichment lands; no template changes needed.

- **Small housekeeping PR.** Two items: (a) untracked Python helpers in repo root (`fix_*.py`, `merge_*.py`, Katsunuma webp, etc.) — decide commit-to-scripts/ vs delete; (b) /map ↔ MapView dedup (PROJECT_STATE has had `0b97ad3` queued for this; PR #32's rename pass surfaced PLACES_LEGEND duplication across map.astro and MapView.astro that's currently held in sync by comments only). The two items can fold into one small PR, or split. Either way it's <1 session of work. Recommended sequence: after D7 (so /map dedup happens against final-state code with stay pins present).

- **Phase A.10 — Map UX consolidation.** Fold the 3 toolbar chips (WHERE / EAT / STAY) into the legend panel header. Current state has chips top-left and legend bottom-left — diagonal eye-jump between two related controls. Major sites consolidate source + cluster filters into one spatial anchor.

### Strategic / architectural (next tier)

- **Per-item pages (`/products/<slug>`, `/places/<slug>`, `/eat/<slug>`, `/stay/<slug>`).** Today every entry exists ONLY as a card on the single listing page — no detail routes. Needed for: direct-link strategy, SEO (indexable per-item URLs), future webshop integration, Pagefind search. Scale: ~1,403 pages total (now including 136 stays). Biggest remaining workstream. Probably 3-4 CC sessions.

- **ManyChat conditional email capture + /products & /places default flows.**

### Design work (not CC)

- **Homepage "Going to Japan?" section redesign.** Claude Design brief drafted 2026-05-26 evening. Three variants requested: ICON-FORWARD, NUMBERED-LIST, CHIPS-AND-CARDS. Strict brand palette + imagery constraints. Verify against brand.md before passing to CC for implementation.
- **Cheat sheets redesign.** Brief drafted 2026-05-27. Same constraint pattern. Sequential after homepage (one at a time prevents drift).

### Phase D continued

- **D3: Steven photo override on top-N cards.** Manual pace, ongoing. Steven's IG/Reels photos override on highest-leverage cards. Now applies to /stay too once D7 ships.

### Phase D — site-wide eval pass (later, after current stack ships)

Structured 3–5 hour task: Performance baseline (Lighthouse), banned-words pass, axe a11y audit, brand voice review, UX pattern audit, content quality audit, 2–3 friend user tests. Now includes /stay in scope.

### Small follow-ups
- **Matsuyama Castle re-enrichment.** Matched to wrong place. Fix: edit YAML, delete place_id fields, re-run enrich script. Paid API — auto-mode OFF.
- **Hero photo brand-coherence outcome check.** Overdue. Look at live site with Google photos in place. Decide: keep or roll back to color blocks + accelerate D3.
- **136 stays seed vet.** Manual cull once D7 makes them visible on map. Build kill list, batch delete YAMLs.

### Background queue
- 21 v2-deferred product items review (probably folded into D5c)
- "Browse the catalog" homepage CTA → brand voice revision
- Cuisine chip single-select alignment across pages (now applies to all four list pages)
- Sub-chip behavior decision on /products
- Unused `--color-tokyo-red-dark` token prune in global.css
- POSSIBLE_MISSING_FLAGS audit (102 product slugs)
- Scenic transport as LineString routes on /map (future polish)

## Active decisions log

### 2026-05-27 (afternoon) — PR #32 carry-overs
- **Nav placement for "Stay":** between Eat and Finds. Order: Where · Eat · Stay · Finds · Cheat Sheets · Shop Waitlist · Partner. Reasoning: trip-planning verb sequence (places → food → lodging → things to bring home), commerce pushed right.
- **Price tier chip styling:** yen glyphs (¥ / ¥¥ / ¥¥¥ / ¥¥¥¥) on Concrete Gray background, Ink Black text. Monochrome with quantitative glyphs is travel-site convention (Booking, Tabelog). Tokyo Red and Matcha Green reserved for their existing semantic roles.
- **/stay cards launch as color blocks, not photos.** Template fall-through is in place — photos render automatically per-entry when D7 populates `photo_cache_path`. Mirrors the /eat launch pattern (color blocks first, photos in a follow-up).
- **Sort = alphabetical on /stay.** Placeholder until the pending search-and-sort PR merges. /stay inherits newest-first + client-side search at that point.
- **/map duplication held in sync by comments.** PLACES_LEGEND duplicated across map.astro and MapView.astro deliberately not dedup'd in PR #32 to keep the rename commit small. Belongs in the queued /map ↔ MapView dedup work (`0b97ad3`), which just notched up in priority because the duplication created risk during the rename.

### 2026-05-27 (morning)
- **/add-eats is a low-frequency tool.** Tabelog Hyakumeiten is a finite curated set (~280 restaurants). /eat is fully populated. /add-eats exists for when Tabelog publishes new annual lists, not for posting-cadence use. /add-places is the high-frequency posting-workflow command.
- **Hotels go in /stay, not /places.** User job determines categorization: "where should I sleep?" → /stay. "Where should I drop by for an experience?" → /places. Edge cases (iconic hotel bars / design landmarks people visit without booking) → can go in /places under whatever category fits, but default to /stay.
- **/places "Onsen & Ryokan" → renamed to "Onsen Towns"** (shipped in PR #32). Clarifies it's about destination towns, NOT specific properties to book. Eliminates apparent duplicate vs /stay "Onsen ryokan" chip. Internal slug `onsen_ryokan` retained.

### Phase A.9 (2026-05-26)
- 9 stay chips (consolidated from 12): `city_hotel` folded into `design_hotel`; `floating_ryokan` folded into `resort`. Display label rewrites: `design_boutique → Design hotel`, `glamping_cabin → Glamping`, `temple_lodging → Temple stay`. `capsule_themed` slug retained; display "Capsule & novelty."
- STAY marker color: Aizome Indigo `#3B4F81`. Not added to brand.md — map cluster colors are an extended palette by necessity.
- Toolbar taxonomy: SEE/DO/EAT/STAY → WHERE/EAT/STAY. SEE/DO were vibe descriptors, not real categories.
- Mode-switching toolbar, not co-filter. Single primary filter + scoped sub-filters within active mode.
- Click-to-focus on legend rows, single-select within source.
- Group headers are non-interactive labels.
- Popup CTA labels: "More about this place →" / "More about this restaurant →" (no "/" in copy). Anchor link to /places#slug or /eat#slug. Same label survives when per-item routes ship.
- URL scheme: `?mode=<source>` + optional `?cluster=<slug>`. Legacy URLs auto-rewrite.

### Map migration (2026-05-26)
- Public maps migrated to self-hosted Mapbox GL JS. Unified `/map` shows /places + /eat + /stay content.

### Cost kill (2026-05-24) + followup gap caught 2026-05-27
- Enrichment script defaults to photos-only. `--hours` only when needed.
- Live "open now" status dropped from /places and /eat cards. `OpenNowBadge.astro` deleted.
- **The prebuild hook in package.json was still calling `enrich:refresh` with `--hours-only` on every Vercel build despite the UI no longer using hours. Cost: $90.62 over 7 days before discovery. Fixed in PR #31.**

### Pre-Phase-C decisions (carried)
- Photo strategy reversed 2026-05-19 to Google Places API hero photos.
- Restaurant curation framing: "Steven aggregates Tabelog Hyakumeiten. Honest about it."

### Phase C / B-3 / Brand decisions (2026-05-18)
- 282 Tabelog Hyakumeiten restaurants. 13 cuisine chips ordered specialty-first.
- `.chip--red` uses ink text. `.chip--green` uses darkened variant `#3f7548` + white text.
- Subtle text token `--color-ink-60` defined in brand.md.

### Phase D D1 closing decisions (2026-05-19)
- Pin description format: brand-voice two-line dense.
- Hero photo aspect ratio: `3 / 2`.

### D5 decisions (2026-05-19)
- ChatGPT regular chat won 4-tool bake-off. Deep-research modes are categorically wrong for structured data extraction.
- 25-product batches held quality.

## Files in Claude project
- `brand.md` — locked brand spec.
- `preferences.md` — Steven's working preferences.
- `PROJECT_STATE.md` — this file.
- `STAY_LAUNCH_BUILD_SPEC.md` — /stay launch bundle build spec (historical, shipped via PR #32).

## Files in repo (`docs/build/`)
- `PHASE_A9_BUILD_SPEC.md` — Phase A.9 build spec
- `stays_seed.csv` — 136-row stays seed CSV
- `QUICK_ADD_COMMANDS_BUILD_SPEC.md` — Quick-Add build spec
- `STAY_LAUNCH_BUILD_SPEC.md` — /stay launch bundle build spec (PR #32)
- `OVERNIGHT_QUESTIONS.md` — 2026-05-27 overnight cleanup PR root-cause analysis
- `BUILD_SPEC_cost_kill.md`, `BUILD_SPEC_d5b5_finish.md`, `BUILD_SPEC_d5c_editorial_review.md`, `BUILD_SPEC_d5d_download_merge.md` — historical Phase D specs

## Files on Desktop (upload per chat as needed)
- `PROMPT_v2_1.md` — D5 final enrichment prompt
- `PHASE_D_PRIORITIZATION.md` — Phase D strategy doc v2
- `stays_merged.json` — Phase A.9 reference: 136 stays with audit fields
- `01_Travel_Cheat_Sheets_Source_of_Truth_v1.docx` — B-3 research source

## Conversation handoff rules
- New chat = paste this doc at top + state workstream + paste relevant Desktop files (or rely on project-files auto-load).
- Update this doc immediately after any decision reversal — don't wait for "after the next milestone."
- Decisions get marked as "locked" only after Steven explicit confirmation.
- Don't replay decisions across chats — reference the log above.
- One chat = one workstream; one branch per chat.

### For D7 next chat (immediate next session)
Claude Code session. **Auto-mode OFF in CC** (paid Google Places API ~$10 for 136 stays). Adapt existing `enrich_with_places_api.py` to read `src/content/stays/*.yaml` and populate `place_id`, `lat`, `lng`, `photo_cache_path` (defaults to photos-only per Cost-Kill decision). Verify pin count matches 136 in build log after run. Template fall-through on StayCard already in place — photos appear on /stay cards automatically as YAMLs gain `photo_cache_path`.

### For the housekeeping PR (after D7)
Claude Code session, auto-mode ON (no paid APIs, feature branch). Two items, can be one branch or split: (a) untracked Python helpers — `git mv` into `scripts/` plus `.gitignore` for orphan assets like the Katsunuma webp; (b) /map ↔ MapView dedup — collapse PLACES_LEGEND and other duplication held in sync by comments. Use the queued `0b97ad3` as starting point if it's still on a branch somewhere; otherwise rebuild against current main.

### For Phase A.10 next chat (after housekeeping)
Map UX consolidation. Fold the 3 toolbar chips into the legend panel header. Single control surface, one spatial anchor.
