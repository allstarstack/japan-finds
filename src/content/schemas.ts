/* V2 content-collection schemas (Zod).
   Shared by src/content/config.ts (Astro) and scripts/convert-source.mjs
   (the conversion script) so the contract lives in exactly one place.
   Uses the standalone `zod` package — deduped with Astro's own zod. */
import { z } from "zod";

/* Publish status — shared across all collections.
   Only `ready` renders publicly (gate enforced in the V2 components). */
export const statusEnum = z.enum([
  "ready",
  "v1_candidate",
  "needs_verification",
  "hold",
  "reject",
  "content_only",
]);

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase kebab-case");
const score = z.number().min(0).max(10);
const strings = z.array(z.string());

/* Phase D D1 — opening hours from the Google Places API (BUILD_SPEC_d1).
   A 7-day map; each day is a list of [open, close] pairs and an empty
   list means closed that day. The YAML carries bare HH:MM scalars, which
   js-yaml reads as strings — the number branch is defensive only. */
const hoursDay = z.array(z.array(z.union([z.string(), z.number()])));
const placesHours = z
  .object({
    monday: hoursDay,
    tuesday: hoursDay,
    wednesday: hoursDay,
    thursday: hoursDay,
    friday: hoursDay,
    saturday: hoursDay,
    sunday: hoursDay,
  })
  .partial();

export const productSchema = z.object({
  // required
  id: z.string().regex(/^JF-\d{4}$/, "must match JF-####"),
  slug,
  name_en: z.string(),
  category: z.enum([
    "konbini",
    "donki-drugstore",
    "100-yen",
    "snacks",
    "skincare",
    "stationery",
    "kitchen",
    "hobby",
    "weird",
    "other",
  ]),
  // intent is an array — source data is genuinely multi-intent (audit D1)
  intent: z
    .array(
      z.enum([
        "try_in_japan",
        "stock_up",
        "bring_home",
        "gift_easy",
        "local_editions",
        "day_one_fixes",
        "make_it_yours",
        "content_only",
      ]),
    )
    .min(1),
  status: statusEnum,
  // optional
  name_jp: z.string().optional(),
  brand: z.string().optional(),
  where_found: strings.optional(),
  price_yen: z.string().optional(),
  what_it_is: z.string().max(200).optional(),
  why_travelers_care: z.string().max(200).optional(),
  risk_flags: strings.optional(),
  verification_notes: z.string().optional(),
  source_links: strings.optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  trip_score: score.optional(),
  suitcase_score: score.optional(),
  // Phase B-1 catalog-launch fields. Optional: only the 385 launch products
  // carry them — the other ~75 YAMLs in the collection are not in the launch
  // set, and a required enum would fail schema validation on those and break
  // the build. The /products UI keys off `launch_category` + `status: ready`.
  launch_category: z
    .enum([
      "konbini",
      "hundred_yen",
      "drugstore",
      "donki",
      "skincare_beauty",
      "regional_food",
      "snacks",
      "stationery",
      "kitchen",
      "kids_family",
      "customization",
      "travel_gear",
      "gift",
    ])
    .optional(),
  fill_type: z.enum(["verified", "creator_fill"]).optional(),
  display_strategy: z
    .enum(["show_all", "hide_jp_and_brand_until_enriched"])
    .optional(),
  featured: z.boolean().optional().default(false),
  // konbini → food|drink|sweet · drugstore → skincare|comfort|beauty|meds
  sub_chip: z.string().optional(),
  // D5b enrichment fields (added in D5b.5)
  description: z.string().nullable().optional(),
  english_name: z.string().nullable().optional(),
  japanese_name: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  price_range_jpy: z.string().nullable().optional(),
  where_to_buy: strings.optional(),
  image: z.string().nullable().optional(),
  safety_flags: strings.optional(),
  // D5c — human-readable safety blurb shown beneath the description on
  // /products cards. Optional: only a minority of slugs carry one.
  safety_callout: z.string().nullable().optional(),
  enrichment_confidence: z.enum(["high", "medium", "low"]).optional(),
  enrichment_source_url: z.string().nullable().optional(),
  enrichment_date: z.string().nullable().optional(),
});

