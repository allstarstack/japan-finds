/* /eat taxonomy — single source of truth for the 13 cuisine chips, the 4
   planning flags, and the per-cuisine card colour. Imported by ChipRow,
   RestaurantCard and /eat so chip order, grid sort and colours never drift
   between them. Mirrors place-chips.js. */

/* Cuisine chips — order is meaningful (BUILD_SPEC §3): meals people travel
   for first, everyday meals last. This array drives the chip row AND the
   grid sort, so it stays in the spec's exact left-to-right order — not
   alphabetised, not sorted by count.

   `slug`  — lowercase URL-param token (?cuisine=ramen,sushi).
   `value` — matches restaurants.json `cuisine_chip` verbatim. */
export const CUISINE_CHIPS = [
  { slug: "sushi", value: "Sushi", label: "Sushi" },
  { slug: "tempura", value: "Tempura", label: "Tempura" },
  { slug: "unagi", value: "Unagi", label: "Unagi" },
  { slug: "sukiyaki", value: "Sukiyaki & Shabu-shabu", label: "Sukiyaki & Shabu-shabu" },
  { slug: "yakiniku", value: "Yakiniku", label: "Yakiniku" },
  { slug: "yakitori", value: "Yakitori", label: "Yakitori" },
  { slug: "tonkatsu", value: "Tonkatsu", label: "Tonkatsu" },
  { slug: "ramen", value: "Ramen", label: "Ramen" },
  { slug: "soba", value: "Soba", label: "Soba" },
  { slug: "udon", value: "Udon", label: "Udon" },
  { slug: "izakaya", value: "Izakaya", label: "Izakaya" },
  { slug: "okonomiyaki", value: "Okonomiyaki", label: "Okonomiyaki" },
  { slug: "shokudo", value: "Shokudo", label: "Shokudo" },
];

/* City chips (Phase D D6). City-level granularity matches the user's
   mental model when picking a place to eat — and mirrors byFood / Tabelog
   convention. The 4 named buckets are a design decision; everything else
   rolls into "Elsewhere" (currently 16 one-off cities). Counts regenerate
   at build time in /eat — never hardcoded here. */
export const CITY_CHIPS = [
  { slug: "tokyo", value: "Tokyo", label: "Tokyo" },
  { slug: "osaka", value: "Osaka", label: "Osaka" },
  { slug: "kyoto", value: "Kyoto", label: "Kyoto" },
  { slug: "fukuoka", value: "Fukuoka", label: "Fukuoka" },
  { slug: "elsewhere", value: null, label: "Elsewhere", isRollup: true },
];

const NAMED_CITIES = new Set(
  CITY_CHIPS.map((c) => c.value).filter(Boolean),
);

/* Bucket a restaurant's `city` into one of the 5 chip slugs. Unknown
   cities (anything outside the 4 named buckets) fold into "elsewhere". */
export function restaurantCity(r) {
  return NAMED_CITIES.has(r.city) ? r.city.toLowerCase() : "elsewhere";
}

/* Planning flag chips (walk-in / reservation / casual / splurge) were
   removed: source data assigns `reservation_required` and `price_tier`
   per-cuisine stereotype, so combining them with a cuisine chip almost
   always collapsed to 0 (e.g. every Sushi row is yes+¥¥¥¥, every Ramen
   row is walk-in+¥). The chips were honest about that, but they
   double-encoded the cuisine selection, so they're gone as filters.
   `reservation_required` and `price_tier` are still shown on each card
   (badge + meta line); only the filter UI was removed. Reinstate the
   chips alongside any future per-restaurant flag enrichment pass. */

/* cuisine_chip -> colour-block token (BUILD_SPEC §5). Drives the card's
   placeholder block. `red-deep` is Tokyo Signal Red darkened ~30% so the
   Sukiyaki block reads distinct from the Ramen/Sushi red. */
export const CUISINE_COLOR = {
  "Sushi": "red",
  "Tempura": "yellow",
  "Unagi": "ink",
  "Sukiyaki & Shabu-shabu": "red-deep",
  "Yakiniku": "ink",
  "Yakitori": "blue",
  "Tonkatsu": "yellow",
  "Ramen": "red",
  "Soba": "gray",
  "Udon": "gray",
  "Izakaya": "green",
  "Okonomiyaki": "yellow",
  "Shokudo": "green",
};

const SLUG_BY_VALUE = new Map(CUISINE_CHIPS.map((c) => [c.value, c.slug]));

/* cuisine_chip value -> URL slug. */
export function cuisineSlug(value) {
  return SLUG_BY_VALUE.get(value) ?? "";
}
