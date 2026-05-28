# Japan Finds — Project State

**Last updated:** 2026-05-28 (late morning) — Shipped this session: PR #39 polish pass 2, PR #40 Going-to-Japan V4 alignment, PR #41 list-page consistency, PR #42 homepage dividers (divider-contrast follow-up in progress). List-page audit complete, sort question resolved. A.10 map-UX design output ready for review. Two workstreams teed up next: filter-header rework (content-starving sticky filters) and A.10 implementation.

## What this is
The traveling state doc. Drop at the top of any new chat for full context in ~500 tokens instead of replaying history. Update after major milestones — and AFTER any decision reversal, immediately.

## Site state
- **URL:** japan.allstarsteven.com
- **Stack:** Astro 6 + vanilla CSS + Vercel
- **Repo:** github.com/allstarstack/japan-finds
- **Local path:** ~/Desktop/builds/japan-finds
- **Brand spec:** `brand.md` (Claude project files) — source of truth for voice, palette, type, banned content
- **Counts:** 363 places · 282 restaurants (Tabelog Hyakumeiten) · 135 stays · ~384 products · 10 cheat sheets

## What's shipped (most recent first)
- **PR #42 — Homepage section dividers (merging; divider-contrast follow-up in progress):** New SectionDivider component between every consecutive <main> child; removed the old heavy 1.5px ink-black section borders. FOLLOW-UP: first pass used Concrete Gray hairlines, which are ~1.1:1 on Rice White = effectively invisible (brand.md's own warning). Fix in progress: switch to a visible-but-subtle ink-tone hairline (~12% ink or `--color-ink-60`), and verify the §02 Going-to-Japan → §03 Map boundary actually renders.
- **PR #41 — List-page consistency (merging):** /eat got a SearchBox + RestaurantCard data-search blob + ChipRow token-AND predicate, mirroring /places + /stay exactly. Featured/"six to start with" section removed from BOTH /places and /products (it was on both). Dead featuredEl toggle removed from PlaceFilterRail. All four list pages now uniformly hero → search → chips → grid. (+54 / −185.)
- **PR #40 — Going to Japan V4 alignment (merged):** Homepage GoingToJapan rewritten in the V4 cheat-sheets card vocabulary (iconwell + category chip via CSIcon + local SHEET_META). Removed the six identical "UPDATED" date chips and the redundant tail numeral. Anchored as §02 "GOING TO JAPAN · BEFORE YOU FLY"; MapSection renumbered §02 → §03 (filled the pre-launch §03 gap; homepage now reads §01→§06 continuously). Mobile timeline-list dropped for a single responsive grid.
- **PR #39 — Polish pass 2 (merged):** Stay card added to homepage Start here as §05 (ink-black stripe — the unused chip slot), label "Four useful things" → "Five". Eyebrow added to /eat hero. events-2026 frontmatter title " — Japan Finds" suffix removed + the now-redundant cleanTitle strip helper deleted from cheat-sheets/index. (C4 "Browse the catalog" CTA — confirmed never existed, skipped.)
- **PR #38 — Cross-page layout consistency (merged 2026-05-28):** Capped LocationChipRow + StayFilterRail + view-toggle-row at `--content-max`; search-bar left-edge aligned to hero/chip column on /places, /eat, /stay (propagated to /products via shared SearchBox). The "/stay centered hero" was an illusion from chip-rail drift — no text-align:center existed.
- **PR #37 — Cheat-sheets V4 redesign (merged 2026-05-28):** /cheat-sheets index rebuilt; 2-up featured row + 3-up grid, real `/cheat-sheets/<slug>` routes, V4 icons (1.5px ink-stroke), egg-yellow 2026 badge, extractLede() taglines. Renames: "JR Pass Basics"→"JR Pass Math", "Suica / IC"→"Suica & IC Cards".
- **PR #36 — "Going to Japan?" pivot (merged 2026-05-27):** Reframed from affiliate checklist → cheat-sheet preview (now superseded visually by #40's V4 alignment). affiliates.ts reverted; component moved below Start here; removed from /cheat-sheets index.
- **PRs #34/#35, D7 stay enrichment, Phase A.9, Phase D:** see prior PROJECT_STATE revisions + git log. D7: 135/135 stays enriched, ~$9.87. map-legends.js shared module (PR #34).

## What's in flight
- **#42 divider-contrast fix** — see above. The only thing between here and "list-page + homepage polish workstream done."

## What's queued

### Next workstreams (one chat each)
- **Filter-header rework (HIGH impact — all 4 list pages).** The filter block (search + 2–3 stacked horizontally-scrolling chip rows: location, category, attributes) is tall AND sticky, so it permanently eats ~half the viewport and starves the cards (<2 rows visible while scrolling). First-principles fix: minimize the PINNED footprint. Full filters at the top; on scroll-down collapse to a slim sticky bar (search + "Filters" button w/ active count + active-filter pills); tuck secondary groups (category, attributes) behind a "Filters" disclosure so even the top block is shorter; on mobile the Filters button opens a drawer/sheet. Controls accessible, not dominant. Shared components: SearchBox, ChipRow, the filter rails. CC-doable with the pattern locked (above).
- **A.10 — Map UX consolidation (design output READY).** Fold the WHERE/EAT/STAY mode toolbar into the legend panel header → one control surface. Design variants are produced; next step is review against the brief's eval rubric → lock a direction → spec CC. Brief lives in this session's history; rubric: one control surface / unambiguous active mode / pin-colors legible / works on phone / brand tokens only / interaction model intact (mutually-exclusive modes, single-select clusters).

