# D6 — Location Filter for /eat and /places

**Build spec for Claude Code session**
**Date:** 2026-05-20
**Estimated effort:** 1–2 hours
**Suggested branch:** `phase-d-d6-location-filter`

---

## Goal

A traveler planning a Japan trip can answer "what's worth eating / visiting in [destination]?" on japan.allstarsteven.com without leaving the site. Add a location filter chip row at the top of /eat and /places.

Closes the real UX gap identified in D1 spot-check: currently the only way to filter by location is to leave the site for Google My Maps.

---

## Locked design decisions

| Decision | Choice | Rationale |
|---|---|---|
| /eat granularity | City | Matches user mental model when picking a place to eat. Mirrors byFood / Tabelog convention. |
| /places granularity | Region (JNTO 10) | Matches trip-planning mental model. Mirrors japan-guide / JNTO convention. Avoids 47-prefecture overwhelm. |
| Cross-page state | None | Different scales (city vs region) don't translate cleanly. Each page owns its own URL param. |
| Multi-prefecture rows | First prefecture wins | 5/333 rows; complexity of dual-region not worth the rare benefit. |
| Rollup label | "Elsewhere" | Voice: natural, dry, not corporate. "Other" is the corporate trap. |
| Multi-select | Single-select | v1 stays clean. Multi-select can come later if real demand emerges. |
| Default state | "All Japan" | No filter applied. |
| URL persistence | Yes, per page | `?where=` on /eat, `?region=` on /places. Different param names make the scale-asymmetry explicit and avoid cross-page collision. |
| Yamanashi → which region | Kanto | Mt. Fuji / Fuji Five Lakes content is almost always day-trip-from-Tokyo intent. |

---

## /eat chip set

Five city chips + default, ordered count-descending:

```
All Japan · Tokyo (148) · Osaka (70) · Kyoto (45) · Fukuoka (3) · Elsewhere (17)
```

- **Filter logic:** Match `restaurants[].city` against selected chip.
- **"Elsewhere"** matches any row whose `city` is not in `{Tokyo, Osaka, Kyoto, Fukuoka}`. Currently 17 one-off cities (Yonezawa, Izumo, Toba, Kashiwa, Futtsu, Saga, Ise, Kitakata, Saitama, Ishigaki, Niigata, Choshi, Nobeoka, Kurashiki, Koriyama, Himi, and one more).
- **"All Japan"** = no filter applied (default).
- **URL param:** `?where={slug}` where slug ∈ `{tokyo, osaka, kyoto, fukuoka, elsewhere}`. Absence of param = "All Japan".

**Counts in spec are current as of 2026-05-20 build.** Actual chip labels regenerate at build time from data — never hardcoded.

---

## /places chip set

Ten region chips + default, ordered count-descending:

```
All Japan · Kanto (57) · Tokai (49) · Kyushu (44) · Kansai (33) · Chugoku (33) · Shikoku (27) · Tohoku (27) · Hokkaido (26) · Okinawa (23) · Hokuriku Shinetsu (14)
```

- **Filter logic:** Compute each row's region via the prefecture lookup table. For multi-prefecture rows (e.g., `Toyama/Nagano`), split on `/`, take `[0]`, look up region.
- **URL param:** `?region={slug}` where slug ∈ `{kanto, tokai, kyushu, kansai, chugoku, shikoku, tohoku, hokkaido, okinawa, hokuriku-shinetsu}`. Absence of param = "All Japan".
- **No "Elsewhere" needed** — the prefecture-to-region map covers all 47 prefectures, so every row has a home.

---

## Prefecture → Region lookup

Complete coverage of all 47 prefectures. Suggested location: `src/data/regions.ts` (use `.json` if preferred).

