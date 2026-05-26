# Phase A.9 — Build Spec (CC handoff)

**Branch:** `phase-a9-legend-and-stay`
**Scope:** STAY data infrastructure + clickable map legend filtering + sub-category reorder
**Inputs:** `docs/build/stays_seed.csv` (136 rows, attached to this spec)
**Reference:** this file, committed at `docs/build/PHASE_A9_BUILD_SPEC.md`

---

## Scope summary

Three commits on the same branch so each is revertable:

1. **`feat(stays): schema + content collection + seed import`** — new `src/content/stays/*.yaml` collection from `stays_seed.csv`, Zod schema, no UI surface yet.
2. **`feat(map): STAY markers + legend cluster`** — render stays on `/map` with distinct color, 9 sub-category clusters in the legend.
3. **`feat(map): clickable legend filtering + sub-category reorder`** — legend rows become toggle filters; reorder logic for /places + /eat + STAY clusters.

"Top restaurants" stays as-is. No rename in this phase.

---

## 1. Stays schema + content collection

**New collection:** `src/content/stays/` (one YAML per stay), parallel to `/content/places/`.

**Zod schema** (`src/content/config.ts`, new collection block):

```ts
const stays = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),                     // jf-stay-#### zero-padded
    name: z.string(),
    name_jp: z.string(),
    city: z.string(),
    prefecture: z.string(),
    primary_cat: z.enum([
      'onsen_ryokan',
      'design_hotel',
      'machiya_kominka',
      'glamping',
      'resort',
      'capsule_themed',
      'mountain_lodge',
      'heritage_hotel',
      'temple_stay',
    ]),
    price_tier: z.enum(['budget', 'mid', 'upscale', 'luxury']),
    description: z.string(),
    distinctive: z.string(),
    source_url: z.string().url(),
    // place_id enrichment fields, all optional — populated in a later workstream (D7)
    place_id: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    photo_cache_path: z.string().optional(),
  }),
});
```

**Import script** (`scripts/import_stays_seed.py`): reads `docs/build/stays_seed.csv`, writes one YAML per row to `src/content/stays/`. Slug = NFKD slugify of `name`. Assign `id = "jf-stay-" + str(idx).zfill(4)` in input CSV order (Hoshinoya Karuizawa → jf-stay-0001).

**Self-verify in script:**
- Print row count after write (must equal CSV row count: 136).
- Round-trip parse each emitted YAML.
- Sample-after print first 3 and last 3 written files with full body.
- Assert zero slug collisions before write.

**Astro 6 cache landmine (per D5c learnings):** after schema change, before first `astro build`, delete `node_modules/.astro/data-store.json`. Note this in the commit message.

---

## 2. STAY markers + legend cluster on `/map`

The unified `/map` currently renders /places + /eat with visual differentiation (Mapbox GL JS, May 2026 migration). Add stays as a third source.

**Marker color:** TBD — pick a token from the brand palette not already used by /places or /eat. Suggest **Matcha Green `#4D8B57`** if not taken; otherwise **Egg Sando Yellow `#FFD84D`**. Confirm with Steven before shipping.

**Legend block:** new `<details>` block at the bottom of the legend stack labeled "Stay" (matches the singular convention of "Where" / "Eat"). Inside: 9 sub-category rows in this exact order:

| Order | Label | Slug | Count |
|---|---|---|---|
| 1 | Onsen ryokan | onsen_ryokan | 63 |
| 2 | Design hotel | design_hotel | 22 |
| 3 | Machiya & kominka | machiya_kominka | 11 |
| 4 | Glamping | glamping | 9 |
| 5 | Resort | resort | 7 |
| 6 | Capsule & novelty | capsule_themed | 7 |
| 7 | Mountain lodge | mountain_lodge | 6 |
| 8 | Heritage hotel | heritage_hotel | 6 |
| 9 | Temple stay | temple_stay | 5 |

Slug renames from research-phase scratch labels: `design_boutique → design_hotel`, `glamping_cabin → glamping`, `temple_lodging → temple_stay`. The `city_hotel` bucket from the research scan was folded into `design_hotel` (OMOs are design-led; "city hotel" failed the distinct-intent test). `floating_ryokan` (guntû, singleton) folded into `resort`. The CSV is already labeled with these final slugs.

Display label note: the storage slug stays `capsule_themed` (don't churn the data), but the display label is **"Capsule & novelty"**. Map slug → display label in the legend render code, not in the YAML.

Each row shows `Label · Count` using the existing legend row component.

---

## 3. Clickable legend filtering + sub-category reorder

Today's legend is static, not a filter. This change makes legend rows act as toggles.

**3a. Toggle behavior.** Each legend row gets a click handler. Click toggles a `data-active` attribute on the row. Default state: all rows active (everything visible). Toggling a row off hides all markers in that cluster.

**Persistence convention:** URL params `?show=` with comma-joined active slugs, matching the rail convention from D6. Default omits the param when all are active.

**3b. Mutual-group rules.** Within a source ("Where" / "Eat" / "Stay"), toggles are independent. Across sources, no constraint — you can hide all of /eat and keep /places + /stay visible.

**3c. Sub-category reorder.** The "Where" legend currently lists its 13 clusters in legacy CSV-import order (per D1 closing decision: humanized cluster legend labels). Reorder to traveler-intent priority — confirm Steven's desired order before shipping or use alphabetical as a fallback. The 10-cluster Eat legend reorders to match the /eat chip rail (specialty-first, already established). Stays use the table above.

---

## What's NOT in this phase

- Stay-card list page (no `/stay` route yet).
- place_id enrichment for stays (lat/lng population) — separate workstream, parallels D1.
- Stay hero photos.
- Cross-linking stays to nearby /places or /eat entries.
- Manual vetting/paring of the 136-row seed — Steven does that against the live data after import.

---

## CC working defaults

- **First action:** read this spec, view `docs/build/stays_seed.csv` (head -3 + tail -3) to confirm structure, then ask Steven to confirm the marker color before starting commit 2.
- **Discovery grep before any batch changes:** `rg "places-legend|eat-legend" src/` (or whatever the current legend class names are — confirm first).
- **After schema change:** delete `node_modules/.astro/data-store.json` before next build (Astro 6 cache landmine, per D5c learnings).
- **Lighthouse mobile pass required** before opening the PR: /map, /places, /eat. Hold a11y/best-practices/SEO at 100/100/100.
- **Commit messages** follow the conventional commits style already in use on the repo.
