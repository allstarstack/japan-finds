#!/usr/bin/env node
/* Generate public/places.geojson from src/content/places/*.yaml AND
   src/data/restaurants.json (Tabelog Hyakumeiten /eat collection).
   Each feature carries a `source` property ("places" or "eat") so the
   map can render and filter them distinctly.

   Runs as a prebuild step so the Mapbox map sources on /map and the
   /places + /eat list-page map views are always in sync with the YAML +
   JSON catalogs.

   Filters:
     /places: status === "ready" && public_render !== false
              Base-tier rows ARE included on the map (visual discovery),
              even though /places list hides them by default.
     /eat:    every entry in restaurants.json with lat AND lng. The
              current dataset (May 2026) has 282 entries, all geocoded;
              the skip-on-missing-coords rule is defensive only.

   Skip rule for either source: missing lat AND/OR lng → exclude with
   per-source skipped count surfaced in the build log. */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

const PLACES_DIR = "src/content/places";
const EAT_FILE = "src/data/restaurants.json";
const OUT_PATH = "public/places.geojson";

const features = [];
let placesScanned = 0;
let placesSkippedNoCoords = 0;
let placesSkippedNotReady = 0;
let eatScanned = 0;
let eatSkippedNoCoords = 0;

/* ---- /places (YAML) ---- */
for (const fn of readdirSync(PLACES_DIR)) {
  if (!fn.endsWith(".yaml")) continue;
  placesScanned++;
  const data = yaml.load(readFileSync(join(PLACES_DIR, fn), "utf-8"));
  if (!data || typeof data !== "object") continue;
  if (data.status !== "ready" || data.public_render === false) {
    placesSkippedNotReady++;
    continue;
  }
  if (typeof data.lat !== "number" || typeof data.lng !== "number") {
    placesSkippedNoCoords++;
    continue;
  }
  features.push({
    type: "Feature",
    geometry: { type: "Point", coordinates: [data.lng, data.lat] },
    properties: {
      source: "places",
      slug: fn.replace(/\.yaml$/, ""),
      name: data.name,
      public_label: data.public_label || "",
      primary_category: data.primary_category,
      address_or_area: data.address_or_area || "",
      hero_image: data.hero_image || null,
      local_favorite: data.local_favorite === true,
      viral: data.viral === true,
      viral_signal: data.viral_signal || null,
    },
  });
}

/* ---- /eat (Tabelog Hyakumeiten JSON) ----
   Field map per the audit (May 2026):
     id           → slug
     name_en      → name
     name_jp      → name_jp
     cuisine_chip → cuisine
     price_tier   → price_tier (¥/¥¥/¥¥¥/¥¥¥¥)
     list_year    → list_year (Hyakumeiten list year)
     is_shokudo   → is_shokudo
     rank_in_city → rank_in_city (1–30)
     neighborhood / city / prefecture → exposed for popup display
     hero_image   → hero_image
   Tabelog Hyakumeiten is binary (on the list or not) — no bronze/
   silver/gold tier exists in the data. The 5th category-filter button
   ("Tabelog") scopes by source === "eat" rather than by any tier. */
const eat = JSON.parse(readFileSync(EAT_FILE, "utf-8"));
for (const r of eat) {
  eatScanned++;
  if (typeof r.lat !== "number" || typeof r.lng !== "number") {
    eatSkippedNoCoords++;
    continue;
  }
  features.push({
    type: "Feature",
    geometry: { type: "Point", coordinates: [r.lng, r.lat] },
    properties: {
      source: "eat",
      slug: r.id,
      name: r.name_en || "",
      name_jp: r.name_jp || "",
      cuisine: r.cuisine_chip || r.genre || "",
      price_tier: r.price_tier || "",
      list_year: r.list_year || null,
      is_shokudo: r.is_shokudo === true,
      rank_in_city: typeof r.rank_in_city === "number" ? r.rank_in_city : null,
      neighborhood: r.neighborhood || "",
      city: r.city || "",
      prefecture: r.prefecture || "",
      hero_image: r.hero_image || null,
    },
  });
}

writeFileSync(
  OUT_PATH,
  JSON.stringify({ type: "FeatureCollection", features }, null, 2),
);

console.log(
  `geojson: ${features.length} features → ${OUT_PATH}\n` +
    `  /places: scanned ${placesScanned} yaml, skipped ${placesSkippedNotReady} not-ready, ${placesSkippedNoCoords} without lat/lng\n` +
    `  /eat:    scanned ${eatScanned} restaurants, skipped ${eatSkippedNoCoords} without lat/lng`,
);
