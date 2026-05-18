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

/* Planning flags — multi-select, AND logic (every active flag must match,
   same as the /places planning chips). "recommended" reservations carry no
   flag — too ambiguous to filter on (BUILD_SPEC §3). */
export const FLAG_CHIPS = [
  { slug: "walk-in", label: "Walk-in OK" },
  { slug: "reservation", label: "Reservation needed" },
  { slug: "casual", label: "Casual (¥)" },
  { slug: "splurge", label: "Splurge (¥¥¥¥)" },
];

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

/* Blocks dark enough that the overlaid price / list badges need white text
   for AA contrast. BUILD_SPEC §5 annotates "(white text)" on the two Ink
   Black blocks; the darkened-red Sukiyaki block needs it too (white ≈ 6:1,
   ink ≈ 3.5:1) — noted in the PR. */
export const DARK_BLOCKS = new Set(["ink", "red-deep"]);

const SLUG_BY_VALUE = new Map(CUISINE_CHIPS.map((c) => [c.value, c.slug]));

/* cuisine_chip value -> URL slug. */
export function cuisineSlug(value) {
  return SLUG_BY_VALUE.get(value) ?? "";
}

/* Planning-flag slugs that apply to one restaurant record. Precomputed at
   build time and stamped onto the card as `data-flags` so the client
   filter never needs to ship this logic. */
export function restaurantFlags(r) {
  const out = [];
  if (r.reservation_required === "walk-in OK") out.push("walk-in");
  if (r.reservation_required === "yes") out.push("reservation");
  if (r.price_tier === "¥") out.push("casual");
  if (r.price_tier === "¥¥¥¥") out.push("splurge");
  return out;
}
