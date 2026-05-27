## Overnight build — notes for morning review

Branch: `chore/cleanup-and-small-fixes` — three commits (popup anchor fix, /map a11y, scratch-file gitignore + spec commits).

### COMMIT 1 — diagnosis differs from task description

The task said: *"the cards on the listing pages don't have matching id attributes for the browser to scroll to. Fix: add id=\"<slug>\" to each card wrapper on /places and /eat list pages."*

Verified that's not the actual problem:

- `src/components/v2/PlaceCard.astro:112` already renders `<article id={entry.id} …>` (shipped in Phase A.9 C4, commit `b15c192`).
- `src/components/eat/RestaurantCard.astro:46` already renders `<article id={r.id} …>` (same commit).
- The `:target` highlight + `scroll-margin-top` rules already exist on both card types.
- Confirmed the ids in the built `dist/` HTML match the `slug` field that `scripts/generate-geojson.mjs` writes into the popup hrefs (e.g. card `id="african-safari"` ↔ popup `href="/places#african-safari"`).

So the *symptom* the user reports is real, but the *cause* is something else. Two residual issues that would explain "lands at top, not on the card":

1. **`scroll-margin-top: 80px` is too small for the sticky chip rail.** The `.rail-sticky` block on `/places` stacks view-toggle (~40px) + SearchBox (~50px) + LocationChipRow (~50px) + PlaceFilterRail (~80-100px) ≈ 220px. On `/eat` it's view-toggle + LocationChipRow + ChipRow ≈ 170-190px. The 80px scroll-margin clears only a fraction of the rail, so the landed card sits *underneath* the sticky chips — visually indistinguishable from "didn't scroll".
2. **`content-visibility: auto`** on `.plc` / `.rc` (places.astro:323-326, eat.astro:245-248) can break anchor scrolling because the browser uses the `contain-intrinsic-size` placeholder to estimate the scroll target's position before the card actually paints. The `:target` pseudo-class is specced to wake the element, but real-world Chrome/Safari behavior on this has been inconsistent.

Fix applied in this commit:
- Bumped `scroll-margin-top` to `220px` on both `.plc:target` and `.rc:target` so the card clears the sticky rail with ~20px breathing room. Kept it on `:target` to preserve the existing 2s yellow highlight pairing.
- Added a small inline rescroll handler in `/places.astro` and `/eat.astro` that fires on load if `location.hash` is set: two RAFs to let content-visibility settle, then explicit `scrollIntoView({ block: "start" })`. Belt and suspenders for the cv:auto case.

If after morning Vercel-preview testing the card *still* lands behind the rail on mobile, the next move is to instrument with `getBoundingClientRect()` on the rail element and compute the offset dynamically rather than using a fixed 220px.

### COMMIT 2 — straightforward, no notes

### COMMIT 3 — only the clear-cut decisions

Per task: gitignored the scratch artifacts, committed the historical BUILD_SPEC docs. Left the helper python scripts (`add_schema_fields.py`, `fix_*`, `merge_enrichment_to_yaml*.py`, etc.) untouched — those need human judgment on `scripts/` vs delete and were explicitly deferred in the task brief. Also left `docs/d5/d5_review_flagged.txt`, `docs/d5/scripts/d5c_editorial_review.py`, `docs/build/SEARCH_AND_SORT.md` untouched — same reasoning (not on the clear-cut list).
