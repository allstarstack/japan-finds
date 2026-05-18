/* Phase B-2 places taxonomy — single source of truth for the 12 primary
   experience chips, the 3 planning sub-filters, and the See/Do/Eat/Stay
   card colours. Imported by PlaceCard, PlaceFilterRail and /places so
   labels, rail order and colours never drift between them.

   Chip colour previews the card colour you will mostly land on: nature /
   animals / museums etc. are "See" places (green), food markets are
   "Eat" (yellow), onsen are "Stay" (blue), parks / theme parks /
   workshops are "Do" (red).

   `parks` is the 12th chip (see schemas.ts). `day_trips` is deliberately
   absent from SECONDARY_CHIPS — the taxonomy allows it but 0 rows carry
   it, so rendering it would be a dead chip (matches the /products
   "only show non-empty chips" rule). */

export const PRIMARY_CHIPS = [
  { value: "nature_water", label: "Nature & Water", color: "green" },
  { value: "culture_history", label: "Culture & History", color: "green" },
  { value: "animals", label: "Animals", color: "green" },
  { value: "food_markets", label: "Food Markets", color: "yellow" },
  { value: "onsen_ryokan", label: "Onsen & Ryokan", color: "blue" },
  { value: "quirky_museums", label: "Quirky Museums", color: "green" },
  { value: "theme_parks", label: "Theme Parks", color: "red" },
  { value: "parks", label: "Parks", color: "red" },
  { value: "photo_spots", label: "Photo Spots", color: "green" },
  { value: "scenic_transport", label: "Scenic Transport", color: "blue" },
  { value: "workshops_crafts", label: "Workshops & Crafts", color: "red" },
  { value: "anime", label: "Anime", color: "red" },
];

/* Planning / audience filters — multi-select, combine with any primary
   chip. Derived from the semicolon-separated `planning_flags` field. */
export const SECONDARY_CHIPS = [
  { value: "rainy_day", label: "Rainy Day" },
  { value: "with_kids", label: "With Kids" },
  { value: "by_train", label: "By Train" },
];

/* primary_category -> colour token. Drives the card colour block and the
   category badge. See=green, Do=red, Eat=yellow, Stay=blue (Step 5). */
export const CAT_COLOR = {
  See: "green",
  Do: "red",
  Eat: "yellow",
  Stay: "blue",
};
