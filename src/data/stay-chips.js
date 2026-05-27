/* Phase A.9 / Stay-launch /stay taxonomy — single source of truth for the
   9 stays category chips, mirroring place-chips.js for /places.

   The 9 chips all share the Stay card colour (blue / konbini-blue), since
   every row in the stays collection maps to the same primary category
   axis. Order below is content-gravity descending (highest seed count
   first) — matches STAY_LEGEND in src/pages/map.astro so the filter rail
   on /stay reads identically to the map legend.

   Slugs are schema-stable (see staySchema.primary_cat in
   src/content/schemas.ts); labels are display-only and can be tweaked
   here without a schema migration. */

export const STAYS_PRIMARY_CHIPS = [
  { value: "onsen_ryokan",    label: "Onsen ryokan",     color: "blue" },
  { value: "design_hotel",    label: "Design hotel",     color: "blue" },
  { value: "machiya_kominka", label: "Machiya & kominka", color: "blue" },
  { value: "glamping",        label: "Glamping",         color: "blue" },
  { value: "resort",          label: "Resort",           color: "blue" },
  { value: "capsule_themed",  label: "Capsule & novelty", color: "blue" },
  { value: "mountain_lodge",  label: "Mountain lodge",   color: "blue" },
  { value: "heritage_hotel",  label: "Heritage hotel",   color: "blue" },
  { value: "temple_stay",     label: "Temple stay",      color: "blue" },
];

/* Price tier glyph map — rendered on the card as a small chip alongside
   the category badge (STAY_LAUNCH_BUILD_SPEC §"Price tier styling": chip
   on Concrete Gray with yen glyphs, mirrors the Booking/Tabelog
   convention). The schema's price_tier enum is budget|mid|upscale|luxury. */
export const PRICE_TIER_GLYPH = {
  budget: "¥",
  mid: "¥¥",
  upscale: "¥¥¥",
  luxury: "¥¥¥¥",
};
