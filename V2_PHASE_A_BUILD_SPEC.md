# Japan Finds V2 — Phase A Build Spec

Mission: Build the data + component foundation for V2. After Phase A, 
adding a new product/place/cheat-sheet means editing a single YAML or 
MDX file and the site picks it up automatically. Status gating is 
enforced at the data layer. No live site changes yet — Phase A is 
plumbing only.

V2 lives in the SAME project folder as V1 (`japan-finds/`). Same Astro 
project. Same Vercel deploy. Same domain. We extend, don't fork.

## What V1 already provides — do not rebuild

- Astro project scaffold, Vercel deploy, GitHub repo, domain wired
- Design tokens: Rice White, Ink Black, Tokyo Red, Konbini Blue, Matcha 
  Green, Egg Yellow, Concrete Gray (in `/src/styles/tokens.css`)
- Type stack: Space Grotesk / Inter / IBM Plex Mono (loaded in Base layout)
- Banned-words list, image rules, brand voice rules (V1 BUILD_SPEC.md)
- Section components from V1 (Hero, §01–§06, Footer) — leave untouched
- Existing pages: `/` (landing), `/accessibility/`

Phase A adds: data layer, V2 component scaffolds, conversion tooling. 
Nothing in V1 changes. Nothing renders publicly yet.

## Folder additions

```
japan-finds/
├── src/
│   ├── content/                          NEW (Astro Content Collections)
│   │   ├── config.ts                     NEW (Zod schemas + collection defs)
│   │   ├── products/                     NEW (one YAML per product)
│   │   ├── places/                       NEW (one YAML per place)
│   │   ├── stores/                       NEW (one YAML per store)
│   │   ├── routes/                       NEW (one YAML per route)
│   │   └── cheat-sheets/                 NEW (one MDX per cheat sheet)
│   └── components/
│       └── v2/                           NEW (V2 component scaffolds)
│           ├── ProductCard.astro
│           ├── PlaceCard.astro
│           ├── StoreCard.astro
│           ├── RouteCard.astro
│           └── CheatSheetCard.astro
├── data/
│   └── source/                           NEW (gitignored — your XLSXs)
│       ├── products.xlsx
│       ├── places.xlsx
│       ├── stores.xlsx
│       ├── cheat-sheets.docx
│       └── handoff.docx
├── scripts/
│   └── convert-source.mjs                NEW (XLSX → YAML/MDX)
└── .gitignore                            UPDATED (add data/source/)
```

