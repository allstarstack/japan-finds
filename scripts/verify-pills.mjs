/* Regression check for the /places region-scoped facet counts.

   The bug this guards against: category / modifier pills showed a global
   per-facet count that ignored the active region, so a pill could promise
   N results and deliver fewer when clicked (e.g. PHOTO SPOTS read 16 even
   under KANTO, which has 4). The fix derives each pill's count from the
   cards matching every OTHER active filter, so a pill's number always
   equals the rows you get after clicking it.

   This script rebuilds the same card descriptors the page stamps as data-*
   attributes and re-implements the exact matches() predicate shipped in
   PlaceFilterRail.astro, then asserts the invariant
     pill-count(facet) === result-count(after clicking facet)
   for every region x category and region x flag combination.

   Run from the repo root:  node scripts/verify-pills.mjs
   Exits non-zero if any pill count would not match its click-through. */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { prefectureToRegion, REGION_LABELS } from "../src/data/regions.js";
import { PRIMARY_CHIPS, SECONDARY_CHIPS } from "../src/data/place-chips.js";

const placesDir = join(dirname(fileURLToPath(import.meta.url)), "../src/content/places");

const field = (text, key) => {
  const m = text.match(new RegExp("^" + key + ":\\s*(.*)$", "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};

/* Same eligibility + per-card data the page builds (PlaceCard data-*). */
const cards = [];
for (const f of readdirSync(placesDir).filter((f) => f.endsWith(".yaml"))) {
  const t = readFileSync(join(placesDir, f), "utf8");
  if (field(t, "status") !== "ready" || field(t, "public_render") === "false") continue;
  cards.push({
    isBase: field(t, "launch_tier") === "base",
    chip: field(t, "public_label") || "",
    region: prefectureToRegion(field(t, "prefecture")) || "",
    flags: (field(t, "planning_flags") || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean),
    search: "", // no search scenarios here; tokens stay empty
  });
}

/* Exact copy of the predicate in PlaceFilterRail.astro — keep in sync. */
const matches = (c, { location, chip, flagSet, base, tokens }) => {
  if (!tokens.every((t) => c.search.includes(t))) return false;
  const okFlags = [...flagSet].every((fl) => c.flags.includes(fl));
  const okLocation = !location || c.region === location;
  if (c.isBase) return (base || tokens.length > 0) && !chip && okFlags && okLocation;
  return (!chip || c.chip === chip) && okFlags && okLocation;
};

const blank = (over = {}) => ({
  location: null,
  chip: null,
  flagSet: new Set(),
  base: false,
  tokens: [],
  ...over,
});
const count = (state) => cards.reduce((a, c) => a + (matches(c, state) ? 1 : 0), 0);
const catPill = (state, v) =>
  cards.reduce((a, c) => a + (matches(c, { ...state, chip: v }) ? 1 : 0), 0);
const flagPill = (state, v) =>
  cards.reduce(
    (a, c) => a + (matches(c, { ...state, flagSet: new Set([...state.flagSet, v]) }) ? 1 : 0),
    0,
  );
const basePill = (state) =>
  cards.reduce((a, c) => a + (c.isBase && matches(c, { ...state, chip: null, base: true }) ? 1 : 0), 0);

const regions = [null, ...Object.keys(REGION_LABELS)];
const failures = [];

/* Invariant: a category pill's number === rows after clicking it. */
for (const r of regions) {
  const state = blank({ location: r });
  for (const ch of PRIMARY_CHIPS) {
    const pill = catPill(state, ch.value);
    const clicked = count(blank({ location: r, chip: ch.value }));
    if (pill !== clicked)
      failures.push(`[${r ?? "ALL"}] category ${ch.value}: pill ${pill} != clicked ${clicked}`);
  }
  for (const fl of SECONDARY_CHIPS) {
    const pill = flagPill(state, fl.value);
    const clicked = count(blank({ location: r, flagSet: new Set([fl.value]) }));
    if (pill !== clicked)
      failures.push(`[${r ?? "ALL"}] flag ${fl.value}: pill ${pill} != clicked ${clicked}`);
  }
}

/* Human-readable snapshot for the two scenarios called out in the brief. */
const report = (title, state) => {
  console.log(`\n=== ${title} ===  (${count(state)} places)`);
  let visible = 0;
  for (const ch of PRIMARY_CHIPS) {
    const n = catPill(state, ch.value);
    const hidden = n === 0 && state.chip !== ch.value;
    if (!hidden) visible++;
    console.log(`  ${ch.label.padEnd(20)} ${String(n).padStart(3)}${hidden ? "   (hidden)" : ""}`);
  }
  for (const fl of SECONDARY_CHIPS) {
    const n = flagPill(state, fl.value);
    const hidden = n === 0 && !state.flagSet.has(fl.value);
    console.log(`  ~${fl.label.padEnd(19)} ${String(n).padStart(3)}${hidden ? "   (hidden)" : ""}`);
  }
  const b = basePill(state);
  console.log(`  ~Stay bases          ${String(b).padStart(3)}${b === 0 && !state.base ? "   (hidden)" : ""}`);
  console.log(`  hint -> "${visible} categories · scroll →"`);
};

report("ALL JAPAN (must match production baseline)", blank());
report("KANTO selected", blank({ location: "kanto" }));

console.log("\n=== INVARIANT: pill count === click-through result ===");
console.log(`  checked ${regions.length} regions × ${PRIMARY_CHIPS.length + SECONDARY_CHIPS.length} facets`);
if (failures.length) {
  console.log(`  FAIL ✗  ${failures.length} mismatch(es):`);
  for (const f of failures) console.log("   - " + f);
  process.exit(1);
}
console.log("  PASS ✓  every pill count matches its click-through result");
