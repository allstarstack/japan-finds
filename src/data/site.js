/* Site-wide constants.

   PLACES_MAP_URL — the public map URL. Used by the header CTA, the
   homepage hero, the MapSection homepage block, and the StartHere
   section-01 tile. Points to the internal self-hosted Mapbox map at
   /map (Phase A → C migration, May 2026). The constant is retained
   (vs inlining the literal "/map") so a single edit moves every CTA
   if the route ever changes.

   RESTAURANTS_MAP_URL — REMOVED in Phase C cleanup. Its only consumer
   was the /eat .emap CTA section, which was deleted alongside this
   constant because /eat now has its own list/map toggle (Phase B). */
export const PLACES_MAP_URL = "/map";
