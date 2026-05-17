/* V2 content collections.
   NB: Astro 6 requires this file at src/content.config.ts — the spec's
   src/content/config.ts is the removed legacy location.
   Schemas live in ./content/schemas.ts (shared with the conversion script).
   Products / places / stores / routes are YAML; cheat-sheets are Markdown
   (.md, not .mdx — true MDX would need @astrojs/mdx, which Phase A's
   "no new dependencies" rule disallows; cheat-sheet bodies are plain
   markdown anyway). */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  productSchema,
  placeSchema,
  storeSchema,
  routeSchema,
  cheatSheetSchema,
} from "./content/schemas";

const yaml = (folder: string) =>
  glob({ pattern: "**/*.yaml", base: `./src/content/${folder}` });

export const collections = {
  products: defineCollection({ loader: yaml("products"), schema: productSchema }),
  places: defineCollection({ loader: yaml("places"), schema: placeSchema }),
  stores: defineCollection({ loader: yaml("stores"), schema: storeSchema }),
  routes: defineCollection({ loader: yaml("routes"), schema: routeSchema }),
  "cheat-sheets": defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/cheat-sheets" }),
    schema: cheatSheetSchema,
  }),
};
