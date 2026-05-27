# /stay Launch Build Spec

**Branch:** `feat/stay-launch` (single branch, one PR)
**Bundles:** new `/stay` list page + `/add-stays` slash command + `/places` "Onsen & Ryokan" → "Onsen Towns" rename
**Reference files for CC:** `src/pages/places.astro`, `src/components/PlaceCard.astro`, `.claude/commands/add-places.md`, `src/content/schemas.ts` (stays schema from Phase A.9)
**PROJECT_STATE impact:** This PR ships ahead of the queued `/add-places` and `/add-eats` work. Those become the NEXT PR after this merges. D7 stays queued behind both.

---

## Why bundle these three

| Item | Depends on | Standalone? |
|---|---|---|
| `/stay` list page | stays schema (shipped A.9), 136 YAMLs (shipped A.9) | Yes — but `/add-stays` is useless without it |
| `/add-stays` command | `/stay` page existing as a destination | No — needs the list page live |
| `/places` rename | nothing | Yes — but it's a 30-min change and conceptually paired with `/stay` launch (clarifies the towns-vs-properties distinction created by adding `/stay`) |

The rename is the optional bundle member. Justification for including: it's the moment users start seeing both `/places` and `/stay` together, so the semantic boundary needs to be clear at launch. Shipping the rename separately means a window where `/places` says "Onsen & Ryokan" while `/stay` shows actual ryokan properties under "Onsen ryokan" — confusing.

Alternative considered: ship `/stay` + rename as PR1, then `/add-stays` as PR2. Rejected because `/add-stays` is small enough that splitting adds review overhead without reducing risk.

---

## Order of work within the PR

Three commits on `feat/stay-launch`, in this order:

1. **`/places` rename pass** (smallest, lowest risk, ships first)
2. **`/stay` list page** (the substantial work)
3. **`/add-stays` command file** (smallest of the three, depends on `/stay` existing)

Each commit independently revertable. PR review touches all three; if rename or `/add-stays` have issues, the `/stay` page can still land.

---

## Commit 1: `/places` rename pass

### What changes

User-facing display label only: **"Onsen & Ryokan" → "Onsen Towns"** wherever it renders.

### What does NOT change

- Internal slug `onsen_ryokan` (used in URLs, schema enum, map source config, YAML frontmatter)
- The 13-cluster taxonomy
- Map cluster color
- Any YAML files in `src/content/places/`
- Sort/filter behavior

### Discovery before edit

```bash
rg -i "Onsen & Ryokan|Onsen and Ryokan" src/ docs/
```

