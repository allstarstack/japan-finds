/* Site-wide constants.

   PLACES_MAP_URL — the public "Japan Map" Google My Map. Used by the
   header CTA, the homepage hero + map section, and the /places hero CTA.
   Set the PLACES_MAP_URL env var on Vercel to the map's public viewer URL
   (default view — no &ll/&z params, so visitors land on the whole map,
   not zoomed in over Hyogo). Until then the CTA falls back to a TODO
   anchor, same pattern as RESTAURANTS_MAP_URL. */
export const PLACES_MAP_URL =
  process.env.PLACES_MAP_URL || "#TODO-places-map-url";

/* RESTAURANTS_MAP_URL — the separate "Restaurants" Google My Map for /eat.
   Steven creates the map post-import (from restaurants_google_mymaps_import.csv)
   and sets RESTAURANTS_MAP_URL as a Vercel env var to its public viewer URL.
   Until then the CTA falls back to a TODO anchor (BUILD_SPEC §2). */
export const RESTAURANTS_MAP_URL =
  process.env.RESTAURANTS_MAP_URL || "#TODO-restaurants-map-url";
