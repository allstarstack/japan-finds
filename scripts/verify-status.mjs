/* scripts/verify-status.mjs — Phase B-3 dev tool (BUILD_SPEC_cheat_sheets.md §8).

   Lists unresolved `verify_before_publish` entries per cheat sheet so Steven
   can clear them before publishing each sheet. When an item is verified, he
   removes that entry from the frontmatter (and optionally bumps last_verified)
   and re-runs this to see progress.

   Informational only — this never gates the build. Run: npm run verify-status */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import matter from "gray-matter";

const DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "content",
  "cheat-sheets",
);

/* Editorial order — mirrors the /cheat-sheets index (BUILD_SPEC §5). */
const ORDER = [
  "first-24-hours",
  "ic-cards",
  "phone-setup",
  "cash-cards-atms",
  "luggage-forwarding",
  "jr-pass",
  "donki-drugstore-taxfree",
  "konbini",
  "japan-with-kids",
];
const rank = (file) => {
  const i = ORDER.indexOf(file.replace(/\.md$/, ""));
  return i === -1 ? ORDER.length : i;
};

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".md"))
  .sort((a, b) => rank(a) - rank(b));

console.log("Cheat sheets — unresolved verify entries:\n");

let clean = 0;
for (const file of files) {
  const { data } = matter(readFileSync(join(DIR, file), "utf8"));
  const entries = data.verify_before_publish ?? [];
  if (entries.length === 0) {
    clean++;
    continue;
  }
  const verified = data.last_verified
    ? new Date(data.last_verified).toISOString().slice(0, 10)
    : "unknown";
  console.log(`${file} (last verified: ${verified})`);
  for (const e of entries) {
    console.log(`  • ${e.field}`);
    console.log(`    ${e.note}`);
  }
  console.log("");
}

console.log(`Sheets with zero unresolved entries: ${clean}/${files.length}`);