```ts
export const PREFECTURE_TO_REGION: Record<string, string> = {
  // Hokkaido
  "Hokkaido": "hokkaido",

  // Tohoku
  "Aomori": "tohoku",
  "Iwate": "tohoku",
  "Miyagi": "tohoku",
  "Akita": "tohoku",
  "Yamagata": "tohoku",
  "Fukushima": "tohoku",

  // Kanto — includes Yamanashi per D6 decision (Fuji-area content)
  "Tokyo": "kanto",
  "Kanagawa": "kanto",
  "Saitama": "kanto",
  "Chiba": "kanto",
  "Ibaraki": "kanto",
  "Tochigi": "kanto",
  "Gunma": "kanto",
  "Yamanashi": "kanto",

  // Hokuriku Shinetsu
  "Niigata": "hokuriku-shinetsu",
  "Toyama": "hokuriku-shinetsu",
  "Ishikawa": "hokuriku-shinetsu",
  "Fukui": "hokuriku-shinetsu",
  "Nagano": "hokuriku-shinetsu",

  // Tokai
  "Aichi": "tokai",
  "Gifu": "tokai",
  "Mie": "tokai",
  "Shizuoka": "tokai",

  // Kansai
  "Osaka": "kansai",
  "Kyoto": "kansai",
  "Hyogo": "kansai",
  "Nara": "kansai",
  "Shiga": "kansai",
  "Wakayama": "kansai",

  // Chugoku
  "Hiroshima": "chugoku",
  "Yamaguchi": "chugoku",
  "Okayama": "chugoku",
  "Shimane": "chugoku",
  "Tottori": "chugoku",

  // Shikoku
  "Tokushima": "shikoku",
  "Kagawa": "shikoku",
  "Ehime": "shikoku",
  "Kochi": "shikoku",

  // Kyushu
  "Fukuoka": "kyushu",
  "Saga": "kyushu",
  "Nagasaki": "kyushu",
  "Kumamoto": "kyushu",
  "Oita": "kyushu",
  "Miyazaki": "kyushu",
  "Kagoshima": "kyushu",

  // Okinawa
  "Okinawa": "okinawa",
};

export const REGION_LABELS: Record<string, string> = {
  "hokkaido": "Hokkaido",
  "tohoku": "Tohoku",
  "kanto": "Kanto",
  "hokuriku-shinetsu": "Hokuriku Shinetsu",
  "tokai": "Tokai",
  "kansai": "Kansai",
  "chugoku": "Chugoku",
  "shikoku": "Shikoku",
  "kyushu": "Kyushu",
  "okinawa": "Okinawa",
};

/**
 * Map a prefecture string to a region slug.
 * Multi-prefecture rows (e.g. "Toyama/Nagano") use the first prefecture.
 * Returns null if no mapping found — caller should treat as orphan.
 */
export function prefectureToRegion(pref: string): string | null {
  if (!pref) return null;
  const primary = pref.split('/')[0].trim();
  return PREFECTURE_TO_REGION[primary] ?? null;
}
```

---

## Component architecture

- **New row above existing chip rail.** Both /eat and /places gain one location-chip row sitting ABOVE the existing cuisine/category chip row.
- **Reuses existing chip primitive.** Same styles, same accessibility treatment as cuisine chips. Inherits `.chip--red` / `.chip--green` a11y variants if any chip uses red/green; otherwise default styling.
- **Single-select behavior.** Tapping a new chip replaces the previous selection.
- **Sticky positioning preserved.** Mobile two-row layout (location chips row + cuisine/category chips row) stays sticky as a unit.
- **Combined filters AND.** Selecting `Tokyo` + `ramen` on /eat shows only Tokyo ramen shops (not Tokyo OR ramen).
- **Counts in labels.** `Tokyo (148)` — count regenerated at build time, never hardcoded.

---

## Behavior spec

### On chip selection
1. Update URL param without page reload (use `window.history.pushState` or Astro client router).
2. Filter the visible list to matching rows.
3. Update visible result count (if currently shown).
4. Active chip gets visual selected state (matching existing chip rail convention).

### On page load with URL param
1. Read `?where=` (on /eat) or `?region=` (on /places).
2. If valid slug, set that chip active and filter the list on first render.
3. If unknown slug, fall back to "All Japan" — no error, no console warning shown to user.

### On browser back/forward
URL state restores chip selection automatically (natural consequence of `pushState` + reading param on render).

### On cross-page navigation
Each page reads only its own param. Carrying `?region=kansai` from /places to /eat does nothing because /eat only reads `?where=`. By design.

---

## Acceptance criteria (eval rubric)

Ship D6 when all five pass in browser:

1. **Filtering works correctly.** Tap "Kyoto" on /eat → only rows with `city: "Kyoto"` render. Tap "Kansai" on /places → only rows whose prefecture maps to `kansai` render. Rows with empty / missing field don't crash the page.

2. **URL state is shareable.** Selecting a chip updates URL. Pasting the URL in a fresh tab restores the filtered state. Browser back / forward works.

3. **Chip set is data-derived.** Counts and chip list regenerate at build time from actual data. Adding 12 Fukuoka places later doesn't require manual chip edits to update counts.

