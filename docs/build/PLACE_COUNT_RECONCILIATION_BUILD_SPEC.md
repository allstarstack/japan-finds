# Place-Count Reconciliation — Build Spec

**Version:** 1.0
**Date:** 2026-05-29
**Branch:** `fix/place-count-reconciliation`
**Auto-accept:** Phase 1 (diagnose) = ON (read-only). Phase 2 (fix): display-number edits ON; **any deletion of place YAML entries = STOP and report for approval first** (data deletion is destructive — never auto-delete content).

---

## The problem
The place count disagrees across at least five surfaces:
- Search placeholder: "Search 333 places"
- ALL JAPAN chip: "363"
- Generated geojson: 384 place features
- /map (GO mode) legend meta: "384 pins" — AND it reads "801" in some states (= grand total across GO+EAT+STAY, i.e. the meta row shows total not the active mode's count → separate bug)
- Place YAML collection: 385 files

Plus: the add-signal data check found **8 `place_id`s appearing twice** (2x each) across the 385 files — possible duplicate entries that may explain part of the gap.

You CANNOT fix this by picking a number. Establish the true count + its source first, then make every surface derive from that source.

---

## PHASE 1 — DIAGNOSE (read-only; report before any edit)

1. **Trace each surface to its data source.** For each of the five counts above, find the code that produces it and report what it counts:
   - The "333" search placeholder — hardcoded string? stale constant? a filtered count?
   - The "363" ALL JAPAN chip — computed from what set?
   - The 384 geojson features — how is the geojson built, and what does it include/exclude vs the full collection?
   - The /map meta count — does it count the active mode or the grand total? (the "801" suggests grand total → confirm.)
   - The 385 YAML files — the raw collection count (is any entry draft/unpublished/excluded at build?).
2. **Explain each gap with evidence:** 385 files vs 384 geojson (which entry is missing and why?); 384/385 vs 363 chip (the ~21 difference — a category/region filter? unpublished entries? double-counting?); 363 vs 333 placeholder (the ~30 difference — almost certainly a stale hardcoded number; confirm).
3. **The 8 duplicate `place_id`s:** list the pairs with their slugs/names/files. For each, determine: genuine duplicate entry (same venue listed twice → dedupe candidate) vs legitimate distinct entries that happen to share a Google `place_id` (data-entry error on the place_id, or a real shared-building case). **Report the actual entries — do not delete anything yet.**
4. **Name the source of truth:** the single count that represents "published, user-visible places," and the reason every other surface should derive from it.

**Report all of Phase 1 before touching code.** This determines the fix.

---

## PHASE 2 — FIX (only after Phase 1 is confirmed)

1. **Reconcile every display surface to the source of truth** so they all show the same number (search placeholder, ALL JAPAN chip, geojson feature count if it's wrongly filtered, /map meta). Prefer deriving counts from the collection at build time over hardcoded strings, so this can't drift again.
2. **Fix the /map meta "801" bug** so it shows the active mode's count (GO = places only), not the grand total.
3. **Duplicate `place_id`s:** based on the Phase 1 finding —
   - If genuine duplicate entries: **STOP and list exactly which YAML files you propose to remove, and why, for approval before deleting.** Do not auto-delete.
   - If legitimate distinct entries sharing a place_id: leave the entries; if the shared place_id is a data error, report it as a separate fix, don't guess a correction.

---

## FOLD-IN (read-only check, same session)
- **Neighborhood-granularity search test:** on /places (and /eat, /stay), does the search box match neighborhood-level terms (e.g. typing "Shinjuku")? Report whether it matches name + region/area only, or also neighborhood. **Report only** — if it doesn't match neighborhood, that enhancement is a SEPARATE PR, not this one.

---

## Verify (before commit)
- Every place-count surface shows the same, correct number.
- /map meta shows the active mode count, not the grand total.
- No legitimate place entries removed; any dedupe was explicitly approved.
- Build passes.
- Report raw `git status --porcelain` + files changed.

## Git wrap-up
- Commit + push `fix/place-count-reconciliation`. Report PR URL. Merge + branch delete on GitHub.