The XLSX/DOCX sources go in `/data/source/` (gitignored — they're 
working drafts that don't belong in the deploy). Generated YAML/MDX 
files in `/src/content/` ARE committed.

## Stack additions

Locked from V1, no changes to:
- Astro, vanilla CSS, Vercel, Kit, no Tailwind, no React.

Phase A adds:
- **Zod** — schema validation. `npm install zod`.
- **xlsx** (SheetJS) — read XLSX in the conversion script. `npm install xlsx`.
- **gray-matter** — parse MDX frontmatter in the conversion script. 
  `npm install gray-matter`.

These are dev dependencies for the script + content collection schemas. 
Nothing ships to the browser.

## Status gating — canonical rule

The dev handoff doc defines 5 publish statuses. Map XLSX values to this 
enum during conversion:

| XLSX value                  | Schema value         | Renders publicly? |
|-----------------------------|----------------------|-------------------|
| `Ready`                     | `ready`              | ✅ Yes            |
| `V1 Candidate`              | `v1_candidate`       | ❌ No (pre-verify)|
| `Needs Verification`        | `needs_verification` | ❌ No             |
| `Hold` / `Backlog`          | `hold`               | ❌ No             |
| `Reject`                    | `reject`             | ❌ No             |
| `Content Only / Hold`       | `content_only`       | ❌ No             |
| (anything else / blank)     | `needs_verification` | ❌ No (default safe)|

Public render filter: ONLY entries where `data.status === "ready"` 
appear on the public site. Everywhere a collection is queried for 
public display, this filter must be applied. No exceptions.

`v1_candidate` is the user's verification queue. As they verify rows, 
they manually promote `v1_candidate` → `ready` in the YAML file.

## Schemas (Zod, one per collection)

`src/content/config.ts` defines all five collections. Required vs 
optional fields below. Start permissive; tighten field-by-field as 
data quality improves.

### `products`

Required:
- `id` (string, format `JF-\d{4}`)
- `slug` (string, lowercase-kebab, unique within collection)
- `name_en` (string)
- `category` (enum: konbini, donki-drugstore, 100-yen, snacks, 
  skincare, stationery, kitchen, hobby, weird, other)
- `intent` (enum: try_in_japan, stock_up, bring_home, gift_easy, 
  local_editions, day_one_fixes, make_it_yours, content_only)
- `status` (enum above)

Optional:
- `name_jp` (string)
- `brand` (string)
- `where_found` (array of strings — chain names)
- `price_yen` (string — keep as string, source data has ranges like 
  "110-330")
- `what_it_is` (string, max 200 chars)
- `why_travelers_care` (string, max 200 chars)
- `risk_flags` (array of strings — e.g., "allergen", "fragile", 
  "regulated-blade", "skincare-claim")
- `verification_notes` (string — internal)
- `source_links` (array of URLs)
- `confidence` (enum: high, medium, low)
- `trip_score` (number 0–10)
- `suitcase_score` (number 0–10)

Banned: ANY field containing banned words from V1 BUILD_SPEC. 
Conversion script must scan `what_it_is` and `why_travelers_care` 
and fail validation if a banned word is found.

### `places`

Required:
- `slug` (string)
- `name_en` (string)
- `area` (string — e.g., "Shibuya, Tokyo")
- `category` (enum from V1 map labels: konbini-hauls, donki-drugstore-
  missions, 100-yen-finds, hobby-pilgrimages, rain-proof, family-ready, 
  local-food-streets, transit-anchors, quiet-japan-towns)
- `status`

Optional:
- `name_jp` (string)
- `address` (string)
- `google_maps_url` (string, URL)
- `why_it_belongs` (string, max 200 chars)
- `hours` (string — keep loose, varies wildly)
- `tax_free` (enum: yes, no, partial, unverified)
- `cash_only` (boolean)
- `related_products` (array of product slugs)
- `related_stores` (array of store slugs)
- `verification_notes` (string)
- `source_links` (array of URLs)

### `stores`

Required:
- `slug`
- `name_en`
- `layer` (enum: retail_chain, drugstore, konbini, 100_yen, depachika, 
  specialty, district)
- `status`

Optional:
- `name_jp`
- `best_for` (string)
- `core_categories` (array of strings)
- `example_products` (array of product slugs)
- `traveler_locations` (array of place slugs)
- `tax_free_notes` (string)
- `airport_availability` (string)
- `risk_flags` (array of strings)
- `source_links` (array of URLs)

### `routes`

Required:
- `slug`
- `name_en`
- `route_type` (enum: shopping_circuit, food_circuit, family_circuit, 
  rain_day_circuit, mixed)
- `status`

Optional:
- `stops` (ordered array of `{ place_slug: string, note?: string }`)
- `duration_note` (string)
- `related_products` (array of product slugs)
- `source_links` (array of URLs)

### `cheat-sheets` (MDX, not YAML)

Frontmatter required:
- `slug`
- `title`
- `summary` (string, max 200 chars — shows on index card)
- `topic` (enum: arrival, ic_cards, esim_phone, cash_atm, luggage, 
  jr_pass, drugstore_taxfree, konbini, rainy_day, family)
- `status`
- `last_verified` (date — ISO format)

Frontmatter optional:
- `related_products` (array of product slugs)
- `related_places` (array of place slugs)
- `related_stores` (array of store slugs)
- `recheck_recommended_by` (date)
- `source_links` (array of URLs)

Body: markdown. Use semantic headings (H2 for sections within a sheet). 
No banned words.

## Conversion script — `scripts/convert-source.mjs`

A Node.js script that reads from `/data/source/*.xlsx` and emits 
`/src/content/<collection>/<slug>.yaml` (or `.mdx`).

Requirements:
1. Reads each XLSX with the `xlsx` package.
2. For each row, maps XLSX columns to schema fields (mapping defined 
   in the script — explicit, not magic).
3. Validates each row against the corresponding Zod schema.
4. On validation failure: logs the row ID, the field, and the reason. 
   Does NOT write the file for that row.
5. On success: writes one YAML file per row to the correct collection 
   folder. Filename = slug. YAML keys = schema field names.
6. Scans `what_it_is`, `why_travelers_care`, `why_it_belongs`, and 
   cheat-sheet body for banned words. Fails the row if any are found.
7. Reports a summary at the end: total rows, valid rows written, 
   invalid rows skipped (with reasons).

Run via `npm run convert` (add to `package.json` scripts).

The script is idempotent — running it again overwrites existing YAML 
files. The user edits the YAML files directly after initial conversion; 
the XLSX is only used for the initial seed and bulk re-imports.

## Slug rules

- Lowercase kebab-case: `daiso-anti-fog-wipes`, `mega-don-quijote-shibuya`
- Generated from `name_en` if not provided: lowercase, replace spaces 
  and special chars with `-`, strip non-alphanumeric except `-`
- Must be unique within the collection
- Conversion script fails the build if slugs collide

## Component scaffolds — `src/components/v2/`

Phase A creates the components as MINIMAL scaffolds. Real styling 
happens in Phase B–D when they land in their pages.

Each component:
- Takes a typed content collection entry as a prop
- Filters: if `entry.data.status !== "ready"`, returns null (renders 
  nothing). This is the public render gate.
- Renders raw, unstyled HTML with the entry's fields visible — for 
  development inspection only. Phase B+ replaces the markup with the 
  comp-derived design.
- Uses V1 design tokens via CSS variables (no new styles)

Components to create:
- `ProductCard.astro` — name, intent chip, category, where-to-buy chips, 
  what/why, risk flags
- `PlaceCard.astro` — name, area chip, category, why-it-belongs
- `StoreCard.astro` — name, layer, best-for, example products
- `RouteCard.astro` — name, route type, stops count
- `CheatSheetCard.astro` — title, summary, topic, last verified

## .gitignore additions

```
# V2 source material (working drafts, not for git)
data/source/

# Conversion artifacts
.convert-log
```

## Sub-phases — execute in order

### A.1 — Audit
- Read every XLSX file Claude Code can see in `/data/source/`
- Output: `phase-a-column-audit.md` listing per file: sheet name, 
  column headers, row count, value samples for status/category enums
- Used to verify the schema mapping below before writing code
- HALT after this. Show the audit to the user before proceeding.

### A.2 — Install deps + schema
- `npm install zod xlsx gray-matter`
- Write `src/content/config.ts` with all 5 collection schemas
- Update `astro.config.mjs` only if content collections require config
- `npm run build` should pass (collections empty, but schemas valid)

### A.3 — Conversion script
- Write `scripts/convert-source.mjs`
- Add `"convert": "node scripts/convert-source.mjs"` to package.json
- Run `npm run convert`
- Show the conversion summary report. HALT — wait for user to confirm 
  the results look right before proceeding.

### A.4 — Component scaffolds
- Write the 5 V2 components in `src/components/v2/`
- Each component takes a typed entry, applies the `status === "ready"` 
  filter, renders unstyled output
- `npm run build` should still pass

### A.5 — Verification + commit
- Create a temporary `src/pages/_v2-test.astro` page that imports all 
  5 collections, filters to status=ready, renders all 5 card 
  components in a list. This is for visual inspection only and gets 
  deleted at the end of Phase A.
- Visit `/_v2-test` locally, confirm:
  - Collections load
  - Only `ready` rows render (likely 0 if no rows are promoted yet)
  - Cards display correct fields
- Delete `_v2-test.astro` once verified
- Commit + push: `chore: V2 Phase A — content layer + component 
  scaffolds (no public render yet)`

## Halt conditions

- After A.1 (audit) — show audit, wait for confirmation before schema
- After A.3 (conversion) — show summary, wait for confirmation before 
  components
- Any time conversion validation fails on rows the user expected to 
  pass — halt and ask before forcing through
- Banned-word detection — halt and ask before either editing the row 
  or skipping it
- Any XLSX column that doesn't fit cleanly into a schema field — halt

## Rules

- No public site changes. V1 stays untouched.
- No new dependencies beyond `zod`, `xlsx`, `gray-matter`.
- No external CMS, no API integrations, no database.
- Schemas are the contract. Anything that breaks validation gets 
  flagged, not silently dropped.
- Banned words from V1 BUILD_SPEC apply to all rendered copy fields.
- Brand tokens from V1 BUILD_SPEC apply.

## Definition of done

- 5 Zod schemas in `src/content/config.ts`, all pass `astro check`
- `scripts/convert-source.mjs` runs without errors, writes valid YAML 
  files for all rows that pass validation, logs reasons for any 
  skipped rows
- 5 V2 components in `src/components/v2/` render correctly when given 
  typed collection entries
- Public render filter (`status === "ready"`) verified via test page
- `npm run build` passes
- Changes committed to main, pushed to GitHub (Vercel auto-redeploys 
  but no visible change since no public routes added)
- Conversion log saved as `phase-a-conversion-summary.md` for the 
  user's records

Then stop. Phase B (Shopping Lists pages) is the next session.

---
Version: 1.0
Date: 2026-05-16
Depends on: V1 BUILD_SPEC.md (locked tokens, banned words, brand voice)
