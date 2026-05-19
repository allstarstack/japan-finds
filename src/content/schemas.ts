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
      "parks",
      "", // base-tier rows: no experience chip
    ])
    .optional(),
  // semicolon-separated subset of: rainy_day, with_kids, by_train
  // (day_trips is in the taxonomy but unused — no rows carry it)
  planning_flags: z.string().optional(),
  launch_tier: z.enum(["standard", "base"]).default("standard"),
  status: z.enum(["ready", "draft"]).default("ready"),
  public_render: z.boolean().default(true),
  address_verified: z.boolean().default(false),
  source_type: z.string().optional(),
  original_category: z.string().optional(),
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

export const schemas = {
  products: productSchema,
  places: placeSchema,
  stores: storeSchema,
  routes: routeSchema,
  "cheat-sheets": cheatSheetSchema,
};