### Quick / pending decisions
- **Neighborhood-granularity test.** /places + /stay (+ now /eat) search matches name + prefecture/region/area. Open question: does it catch neighborhood level (type "Shinjuku" in /places search)? Filters → done. Only matches coarser → finer granularity is a separate small enhancement, low priority.

### Strategic / architectural (own focused sessions)
- **D8 — per-restaurant Tabelog URL backfill** for 282 /eat entries (scraping + review queue, supervised).
- **Per-item pages** (`/products/<slug>` etc., ~1,403 pages) — biggest remaining workstream, 3–4 CC sessions.
- **/cheat-sheets affiliate placement pass** (eSIM in Phone Setup + First 24 Hours + /tools; relevance-anchored).
- **ManyChat conditional email capture.**

### Small follow-ups
- **/places search placeholder mismatch:** placeholder reads "Search 333 places" but ALL JAPAN chip reads 363 — reconcile the counts.
- **Matsuyama Castle re-enrichment** — wrong place match; edit YAML, delete place_id, re-run. Paid API → auto-mode OFF.
- **136→135 stays seed vet** — manual cull.
- **D3 photo overrides** — densho-sen-nen-no-yado-sakan is priority (place_id but no Google photo).
- **Hero photo brand-coherence check** — overdue.

## Active decisions log

### 2026-05-28 (late morning)
- **Sort defaults — resolved, no change.** Only /products has a real recency signal (JF-#### IDs increment on add). /places/eat/stay date fields are batch enrichment stamps — sorting by them = arbitrary. So /products = newest (real), others = alphabetical (honest/predictable). The asymmetry reflects real data differences, not a bug. No sort menu (pages are filterable; defaults are correct).
- **/eat search added** (PR #41), mirroring /places/stay field set.
- **Featured/"six to start with" removed** from /places and /products (PR #41) — all four list pages uniform.
- **Going to Japan → V4 card alignment** (PR #40); §02 anchor; Map → §03.
- **Homepage dividers must be visible, not Concrete Gray.** Concrete Gray (#E6E1D8) on Rice White (#F7F3EA) ≈ 1.1:1 = invisible (brand.md flags this). Standalone section dividers in whitespace need an ink-tone hairline (~12% ink or `--color-ink-60`). Concrete Gray stays valid only for borders against an edge (card outlines).
- **Filter-header pattern direction (to implement):** compact sticky bar on scroll + Filters disclosure for secondary groups; full filters at top.

### Carried decisions (still in force)
- Hotels → /stay; iconic-hotel-bar edge cases can go /places. /places "Onsen & Ryokan" displays "Onsen Towns" (slug `onsen_ryokan`). STAY marker = Aizome Indigo #3B4F81. Single-select category chips across list pages.
- Enrichment defaults photos-only. Prebuild hook no longer calls paid API (the $90.62 leak, fixed PR #31).
- ChatGPT regular chat won the enrichment bake-off; deep-research modes wrong for structured extraction.
- Restaurant framing: "Steven aggregates Tabelog Hyakumeiten. Honest about it."
- IA principle: cheat sheets own HOW/logistics; /places/eat/stay/products own WHERE/WHAT.
- Affiliate density: relevance-anchored inside topical sheets, not scattered on cards.

## Key process learnings (this session)
- **Screenshot-diagnosis keeps getting corrected by CC reading real code.** The "/stay centered hero" was chip-rail drift; the homepage "had no dividers" actually had heavy ink borders; the divider "wasn't there" was a contrast issue. Lesson: for layout/CSS issues, prefer a CC read-first audit over diagnosing from a screenshot.
- **A subtle treatment still needs enough contrast to exist.** "Subtle" ≠ "invisible." Check the chosen color against its actual background before shipping a divider/hairline.

## Files in Claude project
- `brand.md`, `preferences.md`, `PROJECT_STATE.md` (this file).

## Files in repo (`docs/build/`)
- HANDOFF_going-to-japan.md, CheatSheets_v4_source.jsx, d7_run_log.json, STAY_LAUNCH_BUILD_SPEC.md, PHASE_A9_BUILD_SPEC.md, QUICK_ADD_COMMANDS_BUILD_SPEC.md, stays_seed.csv, plus historical Phase D specs.

## Conversation handoff rules
- New chat = paste/rely on this doc + state the workstream.
- One chat = one workstream; one branch per chat (exception: a "polish pass" of independent small fixes).
- Update immediately after any decision reversal.
- CC auto-accept OFF for: paid APIs (Google Places), main-touching, destructive git ops. ON for feature-branch UI/content work.
- CC handoff threshold: any task touching 2+ files or needing iterative bug-fix → build spec to CC, not chat-terminal relay.

### Next two chats (after #41/#42 merge)
1. **Filter-header rework** — paste this doc; I spec the compact-sticky + Filters-disclosure pattern for CC. (Higher user impact.)
2. **A.10 map UX** — paste this doc + the design output; I run it against the rubric, lock a direction, spec CC. (Design already done.)
Both bootstrap from this doc. CC builds run sequentially (one repo), but the two chats keep the workstreams clean.
