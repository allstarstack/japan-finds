/* Phase B-2 places taxonomy — single source of truth for the primary
   experience chips, the planning + badge sub-filters, and the
   See/Do/Eat/Stay card colours. Imported by PlaceCard, PlaceFilterRail
   and /places so labels, rail order and colours never drift between them.

   Chip colour previews the card colour you will mostly land on: nature /
   animals / museums etc. are "See" places (green), food markets and
   cafes are "Eat" (yellow), onsen are "Stay" (blue), parks / theme parks /
   workshops are "Do" (red).

   SECONDARY_CHIPS mixes two data sources: planning_flags (semicolon-
   separated string) and the new boolean badge fields (local_favorite,
   viral). PlaceCard synthesises both into a single data-flags attribute
   so the rail's existing multi-select logic handles them uniformly. */

export const PRIMARY_CHIPS = [
  { value: "nature_water", label: "Nature & Water", color: "green" },
  { value: "culture_history", label: "Culture & History", color: "green" },
  { value: "animals", label: "Animals", color: "green" },
  { value: "food_markets", label: "Food Markets", color: "yellow" },
  { value: "cafes", label: "Cafes", color: "yellow" },
  { value: "onsen_ryokan", label: "Onsen & Ryokan", color: "blue" },
  { value: "quirky_museums", label: "Quirky Museums", color: "green" },
  { value: "theme_parks", label: "Theme Parks", color: "red" },
  { value: "parks", label: "Parks", color: "red" },
  { value: "photo_spots", label: "Photo Spots", color: "green" },
  { value: "scenic_transport", label: "Scenic Transport", color: "blue" },
  { value: "workshops_crafts", label: "Workshops & Crafts", color: "red" },
  { value: "anime", label: "Anime", color: "red" },
];

/* Planning / audience / badge filters — multi-select, combine with any
   primary chip. The first three are planning_flag values; the last two
   are the boolean badge fields, surfaced here as filter chips because a
   place's local_favorite / viral status is an orthogonal validation
   dimension travelers want to filter on. */
export const SECONDARY_CHIPS = [
  { value: "rainy_day", label: "Rainy Day" },
  { value: "with_kids", label: "With Kids" },
  { value: "day_trips", label: "Day Trips" },
  { value: "local_favorite", label: "Local Favorite" },
  { value: "viral", label: "Viral" },
];

/* primary_category -> colour token. Drives the card colour block and the
   category badge. See=green, Do=red, Eat=yellow, Stay=blue (Step 5). */
export const CAT_COLOR = {
  See: "green",
  Do: "red",
  Eat: "yellow",
  Stay: "blue",
};
