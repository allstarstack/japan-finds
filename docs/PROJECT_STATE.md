# Japan Finds — Project State

**Last updated:** 2026-05-28 (evening) — Shipped: **A.10 map control surface consolidation** on `feat/a10-map-control-surface`. WHERE / EAT / STAY toolbar folded into the legend panel header as a Variant A segmented control (trimmed: single meta row, not two). Real taxonomy bound from `map-legends.js` — the mock's invented STAY list was caught and replaced (Glamping / Design hotel / Heritage hotel etc. are the real clusters, not the mock's Ryokan / Capsule / Boutique inference). EAT swatch corrected to brand red `#FF3B30` (mock had `#D7322E`). Reset button retired — re-tapping a cluster row clears, matching the existing single-select interaction. Mobile sheet opens peeking (~140px, header + ~3 rows). One file touched: `src/pages/map.astro`. Queued next: /stay LIST/MAP toggle (pairs with A.10, shared files).

## What this is
The traveling state doc. Drop at the top of any new chat for full context in ~500 tokens instead of replaying history. Update after major milestones — and AFTER any decision reversal, immediately.

## Site state
- **URL:** japan.allstarsteven.com
- **Stack:** Astro 6 + vanilla CSS + Vercel
- **Repo:** github.com/allstarstack/japan-finds
- **Local path:** ~/Desktop/builds/japan-finds
- **Brand spec:** `brand.md` (Claude project files) — source of truth for voice, palette, type, banned content
- **Counts:** 363 places · 282 restaurants (Tabelog Hyakumeiten) · 135 stays · ~384 products (latest add: JF-0470) · 10 cheat sheets

## What's shipped (most recent first)
- **A.10 — Map control surface consolidation (`feat/a10-map-control-surface`):** Single `src/pages/map.astro` change. Removed the top `.map-toolbar` (3 mode chips + Reset, ~80 lines CSS) and replaced the legend with a Variant A segmented header — full-width 3-up pill (WHERE / EAT / STAY), 1.5px ink dividers between segments, ink-fill + rice text on active. Single meta row underneath: `N clusters · M pins` (mono 10px ink-60) + collapse caret. Group headers renamed *places / restaurants / lodging* (non-interactive mono). Per-row pin counts (right-aligned, tabular). Mobile bottom sheet defaults to peek (~140px showing header + first ~3 rows); tap caret expands to 380px max with scroll. Pin-color binding is live, not eyeballed: WHERE per-cluster color reads from `PLACES_LEGEND_ROWS.color` (same dict as the Mapbox `PLACES_PAINT_COLOR` expression); EAT ring is `#FFFFFF` fill / `#FF3B30` stroke matching `EAT_RING_FILL` / `EAT_RING_STROKE`; STAY is `#3B4F81` matching `STAY_PIN_COLOR`. Build-time per-cluster counts added to frontmatter via existing places.geojson scan. Live totals: WHERE 384 · EAT 282 · STAY 135 across 36 clusters.
- **Filter-block rework (merged to main, de2eb48):** All four list pages (/places, /eat, /stay, /products). The `.rail-sticky` filter block (search + chip rows + view toggle) is no longer `position: sticky` — it scrolls away with the page, so the card grid gets the full viewport while browsing. Interaction unchanged: inline, live chip filtering, no modal. On /places + /eat the LIST/MAP view-toggle moved off the top filter block onto the **results-count row** ("N PLACES" left, toggle right) — it's a results-view mode, not a filter input. The compact-sticky `FilterShell` + Filters→sheet pattern was built first, then abandoned — see decisions.
- **PR #42 — Homepage section dividers (merged):** SectionDivider between consecutive `<main>` children; old heavy ink-black borders removed. Divider-contrast follow-up resolved with a visible-but-subtle ink hairline (the Concrete-Gray-on-Rice-White invisibility trap, ~1.1:1, was the bug).
- **PR #41 — List-page consistency (merged):** /eat got SearchBox + RestaurantCard data-search + ChipRow; featured "six to start with" removed from /places + /products. ⚠️ Its "all four list pages now uniform" claim is FALSE — a prior session's audit found four per-page rails on two shared atoms.
- **PRs #37–#40 (merged):** Cheat-sheets V4 redesign (#37), cross-page layout consistency (#38), Going-to-Japan V4 alignment (#39/#40). See git log for detail.
- **D7 stay enrichment:** 135/135 stays enriched with coordinates (~$9.87). This removed the original blocker for a /stay map view (stays now have lat/lng).

## What's in flight
- Nothing active. A.10 is shipped; pick a queued workstream below.

## What's queued

