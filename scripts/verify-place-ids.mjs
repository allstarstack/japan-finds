/* scripts/verify-place-ids.mjs — guardrail for shared Google place_id values
   across src/content/places.

   The bug class this guards against: two place YAML entries silently carry
   the same place_id, producing overlapping pins on /map and confusing the
   Google Maps deep-link. PR #50 found 8 such groups; that PR deduped one
   (teamLab Planets) and left 7 as either intentional editorial splits or
   data errors pending verification. Every member of every shared group
   must now reference the other members via `shared_place_id_with` (a
   schemas.ts field added alongside this script). Any new shared place_id
   that lands without symmetric annotation fails this check.

   Run from the repo root:   node scripts/verify-place-ids.mjs
   npm script:               npm run verify:place-ids
   Exits non-zero if any shared group is undocumented or asymmetric. */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";

const placesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "content",
  "places",
);

/* Load every YAML once. Slug = filename minus the .yaml suffix — same
   convention the Astro glob loader uses to derive entry ids. */
const entries = [];
for (const fn of readdirSync(placesDir)) {
  if (!fn.endsWith(".yaml")) continue;
  const data = yaml.load(readFileSync(join(placesDir, fn), "utf-8"));
  if (!data || typeof data !== "object") continue;
  entries.push({ slug: fn.replace(/\.yaml$/, ""), file: fn, data });
}

/* Group by place_id. Entries with no place_id are skipped — the train
   row (saphir-odoriko-limited-express) carries none, and that's expected. */
const groups = new Map();
for (const e of entries) {
  const pid = e.data.place_id;
  if (!pid) continue;
  if (!groups.has(pid)) groups.set(pid, []);
  groups.get(pid).push(e);
}

const failures = [];
let documentedGroups = 0;
let documentedEntries = 0;
let singletons = 0;

for (const [pid, members] of groups.entries()) {
  if (members.length === 1) {
    singletons++;
    continue;
  }
  /* Every member must list every OTHER member in shared_place_id_with —
     symmetric, complete. A missing reference, a stale reference (slug
     not in the group), or a missing field at all is a failure. */
  const slugs = new Set(members.map((m) => m.slug));
  let groupOk = true;
  for (const m of members) {
    const ref = m.data.shared_place_id_with;
    if (!Array.isArray(ref) || ref.length === 0) {
      failures.push(
        `place_id ${pid}: ${m.file} missing shared_place_id_with (group has ${members.length} entries)`,
      );
      groupOk = false;
      continue;
    }
    const refSet = new Set(ref);
    /* Self-reference is wrong (a shared list shouldn't list the entry
       itself). Caught here so the error message is specific. */
    if (refSet.has(m.slug)) {
      failures.push(
        `place_id ${pid}: ${m.file} references itself in shared_place_id_with`,
      );
      groupOk = false;
    }
    for (const other of members) {
      if (other.slug === m.slug) continue;
      if (!refSet.has(other.slug)) {
        failures.push(
          `place_id ${pid}: ${m.file} missing reference to '${other.slug}' in shared_place_id_with`,
        );
        groupOk = false;
      }
    }
    for (const refSlug of refSet) {
      if (!slugs.has(refSlug)) {
        failures.push(
          `place_id ${pid}: ${m.file} references '${refSlug}' which is not in this place_id's group`,
        );
        groupOk = false;
      }
    }
  }
  if (groupOk) {
    documentedGroups++;
    documentedEntries += members.length;
  }
}

console.log(
  `place_id audit: ${entries.length} entries, ${groups.size} unique place_ids, ${singletons} singletons.`,
);
console.log(
  `  shared groups (>1 member): ${[...groups.values()].filter((g) => g.length > 1).length}`,
);
console.log(
  `  documented (symmetric shared_place_id_with): ${documentedGroups} groups / ${documentedEntries} entries`,
);

if (failures.length) {
  console.log(`\nFAIL ✗  ${failures.length} issue(s):`);
  for (const f of failures) console.log("  - " + f);
  process.exit(1);
}

console.log("\nPASS ✓  every shared place_id group is symmetrically documented.");
