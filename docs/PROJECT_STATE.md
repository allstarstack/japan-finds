# Japan Finds — Project State

**Last updated:** 2026-05-28 (afternoon) — Shipped: filter-block rework (merged direct to main, commit de2eb48) — the four list pages' filter block is now non-sticky (scrolls away so cards get the viewport), and the LIST/MAP view-toggle moved to the results-count row. The compact-sticky `FilterShell` / Filters-sheet pattern was built first and abandoned as over-engineered (see decisions). Product JF-0470 added directly to main mid-session. Sort question reopened. Queued next: /stay map toggle (audited), A.10 map UX, sort data-signal.

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
- **Filter-block rework (merged to main, de2eb48):** All four list pages (/places, /eat, /stay, /products). The `.rail-sticky` filter block (search + chip rows + view toggle) is no longer `position: sticky` — it scrolls away with the page, so the card grid gets the full viewport while browsing. Interaction unchanged: inline, live chip filtering, no modal. On /places + /eat the LIST/MAP view-toggle moved off the top filter block onto the **results-count row** ("N PLACES" left, toggle right) — it's a results-view mode, not a filter input. The compact-sticky `FilterShell` + Filters→sheet pattern (search + Filters button + active-filter pills + mobile sheet) was built first, then abandoned — see decisions.
- **PR #42 — Homepage section dividers (merged):** SectionDivider between consecutive `<main>` children; old heavy ink-black borders removed. Divider-contrast follow-up resolved with a visible-but-subtle ink hairline (the Concrete-Gray-on-Rice-White invisibility trap, ~1.1:1, was the bug).
- **PR #41 — List-page consistency (merged):** /eat got SearchBox + RestaurantCard data-search + ChipRow; featured "six to start with" removed from /places + /products. ⚠️ Its "all four list pages now uniform" claim is FALSE — this session's audit found four per-page rails on two shared atoms (see learnings).
- **PRs #37–#40 (merged):** Cheat-sheets V4 redesign (#37), cross-page layout consistency (#38), Going-to-Japan V4 alignment (#39/#40). See git log for detail.
- **D7 stay enrichment:** 135/135 stays enriched with coordinates (~$9.87). This removed the original blocker for a /stay map view (stays now have lat/lng).

## What's in flight
- Nothing active. The filter-block workstream is closed. Next session = pick a queued workstream below.

## What's queued

