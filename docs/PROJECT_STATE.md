# Japan Finds — Project State

**Last updated:** 2026-05-28 (late) — Major run shipped: D7 stay enrichment, cross-page architecture work (PRs #34–#38), homepage "Going to Japan?" pivot, cheat-sheets V4 redesign, unified layout. Polish pass 2 running overnight. Next awake-only: neighborhood-search test, /eat search box, "Six to start with" removal decision.

## What this is
The traveling state doc. Drop at the top of any new Claude chat for full context in ~500 tokens instead of replaying history. Update after major milestones — and AFTER any decision reversal, immediately.

## Site state
- **URL:** japan.allstarsteven.com
- **Stack:** Astro 6 + vanilla CSS + Vercel
- **Repo:** github.com/allstarstack/japan-finds
- **Local path:** ~/Desktop/builds/japan-finds
- **Brand spec:** `brand.md` (Claude project files) — source of truth for voice, palette, type, banned content
- **Counts:** 363 places · 282 restaurants (Tabelog Hyakumeiten) · 135 stays · ~384 products · 10 cheat sheets

## What's shipped (most recent first)
- **PR #38 — Cross-page layout consistency (merged 2026-05-28):** Unified container alignment. Capped LocationChipRow + StayFilterRail + view-toggle-row at `--content-max` (they drifted left at ≥1280px). Plus search-bar left-edge aligned to hero/chip column on /places, /eat, /stay. Audit found /stay hero was never `text-align:center` — the "centered" look was chip-rail drift. No new container utility — extended the existing pattern.
- **PR #37 — Cheat-sheets V4 redesign (merged 2026-05-28):** /cheat-sheets index rebuilt as composite layout — 2-up featured row (First 24 Hours + Japan Events 2026) + 3-up evergreen grid (8 sheets). All 10 sheets, real `/cheat-sheets/<slug>` routes (not #fragments), 4 new icons (sunrise/phone/suitcase/family) in V4 1.5px ink-stroke style, year-derived 2026 badge, extractLede() taglines, existing intro kept. Renames: "JR Pass Basics"→"JR Pass Math", "Suica / IC Cards"→"Suica & IC Cards" (frontmatter, propagate everywhere). Egg-yellow token already existed. React→Astro port (viewport prop → CSS @media).
- **PR #36 — "Going to Japan?" pivot (merged 2026-05-27):** Homepage section reframed from affiliate checklist → 6-card cheat-sheet preview (first-24-hours, phone-setup, ic-cards, jr-pass, cash-cards-atms, luggage-forwarding). Links to /cheat-sheets/<slug>, "Read the guide →" CTAs, "View all cheat sheets →" footer. Moved BELOW Start here. Removed from /cheat-sheets/index (was homepage+cheat-sheets via fluid prop; now homepage-only). affiliates.ts reverted to pre-PR state. Original V2 affiliate commits kept as historical record.
- **PR #35 — Site polish pass (merged 2026-05-27):** /stay category-chip-row alignment fix, `--color-tokyo-red-dark` token prune, homepage CTA "Browse restaurants"→"See where to eat", cuisine-chip single-select audit (all 4 list pages clean, no drift).
- **PR #34 — Housekeeping (merged 2026-05-27):** Untracked Python helpers triaged (dead one-shots deleted, build specs + D5c artifacts committed). New `src/data/map-legends.js` shared module — consolidated PLACES/EAT/STAY legend config + paint expressions + slug-validation Sets + Mapbox init that were duplicated across map.astro and MapView.astro (held in sync by comments). Net −253/+76 in the two .astro files.
- **D7 — Stay enrichment (merged 2026-05-27, squashed):** 135/135 stays enriched with place_id/lat/lng, 134 photos, 100% category hit rate, ~$9.87 spend. `train-hostel-hokutosei` deleted (confirmed permanently closed — 136→135). `densho-sen-nen-no-yado-sakan` has place_id but no Google photo → D3 photo-override candidate. `enrich_with_places_api.py` parameterized (collection + photo-dir args) — reusable for future D-series. /map STAY mode now shows 135 indigo pins; /stay cards render photos. `d7_run_log.json` committed to docs/build/.
- **Earlier (PR #32 and before):** /stay launch bundle, /add-stays + /add-eats slash commands, Phase A.9 map architecture, Phase D enrichment, cheat-sheets B-3, brand system, unified /map. See git log + earlier PROJECT_STATE revisions for detail.

### Recently-discovered-already-merged
- **D6 location filter + search-and-sort** — both were listed as "pending PRs" but turned out already merged. /places, /eat, /stay, /products all have region/category filtering; /products + /places + /stay have client-side search + newest-first sort. (NOTE: /eat is MISSING its search box — see queue.)

## What's in flight
- **Polish pass 2** (`feat/polish-pass-2`, running overnight 2026-05-28): adds Stay card to homepage Start here (was 4 cards, missing Stay), adds eyebrow to /eat hero (the only list page without one), cleans `events-2026` frontmatter " — Japan Finds" suffix, revises "Browse the catalog" homepage CTA if present. Feature branch — review + merge in the morning.

## What's queued

### Awake-only — next session (decisions/tests needed)
- **Neighborhood-search test.** A site reviewer asked for neighborhood-level search (type "Shibuya"/"Gion") on /places, /eat, /stay. Region chips are too coarse (Kanto = 7 prefectures); exact names need prior knowledge; neighborhood is the missing middle. FIRST: test whether existing search already matches the city/area field (type "Shinjuku" in /places search). If it filters → already works. If only matches names → extend search to match location field (its own PR). Data has city/prefecture; unclear if neighborhood granularity exists.
- **/eat search box.** /eat is the only list page without search (consistency gap + 282 restaurants is a lot to scan). Ties to neighborhood-search decision above — when added, decide if it matches location.
- **"Six to start with" on /places — removal decision.** /places has a featured 6-card section; /eat and /stay don't (read cleaner). Leaning REMOVE (homepage Start here already does site-level orientation; consistency; lower maintenance). Counterargument: /places is the biggest/most-overwhelming list (363) and the featured 6 give cold first-timers entry points. Steven's call.

### Strategic / architectural
- **D8 — Per-restaurant Tabelog URL enrichment for /eat.** /eat cards currently link to Tabelog *category* list pages (top-100), not the specific restaurant. Backfill `tabelog_url` for 282 entries (scraping, likely free, needs manual review queue — similar shape to D7). Then /eat links to per-restaurant Tabelog (credibility + utility in one link). Needs supervision, not autonomous.
- **/cheat-sheets affiliate placement pass.** Per affiliate-density decision: put eSIM affiliate in Phone Setup (prominent) + First 24 Hours (contextual) + /tools. Other affiliates relevance-anchored inside their topical sheets. Content/copy judgment needed.
- **Per-item pages** (`/products/<slug>`, `/places/<slug>`, `/eat/<slug>`, `/stay/<slug>`). ~1,403 pages. SEO, direct-link, future shop integration, Pagefind. Biggest remaining workstream, 3-4 CC sessions.
- **Phase A.10 — Map UX consolidation.** Fold the 3 toolbar chips (WHERE/EAT/STAY) into the legend panel header. Needs design judgment.
- **ManyChat conditional email capture** + /products & /places default flows.

### Design work (not CC)
- **Homepage other sections + cheat-sheets per-page redesigns** — as needed. The "Going to Japan?" + cheat-sheets-index redesigns are done (PRs #36/#37). Run Claude Design → verify against brand.md → CC implements.

### Phase D continued
- **D3 — Steven photo override on top-N cards.** Manual, ongoing. Now includes /stay (densho-sen-nen-no-yado-sakan is a priority — no Google photo).

### Small follow-ups
- **events-2026 frontmatter title cleanup** — folding into polish pass 2 (remove " — Japan Finds" suffix; render-time strip from PR #37 becomes redundant).
- **Matsuyama Castle re-enrichment** — matched to wrong place. Edit YAML, delete place_id, re-run enrich. Paid API — auto-mode OFF.
- **136→135 stays seed vet** — manual cull now that D7 makes them visible on map.
- **Hero photo brand-coherence check** — overdue.

### Phase D — site-wide eval pass (later)
Structured 3–5hr: Lighthouse baseline, banned-words pass, axe a11y audit, brand voice review, UX pattern audit, content audit, friend user tests. Includes /stay + redesigned /cheat-sheets in scope.

### Background queue
- POSSIBLE_MISSING_FLAGS audit (102 product slugs) · scenic transport LineString routes on /map · sub-chip behavior on /products · 21 v2-deferred product items

## Active decisions log

### 2026-05-28 — Information architecture + monetization (this session)
- **IA principle (locked):** cheat sheets own HOW/logistics; /places /eat /stay /products own WHERE/WHAT. Topic overlap is fine when the job differs (e.g., Konbini Basics cheat sheet = how-to-use logistics; /products konbini items = what-to-buy). All 10 cheat sheets pass this test — none cut.
- **"Going to Japan?" = cheat-sheet preview, NOT affiliate listing.** Cheat sheets are the canonical depth surface; affiliate links live INSIDE sheets, earned via depth, not impulse-clicked from the homepage. Higher-quality referrals convert better.
- **Affiliate density (locked):** relevance-anchored, not scattered. eSIM in Phone Setup (prominent) + First 24 Hours (contextual) + /tools. Same principle for other affiliates inside their topical sheets. NOT on /places/eat/stay cards.
- **Cheat-sheets featured row:** First 24 Hours (existing #1, best cold-start orientation) + Japan Events 2026 (freshness/2026 badge). Subjective call, one-line flip if revisited.
- **Taglines:** use existing `extractLede(entry.body)` — single source of truth, no separate tagline frontmatter field. Editing a sheet's opening line updates its card tagline (a feature).
- **Renames accepted:** JR Pass Math (captures "it's a math problem" angle), Suica & IC Cards (punctuation). Rejected 4 others (Konbini Basics, Cash/Cards/ATMs, Donki/Drugstore/Tax-Free stay — V4's renames lost scope).
- **Layout convention:** single max-width container centered in viewport, content left-aligned within (NOT center-aligned text). All heroes/search/chips share one left edge. Minimal fix (cap the outliers) over a new .container utility — the pattern already exists in 5+ places.
- **PR scoping (reaffirmed):** one logical unit per PR. Layout ≠ features ≠ content. Bundling only when items share a true logical unit (e.g., "polish pass" of independent small fixes).

### Carried decisions (still in force)
- Hotels → /stay; "where to sleep?" vs /places "where to drop by?" Edge cases (iconic hotel bars) can go /places.
- /places "Onsen & Ryokan" → display "Onsen Towns" (slug `onsen_ryokan` retained).
- STAY marker = Aizome Indigo `#3B4F81`. Single-select category chips across all list pages.
- Enrichment defaults photos-only (`--hours` only when needed). Live "open now" dropped. Prebuild hook no longer calls paid API (the $90.62 leak, fixed PR #31).
- ChatGPT regular chat won the enrichment bake-off; deep-research modes wrong for structured extraction.
- Restaurant framing: "Steven aggregates Tabelog Hyakumeiten. Honest about it."

## Files in Claude project
- `brand.md` — locked brand spec
- `preferences.md` — working preferences
- `PROJECT_STATE.md` — this file

## Files in repo (`docs/build/`)
- `HANDOFF_going-to-japan.md` (amended), `CheatSheets_v4_source.jsx`, `d7_run_log.json`
- `STAY_LAUNCH_BUILD_SPEC.md`, `PHASE_A9_BUILD_SPEC.md`, `QUICK_ADD_COMMANDS_BUILD_SPEC.md`, `stays_seed.csv`
- Historical Phase D specs: `BUILD_SPEC_cost_kill.md`, `BUILD_SPEC_d5b5_finish.md`, `BUILD_SPEC_d5c_editorial_review.md`, `BUILD_SPEC_d5d_download_merge.md`, `OVERNIGHT_QUESTIONS.md`

## Conversation handoff rules
- New chat = paste this doc + state workstream + relevant Desktop files (or rely on project-files auto-load).
- Update immediately after any decision reversal — don't wait for the next milestone.
- One chat = one workstream; one branch per chat (exception: a "polish pass" of independent small fixes can batch).
- CC auto-accept OFF for: paid APIs (Google Places), main-touching, destructive git ops. ON for feature-branch UI/content work.
- CC handoff threshold: any task touching 2+ files or needing iterative bug-fix → build spec to CC, not chat-terminal relay.

### For next session (awake-only)
1. Run the neighborhood-search test (type "Shinjuku" in /places search) → determines /eat-search + neighborhood approach.
2. Decide "Six to start with" removal on /places.
3. Review + merge polish pass 2 if it finished overnight.
Then pick from the strategic queue: D8 (Tabelog per-restaurant, supervised), /cheat-sheets affiliate placement, or per-item pages (the big one).
