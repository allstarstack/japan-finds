/* Map legend / paint single source of truth.

   /map.astro (standalone, 3 sources mixed) and MapView.astro (embedded,
   single source on /places-map and /eat-map) both render the same pin
   colours and the same legend labels. Before this module those lived
   in two inline copies kept in sync by hand — PR #32's "Onsen & Ryokan"
   → "Onsen Towns" rename had to touch both, and the original code
   carried comments asking future editors to remember.

   Labels are sourced from the chip files so that adding / renaming a
   sub-category in one place automatically reaches every map surface.
   Per-slug pin colours, display order, and Mapbox paint expressions
   are map-only and live here. */

import { PRIMARY_CHIPS } from "./place-chips.js";
import { CUISINE_CHIPS } from "./eat-chips.js";
import { STAYS_PRIMARY_CHIPS } from "./stay-chips.js";

/* ---------- /places pin colours ----------
   13 distinct hues keyed off public_label, plus a base-tier fallback
   for places with empty public_label (~22 rows, mostly base towns).
   Brand red/yellow/green/blue are reserved for the four primary
   categories on /places filter chips, so map sub-cats use an
   extended palette by necessity. */
const PLACES_PIN_COLORS = {
  nature_water: "#176BFF",
  culture_history: "#FF3B30",
  animals: "#4D8B57",
  quirky_museums: "#7B3FA0",
  anime: "#E91E63",
  onsen_ryokan: "#9B7EBD",
  photo_spots: "#FF6B6B",
  scenic_transport: "#FF9800",
  theme_parks: "#FFD84D",
  parks: "#A4C49C",
  workshops_crafts: "#8B5A2B",
  food_markets: "#D4A017",
  cafes: "#D2B48C",
};
const PLACES_BASE_COLOR = "#999999";
const PLACES_BASE_LABEL = "Base towns";

/* /places legend rows derived from PRIMARY_CHIPS so the legend reads
   in the same order as the /places filter rail — slug, label and the
   ordering are all single-source. _base sentinel appended last — it
   represents the fallback colour rendered for features with no
   public_label. */
export const PLACES_LEGEND_ROWS = [
  ...PRIMARY_CHIPS.map((c) => ({
    slug: c.value,
    label: c.label,
    color: PLACES_PIN_COLORS[c.value],
  })),
  { slug: "_base", label: PLACES_BASE_LABEL, color: PLACES_BASE_COLOR },
];

/* Set of valid /places cluster slugs (for URL ?cluster= validation in
   /map.astro). Derived so adding a chip auto-registers it. */
export const PLACES_LEGEND_SLUGS = new Set(
  PLACES_LEGEND_ROWS.map((r) => r.slug),
);

/* Mapbox paint expression for /places pins. Built from the same dict
   the legend reads from — drift is structurally impossible. */
export const PLACES_PAINT_COLOR = [
  "match",
  ["get", "public_label"],
  ...Object.entries(PLACES_PIN_COLORS).flatMap(([slug, color]) => [slug, color]),
  PLACES_BASE_COLOR,
];

/* ---------- /eat pin colours ----------
   Per-cuisine fill for /eat-map (solid pins, single-source). On /map
   standalone /eat pins use a different visual treatment (white fill +
   Tokyo Red ring, source differentiation across mixed pins) — see
   EAT_RING_FILL / EAT_RING_STROKE below. */
const EAT_PIN_COLORS = {
  Sushi: "#ff3b30",
  Tempura: "#ffd84d",
  Unagi: "#151515",
  "Sukiyaki & Shabu-shabu": "#b93028",
  Yakiniku: "#151515",
  Yakitori: "#176bff",
  Tonkatsu: "#ffd84d",
  Ramen: "#ff3b30",
  Soba: "#999999",
  Udon: "#999999",
  Izakaya: "#4d8b57",
  Okonomiyaki: "#ffd84d",
  Shokudo: "#4d8b57",
};
const EAT_FALLBACK_COLOR = "#999999";

/* /eat legend rows derived from CUISINE_CHIPS for label+slug truth,
   joined with map-only pin colours. Order mirrors the chip rail
   (specialty-first, everyday last). Used by MapView on /eat-map;
   on /map (mixed-source) the legend renders a uniform white-ring
   swatch instead, but cuisine labels still come from this list. */
export const EAT_LEGEND_ROWS = CUISINE_CHIPS.map((c) => ({
  slug: c.slug,
  cuisine: c.value,
  label: c.label,
  color: EAT_PIN_COLORS[c.value] || EAT_FALLBACK_COLOR,
}));

export const EAT_LEGEND_SLUGS = new Set(EAT_LEGEND_ROWS.map((r) => r.slug));

/* URL-slug → restaurants.json cuisine_chip value. Used by /map.astro
   at filter time so the feature's `cuisine` property can be tested
   against the lowercase slug set. Derived from EAT_LEGEND_ROWS. */
export const EAT_SLUG_TO_CUISINE = Object.fromEntries(
  EAT_LEGEND_ROWS.map((r) => [r.slug, r.cuisine]),
);
export const EAT_CUISINE_TO_SLUG = Object.fromEntries(
  EAT_LEGEND_ROWS.map((r) => [r.cuisine, r.slug]),
);

/* Mapbox paint for /eat-map solid pins. Two ink-filled cuisines
   (Unagi, Yakiniku) get a Rice White stroke so the dark pin stays
   visible against the ink-on-light map background. */
export const EAT_PAINT_COLOR = [
  "match",
  ["get", "cuisine"],
  ...Object.entries(EAT_PIN_COLORS).flatMap(([cuisine, color]) => [cuisine, color]),
  EAT_FALLBACK_COLOR,
];

export const EAT_PAINT_STROKE = [
  "match",
  ["get", "cuisine"],
  "Unagi", "#F7F3EA",
  "Yakiniku", "#F7F3EA",
  "#151515",
];

/* On /map.astro all /eat pins share one open-ring style so they read
   distinctly from /places solid pins in the mixed-source view. */
export const EAT_RING_FILL = "#FFFFFF";
export const EAT_RING_STROKE = "#FF3B30";

/* ---------- /stay pin colour ----------
   All 9 stay sub-cats share Aizome Indigo on /map — sub-cat is the
   legend filter axis; colour stays uniform per source so /stay reads
   as one cohort against the mixed-source backdrop. */
export const STAY_PIN_COLOR = "#3B4F81";

/* /stay legend rows derived from STAYS_PRIMARY_CHIPS for label+slug
   truth. Order matches the /stay filter rail (content-gravity
   descending — highest seed count first). */
export const STAY_LEGEND_ROWS = STAYS_PRIMARY_CHIPS.map((c) => ({
  slug: c.value,
  label: c.label,
}));

export const STAY_LEGEND_SLUGS = new Set(STAY_LEGEND_ROWS.map((r) => r.slug));

/* slug → display label, used by /map.astro's popup builder for stay
   pins. Derived from STAY_LEGEND_ROWS. */
export const STAY_SLUG_TO_LABEL = Object.fromEntries(
  STAY_LEGEND_ROWS.map((r) => [r.slug, r.label]),
);

/* ---------- Shared Mapbox init ----------
   /map.astro and MapView.astro both create maps with these baseline
   settings. hash:true is the Mapbox-native URL hash sync
   (#zoom/lat/lng) — both surfaces share the convention. */
export const MAP_INIT = {
  style: "mapbox://styles/mapbox/light-v11",
  center: [138, 36],
  zoom: 4.5,
  minZoom: 4,
  maxZoom: 18,
  hash: true,
};