/* Phase B-2 places schema (Decision #1B revision).
   Supersedes the Phase A inspection schema — the old `category` /
   `name_en` / `area` shape is gone. The /places ("Where") page keys off
   `primary_category` (card colour) and `public_label` (the experience
   chip), and derives the planning/audience sub-filters from
   `planning_flags`. 12 primary chips: the spec's 11 plus `parks` — the
   11 backlog rows that arrived tagged `with_kids` as a *label* are all
   parks/playgrounds, so they get their own chip (Steven's call).
   Base-tier rows ("stay bases") carry `public_label: ""` — no chip.
   `slug` is dropped: the glob loader derives the entry id from the
   filename, so the file IS the slug. */
export const placeSchema = z.object({
  // required
  // Monotonic add-signal (jf-place-####), assigned in baseline by git
  // first-add-date asc + filename asc; new rows take the next id. Required
  // is the rail that prevents a future add from silently sorting to the
  // bottom of /places (PLACES_ADD_SIGNAL_BUILD_SPEC).
  id: z.string(),
  name: z.string(),
  address_or_area: z.string(),
  region: z.string(),
  prefecture: z.string(),
  primary_category: z.enum(["See", "Do", "Eat", "Stay"]),
  // optional
  public_label: z
    .enum([
      "nature_water",
      "culture_history",
      "animals",
      "photo_spots",
      "quirky_museums",
      "theme_parks",
      "onsen_ryokan",
      "workshops_crafts",
      "anime",
      "scenic_transport",
      "food_markets",
      "cafes",
      "parks",
      "", // base-tier rows: no experience chip
    ])
    .optional(),
  // semicolon-separated subset of: rainy_day, with_kids, day_trips
  planning_flags: z.string().optional(),
  launch_tier: z.enum(["standard", "base"]).default("standard"),
  status: z.enum(["ready", "draft"]).default("ready"),
  public_render: z.boolean().default(true),
  address_verified: z.boolean().default(false),
  source_type: z.string().optional(),
  original_category: z.string().optional(),
  // Phase D D1 — Places API enrichment (BUILD_SPEC_d1_places_api.md).
  // All optional: saphir-odoriko-limited-express matched no Google Place
  // (it's a train) and carries none of these. `time_sensitive`/`hours` once
  // drove the live open-now badge, removed in the 2026-05-24 cost kill
  // (BUILD_SPEC_cost_kill.md); the fields are retained (no schema change) but
  // are no longer rendered. See `placesHours` above for `hours`.
  place_id: z.string().optional(),
  // When two or more entries intentionally share a Google place_id (an
  // editorial split of one venue, or a base-tier "area" entry whose
  // centroid coincides with a named feature inside it), each member must
  // list the other group members here. scripts/verify-place-ids.mjs reads
  // this to distinguish documented sharing from accidental duplicates;
  // any group of entries with a shared place_id whose members don't
  // mutually reference each other fails validation. Slugs only (no
  // .yaml suffix, no path).
  shared_place_id_with: z.array(z.string()).optional(),
  // Free-form note about the place_id — usually "verification needed"
  // for entries that inherit a sibling's place_id (sub-features without
  // their own Google listing), or a one-liner explaining why an entry
  // shares its place_id with another. Read by verify-place-ids.mjs only
  // for the report; not used by the renderer.
  place_id_note: z.string().optional(),
  // Optional list of extra search tokens (neighborhood names, alternative
  // romanisations, common typos) that the PlaceCard data-search blob folds
  // in alongside name + address_or_area. Empty by default; opt-in per
  // entry. Use this to fix neighborhood-granularity gaps where address_or_area
  // doesn't carry the neighborhood (e.g. a Shinjuku place whose address
  // string is just "Tokyo"). Tokens are joined into the lowercased search
  // blob; no separator semantics — each item is matched as a substring.
  search_aliases: z.array(z.string()).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  // 62 rows (beaches, capes, viewpoints) carry an empty `hours:` key,
  // which YAML reads as null — accept it alongside the 7-day map.
  hours: placesHours.nullish(),
  hours_cache_date: z.string().optional(),
  hero_image: z.string().optional(),
  hero_attribution: z.string().optional(),
  time_sensitive: z.boolean().optional(),
  // Card badge flags (orthogonal to public_label and planning_flags — a
  // place can be both local_favorite and viral). viral_signal is intended
  // to be populated whenever viral=true (source / engagement / date), but
  // not Zod-enforced — data-quality issue if missing, not render-blocking.
  local_favorite: z.boolean().optional().default(false),
  viral: z.boolean().optional().default(false),
  viral_signal: z
    .object({
      source: z.string(),
      engagement: z.string(),
      date: z.string(),
    })
    .optional(),
});

