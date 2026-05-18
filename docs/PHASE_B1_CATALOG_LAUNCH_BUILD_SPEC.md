# Phase B-1 — Catalog Launch BUILD_SPEC

**Version:** v1.0
**Date:** 2026-05-17
**Target:** japan.allstarsteven.com
**Build tool:** Claude Code
**Estimated build time:** ~3–4 hours
**Prereqs:** Phase A shipped (data layer, schemas, 460 product YAMLs gated `status: ready === false`)

---

## Goal

Take the locked 385-product launch list from Decision #2 and ship it to japan.allstarsteven.com with the filter UX from Decision #3. Lighthouse maintained at ≥95.

---

## Inputs (all in `/mnt/user-data/outputs/` from chat sessions)

- `decision_2_v4.csv` — 385 product picks with `launch_category`, `fill_type`, `display_strategy`, retailer field
- `verification_results_v1.csv` — source for verified retailer data
- `verification_input.csv` — source for English names, where_found fallback
- `brand.md` — voice, palette, typography, banned words/imagery
- Existing repo at `allstarstack/japan-finds`

---

## Decision #2 outcomes (locked)

- **385 products total: 239 V (verified-fill) + 146 CF (creator-fill).**
- **13 launch chips:** konbini, hundred_yen, drugstore, donki, skincare_beauty, regional_food, snacks, stationery, kitchen, kids_family, customization, travel_gear, gift
- **Conservative display on CF rows:** show English product name + generic where-to-buy ONLY. Hide `product_name_jp` and `brand_maker` until enrichment confirms (LLM-source hallucination guard — see Yawataya bug as precedent).
- **Dropped from catalog:**
  - 7 dupes (resolved in CSV)
  - 3 harm-excluded: JF-0067 vape/nicotine, JF-0069 strong laxatives, JF-0070 unverified contacts
  - 21 deferred to v2 wave (formerly "skip" chip — needs Steven per-item review for product/tip/cut classification)
- **Transplant safety flags are personal, not audience-facing.** Do NOT render any "skip if on transplant meds" callouts. Strip them from card display entirely.

---

## Decision #3 outcomes (locked)

### Chip labels — shopping-intent for the 4 store chips

| `launch_category` value | Display label | Item count |
|---|---|---|
| konbini | Konbini Run | 47 |
| drugstore | Drugstore Haul | 41 |
| hundred_yen | 100-Yen Stop | 36 |
| donki | Donki Trip | 31 |
| skincare_beauty | Skincare | 48 |
| regional_food | Regional Food | 49 |
| snacks | Snacks | 25 |
| stationery | Stationery | 25 |
| travel_gear | Travel Gear | 31 |
| customization | Customization | 16 |
| kids_family | Kids & Family | 24 |
| kitchen | Kitchen | 4 |
| gift | Gift | 8 |

### Sub-chips (dense chips only)

- **Konbini Run** → Food / Drink / Sweet
- **Drugstore Haul** → Skincare / Comfort / Beauty / Meds

Sub-chip mapping logic: derive from existing source `category` column in `verification_input.csv` (Konbini Food / Konbini Drink / Konbini Sweet / Konbini foods & drinks → split by product name). Drugstore sub-mapping by product type — Megrhythm/sheet masks → Skincare, Babu/eye drops → Comfort, Canmake/Cezanne-like → Beauty, NSAIDs/cold meds → Meds.

### Filter rules

- Primary chips: **single-select**
- Sub-chips (Konbini Run / Drugstore Haul only): **multi-select**
- Filter applies in place — no page nav required
- URL params for shareability welcome but not blocking
- Sort within chip: verified-first → CF, then alphabetical by `product_name_en`

### Default landing state

- No filter active
- 6 featured cards in hero rotation at top
- Chip rail below hero (horizontal-scroll on mobile, sticky on scroll)
- Lazy-loaded grid below: 2-col mobile / 3-col desktop
- Skip This chip: last position in rail

---

## Work breakdown

### Step 1 — Schema additions (~20 min)

Add to `src/content/schemas.ts` product schema:

```typescript
launch_category: z.enum([
  "konbini","hundred_yen","drugstore","donki","skincare_beauty",
  "regional_food","snacks","stationery","kitchen","kids_family",
  "customization","travel_gear","gift"
]),
fill_type: z.enum(["verified","creator_fill"]),
display_strategy: z.enum(["show_all","hide_jp_and_brand_until_enriched"]),
featured: z.boolean().optional().default(false),
sub_chip: z.string().optional(), // "food"|"drink"|"sweet" or "skincare"|"comfort"|"beauty"|"meds"
```

### Step 2 — Bulk YAML population from CSV (~30–45 min)

Write a one-off script (`scripts/populate-launch.mjs`) that:

1. Reads `decision_2_v4.csv`
2. For each row, locates `src/content/products/{jf_id}.yaml`
3. Sets `launch_category`, `fill_type`, `display_strategy`
4. For V rows: populates `confirmed_retailers` from verification_results_v1.csv
5. For CF rows: populates `where_found` from verification_input.csv; does NOT populate `product_name_jp` or `brand_maker` (leave empty or commented-out for enrichment pass later)
6. Derives `sub_chip` for konbini and drugstore rows using rules in Decision #3
7. Flips `status: ready` to `true`
8. Validates all 385 YAMLs against schema
9. Dropped JF-IDs (7 dupes, 3 harm-excludes, 21 v2-deferred): keep `status: ready === false`

### Step 3 — Product card component (~45 min)

Mobile-first per brand.md. Render fields based on `display_strategy`:

| display_strategy | name_en | name_jp | brand | where-to-buy |
|---|---|---|---|---|
| show_all | ✓ | ✓ | ✓ | ✓ (from `confirmed_retailers`) |
| hide_jp_and_brand_until_enriched | ✓ | hidden | hidden | ✓ (from `where_found`, generic OK) |