### Next workstreams (one chat each)
- **/stay LIST/MAP toggle (AUDITED — ~half a day, not a build) — RECOMMENDED NEXT.** The shared map already has a complete, working STAY mode — Aizome Indigo pins (#3B4F81), WHERE/EAT/STAY toolbar (now A.10-consolidated), popups with a "Visit hotel site →" CTA, mode filtering, URL state. D7 filled all 135 stay coords, so the original "no lat/lng" blocker is gone. Delta: ~6 surgical `MapView.astro` edits (widen `sourceFilter` + `legendKind` unions to include `"stay"`; add `STAY_PAINT`; 3-way paint selector; stay popup branch lifted from `map.astro:1302-1327`); one `stay:filter-changed` event at the end of `StayFilterRail` `apply()` (mirror `PlaceFilterRail`); copy-paste the view-toggle section + `setView` script from `places.astro` into `stay.astro`; check `StayCard` has `data-slug` for the seed-from-DOM path; scrub stale "no lat/lng / no map this phase" comments (`generate-geojson.mjs:18-22,121-125`; `map.astro:1238-1240`; `stay.astro:5-7`). Toggle inherits the count-row placement from the filter-block rework. **Pairs with A.10** — `map.astro` / `MapView.astro` context is still fresh; run next.
- **Sort data-signal.** Make newest-first an honest default on /places, /eat, /stay. It currently isn't possible because their date fields are batch enrichment stamps, not real add-dates — so the pages default to alphabetical (honest given the data). Lever: give these collections a real monotonic add-signal like /products' JF-#### IDs, stamp new adds going forward, baseline the existing bulk, then sort newest-desc with alphabetical as the tiebreaker. NO sort menu (dimensions too thin; page is filter-first). Possible /stay price *filter* (`price_tier` exists). First step: read-only data check for whether a usable add-order already exists before inventing one.

### Quick / pending decisions
- **Neighborhood-granularity test.** /places + /stay (+ /eat) search matches name + prefecture/region/area. Does it catch neighborhood level (type "Shinjuku" in /places search)? Filters → done; only matches coarser → a separate small enhancement, low priority.

### Strategic / architectural (own focused sessions)
- D8 — per-restaurant Tabelog URL backfill (282 /eat, scraping + review queue, supervised).
- Per-item pages (`/products/<slug>` etc., ~1,403 pages) — biggest remaining workstream, 3–4 CC sessions.
- /cheat-sheets affiliate placement pass (eSIM in Phone Setup + First 24 Hours + /tools; relevance-anchored).
- ManyChat conditional email capture.

### Small follow-ups
- **Place-count inconsistency (now 4 surfaces):** /places search placeholder reads "Search 333 places", the ALL JAPAN chip reads 363, the generated geojson emits 384 place features, **and as of A.10 the /map legend meta row displays "384 pins" under WHERE**. Reconcile the source of truth — when fixed, update all four surfaces in one PR.
- **Matsuyama Castle re-enrichment** — wrong place match; edit YAML, delete place_id, re-run. Paid API → auto-mode OFF.
- **136→135 stays seed vet** — manual cull.
- **D3 photo overrides** — densho-sen-nen-no-yado-sakan is priority (place_id but no Google photo).
- **Hero photo brand-coherence check** — overdue.

## Active decisions log

### 2026-05-28 (evening) — A.10 ship
- **Variant A locked, trimmed.** Three-segment ink-fill control (vs B folder tabs / C dial chip). A wins on criterion 2 (mode unambiguous) — the workstream's actual reason for existing. C's footprint advantage neutralized by mobile peek default + collapse. Trimmed the design's two-line header to one meta row (count + caret), reclaiming ~24px.
- **Legend pin-color binding is live, not hardcoded.** WHERE colors read from `PLACES_LEGEND_ROWS.color` (which feeds the Mapbox paint expression); EAT ring reads from `EAT_RING_FILL` / `EAT_RING_STROKE`; STAY reads `STAY_PIN_COLOR`. Pattern for any future legend: swatch === pin via shared module, never a typed hex.
- **Reset button retired.** Re-tap on an active cluster row clears the filter (existing `setupLegendRows` behavior). The dedicated Reset chip was redundant in the consolidated control surface.
- **Mobile default = peek (~140px, header + ~3 rows)**, over fully collapsed. A legend you can't see without tapping partly defeats criterion-3 (pin coding legible in the legend).
- **STAY taxonomy correction.** Design mock inferred a stale STAY taxonomy (Ryokan / Onsen Ryokan / Capsule / Business hotel / Boutique / Minshuku / Temple lodging / Hostel). Real taxonomy per `map-legends.js` is Onsen ryokan / Design hotel / Machiya & kominka / Glamping / Resort / Capsule & novelty / Mountain lodge / Heritage hotel / Temple stay (9 clusters). Caught by the spec's Step 0 read-real-code precondition.

### 2026-05-28 (afternoon) — Filter-block decisions
- **Filter-block: compact-sticky shell / Filters→sheet pattern ABANDONED.** First principles: the real problem was narrow — the sticky block ate the viewport *while scrolling*; inline live filters at the top were never the problem. **Resolution: make the filter block non-sticky** (scrolls away). No modal, no pills, no extra steps; cards get the viewport while browsing.
- **The LIST/MAP toggle is a view-mode, not a filter input** → it lives on the results-count row ("N PLACES" + toggle right), not in the search/chip cluster. This is the standard placement; /stay inherits it when its toggle lands.
- **Sort REOPENED.** Alphabetical on places/eat/stay is honest only because the data lacks a real add-signal (dates are enrichment-batch stamps). Recommendation: add an add-signal à la products' JF IDs → newest-desc default with alphabetical tiebreaker. No sort menu. See queued "Sort data-signal."

### Carried decisions (still in force)
- **/products = newest-first** (JF IDs are a real recency signal). places/eat/stay = alphabetical for now (no honest recency signal yet — see Sort reopened).
- Hotels → /stay; iconic-hotel-bar edge cases can go /places. /places "Onsen & Ryokan" displays "Onsen Towns" (slug `onsen_ryokan`). STAY map marker = Aizome Indigo #3B4F81. Single-select category chips across list pages.
- Enrichment defaults photos-only. Prebuild hook no longer calls paid API (the $90.62 leak, fixed PR #31).
- ChatGPT regular chat won the enrichment bake-off; deep-research modes wrong for structured extraction.
- Restaurant framing: "Steven aggregates Tabelog Hyakumeiten. Honest about it."
- IA principle: cheat sheets own HOW/logistics; /places/eat/stay/products own WHERE/WHAT.
- Affiliate density: relevance-anchored inside topical sheets, not scattered on cards.

## Key process learnings (recent sessions)
- **Trust real code over mockup / prior claims — again.** A.10's Step 0 precondition caught the design mock's invented STAY taxonomy (8 wrong names) and the EAT pin-color drift (#D7322E vs the real #FF3B30). Two sessions running, the read-real-code-first pattern saved the build from a confidently-stated-but-wrong artifact. The mock was an *output of this same workflow*, fresh — not stale changelog claims. Verify even fresh artifacts against the code. *(Strong candidate for promoting to `preferences.md` Working patterns if not already there in a strengthened form.)*
- **A fix that adds steps or hides what you're acting on is the wrong abstraction.** From the prior filter-block session: the Filters→sheet pattern hid the grid behind a sheet, added open→pick→close steps, and spawned an ugly pills component. The "ugly pills" were a *symptom* of the wrong approach, not a design bug to polish. Kill the abstraction; don't polish its outputs. *(Cross-cutting; promote to preferences if recurs.)*
- **Place a control by its semantics.** A view-toggle is a results-view mode → count row, not the filter cluster. A mode-switcher belongs *with* the legend it controls → unified header, not a separate toolbar. Both A.10 and the filter-block work resolved on this principle.

## Files in Claude project
- `brand.md`, `preferences.md`, `PROJECT_STATE.md` (this file).

## Files in repo (`docs/build/`)
- `A10_MAP_CONTROL_SURFACE_BUILD_SPEC.md` — A.10 spec; committed alongside this PR. Reference for any future map control-surface work.
- `HANDOFF_going-to-japan.md`, `CheatSheets_v4_source.jsx`, `d7_run_log.json`, `STAY_LAUNCH_BUILD_SPEC.md`, `PHASE_A9_BUILD_SPEC.md`, `QUICK_ADD_COMMANDS_BUILD_SPEC.md`, `stays_seed.csv`, plus historical Phase D specs.
- Note: `FILTER_HEADER_BUILD_SPEC.md` specced the abandoned `FilterShell` approach and is no longer in the repo — don't resurrect it.

## Conversation handoff rules
- New chat = paste/rely on this doc + state the workstream.
- One chat = one workstream; one branch per chat (exception: a "polish pass" of independent small fixes).
- Update immediately after any decision reversal.
- CC auto-accept OFF for: paid APIs (Google Places), main-touching, destructive git ops. ON for feature-branch UI/content work.
- CC handoff threshold: any task touching 2+ files or needing iterative bug-fix → build spec to CC, not chat-terminal relay.
- Git wrap-up (commit/push of a feature branch, PR merge, branch delete) is run by Steven in the terminal, not routed through CC — merge/delete are main-touching + destructive.

### Next chats (any order; the map ones still pair)
1. **/stay LIST/MAP toggle** — paste this doc + the read-only stay-map audit from the prior chat history. ~half-day build; inherits the count-row toggle placement. Pairs with A.10 — run next while `map.astro` / `MapView.astro` context is fresh.
2. **Sort data-signal** — paste this doc; start with the read-only data check (does a usable add-order already exist?), then spec the schema field + sort tiebreaker. Independent of the map work.