### Next workstreams (one chat each)
- **/stay LIST/MAP toggle (AUDITED — ~half a day, not a build).** The shared map already has a complete, working STAY mode — Aizome Indigo pins (#3B4F81), WHERE/EAT/STAY toolbar, popups with a "Visit hotel site →" CTA, mode filtering, URL state — all built in Phase A.9 and sitting unused. D7 filled all 135 stay coords, so the original "no lat/lng" blocker is gone. Delta: ~6 surgical `MapView.astro` edits (widen `sourceFilter` + `legendKind` unions to include `"stay"`; add `STAY_PAINT`; 3-way paint selector; stay popup branch lifted from `map.astro:1302-1327`); one `stay:filter-changed` event at the end of `StayFilterRail` `apply()` (mirror `PlaceFilterRail`); copy-paste the view-toggle section + `setView` script from `places.astro` into `stay.astro`; check `StayCard` has `data-slug` for the seed-from-DOM path; scrub stale "no lat/lng / no map this phase" comments (`generate-geojson.mjs:18-22,121-125`; `map.astro:1238-1240`; `stay.astro:5-7`). Toggle inherits the count-row placement from PR #43.
- **A.10 — Map UX consolidation (design output READY).** Fold the WHERE/EAT/STAY mode toolbar into the legend panel header → one control surface. Spec: `docs/build/A10_MAP_CONTROL_SURFACE_BUILD_SPEC.md`. Run against the rubric (one control surface / unambiguous active mode / pin-colors legible / works on phone / brand tokens only / interaction model intact) → lock direction → spec CC. Pairs with the /stay toggle — both touch `map.astro` / `MapView.astro`, so run them back-to-back.
- **Sort data-signal (NEW).** Make newest-first an honest default on /places, /eat, /stay. It currently isn't possible because their date fields are batch enrichment stamps, not real add-dates — so the pages default to alphabetical (honest given the data). Lever: give these collections a real monotonic add-signal like /products' JF-#### IDs, stamp new adds going forward, baseline the existing bulk, then sort newest-desc with alphabetical as the tiebreaker. NO sort menu (dimensions too thin; page is filter-first). Possible /stay price *filter* (`price_tier` exists). First step: read-only data check for whether a usable add-order already exists before inventing one.

### Quick / pending decisions
- **Neighborhood-granularity test.** /places + /stay (+ /eat) search matches name + prefecture/region/area. Does it catch neighborhood level (type "Shinjuku" in /places search)? Filters → done; only matches coarser → a separate small enhancement, low priority.

### Strategic / architectural (own focused sessions)
- D8 — per-restaurant Tabelog URL backfill (282 /eat, scraping + review queue, supervised).
- Per-item pages (`/products/<slug>` etc., ~1,403 pages) — biggest remaining workstream, 3–4 CC sessions.
- /cheat-sheets affiliate placement pass (eSIM in Phone Setup + First 24 Hours + /tools; relevance-anchored).
- ManyChat conditional email capture.

### Small follow-ups
- **Place-count inconsistency:** /places search placeholder reads "Search 333 places", the ALL JAPAN chip reads 363, and the generated geojson emits 384 place features — three different numbers. Reconcile the source of truth.
- **Matsuyama Castle re-enrichment** — wrong place match; edit YAML, delete place_id, re-run. Paid API → auto-mode OFF.
- **136→135 stays seed vet** — manual cull.
- **D3 photo overrides** — densho-sen-nen-no-yado-sakan is priority (place_id but no Google photo).
- **Hero photo brand-coherence check** — overdue.

## Active decisions log

### 2026-05-28 (afternoon)
- **Filter-block: compact-sticky shell / Filters→sheet pattern ABANDONED** (reverses the pattern locked last session). The modal hid the results behind a sheet, added open→pick→close steps, and spawned an ugly active-filter pills component. First principles: the real problem was narrow — the sticky block ate the viewport *while scrolling*; inline live filters at the top were never the problem. **Resolution: make the filter block non-sticky** (scrolls away). No modal, no pills, no extra steps; cards get the viewport while browsing.
- **The LIST/MAP toggle is a view-mode, not a filter input** → it lives on the results-count row ("N PLACES" + toggle right), not in the search/chip cluster. This is the standard placement; /stay inherits it when its toggle lands.
- **Sort REOPENED** (reverses the prior "sort resolved, no change"). Alphabetical on places/eat/stay is honest only because the data lacks a real add-signal (dates are enrichment-batch stamps). Recommendation: add an add-signal à la products' JF IDs → newest-desc default with alphabetical tiebreaker. No sort menu. See queued "Sort data-signal."

### Carried decisions (still in force)
- **/products = newest-first** (JF IDs are a real recency signal). places/eat/stay = alphabetical for now (no honest recency signal yet — see Sort reopened).
- Hotels → /stay; iconic-hotel-bar edge cases can go /places. /places "Onsen & Ryokan" displays "Onsen Towns" (slug `onsen_ryokan`). STAY map marker = Aizome Indigo #3B4F81. Single-select category chips across list pages.
- Enrichment defaults photos-only. Prebuild hook no longer calls paid API (the $90.62 leak, fixed PR #31).
- ChatGPT regular chat won the enrichment bake-off; deep-research modes wrong for structured extraction.
- Restaurant framing: "Steven aggregates Tabelog Hyakumeiten. Honest about it."
- IA principle: cheat sheets own HOW/logistics; /places/eat/stay/products own WHERE/WHAT.
- Affiliate density: relevance-anchored inside topical sheets, not scattered on cards.

## Key process learnings (this session)
- **Trust real code over prior claims — again.** The read-only filter audit found PR #41's "all four list pages uniform" claim was false: four per-page rails (PlaceFilterRail / StayFilterRail / FilterRail / eat ChipRow) on two shared atoms, with divergent URL vocab, chip-class prefixes, and predicates. Changelog/screenshot claims keep needing code verification before they can ground a build.
- **A fix that adds steps or hides what you're acting on is the wrong abstraction.** The Filters→sheet pattern traded a mild annoyance (tall sticky block while scrolling) for real regressions: blind filtering (sheet covered the grid), extra steps, and an ugly pills component. The "ugly pills" were a *symptom* of the wrong approach, not a design bug to polish — two passes were spent polishing an artifact that shouldn't have existed. Kill the abstraction; don't polish its outputs. Removing code (non-sticky) beat adding it.
- **Collapsing sticky headers carry an inherent reflow / scroll-anchor oscillation problem.** "Not sticky at all" sidestepped it entirely — simpler and jank-free.
- **Place a control by its semantics.** The view-toggle is a results-view mode → it belongs at the configure→consume boundary (count row), not in the filter-input cluster.
- *(Cross-cutting candidates for `preferences.md` Working patterns if they recur: "trust code over claims," and "a fix that adds steps or hides the target is the wrong abstraction.")*

## Files in Claude project
- `brand.md`, `preferences.md`, `PROJECT_STATE.md` (this file).

## Files in repo (`docs/build/`)
- `A10_MAP_CONTROL_SURFACE_BUILD_SPEC.md` — A.10 design output. Currently untracked; commit it on the A.10 / stay-map branch.
- `HANDOFF_going-to-japan.md`, `CheatSheets_v4_source.jsx`, `d7_run_log.json`, `STAY_LAUNCH_BUILD_SPEC.md`, `PHASE_A9_BUILD_SPEC.md`, `QUICK_ADD_COMMANDS_BUILD_SPEC.md`, `stays_seed.csv`, plus historical Phase D specs.
- Note: `FILTER_HEADER_BUILD_SPEC.md` specced the abandoned `FilterShell` approach and is no longer in the repo — don't resurrect it.

## Conversation handoff rules
- New chat = paste/rely on this doc + state the workstream.
- One chat = one workstream; one branch per chat (exception: a "polish pass" of independent small fixes).
- Update immediately after any decision reversal.
- CC auto-accept OFF for: paid APIs (Google Places), main-touching, destructive git ops. ON for feature-branch UI/content work.
- CC handoff threshold: any task touching 2+ files or needing iterative bug-fix → build spec to CC, not chat-terminal relay.
- Git wrap-up (commit/push of a feature branch, PR merge, branch delete) is run by Steven in the terminal, not routed through CC — merge/delete are main-touching + destructive.

### Next chats (any order; the two map ones pair)
1. **/stay LIST/MAP toggle** — paste this doc + the read-only stay-map audit (in this session's history). ~half-day build; inherits the count-row toggle placement.
2. **A.10 map UX** — paste this doc + `A10_MAP_CONTROL_SURFACE_BUILD_SPEC.md`; run against the rubric, lock a direction, spec CC.
3. **Sort data-signal** — paste this doc; start with the read-only data check (does a usable add-order already exist?), then spec the schema field + sort tiebreaker. Independent of the map work.