Expect hits in (at minimum):
- `src/pages/places.astro` — chip rail label
- `src/components/MapView.astro` or `src/pages/map.astro` — legend label, cluster display name
- Possibly `PlaceCard.astro` if category label renders on cards
- Possibly cluster config object that maps slug → display label (single source of truth — if this exists, that's likely the ONLY file to change)

Look for a cluster config map FIRST. If display labels are centralized in one file (e.g. `src/data/clusters.ts` or inline in `MapView.astro`), the rename is one-line. If labels are duplicated across pages, fix the duplication: extract to a config map as part of this commit, then change the label once. Don't just sed-replace across multiple files and leave the duplication.

### Verify before commit

- Lighthouse on `/places` and `/map`: no regression vs main
- Click "Onsen Towns" chip on `/places` → still filters correctly (URL still uses `?category=onsen_ryokan` or whatever the live param name is)
- `/map?cluster=onsen_ryokan` still loads with the cluster filter applied (no slug change)
- Search `rg -i "onsen_ryokan" src/` — confirm slug references are untouched
- `docs/` files: update PROJECT_STATE.md if it references the label by display name (it shouldn't — it uses cluster slugs — but check)

### What NOT to do in this commit

- Do NOT rename the slug. Mentioning this twice because it's the easy mistake.
- Do NOT rename the corresponding `/stay` cluster `onsen_ryokan` (it's a separate collection — the rename is `/places`-only).
- Do NOT change map cluster color or marker style.

---

## Commit 2: `/stay` list page

### Route

`src/pages/stay.astro` — list page for the 136 stays in `src/content/stays/`.

Note the route is singular `/stay` (not `/stays`). This matches the Phase A.9 URL scheme (`?mode=stay`, "STAY" toolbar chip) and the existing nav order from PROJECT_STATE (Where · Eat · Finds · Cheat Sheets · Shop Waitlist · Partner — `/stay` slots between Eat and Finds, or alongside Where; nav placement is a decision below).

### Nav placement decision

**Recommended placement:** Where · Eat · **Stay** · Finds · Cheat Sheets · Shop Waitlist · Partner

Reasoning: Where (places to go) → Eat (food at those places) → Stay (where to sleep at those places) → Finds (things to bring home) is the natural trip-planning sequence. Stay between Eat and Finds keeps trip-planning verbs adjacent and pushes commerce (Finds, Shop Waitlist) to the right.

Alternative: Stay before Eat (alphabetical-ish, doesn't matter much). Not recommended — disrupts the planning sequence.

This decision touches `Header.astro`. Single nav array update.

### Card component: `src/components/StayCard.astro`

Mirror `PlaceCard.astro` structure. Fields to render:

- `name` (heading)
- `name_jp` (subtitle, small)
- `primary_cat` display label (chip-style badge using the cluster color)
- `city`, `prefecture` (line: "Hakone, Kanagawa")
- `price_tier` (chip: budget / mid / upscale / luxury — needs styling decision below)
- `description` (body, 2-3 lines)
- `distinctive` (body, 1 line, italic or styled distinctly to call out the "why this one" hook)
- `source_url` (footer link: "More about this stay →")

### Hero photo handling — CRITICAL

`photo_cache_path` is `null` for all 136 stays until D7 runs. The card must render gracefully without a photo.

**Implementation:** color-block card surface using the cluster color at low opacity (mirror the `/eat` pre-D1 pattern). When D7 ships and `photo_cache_path` is populated, the card template falls through to render the photo as hero with the color block as fallback for the few stays D7 can't enrich.

Template logic (pseudo-Astro):
```astro
{stay.data.photo_cache_path ? (
  <img src={stay.data.photo_cache_path} alt={stay.data.name} class="stay-card__hero" />
) : (
  <div class="stay-card__hero stay-card__hero--blockcolor" style={`background: var(--cluster-${stay.data.primary_cat})`} />
)}
```

This means D7 ships as a pure data update (no template changes needed) — the page automatically swaps to photo mode per-entry as enrichment lands. Right pattern.

### Price tier styling

`price_tier` is a 4-value enum (budget / mid / upscale / luxury). Render as a small chip on the card. Color decision:

Recommended: all four tiers use Ink Black text on Concrete Gray background (`--color-concrete-gray`) with a small icon or character differentiator — e.g. `¥` / `¥¥` / `¥¥¥` / `¥¥¥¥`. Don't use Tokyo Red or Matcha Green for tier — those colors carry semantic weight elsewhere (alerts, secondary accent) and tier isn't urgent or accent-worthy. Monochrome with quantitative glyphs is the convention for price across major travel sites (Booking, Tabelog).

Alternative: skip the chip entirely, just render the yen glyphs as text. Cleaner, less visual noise. Acceptable if Steven wants the card lighter.

### Chip rail (9 chips)

Single-select, mirroring `/places` and `/products` convention (NOT `/eat`'s multi-select). Per the existing pattern from PROJECT_STATE active-decisions log, single-select is the alignment target.

Order — recommended by Steven's content gravity (highest-volume → lowest), matching the seed counts:

1. Onsen ryokan (63)
2. Design hotel (22)
3. Machiya & kominka (11)
4. Glamping (9)
5. Resort (7)
6. Capsule & novelty (7)
7. Mountain lodge (6)
8. Heritage hotel (6)
9. Temple stay (5)

Alternative: alphabetical. Rejected — content-gravity ordering puts the meaty categories first, which is where users will spend time.

Slugs (don't change these — schema enum):
`onsen_ryokan, design_hotel, machiya_kominka, glamping, resort, capsule_themed, mountain_lodge, heritage_hotel, temple_stay`

### Location filter (region chips)

Mirror D6's `/places` region filter exactly. Same 10 JNTO regions, same `?region=` URL param, same chip rail position (below category chips).

If the D6 region filter is implemented in a reusable component, use it. If it's inline in `/places`, extract during this commit — same reasoning as the cluster label dedup. Inline duplication is the start of drift.

### Search + sort

Mirror whatever `/places` has on `main` at PR-open time. If the pending search-and-sort PR (newest-first + client-side search) has merged by then, include both. If not, ship without and add in a follow-up.

Do NOT block this PR waiting for the search-and-sort PR. If it's not merged when this PR is ready, ship `/stay` matching `/places` current state. The sort and search ship to all list pages later as one parallel addition.

### URL scheme

- `/stay` — all 136
- `/stay?category=onsen_ryokan` — single-select category
- `/stay?region=kansai` — single-select region
- `/stay?category=onsen_ryokan&region=kansai` — both

Match `/places` param naming exactly. If `/places` uses `?cluster=` not `?category=`, use that. Consistency over preference.

### Lighthouse target

100/100/100 on mobile (matches `/places` and `/eat` post-launch baselines per PROJECT_STATE). Do not ship the PR with regressions vs `main`.

### Empty states

- No category match: "No stays in this category yet. Try another filter."
- No region match: "No stays in this region yet."
- Both filters, no match: "No stays match both filters."

Brand voice per `brand.md` — honest absence, forward signal. Don't write "Stay tuned!" or anything similar.

---

## Commit 3: `/add-stays` slash command

### File

`.claude/commands/add-stays.md`. Mirror `.claude/commands/add-places.md` structure.

### What's the same as `/add-places`

- Three input modes: link / photo / pasted text
- Read live schema, 2 example entries, `brand.md`, highest existing ID before processing
- Field discipline: schema is the contract
- HIGH → live folder, MED/LOW → `drafts/_review/` with `_notes`
- Auto-commit HIGH items, push to main
- Bot-protected site fallback pattern
- One-at-a-time processing
- Voice self-check cadence
- Slug collision → append `-2`, `-3`

### What differs from `/add-places`

**Schema:** see Phase A.9 stays schema in `src/content/schemas.ts`. Required: `name`, `name_jp`, `city`, `prefecture`, `primary_cat` (enum of 9), `price_tier` (enum of 4), `description`, `distinctive`, `source_url`. Optional D7 fields: `place_id`, `lat`, `lng`, `photo_cache_path`.

**ID generation:** `jf-stay-XXXX` (zero-padded 4 digits), max existing id + 1. Per the Phase A.9 import script convention.

**No safety flags.** Stays don't have consumable safety concerns.

**No Hyakumeiten gate.** Unlike `/add-eats`, there's no equivalent quality-policy gate for stays. The implicit quality bar is "distinctive enough that `distinctive` field has real content." If the new stay's `distinctive` field would read like generic hotel marketing copy, draft to `_review/`.

**Category fit prompt:** if the new stay doesn't cleanly map to one of the 9 chips, write to `drafts/_review/` with a `_notes` field explaining the ambiguity. Don't force-fit. Same pattern as `/add-places`.

**Input priority:** official property site URL > booking-site link (Booking.com, Rakuten Travel) > pasted research blob > photo (lowest — property photos rarely identify the specific stay).

**Places API enrichment:** same paid-API gate as `/add-places`. Per-invocation cost prompt before the enrichment call: `"Enrich [stay name] via Google Places API (~$0.07). Proceed? [y/N]"`. If declined, commit the YAML without enrichment fields (entry appears on `/stay` list but not on `/map` until D7's batch enrichment).

Same `enrich_with_places_api.py` script — just point at the stays collection.

### Auto-mode

Writing the command file itself: auto-mode ON is fine. No paid API in the writing step.

Using the command later: per-invocation cost gate is built in. Auto-mode can stay ON when invoking `/add-stays` because the cost prompt asks per-item regardless of CC's mode.

---

## What's NOT in this PR

- D7 (batch enrichment of all 136 stays). Separate workstream, paid API, supervised CC mode.
- `/add-places` and `/add-eats` slash commands. Next PR.
- Phase A.10 map UX consolidation. Queued behind this + Quick-Add.
- Per-item detail pages (`/stay/<slug>`). Part of the larger per-item pages workstream.
- Backfilling lat/lng or photos for the 136 existing stays. That's D7.
- Refactoring `/stay`, `/places`, `/eat` into a shared `ListPage` template. Premature — let the duplication settle, refactor later when patterns are clearer.

---

## CC working defaults

- **First action:** read `.claude/commands/add-places.md` and `src/components/PlaceCard.astro` as reference patterns. Then read `src/content/schemas.ts` for the stays schema.
- **Sample 2 entries** from `src/content/stays/` before writing `StayCard.astro` to confirm actual field shapes.
- **Sample 2 entries** from `src/content/places/` before writing `/stay` page to confirm filtering patterns.
- **Three separate commits** on `feat/stay-launch`. Don't squash before PR.
- **Lighthouse pass after each commit** that touches rendering (commits 1 and 2). Commit 3 doesn't touch site rendering.
- **No tests required** for these changes (Astro pages + prompt file). Validation by preview deploy.
- **Auto-mode ON** for this entire session (no paid APIs, no destructive git ops, feature branch only).

---

## Open questions for Steven before CC kickoff

1. **Nav placement of "Stay":** between Eat and Finds (recommended) or somewhere else?
2. **Price tier display:** chip with yen glyphs (recommended) or plain text yen glyphs (lighter) or skip entirely?
3. **Search + sort dependency:** if pending search-and-sort PR hasn't merged by `/stay` PR-open time, ship `/stay` matching current `/places` (no search) and add search later — confirm?
4. **PROJECT_STATE.md update on Quick-Add status:** doc currently says Quick-Add commands are queued #1. Steven's framing implies `/add-places` already shipped. Worth a doc reconciliation in this PR or as a separate housekeeping commit?

---

## End-state user experience

After merge:

- `/places` chip rail and `/map` legend show "Onsen Towns" where they used to show "Onsen & Ryokan." All URLs and YAML data unchanged.
- `/stay` is a live route showing 136 stays as color-block cards filterable by 9 category chips and 10 region chips. Same UX patterns as `/places`.
- `/add-stays <url>` in CC: fetches the page, extracts fields, asks about paid enrichment, writes the YAML, commits, pushes. New stay appears on `/stay` list within ~60 seconds of running the command.
- `/map` still shows zero STAY pins (D7 hasn't run yet). The empty-state message Phase A.9 shipped still applies.

When D7 runs later as its own PR: photos appear on `/stay` cards, lat/lng populates, STAY pins appear on `/map`. No template changes needed at that point — D7 is a pure data update.
