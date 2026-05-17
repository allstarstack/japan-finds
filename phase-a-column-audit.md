# Phase A.1 — Column Audit

Audit of the source files in `data/source/`, against the V2 Phase A schemas.
Purpose: verify the column→schema mapping **before** writing the schemas
(A.2) and conversion script (A.3).

## Source files found

| File | Maps to | Data sheet | Data rows |
|---|---|---|---|
| `japan_finds_product_source_of_truth_v1.xlsx` | `products` | **Product Master** | 461 |
| `japan_finds_map_source_of_truth_v1.xlsx` | `places` | **Candidate Pins** | 35 |
| `japan_finds_where_to_buy_source_of_truth_v1.xlsx` | `stores` + `routes` | **Where-to-Buy Master** (19) · **Shopping Circuits** (5) | 24 |
| `01_Travel_Cheat_Sheets_Source_of_Truth_v1.docx` | `cheat-sheets` | (DOCX — not yet parsed) | — |
| `japan_finds_sponsor_outreach_contacts_top10_v2.xlsx` | *(none — out of scope)* | — | — |

`handoff.docx` (listed in the spec's `data/source/`) is **not present**. Not
blocking — the 5 publish statuses are fully defined in the spec itself.

Every source XLSX also carries several non-data sheets (Executive Summary,
Source Comparison, Counts, Backlog, Verification Queue, etc.). The conversion
script will read only the one data sheet named per collection above.

---

## `products` — Product Master (461 rows)

`Master ID` runs `JF-0001`…`JF-0461`, matching the schema's `JF-\d{4}`.

| XLSX column | → schema field | Notes |
|---|---|---|
| Master ID | `id` | ✅ clean |
| Product name | `name_en` | ✅ — also seeds `slug` |
| Japanese name | `name_jp` | ✅ (435/461 filled) |
| Brand / maker | `brand` | ✅ |
| Category | `category` | ⚠️ **D1/D2** — 29 free-form values vs 10-enum |
| Where found | `where_found` | comma-text → string[] ✅ |
| Intent label | `intent` | ⚠️ **D1** — 43 values, mostly compound |
| Approx price | `price_yen` | ✅ string (ranges kept) |
| What it is | `what_it_is` | ✅ (200-char limit checked at validation) |
| Why travelers care | `why_travelers_care` | ✅ |
| Risk flags | `risk_flags` | `;`-text → string[] ✅ |
| Verification needed | `verification_notes` | ✅ |
| Source links / reference | `source_links` | ⚠️ **D7** — mixed URLs / bare domains / "general" |
| Confidence | `confidence` | High/Medium/Low → high/medium/low ✅ |
| Trip score | `trip_score` | ✅ number 0–10 |
| Suitcase score | `suitcase_score` | ✅ number 0–10 (20 blank) |
| Publish status | `status` | ✅ **clean** — see below |
| Demand signal · Sources seen · Source count · Launch priority | — | ⚠️ **D5** — no schema field |
| Steven personal flag | — | ⚠️ **D4** — sensitive; no schema field |

**`status` — Publish status values (5, all map cleanly):**
`V1 Candidate`→`v1_candidate` · `Needs Verification`→`needs_verification` ·
`Hold`→`hold` · `Backlog`→`hold` · `Content Only / Hold`→`content_only`.
Counts: ~279 `v1_candidate`, ~95 `needs_verification`, ~48 `hold` (backlog),
rest `hold`/`content_only`. **0 are `ready`** → nothing renders until rows are
promoted. Correct per spec.

**`category` — 29 distinct XLSX values** (schema enum: konbini, donki-drugstore,
100-yen, snacks, skincare, stationery, kitchen, hobby, weird, other):
`100-yen` · `100-yen shop / kitchen / travel helpers` · `Avoid` ·
`Content-only / caution` · `Customize` · `Design` · `Donki` · `Donki finds` ·
`Drugstore` · `Drugstore basics & OTC comfort` · `Gift` · `Kid` ·
`Kid / family products` · `Kitchen` · `Konbini Drink` · `Konbini Food` ·
`Konbini Sweet` · `Konbini foods & drinks` · `Manual pasted additions / audit` ·
`Packing` · `Personalization / customization` · `Regional` ·
`Regional souvenir foods` · `Skincare` · `Skincare / beauty / sunscreen` ·
`Snacks` · `Stationery` · `Sunscreen` · `Travel`

**`intent` — 43 distinct XLSX values**, e.g. `Bring Home`, `Gift Easy`,
`Stock Up`, `Day-One Fixes`, `Try in Japan`, `Make It Yours`, `Local Editions`,
`Content Only` — **but most rows are compound**: `Gift Easy / Bring Home`,
`Bring Home / Gift Easy / Local Editions`, `Try in Japan / Stock Up`, etc.

> Other sheets in this file — **V1 Shortlist** (75 rows, same `Master ID`s, a
> curated subset) and **Verification Queue** (150 rows, fewer columns) — are
> *views* of Product Master, not separate data. Converting them would collide
> on `id`/`slug`. See **D8**.

---

## `places` — Candidate Pins (35 rows)

| XLSX column | → schema field | Notes |
|---|---|---|
| Candidate | `name_en` | ✅ — also seeds `slug` |
| Area / City | `area` | ✅ |
| Suggested Label | `category` | ⚠️ **D1** — 21 values, ~12 compound |
| Why it belongs | `why_it_belongs` | ✅ |
| V1 status | `status` | ⚠️ **D3** — non-canonical vocabulary |
| Verification needed · Notes | `verification_notes` | ✅ (merge the two) |
| Priority · Source signal | — | no schema field — drop |

No `name_jp`, `address`, `google_maps_url`, `hours`, `tax_free`, `cash_only`
columns exist — those optional fields will simply be absent.

**`category` — 21 distinct "Suggested Label" values** (schema enum:
konbini-hauls, donki-drugstore-missions, 100-yen-finds, hobby-pilgrimages,
rain-proof, family-ready, local-food-streets, transit-anchors,
quiet-japan-towns). Single values map fine; **~12 are compound**, e.g.
`Hobby Pilgrimages / Rain-Proof`, `Family-Ready / Hobby Pilgrimages / Rain-Proof`,
`Konbini Hauls / Day-One Food` (note: "Day-One Food" is not in the enum),
`Family-Ready / Make It Yours` ("Make It Yours" is a product *intent*, not a
place category).

**`status` — "V1 status" has 3 values:** `V1 verify`, `V1/V2 verify`,
`V2 verify`. **None match the spec's status table** → all 35 fall through to the
default `needs_verification`. (Reasonable — they all mean "not verified yet" —
but see **D3**.)

---

## `stores` — Where-to-Buy Master (19 rows)

⚠️ This sheet has a **title in row 1 and real headers in row 2** (data from
row 3). The conversion script must skip the title row.

| XLSX column (row 2) | → schema field | Notes |
|---|---|---|
| Store / Chain / District | `name_en` | ✅ — also seeds `slug` |
| Japanese Name | `name_jp` | ✅ |
| Layer | `layer` | ⚠️ **D1** — 12 values vs 7-enum |
| Best For | `best_for` | ✅ |
| Core Product Categories | `core_categories` | `;`-text → string[] ✅ |
| Example Products / Items | `example_products` | ⚠️ **D6** — free text, not product slugs |
| Traveler-Friendly Locations / Circuits | `traveler_locations` | ⚠️ **D6** — free text, not place slugs |
| Tax-Free / Coupon Notes | `tax_free_notes` | ✅ |
| Airport Availability | `airport_availability` | ✅ |
| Risk / Safety Flags | `risk_flags` | `;`-text → string[] ✅ |
| Source URLs | `source_links` | ✅ (mostly real URLs) |
| Why Travelers Care · Japan Finds Labels · Practical Notes · Verification Needed · V1 Priority · Public Site Use · Source Winner | — | no schema field |

**No `status` column exists** → all 19 default to `needs_verification`. See **D3**.

**`layer` — 12 distinct values** (schema enum: retail_chain, drugstore, konbini,
100_yen, depachika, specialty, district): `Retail chain`, `Drugstore`,
`Konbini chain`, `100-yen chain`, `Lifestyle store`, `Lifestyle / DIY store`,
`Stationery specialist`, `District`, `Retail complex`, `Transit retail hub`,
`Department-store food hall`, `Regional specialty retail`. Most map (e.g.
`Department-store food hall`→`depachika`); `Retail complex` and
`Transit retail hub` have no obvious enum home.

---

## `routes` — Shopping Circuits (5 rows)

⚠️ Same title-row-then-header-row layout as the stores sheet.

| XLSX column (row 2) | → schema field | Notes |
|---|---|---|
| Circuit | `name_en` | ✅ — also seeds `slug` |
| Stops | `stops` | ⚠️ **D6/D10** — arrow-joined free text, not place slugs |
| Best Use | `duration_note` *(loose fit)* | — |
| Why It Belongs · Labels · V1 Priority · Verification Needed | — | no schema field |

The 5 circuits: Day-One Survival Circuit · Shibuya Chaos-to-Curated Circuit ·
Tokyo Station Gift Sprint · Ginza Design + Stationery Circuit · Kappabashi
Carry-Home Circuit.

**No `route_type` column** (all 5 are shopping circuits) and **no `status`
column**. See **D10**.

---

## `cheat-sheets` — DOCX, not audited here

`01_Travel_Cheat_Sheets_Source_of_Truth_v1.docx` is the source. A.1 covers
XLSX only, and the conversion-script spec says it "reads `/data/source/*.xlsx`"
— the DOCX→MDX path isn't specified. See **D12**.

---

# Decisions needed before A.2

These are halt items — the spec says halt on "any XLSX column that doesn't fit
cleanly into a schema field." Each has a recommendation; confirm or correct.

**D1 — Compound `intent` / `category` values.**
The data is heavily multi-valued where the schemas expect single enums.
- *Recommendation:* make **`products.intent` an array** of the enum (the data
  is genuinely multi-intent — 43 mostly-compound values). Keep **`category`
  single enum** (products & places) and map each XLSX value to one schema value
  via an explicit table in the conversion script; for compound place labels,
  use the **first** label as primary. I'll bring the full mapping tables for
  sign-off in A.2.

**D2 — Non-category values in `products.Category`.**
`Avoid`, `Content-only / caution`, `Manual pasted additions / audit` are
process notes, not categories.
- *Recommendation:* map them to `other`; gating is handled by `status` anyway.

**D3 — Only `products` has real publish-status data.**
`places` uses a non-canonical vocabulary; `stores` and `routes` have no status
column at all → **all places, stores, and routes default to
`needs_verification` and render nothing** until you promote them in the YAML.
- *Recommendation:* accept the safe default. (Optionally, map the place values
  `V1 verify`/`V1/V2 verify`/`V2 verify` all → `needs_verification` explicitly —
  same result, just intentional.)

**D4 — `Steven personal flag` column (products, 12 rows).**
Sensitive personal/medical notes (transplant team, liver, grapefruit/alcohol).
**Must never render publicly**, and there's no schema field for it.
- *Recommendation:* do **not** carry it into a public field. Either drop it, or
  fold it into `verification_notes` (internal-only). Your call — I'd lean drop.

**D5 — Extra product columns with no schema home.**
`Demand signal`, `Sources seen`, `Source count`, `Launch priority`.
- *Recommendation:* drop them — internal research metadata, not needed on-site.

**D6 — Cross-link fields hold free text, not slugs.**
`stores.example_products`, `stores.traveler_locations`, `routes.stops` (and the
`related_*` fields) expect slug arrays; the XLSX has names / arrow-strings.
- *Recommendation:* leave all cross-link fields **empty** in Phase A. Resolving
  text → slugs is a later phase; converting it now would invent links.

**D7 — `products.source_links` aren't all valid URLs.**
Mix of full URLs, bare domains (`cando-web.co.jp`), and `general`.
- *Recommendation:* keep `source_links` as a plain `string[]` (not URL-validated)
  for Phase A — "start permissive." Values pass through as-is.

**D8 — Convert `Product Master` only.**
`V1 Shortlist` (75) and `Verification Queue` (150) are subsets/views of the same
461 rows — converting them collides on `id`/`slug`.
- *Recommendation:* convert **Product Master (461)** only.

**D10 — `routes` has a thin source.**
- *Recommendation:* seed the 5 circuits with `route_type: shopping_circuit` and
  `status: needs_verification`, `stops` omitted. Or defer `routes` entirely to a
  later phase (still create the schema). I'd lean: seed the 5, loosely.

---

# Notes / FYI (no decision needed)

- **D9** — The `Where-to-Buy Master` and `Shopping Circuits` sheets have a title
  row above the header row; the conversion script will skip it.
- **D11** — `handoff.docx` is missing but not needed; the status enum is in the
  spec.
- **D12** — `cheat-sheets` source is a `.docx`. I'll audit its structure and
  handle DOCX→MDX when we reach A.3 (it needs its own parser; `xlsx` won't read
  it).
- **D13** — `japan_finds_sponsor_outreach_contacts_top10_v2.xlsx` is sponsor
  outreach — no matching collection. Excluded from Phase A.

**Halting per spec — A.1 complete. Confirm the decisions above (or correct
them) before I proceed to A.2 (install deps + write the 5 Zod schemas).**