Standard card treatment for all 385 launch products (Rice White background, Ink Black text, Concrete Gray border).

**Do NOT render:** transplant safety flags, NSAID warnings, alcohol cautions, or any content from `existing_risk_flags` / `steven_personal_flag` columns of source data. Those are personal-use notes.

**Photography:** use creator stills where available; mark stock placeholders in code comments per brand.md ("// PLACEHOLDER — replace before launch refinement"). Don't generate AI photography. Don't use banned imagery (Mt. Fuji, torii, cherry blossoms, Shibuya neon, shrines).

### Step 4 — Filter rail and chip system (~60–90 min)

- Horizontal-scroll chip rail, sticky-on-scroll
- 13 primary chips, in this order:
  1. Konbini Run
  2. Drugstore Haul
  3. 100-Yen Stop
  4. Donki Trip
  5. Skincare
  6. Regional Food
  7. Snacks
  8. Stationery
  9. Travel Gear
  10. Customization
  11. Kids & Family
  12. Kitchen
  13. Gift
- Primary chips: single-select. Tapping the active chip deselects.
- Sub-chips appear beneath the primary rail ONLY when Konbini Run or Drugstore Haul is active. Multi-select.
- Sort: verified-first → CF, then alphabetical by `product_name_en`
- Empty state per brand.md: "Nothing here yet. Back when there is."

### Step 5 — Homepage hero and grid (~30 min)

- Hero rotation: 6 featured cards at top of `/products` (and `/` if products is the landing)
- Featured selection: any product with `featured: true`; fallback to 6 picks across diverse chips weighted to A-grade verified
- Grid below: lazy-load, infinite scroll
- 2-col mobile (375px) / 3-col tablet / 4-col desktop

### Step 6 — QA and ship (~30 min)

- Lighthouse run on `/products` and `/products?chip=konbini`: target ≥95/95/100/95
- Mobile render tested at 375px
- All 385 cards render without console errors
- Filter behavior matches spec (single/multi-select rules correct)
- Vercel build succeeds; deploy verified

---

## Acceptance criteria

- [ ] 385 product YAMLs have `status: ready`, `launch_category`, `fill_type`, `display_strategy` set
- [ ] CF rows render English name + where_found only (no JP name, no brand_maker)
- [ ] V rows render full info (name EN, name JP, brand, confirmed_retailers)
- [ ] All 13 primary chips render with correct counts
- [ ] Sub-chips appear ONLY inside Konbini Run and Drugstore Haul
- [ ] Single-select enforced on primary chips
- [ ] Multi-select works on sub-chips
- [ ] No transplant/safety callouts render anywhere on launch cards
- [ ] Mobile horizontal-scroll chip rail works at 375px, sticky-on-scroll
- [ ] Hero rotation shows 6 cards
- [ ] Lighthouse ≥95/95/100/95 on `/products` and at least one chip-filtered route
- [ ] Vercel deploy succeeds

---

## Failure modes and mitigations

| Risk | Mitigation |
|---|---|
| Bulk population script writes malformed YAML | Validate every YAML against schema before commit; abort on first failure |
| Schema enum mismatch breaks build | Run `astro check` after schema additions before populating YAMLs |
| Sub-chip derivation rules miss edge cases | Log un-mapped products during script run; default to no sub_chip rather than wrong sub_chip |
| Filter UX gets dense on mobile | Sticky chip rail + horizontal scroll; sub-chips collapse when parent inactive |
| Lighthouse drops below 95 | Profile cards image-by-image; lazy-load below-fold; defer non-critical JS |
| Vercel rebuild time blows up with 406 ready products | Astro static gen is fast for this size; if rebuild >90s, check for un-optimized images |
| User confused by chip taxonomy | Acceptable for v1; iterate based on real usage data |

---

## Out of scope (deferred to later builds)

- **21 "v2-deferred" items** (formerly proposed "skip" chip) → Steven reviews per-item later; each becomes a regular product card, behavioral tip moved to cheat-sheets, or cut
- **Shopping Lists feature** → Phase B-2, separate spec
- **Product card copy writing in full brand voice** → background queue, ~30–60hr total. Launch ships with terse one-liners; polish over time as real traffic identifies high-traffic cards.
- **Enrichment of CF rows** (confirmed JP names, specific retailer chains) → post-launch LLM enrichment pass (prompt drafted in chat session, run after launch)
- **Photo replacement** (stock → creator stills) → background queue per brand.md
- **Quick-add Phase 0** (stub product capture) → separate build, can run parallel
- **Search functionality** → Phase B-3 or later
- **URL-shareable filter state** → nice-to-have, not v1 blocking
- **Color contrast fixes on chips** → background queue (current ~3.5:1, target AA 4.5:1)
- **Places Backlog Import** (272-row regional places) → separate BUILD_SPEC

---

## Items needing Steven's input before/during build

1. **Featured rotation picks** — confirm 6 hero cards, or let Claude Code auto-pick from A-grade verified
2. **Sub-chip mapping spot-check** — Claude Code will derive, Steven eyeballs the konbini food/drink/sweet split before commit
3. **"Skip This" copy treatment confirmation** — does Tokyo Signal Red border-bottom + "WORTH SKIPPING" label feel right, or workshop?

---

## Post-build follow-ups

- Run enrichment LLM on the 146 CF rows (prompt versioned in chat as `japan-finds-creator-fill-enrichment v1.0`). Upgrade CF cards to `display_strategy: show_all` as confirmations land.
- Real traffic analysis after 1–2 weeks → identify which chips and cards drive engagement; reallocate copy-polish time accordingly.
- Photo swap: prioritize the top 20 highest-traffic cards for creator-still replacement.
