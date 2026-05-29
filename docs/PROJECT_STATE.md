# Japan Finds — Project State

**Last updated:** 2026-05-28 (late evening) — Shipped: **/places add-signal + newest-first sort** on `feat/places-add-signal`. places had no honest recency signal (only a random Google `place_id` + a `hours_cache_date` cache-stamp), so invented a monotonic `id: jf-place-####` mirroring products' `JF-####` / stays' `jf-stay-####`. Baseline order = git first-add-date backbone + filename-alpha tiebreak within a date batch (oldest add → lowest id); existing 385 stamped `jf-place-0001…0385`; schema-first (optional → stamp → required); `/places` now sorts id-desc. **Sort data-signal workstream RESOLVED:** places SHIPPED, /eat DROPPED (deliberate ranked sort, not alphabetical), /stay sort FOLDED into the next map chat (shares `stay.astro`). Earlier today also shipped **A.10 map control surface** on `feat/a10-map-control-surface`.

## What this is
The traveling state doc. Drop at the top of any new chat for full context in ~500 tokens instead of replaying history. Update after major milestones — and AFTER any decision reversal, immediately.

## Site state
- **URL:** japan.allstarsteven.com
- **Stack:** Astro 6 + vanilla CSS + Vercel
- **Repo:** github.com/allstarstack/japan-finds
- **Local path:** ~/Desktop/builds/japan-finds
- **Brand spec:** `brand.md` (Claude project files) — source of truth for voice, palette, type, banned content
- **Counts:** 363 places · 282 restaurants (Tabelog Hyakumeiten) · 135 stays · ~384 products (latest add: JF-0470) · 10 cheat sheets
- **ID schemes:** products `JF-####` (→JF-0470), stays `jf-stay-####` (→jf-stay-0136), places `jf-place-####` (→jf-place-0385, NEW). All monotonic; used as the newest-first recency signal where the sort is id-desc.

## What's shipped (most recent first)
- **/places add-signal + newest-first sort (`feat/places-add-signal`):** places had no honest recency signal (only random Google `place_id` + `hours_cache_date` cache-stamp), so invented `id: jf-place-####`. Baseline for the existing 385 = git first-add-date as the chronological backbone + filename-alpha tiebreak within a batch (oldest add → lowest id), so id-desc surfaces the newest batch first. Schema-first: `placeSchema` got `id` optional → throwaway baseline script stamped all 385 (surgical line-prepend, NOT reserialize; self-verified round-trip parse + contiguity) → tightened to `z.string()` required so future adds must carry an id. `/places` sort swapped alpha→id-desc with a trailing-digit comparator mirroring `products.astro`. Verified before commit: build passes with id required; exactly 387 files changed (385 YAML + `schemas.ts` + `places.astro`, nothing else); 385 unique ids contiguous `jf-place-0001…0385` (proved via diff-against-seq). Top of /places: 0385 (05-27 singleton) → 0334–0384 (51 from 05-26) → 0019–0333 (05-18) → 0001–0018 (05-16). Throwaway script deleted. Spec: `docs/build/PLACES_ADD_SIGNAL_BUILD_SPEC.md`.
- **A.10 — Map control surface consolidation (`feat/a10-map-control-surface`):** Single `src/pages/map.astro` change. Removed the top `.map-toolbar` (3 mode chips + Reset) and replaced the legend with a Variant A segmented header — full-width 3-up pill (WHERE / EAT / STAY), ink-fill + rice text on active. Single meta row underneath: `N clusters · M pins` + collapse caret. Group headers renamed *places / restaurants / lodging*. Per-row pin counts. Mobile bottom sheet defaults to peek (~140px); caret expands to 380px max. Pin-color binding is live: WHERE reads `PLACES_LEGEND_ROWS.color`; EAT ring `#FFFFFF`/`#FF3B30` matching `EAT_RING_FILL`/`EAT_RING_STROKE`; STAY `#3B4F81` matching `STAY_PIN_COLOR`. Live totals: WHERE 384 · EAT 282 · STAY 135 across 36 clusters.
- **Filter-block rework (merged to main, de2eb48):** All four list pages. The `.rail-sticky` filter block is no longer `position: sticky` — it scrolls away, so the card grid gets the full viewport. On /places + /eat the LIST/MAP toggle moved off the filter block onto the **results-count row** ("N PLACES" left, toggle right) — it's a results-view mode, not a filter input. The compact-sticky `FilterShell` + Filters→sheet pattern was built first, then abandoned — see decisions.
- **PR #42 — Homepage section dividers (merged):** SectionDivider between consecutive `<main>` children; old heavy ink-black borders removed. Divider-contrast resolved with a visible-but-subtle ink hairline (the Concrete-Gray-on-Rice-White invisibility trap was the bug).
- **PR #41 — List-page consistency (merged):** /eat got SearchBox + RestaurantCard data-search + ChipRow; featured "six to start with" removed from /places + /products. ⚠️ Its "all four list pages now uniform" claim is FALSE — a prior audit found four per-page rails on two shared atoms.
- **PRs #37–#40 (merged):** Cheat-sheets V4 redesign (#37), cross-page layout consistency (#38), Going-to-Japan V4 alignment (#39/#40). See git log.
- **D7 stay enrichment:** 135/135 stays enriched with coordinates (~$9.87). Removed the original blocker for a /stay map view.

