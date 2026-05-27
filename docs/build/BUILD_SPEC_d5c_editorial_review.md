# Build Spec — D5c Editorial Review (Voice/Format Pass)

**Workstream:** D5c — editorial review of low/medium confidence rows from D5 LLM enrichment run.

**Goal:** Voice/format pass on all 362 slugs in `docs/d5/d5_review_queue.txt` against `docs/d5/products_enriched_master.json`. Output a flagged-rows file ready for Steven's manual review + safety_flag verification.

**Inputs:**
- `docs/d5/products_enriched_master.json` — 455 enriched product records
- `docs/d5/d5_review_queue.txt` — 362 slugs to review (LOW 164 + MEDIUM 188 + HIGH-with-notes 10)
- `brand.md` (in Claude project files; mirror in repo if synced) — voice rules, banned words, voice tone examples

**Output:**
- `docs/d5/d5_review_flagged.txt` — one block per flagged row, format below

This is read-only. No YAML writes, no master JSON edits. Only the flagged-rows file is produced.

---

## Method

Two-pass:

1. **Programmatic format pass** — script the deterministic checks first; run in a single pass over the 362 queued records. Output: structured flags per row, machine-checkable.
2. **Per-row voice judgment pass** — read the `description` field for each of the 362 rows, apply the calibration bar below, append voice flags to the same per-row record.

Combine into the output file. Sort by slug ASC for easy diff/review.

Implementation choice (LLM-per-row vs heuristic detectors for the voice pass) is CC's call. Heuristics + regex are fine for banned words / corporate hedging / generic hype / present-tense violations. The Wikipedia-style detector is the hardest call and may warrant LLM judgment per row; budget accordingly.

---

## Calibration bar (locked)

### Format flags — programmatic, no judgment

- Missing required field: `description`, `english_name`, `japanese_name`, `category`, `subcategory`, `price_range_jpy`, `where_to_buy`, `image_url`, `image_source`, `safety_flags`, `source_url`, `confidence`, `notes`
- Markdown link syntax `[text](url)` in ANY field (URL fields or description)
- Reference markers like `([Files][1])`, `([Files][2])`, `[1]`, `[2]` etc. in any field
- Wrong type: array where string expected or vice versa
- Character outliers in `description`: under 20 chars OR over 400 chars
- Trailing prose in URL fields (anything after the URL ends)
- `source_url` is null, empty string, or doesn't start with `https://`

### Voice flags — per-row judgment

- **Banned words** from brand.md present in `description` (case-insensitive): ultimate, hidden gems, hidden gem, magical, wanderlust, authentic journey, unforgettable, discover Japan, explore, must-see, curated experiences, local secrets, comprehensive guide, uncover, delve
- **Corporate hedging** in `description`: "please note," "we recommend," "it is advisable," "consumers should," "it should be noted," "please consult," etc.
- **Generic hype**: "amazing," "incredible," "fantastic," "wonderful," "delightful," "exquisite," "perfect," "stunning," vague superlatives without specifics
- **Wikipedia-style** — flag ONLY when BOTH conditions hold:
  - (a) **Impersonal voice** — no recommendation, no specific brand/store anchor, no consumer angle
  - (b) **Fact-dump structure** — sequential encyclopedic facts strung together (origin date, production region, ingredient list, weight)
  - Merely informative ≠ Wikipedia-style. Pass: "Onigiri tuna mayo with Kewpie. Lawson's version is the benchmark." Fail: "Onigiri is a Japanese rice ball wrapped in nori, traditionally filled with various ingredients. It originated during the Heian period."
- **Present-tense violations** on descriptive copy: past or future tense where present should be used (e.g., "this was created in 1978 and has become popular" → flag; "this is Lawson's classic" → pass)

### Safety-flag-candidate flags — Steven verifies, CC flags only

Flag products whose category or name suggests a safety flag should exist but `safety_flags` is null or empty:

