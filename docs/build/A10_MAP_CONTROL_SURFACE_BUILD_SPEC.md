# A.10 — Map Control Surface Consolidation · Build Spec

**Repo:** `allstarstack/japan-finds` · **Local:** `~/Desktop/builds/japan-finds`
**Branch:** `feat/a10-map-control-surface` (cut from current main; confirm #41/#42 merged first)
**CC auto-accept:** ON is fine — feature-branch UI work, no paid APIs, no main-touch, no destructive git.
**Goal:** Fold the WHERE / EAT / STAY mode toolbar into the legend panel header so mode-switch and cluster filters are one control surface. Kills the toolbar-top / legend-bottom diagonal eye-jump.

---

## Direction: Variant A — Segmented control header (with footprint trim)

A bordered legend card. Header top → segmented 3-up mode control; one compact meta row (count + collapse caret); divider; cluster body below. One card, one place to look.

**Why A** (for context, not to re-litigate): the workstream exists to make the active mode unambiguous. A segmented control is the strongest "exactly one of three is on" signal and maps 1:1 onto the locked mutually-exclusive model. Its only weakness is header height, neutralized by the trim below + collapse-on-mobile.

**Footprint trim (required):** do NOT ship the design's two-line header (segmented track + standalone "N clusters · M pins" line + divider). Collapse to: segmented track, then a single meta row containing the count (left) and the collapse caret (right), then the divider. One line, not two.

---

## PRECONDITIONS — confirm with Steven before running. Do not hardcode guesses.

1. **WHERE cluster taxonomy.** The design mock invented ~7 WHERE categories beyond the real set. Read the real category list from the content collection / map config — do NOT use the mock's 14-item list. Bind the legend to the live taxonomy.
2. **STAY cluster taxonomy.** Mock names are inferred. Read real values from the data source.
3. **Pin colors.** Read every pin color from the live Mapbox layer config (or the shared `map-legends.js` module from PR #34), NOT from the mock hexes. Legend swatch MUST equal the rendered pin. Known-good: STAY = Aizome Indigo `#3B4F81`. Verify EAT (mock used `#D7322E`; brand red is `#FF3B30` — use whatever the layer actually renders).
4. **Mobile default state.** Recommended: sheet opens peeking (header + first ~3 cluster rows), not fully collapsed, so the legend is visible without a tap. Confirm before building the mobile default.

---

## Step 0 — Read real code first (do not diagnose from the mockup)

Before writing anything, read and report back:
- The current /map page component and its legend panel + mode toolbar components.
- `map-legends.js` (shared module, PR #34) — source of truth for cluster lists + colors.
- The Mapbox layer style/paint config where pin colors are defined.
- The existing mode-switch state handler (mutually-exclusive WHERE/EAT/STAY) and the cluster single-select handler.

Confirm: where mode state lives, where cluster-select state lives, and how pins are currently colored. Map the existing handlers — we are re-housing the controls, not rewriting the interaction.

---

## Locked interaction model — DO NOT change

- **Modes are mutually exclusive.** Exactly one of WHERE / EAT / STAY active. Selecting a mode swaps the cluster body + repaints pins.
- **Clusters are single-select.** One active cluster (focus filter) per mode, shown by a left ink rule + light row fill. Re-tapping the active cluster clears it.
- **Group header is non-interactive.** The mode-word label (`Places` / `Restaurants` / `Lodging`) is a muted mono label, not a filter.
- **Switching mode resets cluster selection** (existing behavior — preserve whatever it does today; confirm in Step 0).

---

## Component spec (Variant A, trimmed)

### Container
- `--rice` fill, `1.5px solid --ink` border, `border-radius: 10px`, shadow `3px 3px 0 --ink`, `overflow: hidden`.
- Desktop: bottom-left anchor, ~300px wide (same anchor as today's legend — preserve muscle memory).
- Mobile: bottom sheet, `left/right: 12px`, drag handle above the card. Default state per precondition 4.

### Header — segmented mode control
- `display: grid; grid-template-columns: 1fr 1fr 1fr` inside a `1.5px --ink` border, `border-radius: 999px`, `overflow: hidden`.
- Track background: `--rice` (NOT `#fff` — the mock used pure white, which is a non-token; confirm with Steven if a white inset is actually wanted).
- Active segment: `--ink` fill, `--rice` text. Inactive: transparent, `--ink` text. `1.5px --ink` divider between segments.
- Type: `--fh` (Space Grotesk) 700, ~13px, letter-spacing 0.02em.
- Labels: `WHERE` / `EAT` / `STAY`.
- Each segment is a real button: `role`/keyboard-operable, `aria-pressed` reflecting active mode.

### Meta row (the trim)
- Single flex row under the track: left = `N clusters · M pins` in `--fm` 10px, `--ink-60`, uppercase, tracked. Right = collapse caret (`▾`, rotates -90° when collapsed).
- Counts bind to live data, not the mock.
- Divider (`1.5px solid --ink`) below the meta row; removed when collapsed.

### Cluster body
- `GroupHeader`: mode word lowercased, `--fm` 10px `--ink-60`, uppercase, tracked, non-interactive.
- `ClusterRow` per live cluster: pin swatch (left) + name + count (right, `--fm` 10px `--ink-60`, tabular).
  - Pin swatch per mode: WHERE = filled disc, per-cluster color (from layer config). EAT = hollow ring, single color (from layer config). STAY = filled `#3B4F81` disc. Disc border `1.5px rgba(21,21,21,0.18)`.
  - Selected row: `border-left: 2px solid --ink`, `background: rgba(21,21,21,0.05)`, name weight 600. Unselected: transparent left border (no layout shift).
- Body scrolls (`overflow-y: auto`) past a max height so a 14-item WHERE list doesn't blow out the sheet. Desktop maxH ~300px, mobile ~380px.

### Collapse
- Caret toggles body. Collapsed = header (track + meta row) only, body removed, no divider.

---

## Token hygiene — fix as part of this PR

- **`--ink-30`:** not defined in `brand.md`. If the build needs a 30% ink (it may not, once C's `/` separators are out of scope), either add it properly (`brand.md` → CSS token file → usage, in that order) or avoid it. Do not introduce it silently.
- **No pure `#fff`** unless Steven confirms a deliberate white inset. Default to `--rice`.
- All colors via tokens / live layer config. No new hardcoded hexes except pin colors that mirror the Mapbox layer (and those should ideally be imported from the shared module, not re-typed).

---

## Self-verification before PR (per "scripts must self-verify")

- Mode switch: each of WHERE/EAT/STAY activates, swaps body, repaints pins, resets cluster selection. Active segment styling correct in all three.
- Cluster single-select: select / re-tap-to-clear works; only one active at a time; switching mode clears it.
- Group header is not clickable.
- Legend swatch color === actual pin color for a sampled cluster in each mode (the criterion-3 check — verify visually, not just that code runs).
- Mobile: sheet default state matches precondition 4; body scrolls; map not buried.
- Keyboard: segments tab-focusable and operable; `aria-pressed` correct.
- a11y: any text-on-fill (active segment Rice-on-Ink; meta row ink-60-on-Rice) passes AA.

---

## Out of scope

- The map itself (geography, clustering math, pin rendering logic) — untouched.
- Any change to what the filters *do* — this is re-housing controls only.
- Other list pages (filter-header rework is a separate workstream).

## PR

- Title: `A.10 — fold mode toolbar into legend (unified control surface)`
- Body: before/after of the control surface; confirm the four preconditions were resolved (with the values used); scorecard note that this is Variant A trimmed.
- Update `PROJECT_STATE.md`: move A.10 from queued → shipped; record the resolved WHERE/STAY taxonomies + pin-color source as carried decisions.