## What's in flight
- Nothing active. /places add-signal shipped; pick a queued workstream below.

## What's queued

### Next workstreams (one chat each)
- **/stay LIST/MAP toggle (AUDITED — ~half a day, not a build) — RECOMMENDED NEXT.** The shared map already has a complete, working STAY mode — Aizome Indigo pins (#3B4F81), WHERE/EAT/STAY toolbar (now A.10-consolidated), popups with a "Visit hotel site →" CTA, mode filtering, URL state. D7 filled all 135 stay coords. Delta: ~6 surgical `MapView.astro` edits (widen `sourceFilter` + `legendKind` unions to include `"stay"`; add `STAY_PAINT`; 3-way paint selector; stay popup branch lifted from `map.astro:1302-1327`); one `stay:filter-changed` event at the end of `StayFilterRail` `apply()`; copy-paste the view-toggle section + `setView` script from `places.astro` into `stay.astro`; check `StayCard` has `data-slug`; scrub stale "no lat/lng / no map this phase" comments. Toggle inherits the count-row placement from the filter-block rework. **ALSO lands the /stay newest-first sort for free** (one-line id-desc comparator using `jf-stay-####`, mirror `places.astro`) — folded here to avoid a second branch on `stay.astro`. **Pairs with A.10** — `map.astro`/`MapView.astro` context still fresh; run next.

### Quick / pending decisions
- **Neighborhood-granularity test.** /places + /stay (+ /eat) search matches name + prefecture/region/area. Does it catch neighborhood level (type "Shinjuku" in /places search)? Filters → done; only matches coarser → a separate small enhancement, low priority.

### Strategic / architectural (own focused sessions)
- D8 — per-restaurant Tabelog URL backfill (282 /eat, scraping + review queue, supervised).
- Per-item pages (`/products/<slug>` etc., ~1,403 pages) — biggest remaining workstream, 3–4 CC sessions.
- /cheat-sheets affiliate placement pass (eSIM in Phone Setup + First 24 Hours + /tools; relevance-anchored).
- ManyChat conditional email capture.

### Small follow-ups
- **Place-count inconsistency (now 5 surfaces):** /places search placeholder reads "Search 333 places", the ALL JAPAN chip reads 363, the generated geojson emits 384 place features, the /map legend meta row displays "384 pins" under WHERE, **and the places collection holds 385 YAML files** (the count the jf-place baseline used). Reconcile the source of truth — when fixed, update all surfaces in one PR.
- **places `place_id` duplicates:** the add-signal data check found 8 `place_id`s appearing twice (2× each) across the 385 files — possible duplicate place entries. Investigate; may be a dedupe, may be legit shared-venue cases.
- **Matsuyama Castle re-enrichment** — wrong place match; edit YAML, delete place_id, re-run. Paid API → auto-mode OFF.
- **136→135 stays seed vet** — manual cull (explains the jf-stay-0136-vs-135-files gap).
- **D3 photo overrides** — densho-sen-nen-no-yado-sakan is priority (place_id but no Google photo).
- **Hero photo brand-coherence check** — overdue.

## Active decisions log

### 2026-05-28 (late evening) — Sort data-signal resolved + /places shipped
- **Per-collection verdict from the read-only data check (YAML-aware):** products `id: JF-####` = the recency signal (control, already newest-first); stays ALREADY carries `id: jf-stay-####` on all 135 (no invention); places had NO signal (only random `place_id` + `hours_cache_date` cache-stamp) → invented `jf-place-####`; /eat is NOT a collection — it's `src/data/restaurants.json`, sorted cuisine-chip-order → `rank_in_city` asc (deliberate, "no sort controls" out of scope per its build spec).
- **/eat DROPPED from the workstream.** Newest-first is the wrong goal for a curated ranked guide — "most recently added restaurant" is worse than "the #1 Hyakumeiten pick." The queued premise ("all three default to alphabetical, none has a signal") was wrong on two of three — written from memory, not the file. Trust-real-code-over-prior-claim, again.
- **/stay sort FOLDED into the LIST/MAP toggle chat.** One-line id-desc comparator on the existing `jf-stay-####`. Two branches off main both editing `stay.astro` = guaranteed conflict (the PR-base-ordering trap); a one-liner doesn't earn its own branch when a chat editing the same file is next anyway.
- **/places baseline = git-date backbone + alpha tiebreak.** Between-batch git add-dates are real chronology (exactly what newest-first cares about most); within a batch there's none, so alpha is just a stable tiebreak, no chronology claimed. Strictly more honest than pure-alpha id assignment; costs one extra sort key.
- **Completeness proof = build-passes-with-required-id**, not the diff count. Astro throws on any place missing a required `id`, so a clean build proves all 385 are stamped — stronger than counting files. This mattered because CC's first file-count summary was internally contradictory (387/385/361); the 361 was just `git diff --stat` display truncation, settled by a raw `git status --porcelain` count. *(Two cross-cutting candidates for `preferences.md`: "a required schema field is a stronger completeness proof than a file count," and "verify CC's raw command output, not its narrative summary — the summary was muddy, the raw numbers were clean.")*

### 2026-05-28 (evening) — A.10 ship
- **Variant A locked, trimmed.** Three-segment ink-fill control (vs B folder tabs / C dial chip). A wins on criterion 2 (mode unambiguous). C's footprint advantage neutralized by mobile peek default. Trimmed the design's two-line header to one meta row, reclaiming ~24px.
- **Legend pin-color binding is live, not hardcoded.** Pattern for any future legend: swatch === pin via shared module, never a typed hex.
- **Reset button retired.** Re-tap on an active cluster row clears the filter (existing `setupLegendRows` behavior).
- **Mobile default = peek (~140px)**, over fully collapsed.
- **STAY taxonomy correction.** Design mock inferred a stale STAY taxonomy. Real taxonomy per `map-legends.js` is Onsen ryokan / Design hotel / Machiya & kominka / Glamping / Resort / Capsule & novelty / Mountain lodge / Heritage hotel / Temple stay (9 clusters). Caught by the spec's Step 0 read-real-code precondition.

### 2026-05-28 (afternoon) — Filter-block decisions
- **Filter-block: compact-sticky shell / Filters→sheet pattern ABANDONED.** The real problem was narrow — the sticky block ate the viewport *while scrolling*; inline live filters were never the problem. **Resolution: make the filter block non-sticky** (scrolls away). No modal, no pills, no extra steps.
- **The LIST/MAP toggle is a view-mode, not a filter input** → results-count row, not the search/chip cluster. /stay inherits it when its toggle lands.
- **Sort REOPENED** → now RESOLVED (see late-evening entry).

### Carried decisions (still in force)
- **Recency signal = id-desc** where an id scheme exists: /products (`JF-####`), /places (`jf-place-####`, NEW), and /stay (`jf-stay-####`, sort pending the map chat). /eat stays on its deliberate cuisine→rank sort. No sort menu anywhere (dimensions too thin; pages are filter-first).
- Hotels → /stay; iconic-hotel-bar edge cases can go /places. /places "Onsen & Ryokan" displays "Onsen Towns" (slug `onsen_ryokan`). STAY map marker = Aizome Indigo #3B4F81. Single-select category chips across list pages.
- Enrichment defaults photos-only. Prebuild hook no longer calls paid API (the $90.62 leak, fixed PR #31).
- ChatGPT regular chat won the enrichment bake-off; deep-research modes wrong for structured extraction.
- Restaurant framing: "Steven aggregates Tabelog Hyakumeiten. Honest about it."
- IA principle: cheat sheets own HOW/logistics; /places/eat/stay/products own WHERE/WHAT.
- Affiliate density: relevance-anchored inside topical sheets, not scattered on cards.

## Key process learnings (recent sessions)
- **A required schema field is a stronger completeness proof than a file count.** /places: a passing build with `id: z.string()` required proves all 385 files carry a valid id (Astro throws otherwise) — more reliable than the diff `--stat`, whose displayed list truncated and produced a confusing 361. *(Cross-cutting; candidate for `preferences.md`.)*
- **Verify CC's raw command output, not its narrative summary.** CC's prose summary contradicted itself on file counts (387/385/361); the raw `git status --porcelain` / `grep | sort -u | wc -l` output was clean and unambiguous. Ask for raw output before trusting a confident summary. *(Cross-cutting; candidate for `preferences.md`.)*
- **Trust real code over mockup / prior claims — again.** A.10's Step 0 caught the design mock's invented STAY taxonomy and EAT pin-color drift. The Sort workstream's queued premise (all three alphabetical, no signal) was wrong on stays + /eat. Verify even fresh artifacts against the code.
- **A fix that adds steps or hides what you're acting on is the wrong abstraction.** The abandoned Filters→sheet pattern hid the grid and spawned ugly pills — symptom of the wrong approach, not a design bug to polish.
- **Place a control by its semantics.** View-toggle → count row; mode-switcher → with the legend it controls.

## Files in Claude project
- `brand.md`, `preferences.md`, `PROJECT_STATE.md` (this file).

## Files in repo (`docs/build/`)
- `PLACES_ADD_SIGNAL_BUILD_SPEC.md` — places add-signal spec; committed alongside that PR.
- `A10_MAP_CONTROL_SURFACE_BUILD_SPEC.md` — A.10 spec.
- `HANDOFF_going-to-japan.md`, `CheatSheets_v4_source.jsx`, `d7_run_log.json`, `STAY_LAUNCH_BUILD_SPEC.md`, `PHASE_A9_BUILD_SPEC.md`, `QUICK_ADD_COMMANDS_BUILD_SPEC.md`, `stays_seed.csv`, plus historical Phase D specs.
- Note: `FILTER_HEADER_BUILD_SPEC.md` specced the abandoned `FilterShell` approach and is no longer in the repo — don't resurrect it.

## Conversation handoff rules
- New chat = paste/rely on this doc + state the workstream.
- One chat = one workstream; one branch per chat (exception: a "polish pass" of independent small fixes, or a bundled one-liner on a file the chat already edits — e.g. the /stay sort riding the map-toggle chat).
- Update immediately after any decision reversal.
- CC auto-accept OFF for: paid APIs (Google Places), main-touching, destructive git ops. ON for feature-branch UI/content work.
- CC handoff threshold: any task touching 2+ files or needing iterative bug-fix → build spec to CC, not chat-terminal relay.
- Git wrap-up (commit/push of a feature branch, PR merge, branch delete) is run by Steven — commit/push is fine in CC for a feature branch, but PR merge + branch delete (main-touching + destructive) stay out of CC, done on GitHub.

### Next chats (any order; the map ones still pair)
1. **/stay LIST/MAP toggle** — paste this doc + the read-only stay-map audit from prior chat history. ~half-day build; inherits the count-row toggle placement; ALSO lands the one-line /stay newest-first sort (id-desc on `jf-stay-####`). Pairs with A.10 — run next while `map.astro`/`MapView.astro` context is fresh.
