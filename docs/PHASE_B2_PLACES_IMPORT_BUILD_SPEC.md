# Phase B-2 — Places Import BUILD_SPEC

**Version:** v1.0
**Date:** 2026-05-18
**Target:** japan.allstarsteven.com
**Build tool:** Claude Code
**Estimated build time:** ~3–4 hours
**Prereqs:** Phase B-1 merged and live (catalog with 384 products on /products)

---

## Goal

Take the locked 323-place enriched dataset (Decision #1B places + Decision #4 chip taxonomy revision) and ship a `/places` page parallel to `/products`. Same filter UX patterns, different content, different chip set. The "Japan Map" master Google My Map gets a hero CTA. Lighthouse maintained at ≥95.

---

## Inputs (paths in repo)

- `docs/japan_locations_v2.csv` — 323 enriched places (272 backlog + 51 food markets), full schema fields
- `docs/PHASE_B2_PLACES_IMPORT_BUILD_SPEC.md` — this spec
- Existing 35 V1 places in `src/content/places/*.yaml` (already on site, will be merged with import)
- `docs/brand.md` — voice, palette, typography (locked, already in repo)
- Google My Map public URL: **`https://www.google.com/maps/d/viewer?mid=138XXBg77uO1oGJS1rCGaqZbrfjBfb7s&ll=34.79062184947372%2C134.48174290000003&z=5`**

---

## Decisions locked

### Decision #1B revision: chip set updated to 16 chips for the combined 323-place catalog

Original 17 chips from Phase A were sized for 35 V1 places. With 323 places after the backlog import, the chip set is revised to:

**EXPERIENCE chips:**
- Nature & Water (79 places)
- Culture & History (42 places) — NEW chip
- Animals (35 places) — NEW chip
- Photo Spots (14 places)
- Quirky Museums (14 places)
- Theme Parks (11 places) — NEW chip
- Onsen & Ryokan (8 places)
- Workshops & Crafts (7 places)
- Anime (4 places)

**POI / TRANSPORT:**
- Scenic Transport (16 places) — renamed from Scenic Trains

**FOOD:**
- Food Markets (60 places, after research expansion from 9)

**PLANNING chips (cross-cut, derived from `planning_flags` field):**
- Day Trips
- By Train (14 places)
- Rainy Day (29 places)

**AUDIENCE chip:**
- With Kids (75 places — derived from `planning_flags`, overlaps with multiple primary chips)

**TIER FLAG (not a chip):**
- Base Town (22 places) — render differently or filter out of "what to see" browse; these are stay-as-a-base destinations, not destinations themselves

### Decision: Places is a separate page

`/places` lives alongside `/products`. Two top-level catalogs, two chip systems, two filter URLs. Reasons:
- Products and places are different verbs (shop vs visit)
- Chip taxonomies don't overlap meaningfully — forcing them into one filter creates a 30-chip rail
- Brand framing supports it: products = "Konbini Field Guide" shopping side, places = "where to go" guide side
- Separate Lighthouse scores, separate route, simpler mental model for users

### Decision: address quality is area-level by design

Every place row has `address_verified: false`. Addresses are city + prefecture ("Asahikawa, Hokkaido"). For card display this reads correctly. For navigation, each card's "Where" field links to Google Maps search by name + area — Google's geocoder finds the right pin. For pinpoint accuracy, the Google My Map handles that at the map level. No need for street addresses on individual cards.

### Decision: photo strategy — placeholder mode for v1

No creator photos for 95% of places at launch. Each card renders with:
- A small color-block placeholder keyed to `primary_category` (See=green, Do=orange, Eat=red, Stay=purple)
- The place name + Japanese name (if present in name field)
- Area, region, prefecture
- Chip badges

Photo swap is a background ongoing task. Don't generate AI imagery. Don't use stock. Banned imagery from brand.md applies.

---

## Work breakdown

### Step 1 — Schema additions/updates (~20 min)

Verify the existing place schema in `src/content/schemas.ts` matches Decision #1B. Update if missing:

```typescript
const placeSchema = z.object({
  // existing fields...
  name: z.string(),
  address_or_area: z.string(),
  region: z.string(),
  prefecture: z.string(),
  primary_category: z.enum(["See", "Do", "Eat", "Stay"]),
  
  // Updated chip set (16 chips)
  public_label: z.enum([
    "nature_water", "culture_history", "animals", "photo_spots",
    "quirky_museums", "theme_parks", "onsen_ryokan", "workshops_crafts",
    "anime", "scenic_transport", "food_markets",
    "" // empty for base_town tier — no chip
  ]).optional(),
  
  // Planning flags (semicolon-separated string of: rainy_day, with_kids, by_train, day_trips)
  planning_flags: z.string().optional(),
  
  launch_tier: z.enum(["standard", "base"]).default("standard"),
  status: z.enum(["ready", "draft"]).default("ready"),
  public_render: z.boolean().default(true),
  address_verified: z.boolean().default(false),
  source_type: z.string().optional(),
  original_category: z.string().optional(),
});
```

If the existing V1 35 places have ANY old `public_label` values from the original 17-chip set, those need migrating. Audit before bulk import.

### Step 2 — Bulk YAML population from CSV with dedup (~45 min)

Write `scripts/populate-places.mjs` that:

1. Reads `docs/japan_locations_v2.csv` (323 rows)
2. For each row, builds a slug from the name (lowercased, hyphenated, romaji-only for the path)
3. Checks for collision against existing YAMLs in `src/content/places/`:
   - **Match key:** normalize `name` (strip parens, lowercase, alphanumeric only) + `prefecture`
   - If match: log conflict to `docs/places-import-conflicts.md`, skip creating new YAML
   - If no match: write new YAML to `src/content/places/{slug}.yaml`
4. Populates all schema fields from the CSV
5. Validates every YAML against the place schema
6. Aborts the run on the first validation failure

Expected outcome:
- ~315-323 new YAMLs created (some conflicts with V1 35 likely)
- ~5-15 entries flagged as conflicts for manual review
- 35 existing V1 YAMLs untouched

### Step 3 — `/places` page (~45 min)

Build `src/pages/places/index.astro` mirroring the structure of `/products`:

- Hero: 6 featured place cards (auto-select 1 per primary chip + 2 from diverse regions — algorithm OK here since you don't have strong personal picks for all 323 yet)
- Chip rail: 11 EXPERIENCE/FOOD/POI chips + 4 planning/audience chips (see Step 4)
- Grid: lazy-loaded, 2-col mobile / 3-col desktop, default sort: alphabetical
- Empty state: "Nothing here yet. Back when there is." (brand.md voice)

**Above the chip rail or in hero:** "Japan Map" CTA card. Big button-style link:
- Label: `Get the Japan map →`
- Subtext: `One Google Map. Every place on this site. Add it to your phone, take it with you.`
- Links to the Google My Map public viewer URL

### Step 4 — Filter rail and chip system for places (~60-90 min)

**Primary chip rail (11 chips), single-select:**
1. Nature & Water
2. Culture & History
3. Animals
4. Food Markets
5. Onsen & Ryokan
6. Quirky Museums
7. Theme Parks
8. Photo Spots
9. Scenic Transport
10. Workshops & Crafts
11. Anime

**Secondary chips (4, multi-select, always visible below primary rail):**
- Day Trips
- By Train
- Rainy Day
- With Kids

These planning/audience chips can combine with any primary chip. E.g., "Animals + With Kids + Rainy Day" filters to indoor animal places suitable for kids.

**Filter rules:**
- Primary chips: single-select (matches /products pattern)
- Secondary chips: multi-select
- Both URL-shareable via `?chip=&flags=` params
- Base-tier places (22) excluded from default chip filtering. Optional: add a small "Stay bases" toggle/link below the chips for users planning multi-day trips
- Sort: alphabetical by name (places don't have a verified/unverified distinction like products do)

**Empty state per chip:** "Nothing here yet. Back when there is." — brand.md voice rule

### Step 5 — Place card component (~30-45 min)

Build `src/components/PlaceCard.astro`:

```
┌─────────────────────────────────┐
│ [color block - 16:9 aspect]     │  ← Color keyed to primary_category
│                                  │
├─────────────────────────────────┤
│ [SEE]  Asahiyama Zoo            │  ← chip badge + name
│ 旭山動物園                       │  ← JP name if present in name field
│                                  │
│ Asahikawa, Hokkaido             │  ← address_or_area
│                                  │
│ View on Google Maps →           │  ← link, opens Google Maps search
└─────────────────────────────────┘
```

- Color block backgrounds:
  - See → Matcha Green `#4D8B57`
  - Do → Tokyo Signal Red `#FF3B30`
  - Eat → Egg Sando Yellow `#FFD84D`
  - Stay → Konbini Blue `#176BFF`
- Hover/tap state: slight border emphasis, no shadow gimmicks
- "View on Google Maps" link format: `https://www.google.com/maps/search/?api=1&query={encodeURIComponent(name + ', ' + prefecture)}`
- DO NOT render `planning_flags` as visible labels on the card (those are filter-only)
- DO NOT render `address_verified` state or any internal field

### Step 6 — Nav, "Japan Map" CTA, QA, ship (~45 min)

- Add `/places` link to header and footer nav (alongside existing `Finds` link)
- Suggested label: `Places` (clean, parallel to `Finds`)
- Verify the Google My Map CTA renders correctly on `/places` hero AND on the homepage (add a small CTA on homepage too, replacing or below the existing Finds tour section)
- Lighthouse on `/places` and `/places?chip=animals`: target ≥95/95/100/95
- Mobile render tested at 375px
- All 323 cards render without console errors
- Vercel deploy verified

---

## Acceptance criteria

- [ ] Place schema updated to match the revised chip set (drops Base Town chip, adds Animals/Culture/Theme Parks)
- [ ] `populate-places.mjs` creates 315+ new YAMLs without schema failure
- [ ] Dedupe conflicts logged to `docs/places-import-conflicts.md` (acceptable: 5-15 entries flagged)
- [ ] `/places` page renders with hero + chip rail + grid
- [ ] 11 primary chips render with correct counts; sub-chips/planning flags work as expected
- [ ] Place cards render with color-block placeholders (no broken image refs)
- [ ] "View on Google Maps" link from each card opens the right pin
- [ ] "Japan Map" hero CTA renders and links to the public Google My Map URL
- [ ] Header + footer nav includes "Places" link
- [ ] Mobile horizontal-scroll chip rail at 375px
- [ ] Lighthouse ≥95/95/100/95 on `/places` and one chip-filtered route
- [ ] Vercel deploy succeeds; /places live

---

## Failure modes and mitigations

| Risk | Mitigation |
|---|---|
| Existing V1 35 places use the old 17-chip set | Step 1 audits and migrates before bulk import |
| Slug collisions on import | Append `-2`, `-3` etc; log to conflicts file |
| Google geocoding fails on rare names | Card still renders; "View on Google Maps" still works with name + prefecture search |
| Schema enum mismatch breaks build | `npm run build` runs after schema update before populate script |
| Base Town entries pollute "what to see" browse | Excluded from default chip results; surface only via explicit toggle |
| Hero featured-6 auto-pick lands all in Tokyo | Distribute pick: 1 per primary chip, then spread by region for the remaining 2 |

---

## Out of scope (deferred)

- **Restaurants page** (`/eat` or similar) — Phase C, separate spec. Different content type, more volatile data, requires Steven's actual personal picks (not LLM-sourced).
- **Photo swap from color-blocks to creator stills** — background ongoing
- **Address verification (street-level)** — only do this for places where Google's geocode misplaces the pin; not blanket
- **Search across places** — V2 build with `/products` search if/when added
- **Per-place internal pages** (`/places/{slug}`) — V2; for now everything lives on `/places` grid
- **Multi-region planning chip cleverness** (e.g., "show me Tokyo + Kyoto Animals together") — V2

---

## Items needing Steven's input before/during build

1. **Featured-6 hero picks for /places** — let Claude Code auto-select or override with a manual list. Auto-pick is fine for v1 since you don't have strong personal calls on all 323 places.
2. **Nav label** — `Places` or something more brand-voice? E.g., `Where` or `Spots`. Defaults to `Places` if you don't say.

---

## Post-build follow-ups

- 35 V1 places — audit which use the original chip set and migrate to revised
- Add 30-50 personal creator photos to highest-priority cards (Asahiyama Zoo, Ghibli Museum, etc) over the coming weeks
- Spot-check Google My Map for misplaced pins, drag-fix as needed
- Consider adding a "Recently added" strip to /places when Quick-Add Phase 1 lands
