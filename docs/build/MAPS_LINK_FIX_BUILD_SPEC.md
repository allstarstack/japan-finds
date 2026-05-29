# Build Spec — Google Maps link hardening (`/eat` + `/places`)

**Branch:** `fix/maps-link-fallback`
**Why:** A follower reported `/eat` Osaka Google Maps links "not linking properly." Data is clean (all 70 Osaka rows have well-formed 27-char `ChIJ…` place_ids), so this is not Osaka-specific — every link on both pages uses the same fragile template:

```
https://www.google.com/maps/place/?q=place_id:<id>
```

That format has **no graceful fallback**: a stale or mismatched `place_id` lands on a blank/wrong Maps result with nothing to recover to (cf. the logged Matsuyama Castle wrong-match). Google's documented recommendation is the `search` endpoint with `query` + `query_place_id`, which pins precisely when the ID is good and degrades to a name search when it isn't.

**Scope:** 2 files, 2 lines. No data changes. Feature branch (does not touch main, no paid API). CC auto-accept can stay ON (feature-branch UI work).

---

## Change 1 — `src/components/eat/RestaurantCard.astro` (~line 42)

Replace:

```js
const mapsUrl = r.place_id
  ? `https://www.google.com/maps/place/?q=place_id:${r.place_id}`
  : r.maps_search;
```

With:

```js
const mapsQuery = encodeURIComponent(
  [r.name_jp || r.name_en, r.neighborhood, r.city].filter(Boolean).join(" ")
);
const mapsUrl = r.place_id
  ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}&query_place_id=${r.place_id}`
  : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
```

Note: this also retires the `r.maps_search` fallback, whose stored strings carry **un-encoded spaces** in the query (`query=らーめん 小僧+…`) and would break the moment anything fell back to them. Building the query fresh with `encodeURIComponent` fixes that.

## Change 2 — `src/components/v2/PlaceCard.astro` (~line 85)

Replace:

```js
const mapsUrl = d.place_id
  ? `https://www.google.com/maps/place/?q=place_id:${d.place_id}`
  : "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${en}, ${d.prefecture}`);
```

With:

```js
const mapsQuery = encodeURIComponent(
  [en, d.area, d.prefecture].filter(Boolean).join(" ")
);
const mapsUrl = d.place_id
  ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}&query_place_id=${d.place_id}`
  : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
```

(Check `d.area` exists in the place schema; if not, drop it from the array — `filter(Boolean)` already guards undefined, so it's safe to leave in either way.)

---

## Verify before commit
- `npm run build` passes.
- Grep clean: `grep -rn "maps/place/?q=place_id" src` returns **nothing**.
- Spot-check 2 rendered cards: the `href` is `…/maps/search/?api=1&query=<encoded>&query_place_id=ChIJ…`, query is percent-encoded (no raw spaces), and the link opens the correct business.
- One should be an Osaka `/eat` card (the reported case).

## Out of scope (separate follow-up if needed)
If the follower's links opened the **wrong** business rather than a dead pin, the place_ids themselves are mismatched — a data problem this template fix does not solve. That's an Osaka-batch re-enrichment (paid Places API → **auto-mode OFF**), tracked separately.