4. **Cross-page consistency holds (within scope).** Each page reads its own URL param. Switching pages doesn't error. No filter sharing — that's intentional.

5. **Existing chip rails don't break.** Location row sits above cuisine / category row. Sticky positioning holds on mobile. Combined filters AND together. Mobile two-row layout doesn't overflow on standard mobile widths (375–414px).

---

## Pre-launch data hygiene

Before merging:

1. **Resolve the `Hiroshima/Ehime` vs `Ehime/Hiroshima` duplicate.**
   ```
   grep -l "Hiroshima/Ehime\|Ehime/Hiroshima" src/content/places/*.yaml
   ```
   Returns two files. Compare — if same place, merge. If different, normalize the prefecture string convention.

2. **Verify all prefecture spellings against the lookup.** Smoke test that every row has a mappable prefecture:
   ```js
   // Run from repo root
   import { prefectureToRegion } from './src/data/regions';
   import yaml from 'js-yaml';
   import fs from 'fs';

   const files = fs.readdirSync('src/content/places').filter(f => f.endsWith('.yaml'));
   const orphans = files.filter(f => {
     const d = yaml.load(fs.readFileSync(`src/content/places/${f}`, 'utf8'));
     return d.prefecture && !prefectureToRegion(d.prefecture);
   });
   console.log('Orphan prefecture spellings:', orphans);
   ```
   Expected output: empty array. If any orphans, fix spelling in the YAML or add the variant to the lookup.

3. **Banned-words check on chip labels.** All region names (Hokkaido, Tohoku, Kanto, etc.) + city names (Tokyo, Osaka, Kyoto, Fukuoka) + "Elsewhere" + "All Japan" — none in brand.md banned list. Confirmed.

---

## Out of scope (explicit — not in D6 v1)

- Mapbox / Leaflet embedded map (Google My Maps from D1 covers visual mapping)
- Multi-select location filter
- Geolocation auto-detection
- Cross-page filter state sharing
- Hierarchical chip nesting (region → city)
- Station-level filtering (Tabelog-style)
- City-level sub-chips within /places regions (e.g., split Kansai into Kyoto / Osaka cards)

---

## Possible follow-ups (parked)

- **Sub-city chips for /places Kansai or Kanto.** If usage data shows users selecting Kansai then scrolling through 33 places, consider city-level sub-chips. Decide after observing real usage.
- **Cross-link callout.** On /eat with Tokyo selected, soft footer link: "Looking for things to do in Tokyo? See Kanto on /places." Cross-page nudge without forcing state-sharing complexity.
- **Multi-select.** If users want to filter "Tokyo + Hakone" (which spans Kanto/Tokai), introduce multi-select. Wait for the demand signal.

---

## Implementation order (suggested for CC)

1. Create `src/data/regions.ts` with the lookup table and `prefectureToRegion()` helper.
2. Add region computation to /places data layer (Astro content collections or wherever the list is built — likely a derived field on each place row).
3. Build `LocationChipRow.astro` component using the existing chip primitive.
4. Add the row to /eat and /places page templates (above existing cuisine/category row).
5. Wire URL param read/write logic (read on render, write on selection via `pushState`).
6. Run pre-launch data hygiene checks (orphan prefectures, dupe file resolution).
7. Test all 5 acceptance criteria in browser — mobile (iPhone width) + desktop.
8. Lighthouse check — should hold current baseline (Mobile 99/100/100/100, Desktop 100/100/100/100).

---

## Files expected to change

- **New:** `src/data/regions.ts`
- **New:** `src/components/LocationChipRow.astro` (or similar — match existing chip component naming)
- **Modified:** `src/pages/eat.astro` (or wherever /eat list renders)
- **Modified:** `src/pages/places.astro` (or wherever /places list renders)
- **Possibly modified:** existing chip rail wrapper if structural change is needed for two-row sticky layout
- **Possibly modified:** one or two YAMLs in `src/content/places/` if `Hiroshima/Ehime` dedup requires it

---

## Session handoff

Open CC in `~/Desktop/builds/japan-finds`. Reference this spec with:

```
@docs/build/BUILD_SPEC_d6_location_filter.md
```

Start with `src/data/regions.ts` — once that's right, the rest follows mechanically. The lookup function is the spine; the component is the skin; the URL handling is the glue.

After ship: update `PROJECT_STATE.md` "What's shipped" section, run banned-words sweep on the diff, commit, push, PR.