export const storeSchema = z.object({
  slug,
  name_en: z.string(),
  layer: z.enum([
    "retail_chain",
    "drugstore",
    "konbini",
    "100_yen",
    "depachika",
    "specialty",
    "district",
  ]),
  status: statusEnum,
  name_jp: z.string().optional(),
  best_for: z.string().optional(),
  core_categories: strings.optional(),
  example_products: strings.optional(),
  traveler_locations: strings.optional(),
  tax_free_notes: z.string().optional(),
  airport_availability: z.string().optional(),
  risk_flags: strings.optional(),
  source_links: strings.optional(),
});

export const routeSchema = z.object({
  slug,
  name_en: z.string(),
  route_type: z.enum([
    "shopping_circuit",
    "food_circuit",
    "family_circuit",
    "rain_day_circuit",
    "mixed",
  ]),
  status: statusEnum,
  stops: z
    .array(z.object({ place_slug: z.string(), note: z.string().optional() }))
    .optional(),
  duration_note: z.string().optional(),
  related_products: strings.optional(),
  source_links: strings.optional(),
});

/* Phase B-3 cheat-sheets schema (BUILD_SPEC_cheat_sheets.md §3).
   Supersedes the Phase A inspection shape — the 9 hand-written .md sheets
   carry a deliberately small frontmatter: title, slug, last_verified, the
   dev-only verify_before_publish queue (surfaced by scripts/verify-status.mjs)
   and the medical_caution flag (donki sheet only). The markdown body carries
   everything else; nothing in it is structured data. */
export const cheatSheetSchema = z.object({
  title: z.string(),
  slug,
  last_verified: z.coerce.date(),
  verify_before_publish: z
    .array(z.object({ field: z.string(), note: z.string() }))
    .optional(),
  medical_caution: z.boolean().optional(),
});

/* Phase A.9 stays schema (PHASE_A9_BUILD_SPEC §1).
   New "Stay" source on /map, parallel to places/eat. 136-row seed imported
   from docs/build/stays_seed.csv via scripts/import_stays_seed.py.
   place_id / lat / lng / photo_cache_path are populated by a later D7-style
   enrichment workstream — kept optional so the initial seed lands clean. */
export const staySchema = z.object({
  id: z.string().regex(/^jf-stay-\d{4}$/, "must match jf-stay-####"),
  name: z.string(),
  name_jp: z.string(),
  city: z.string(),
  prefecture: z.string(),
  primary_cat: z.enum([
    "onsen_ryokan",
    "design_hotel",
    "machiya_kominka",
    "glamping",
    "resort",
    "capsule_themed",
    "mountain_lodge",
    "heritage_hotel",
    "temple_stay",
  ]),
  price_tier: z.enum(["budget", "mid", "upscale", "luxury"]),
  description: z.string(),
  distinctive: z.string(),
  source_url: z.string().url(),
  // Enrichment fields — populated by a later workstream.
  place_id: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  photo_cache_path: z.string().optional(),
});

export const schemas = {
  products: productSchema,
  places: placeSchema,
  stores: storeSchema,
  routes: routeSchema,
  stays: staySchema,
  "cheat-sheets": cheatSheetSchema,
};
