# BUILD SPEC — Eval Pass Tier 2 Finish

## Goal
Ship the final 3 tier-2 fixes from the site-wide eval pass.

## Context
Tier 1 (text/copy fixes) and most of Tier 2 (single-select cuisine, stacked flag groups, clickable kicker, social links) are already live on main. This spec finishes the eval pass.

Brand voice rules: see `brand.md` (banned words list, present tense, useful first, no corporate hedging).

---

## Item 1: Mobile chip overflow indicator

**Problem:** Cuisine chips on /eat and category chips on /places overflow horizontally on mobile. Existing fade-mask is too subtle — users miss that more chips exist off-screen.

**Files to investigate:**
- `src/components/eat/ChipRow.astro` (cuisine row — fade-mask already exists)
- `src/components/v2/PlaceFilterRail.astro` (places category chips)
- `src/components/v2/LocationChipRow.astro` (D6 location chips on /eat and /places)

**Fix:**
Below each horizontally-scrolling chip rail, add a small count microcopy (mobile only).

Format: `13 cuisines · scroll →` or `12 categories · scroll →`

**Implementation:**
- Add `<p class="rail-hint">N {label} · scroll →</p>` below each affected chip rail
- CSS: 10–11px mono, ink-60 color, hidden on desktop via `@media (min-width: 1024px) { display: none; }`
- Count comes from existing props (cuisineCounts, categoryCounts, etc.)
- Use ASCII `→` to match site's existing arrow style

**Acceptance criteria:**
- Mobile: count microcopy visible below each affected chip rail
- Desktop (≥1024px): microcopy hidden (all chips wrap into view)
- Voice: lowercase, dry, no exclamation, no banned words
- Does not affect chip rail layout or behavior

---

## Item 2: /eat coverage in Start Here cards

**Problem:** Homepage Start Here has 4 cards (§01–§04). Need to verify all 4 content areas (Places, Eat, Finds, Cheat Sheets) are represented. If /eat is missing, fix it.

**Files to investigate:**
- `src/components/StartHere.astro`
- Possibly `src/pages/index.astro` if cards are defined inline

**Decision rule:**
- Audit what each of §01–§04 currently maps to
- The 4 cards should collectively cover: /places (or Japan Map), /eat, /products, /cheat-sheets
- If /eat is missing, swap the lowest-priority duplicate or weakest card for /eat
- KEEP card count at 4 — do not add a fifth

**Voice for new /eat card (if added):**
- Title: "Where to eat"
- Subhead: "282 Tabelog Hyakumeiten picks. Sorted by cuisine and city."
- CTA: "Browse restaurants"

**Acceptance criteria:**
- All 4 content areas represented in Start Here
- 4 cards total
- No duplicate destinations
- Brand voice maintained

---

## Item 3: Cross-link /places ↔ /eat

**Problem:** No visual wayfinding between /places and /eat. Users entering /places looking for restaurants must navigate via header.

**Files:**
- `src/pages/places.astro` and `src/pages/eat.astro`
- Possibly methodology footer components if they exist

**Fix:**
Add a small inline cross-link at the bottom of the chip rail OR within the methodology footer section.

**On /places:**  
`Looking for restaurants? See → /eat`

**On /eat:**  
`Looking for places to go? See → /places`

**Implementation notes:**
- Mono font, secondary color (matches existing small-link patterns in the codebase)
- Position: after the chip rail, before the grid, OR within methodology section — pick where it reads as a helpful aside, not a primary CTA
- Match existing link styling conventions in the codebase

**Acceptance criteria:**
- Both /places and /eat have a visible cross-link to the other
- Brand voice: lowercase, conversational, present tense
- Visually subordinate to primary CTAs
- No banned words

---

## Order of operations
Ship as 3 separate commits for clean review:
1. `Tier 2: mobile chip overflow indicator`
2. `Tier 2: /eat coverage in Start Here`
3. `Tier 2: cross-link /places ↔ /eat`

Push to main after each. No PR — these are small additive changes consistent with the eval pass batch.

## Verification (after all 3 ship)
- Mobile /eat → see chip overflow hint
- Mobile /places → see chip overflow hint
- Homepage → Start Here covers all 4 content areas
- /places → cross-link to /eat visible
- /eat → cross-link to /places visible

## Notes for CC
- Match existing conventions in the codebase. The D6 build spec is a reference for the established chip-rail pattern.
- State assumptions in commit messages where decisions were needed.
- After all 3 items ship, the eval pass is complete.
