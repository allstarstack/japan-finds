#!/usr/bin/env node
/* Generate public/places.geojson from src/content/places/*.yaml.
   Runs as a prebuild step so the Mapbox map source on /map and /places
   is always in sync with the YAML catalog.

   Filter mirrors src/pages/places.astro:
     status === "ready" && public_render !== false
   Base-tier rows are INCLUDED on the map (visual discovery), even though
   they are hidden from the /places list by default — name search reveals
   them in the list, but the map shows everything geocoded.

   Skip rule: a row with no lat AND no lng can't be plotted, so it is
   excluded with a count surfaced in the build log. */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

const PLACES_DIR = "src/content/places";
const OUT_PATH = "public/places.geojson";

const features = [];
let skippedNoCoords = 0;
let skippedNotReady = 0;
let total = 0;

for (const fn of readdirSync(PLACES_DIR)) {
  if (!fn.endsWith(".yaml")) continue;
  total++;
  const data = yaml.load(readFileSync(join(PLACES_DIR, fn), "utf-8"));
  if (data.status !== "ready" || data.public_render === false) {
    skippedNotReady++;
    continue;
  }
  if (typeof data.lat !== "number" || typeof data.lng !== "number") {
    skippedNoCoords++;
    continue;
  }
  features.push({
    type: "Feature",
    geometry: { type: "Point", coordinates: [data.lng, data.lat] },
    properties: {
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

writeFileSync(OUT_PATH, JSON.stringify({ type: "FeatureCollection", features }, null, 2));
console.log(
  `geojson: ${features.length} features → ${OUT_PATH}  ` +
    `(scanned ${total} yaml, skipped ${skippedNotReady} not-ready, ${skippedNoCoords} without lat/lng)`,
);
