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
});

export const placeSchema = z.object({
  slug,
  name_en: z.string(),
  area: z.string(),
  category: z.enum([
    "konbini-hauls",
    "donki-drugstore-missions",
    "100-yen-finds",
    "hobby-pilgrimages",
    "rain-proof",
    "family-ready",
    "local-food-streets",
    "transit-anchors",
    "quiet-japan-towns",
  ]),
  status: statusEnum,
  name_jp: z.string().optional(),
  address: z.string().optional(),
  google_maps_url: z.string().optional(),
  why_it_belongs: z.string().max(200).optional(),
  hours: z.string().optional(),
  tax_free: z.enum(["yes", "no", "partial", "unverified"]).optional(),
  cash_only: z.boolean().optional(),
  related_products: strings.optional(),
  related_stores: strings.optional(),
  verification_notes: z.string().optional(),
  source_links: strings.optional(),
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

export const cheatSheetSchema = z.object({
  slug,
  title: z.string(),
  summary: z.string().max(200),
  topic: z.enum([
    "arrival",
    "ic_cards",
    "esim_phone",
    "cash_atm",
    "luggage",
    "jr_pass",
    "drugstore_taxfree",
    "konbini",
    "rainy_day",
    "family",
  ]),
  status: statusEnum,
  last_verified: z.coerce.date(),
  related_products: strings.optional(),
  related_places: strings.optional(),
  related_stores: strings.optional(),
  recheck_recommended_by: z.coerce.date().optional(),
  source_links: strings.optional(),
});

export const schemas = {
  products: productSchema,
  places: placeSchema,
  stores: storeSchema,
  routes: routeSchema,
  "cheat-sheets": cheatSheetSchema,
};
