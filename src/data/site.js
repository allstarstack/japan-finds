/* Site-wide constants.

   JAPAN_MAP_URL — the public "Japan Map" Google My Map. Used by the
   header CTA, the homepage map section, and the /places hero CTA.
   NOTE: the `mid` is taken verbatim from the Phase B-2 BUILD_SPEC. If
   the CTA 404s, this is the value to confirm with Steven — PROJECT_STATE
   flagged the real My Map URL as still-pending in its background queue. */
export const JAPAN_MAP_URL =
  "https://www.google.com/maps/d/viewer?mid=138XXBg77uO1oGJS1rCGaqZbrfjBfb7s&ll=34.79062184947372%2C134.48174290000003&z=5";

/* RESTAURANTS_MAP_URL — the separate "Restaurants" Google My Map for /eat.
   Steven creates the map post-import (from restaurants_google_mymaps_import.csv)
   and sets RESTAURANTS_MAP_URL as a Vercel env var to its public viewer URL.
   Until then the CTA falls back to a TODO anchor (BUILD_SPEC §2). */
export const RESTAURANTS_MAP_URL =
  process.env.RESTAURANTS_MAP_URL || "#TODO-restaurants-map-url";