- **NSAID candidates:** anything in `subcategory` matching painkillers, fever reducers, headache; brand names matching Loxonin, Eve, Bufferin
- **Multi-active cold med candidates:** Pabron, Lulu A Gold, similar
- **Aspirin-related candidates:** Salonpas, similar topical/oral aspirin products
- **Alcohol candidates:** anything in category/subcategory matching beer, sake, shochu, highball, whisky, wine; explicit hard-avoid flag for Grapefruit Strong Zero specifically
- **Citrus/grapefruit ingestion candidates:** ingredients or name mentions grapefruit, yuzu, sudachi, kabosu (ingestion context only — skincare excluded)
- **Voltage candidates:** rice cookers, kettles, hair dryers, irons, electric razors — any plug-in product travelers might buy. Special note: Zojirushi NW-YQH 220V tourist model (Dec 2025) — flag rice cookers either as voltage-warn or as "consider tourist model"

Do NOT make the safety call. Flag the candidate; Steven verifies.

---

## What NOT to flag

- Descriptions that are merely informative (no recommendation, no wit, but no banned/corporate/hype/Wikipedia patterns either)
- Missing `notes` field — intentional schema, not a gap
- Low confidence on its own — the queue is already filtered for that
- Descriptions that read flat but contain specific facts/brands/stores
- Image-related fields (`image_url` null, `image_source` null) — D3 handles the image gap separately
- `enrichment_date`, `enrichment_confidence`, `enrichment_source_url` — metadata, not editorial content

---

## Output format

`docs/d5/d5_review_flagged.txt`. Plain text. One block per flagged row, two blank lines between blocks. Sort by slug ASC. Rows with zero flags are omitted entirely — file contains only what needs review.

Header at top of file:

```
D5c Editorial Review Flagged Rows
Generated: <ISO date>
Input: docs/d5/products_enriched_master.json (455 records)
Queue: docs/d5/d5_review_queue.txt (362 slugs)
Flagged: <N> rows
Passed: <N> rows


```

Per-row block:

```
slug: <slug>
confidence: <high|medium|low>
description: <full description text, single line; collapse newlines to spaces>
flags:
  format:
    - <flag tag>: <detail>
  voice:
    - <flag tag>: <detail>
  safety_candidate:
    - <flag tag>: <detail>
```

Omit any of the three flag buckets that has no entries for that row. Example:

```
slug: pabron-gold-a
confidence: low
description: Pabron Gold A is a popular Japanese over-the-counter cold medicine that contains multiple active ingredients including acetaminophen and dihydrocodeine. It is widely available at drugstores throughout Japan.
flags:
  voice:
    - corporate_hedging: "widely available"
    - wikipedia_style: impersonal + fact-dump structure (active ingredients list, no recommendation or store anchor)
  safety_candidate:
    - multi_active_cold_med: Pabron — safety_flags is null


slug: salonpas-original
confidence: medium
description: Salonpas pain relief patches. Standard drugstore find at any Matsumoto Kiyoshi.
flags:
  safety_candidate:
    - aspirin_related: Salonpas — safety_flags is null
```

---

## Acceptance criteria

- All 362 queued slugs were checked (not just the subset with flags)
- Header summary line includes flagged-vs-passed counts that sum to 362
- Each flagged row has at minimum: slug, confidence, description, and one flag
- Format flags are deterministic — re-running the script on unchanged data produces the same flags
- Voice flags applied per the calibration bar above, with the Wikipedia tweak: impersonal AND fact-dump, not merely informative
- Safety-flag candidates flagged for verification, NOT verified
- Output sorted by slug ASC
- No edits to `products_enriched_master.json` or any product YAML

---

## Handoff notes for CC

- Brand.md is the source of truth for voice rules. If the calibration bar above contradicts brand.md, flag the contradiction in your commit message — don't silently resolve.
- The 22 D5 image-download failures in `docs/d5/d5_images_failed.txt` are out of scope.
- After completion, suggest a gitignore-vs-commit decision on the flagged file. Recommendation: commit (it's a working doc the editorial pass references), but Steven decides.
- Update `PROJECT_STATE.md` "What's in flight" / "What's shipped" lines for D5c after the flagged file is committed. Suggested shipped-line: `Phase D D5c voice/format pass: <N> rows flagged across format/voice/safety-candidate buckets. Output at docs/d5/d5_review_flagged.txt. Steven editorial review queue is now <N> rows instead of 362.`
