# PLACES ADD-SIGNAL + NEWEST-FIRST SORT — CC Build Spec

**Workstream:** Sort data-signal (places leg)
**Branch:** `feat/places-add-signal`
**Scope:** places only — `src/content/places/*.yaml`, `src/content/schemas.ts`, `src/pages/places.astro`, plus one throwaway baseline script. **Do not touch `/eat`, `/stay`, `stay.astro`, `MapView.astro`, or any restaurants/stays file.** Keeping the footprint disjoint from the queued /stay map work is deliberate — it prevents a `stay.astro` merge conflict.

## Why
`/places` currently sorts alphabetical because the collection has no honest recency signal — only a Google `place_id` (random) and `hours_cache_date` (a cache stamp, 2 distinct values). We're giving it a monotonic add-signal mirroring products' `JF-####` and stays' `jf-stay-####`, then sorting newest-first. Baseline order for the existing 385 comes from git first-add-date (real between-batch chronology), alpha as the within-batch tiebreaker.

## Auto-accept
Leave **ON** is acceptable: feature branch, no paid API, no main-touching, fully git-reversible. BUT the baseline script mass-writes 385 files, so the self-verify step below is mandatory and Steven eyeballs `git diff --stat` + 3 spot-checked files before any commit. The round-trip parse assertion is the real safety net, not the file count.

---

## Step 0 — Read real code first (precondition, do not skip)
Before writing anything, read and confirm against the actual code — prior sessions have twice been saved by this:
1. `src/pages/products.astro` — find the existing newest-first sort. **Mirror its comparator structure**; only adapt the id-suffix parse (products is `JF-0470`, places will be `jf-place-0042` — extract trailing digits, see below).
2. `src/content/schemas.ts` — locate `placeSchema`. Confirm there is no existing `id` field. Confirm the import/export wiring.
3. One sample: `src/content/places/african-safari.yaml` — confirm top-level shape (flat YAML, `name:` etc. unindented). Confirm no `id:` present.
4. `src/pages/places.astro` — find the current alphabetical sort and the `getCollection("places")` call. This is the only render file you'll edit.

If any of the above contradicts this spec (e.g. an `id` field already exists), stop and report before proceeding.

---

## Step 1 — Schema knows about `id` BEFORE data is read (optional first)
In `src/content/schemas.ts`, add to `placeSchema`:

```ts
id: z.string().optional(),
```

Optional, not required, at this stage. Rationale: Astro silently strips unknown YAML keys (no error, no warning — the documented schema-co-edit trap), so the schema must know `id` exists before the baseline data is consumed. Optional avoids a broken-build window while files are still being stamped. We tighten to required in Step 4.

---

## Step 2 — Baseline script (one-off, throwaway)
Write `scripts/baseline-place-ids.mjs`. It runs once, stamps all 385 files, then can be deleted (don't commit it to `docs/build/`; it's scaffolding).

Logic:
1. Glob `src/content/places/*.yaml` (exclude `.gitkeep`).
2. For each file, get git first-add-date:
   `git log --diff-filter=A --follow --format=%ad --date=short -- <file>` → take the **last** line (earliest add).
3. Sort the file list by `(addDate ascending, then filename ascending)`.
4. Assign `jf-place-0001`, `jf-place-0002`, … in that sorted order (oldest add = lowest id). Zero-pad to 4 digits.
5. **Stamp surgically, do not reserialize.** If the file already has a top-level `id:` line, skip it and warn (idempotent / no double-stamp). Otherwise prepend `id: jf-place-####\n` as the first line. Prepend-a-line, not full YAML parse-and-rewrite — full reserialize risks reordering/reformatting the whole file (the "updated 453 with broken YAML" failure mode). Surgical insert only.

### Self-verify (mandatory — counts alone are not proof)
After writing, in the same script:
- Re-read every file, parse the YAML (`yaml` lib or `js-yaml`), and assert: `id` present, matches the expected value for that file, and the **full document still round-trip parses** without error.
- Assert the assigned ids are a contiguous `jf-place-0001..jf-place-0385` with no gaps or dupes.
- Print: total stamped, total skipped, and a **sample-after dump of 5 files** (first line + parsed `id` + parsed `name`) so the structure is eyeballable.
- If any assertion fails, exit non-zero and print the offending file. Do not leave a half-stamped collection silently.

Run it. Confirm `385 stamped, 0 skipped`, the contiguity assertion passes, and the 5 samples look sane.

---

## Step 3 — Sort `/places` newest-first
In `src/pages/places.astro`, replace the alphabetical sort with id-desc, mirroring `products.astro`'s comparator. Extract the trailing digits so the same logic is scheme-agnostic:

```ts
const idNum = (e) => parseInt(String(e.data.id).match(/(\d+)$/)?.[1] ?? "0", 10);
// newest first; alpha tiebreak (ids are unique, so the tiebreak is just defensive)
const sorted = places.sort((a, b) => idNum(b) - idNum(a) || a.data.name.localeCompare(b.data.name));
```

Use whatever the file already names its collection array; don't rename things. Don't add a sort menu — page is filter-first, dimensions too thin (carried decision).

---

## Step 4 — Tighten schema to required
Now that all 385 carry an `id`, change the schema line to:

```ts
id: z.string(),
```

This is the rail that forces every future place add to carry an id (a missing one would otherwise silently sort to the bottom). Re-run the build to confirm all 385 validate.

---

## Acceptance criteria
- `npm run build` (or your build cmd) passes with `id` required.
- `/places` renders newest-batch-first: the 05-27 singleton and the 51 from 05-26 sort above the 315 from 05-18, which sort above the 18 from 05-16. Spot-check the top ~5 cards against expectation.
- Visible place count is unchanged (still 385 rendering; no entries dropped).
- `git diff --stat` shows: `schemas.ts` (+1 line, then required), `places.astro` (sort block), and 385 `.yaml` files each `+1` line (the `id`). Nothing under `eat/`, `stays/`, `stores/`, `restaurants.json`, `stay.astro`, or `MapView.astro`.
- Delete the throwaway script before the final commit (or `.gitignore` `scripts/baseline-*.mjs`).

## Out of scope (do not do here)
- `/eat` sort — intentionally fixed (cuisine → rank_in_city); leave it.
- `/stay` sort — folded into the LIST/MAP toggle chat to avoid a `stay.astro` conflict.
- The places place_id dupes (8), the 385-vs-363-vs-384 count reconciliation, hero-photo check — all parked follow-ups, not this branch.

## Wrap-up (Steven runs, not CC)
Commit on `feat/places-add-signal`, push, open PR, merge, delete branch — done in the terminal by Steven (main-touching + destructive git ops stay out of CC).
