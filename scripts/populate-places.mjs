/* Phase B-2 — places import + V1 migration script.

   Two jobs, one atomic run:

   1. MIGRATE the 35 Phase A inspection-scaffold place YAMLs:
      - 19 genuine attractions  -> rewritten in the Phase B-2 schema
      - 16 retail / lodging     -> deleted (they are shops/hotels, already
        covered by the `stores` collection; not "where to go" places)
      The migration field assignments (primary_category, public_label,
      planning_flags) are hand-set in V1_KEEP below — review them in the
      generated report.

   2. IMPORT docs/japan_locations_v2.csv (323 enriched places):
      - normalises `public_label` (`with_kids` label -> `parks` chip)
      - builds a romaji slug per row
      - dedupes against the migrated V1 places by normalised name +
        prefecture; a hit is logged and the import row is skipped
      - slug filename collisions get -2, -3 … suffixes

   Atomic: every YAML is validated against placeSchema in memory; if any
   row fails, NOTHING is written. Re-runnable / idempotent — a re-run
   deletes the previously-imported YAMLs and regenerates them, and
   rewrites the V1 places from the V1_KEEP table.

   Run with: node scripts/populate-places.mjs */

import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "fs";
import yaml from "js-yaml";
import { placeSchema } from "../src/content/schemas.ts";

const CSV = "docs/japan_locations_v2.csv";
const DIR = "src/content/places";
const REPORT = "docs/places-import-conflicts.md";

/* Source types written by the CSV import — used to tell imported YAMLs
   apart from curated (V1) ones so a re-run can cleanly regenerate. */
const IMPORT_SOURCES = new Set(["backlog_import", "food_research_v1"]);

/* ── V1 migration table ────────────────────────────────────────────────
   The 19 Phase A places kept as genuine attractions. Keyed by their
   existing filename slug. primary_category / public_label / planning_flags
   are migration assignments — Steven's call per the audit. */
const V1_KEEP = {
  "art-aquarium-ginza": {
    name: "Art Aquarium Ginza", address_or_area: "Ginza, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "Do", public_label: "quirky_museums",
    planning_flags: "rainy_day",
  },
  "beppu-yufuin-onsen-towns": {
    name: "Beppu & Yufuin Onsen Towns", address_or_area: "Beppu & Yufuin, Oita",
    region: "Kyushu", prefecture: "Oita",
    primary_category: "Stay", public_label: "", planning_flags: "",
    launch_tier: "base",
  },
  "cup-noodles-museum-yokohama": {
    name: "Cup Noodles Museum Yokohama", address_or_area: "Yokohama, Kanagawa",
    region: "Kanto", prefecture: "Kanagawa",
    primary_category: "Do", public_label: "quirky_museums",
    planning_flags: "with_kids;rainy_day",
  },
  "ghibli-museum": {
    name: "Ghibli Museum", address_or_area: "Mitaka, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "Do", public_label: "anime",
    planning_flags: "with_kids;rainy_day",
  },
  "gorilla-building": {
    name: "Gorilla Building", address_or_area: "Sangenjaya, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "See", public_label: "photo_spots", planning_flags: "",
  },
  "gotokuji-temple": {
    name: "Gotokuji Temple", address_or_area: "Setagaya, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "See", public_label: "culture_history", planning_flags: "",
  },
  "kanazawa-omicho-kenrokuen": {
    name: "Kanazawa: Omicho Market & Kenrokuen",
    address_or_area: "Kanazawa, Ishikawa",
    region: "Chubu", prefecture: "Ishikawa",
    primary_category: "See", public_label: "nature_water", planning_flags: "",
  },
  "kidzania-tokyo": {
    name: "KidZania Tokyo", address_or_area: "Toyosu, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "Do", public_label: "theme_parks",
    planning_flags: "with_kids;rainy_day",
  },
  "kyoto-station-umekoji-kyoto-railway-museum": {
    // Named to exact-match the import row so the dedupe keeps this V1 entry.
    name: "Kyoto Railway Museum", address_or_area: "Umekoji, Kyoto",
    region: "Kansai", prefecture: "Kyoto",
    primary_category: "Do", public_label: "scenic_transport",
    planning_flags: "with_kids;rainy_day",
  },
  "nara-park-deer": {
    name: "Nara Park Deer", address_or_area: "Nara",
    region: "Kansai", prefecture: "Nara",
    primary_category: "See", public_label: "animals",
    planning_flags: "with_kids",
  },
  "osaka-aquarium-kaiyukan": {
    name: "Osaka Aquarium Kaiyukan", address_or_area: "Osaka",
    region: "Kansai", prefecture: "Osaka",
    primary_category: "See", public_label: "animals",
    planning_flags: "with_kids;rainy_day",
  },
  "sangenjaya-chazawa-dori": {
    name: "Sangenjaya & Chazawa-dori", address_or_area: "Setagaya, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "See", public_label: "photo_spots", planning_flags: "",
  },
  "sunamachi-ginza": {
    name: "Sunamachi Ginza", address_or_area: "Koto, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "Eat", public_label: "food_markets", planning_flags: "",
  },
  "sunshine-aquarium-poke-mon-center-mega-tokyo": {
    name: "Sunshine Aquarium", address_or_area: "Ikebukuro, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "See", public_label: "animals",
    planning_flags: "with_kids;rainy_day",
  },
  "teamlab-borderless-azabudai-hills": {
    name: "teamLab Borderless Azabudai Hills",
    address_or_area: "Azabudai Hills, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "Do", public_label: "quirky_museums",
    planning_flags: "rainy_day",
  },
  "teamlab-planets-toyosu": {
    name: "teamLab Planets Toyosu", address_or_area: "Toyosu, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "Do", public_label: "quirky_museums",
    planning_flags: "rainy_day",
  },
  "togoshi-ginza": {
    name: "Togoshi Ginza", address_or_area: "Shinagawa, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "Eat", public_label: "food_markets", planning_flags: "",
  },
  "tokyo-station-ekibenya-matsuri": {
    name: "Tokyo Station Ekibenya Matsuri", address_or_area: "Tokyo Station, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "Eat", public_label: "food_markets",
    planning_flags: "rainy_day;by_train",
  },
  "yanaka-ginza": {
    name: "Yanaka Ginza", address_or_area: "Taito, Tokyo",
    region: "Kanto", prefecture: "Tokyo",
    primary_category: "Eat", public_label: "food_markets", planning_flags: "",
  },
};

/* The 16 V1 places dropped — retail/lodging, not destinations. Each is
   already represented in the `stores` collection or is a hotel brand. */
const V1_DROP = {
  "daiso-harajuku-flagship-100-yen-stores": "100-yen retail (see stores collection)",
  "evening-supermarket-markdown-circuit": "supermarket shopping route",
  "ginza-six": "luxury shopping mall",
  "isetan-shinjuku-depachika": "department-store food hall (retail)",
  "itoya-ginza": "stationery retailer (see stores collection)",
  "kappabashi-kitchen-town": "kitchenware retail street (see stores collection)",
  "koenji-thrift-overflow-loop": "thrift shopping route (see stores collection)",
  "matsumoto-kiyoshi-sugi-pharmacy-key-branches": "drugstore retail (see stores collection)",
  "mega-don-quijote-shibuya": "discount retail (see stores collection)",
  "mimaru-family-hotel-anchors": "hotel brand, not a destination",
  "nakano-broadway-mandarake": "collectibles retail mall (see stores collection)",
  "shimokitazawa-thrift-circuit": "thrift shopping route (see stores collection)",
  "shinjuku-underground-subnade-keio-mall": "underground shopping mall",
  "stick-out-shimokitazawa": "thrift retailer",
  "wego-shimokitazawa": "clothing retailer",
  "yodobashi-kyoto-6f-porta": "electronics retailer",
};

/* ── CSV parser — handles quoted fields with embedded commas ───────────── */
function parseCsv(str) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (q) {
      if (c === '"') {
        if (str[i + 1] === '"') { cur += '"'; i++; }
        else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim()));
}

/* ── YAML emitter — JSON-quoted scalars, matches populate-launch.mjs ───── */
function yamlScalar(v) {
  if (typeof v === "boolean") return String(v);
  return JSON.stringify(String(v));
}
const KEY_ORDER = [
  "name", "address_or_area", "region", "prefecture", "primary_category",
  "public_label", "planning_flags", "launch_tier", "status",
  "public_render", "address_verified", "source_type", "original_category",
];
function toYaml(obj) {
  let out = "";
  for (const k of KEY_ORDER) {
    const v = obj[k];
    if (v === undefined) continue;
    // planning_flags is omitted when empty; public_label "" is kept (it
    // is meaningful — a base-tier place with no experience chip).
    if (k === "planning_flags" && v === "") continue;
    out += `${k}: ${yamlScalar(v)}\n`;
  }
  return out;
}

/* ── Slug + dedup-key helpers ──────────────────────────────────────────── */
function slugify(name) {
  const s = name
    .replace(/\([^)]*\)/g, " ") // drop parenthetical (often CJK)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "place";
}
function normName(name) {
  return name
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}
function normKey(name, prefecture) {
  return normName(name) + "|" + prefecture.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/* ── Read existing place YAMLs, partition curated vs previously-imported ─ */
const existing = readdirSync(DIR).filter((f) => f.endsWith(".yaml"));
const priorImports = []; // filenames of YAMLs from a previous import run
for (const f of existing) {
  const data = yaml.load(readFileSync(`${DIR}/${f}`, "utf8"));
  if (data && IMPORT_SOURCES.has(data.source_type)) priorImports.push(f);
}

/* ── Build the migrated V1 place objects (validated, not yet written) ──── */
const v1Planned = []; // { file, obj }
const failures = [];
for (const [slug, t] of Object.entries(V1_KEEP)) {
  const obj = {
    name: t.name,
    address_or_area: t.address_or_area,
    region: t.region,
    prefecture: t.prefecture,
    primary_category: t.primary_category,
    public_label: t.public_label,
    planning_flags: t.planning_flags,
    launch_tier: t.launch_tier || "standard",
    status: "ready",
    public_render: true,
    address_verified: false,
    source_type: "v1_curated",
  };
  const parsed = placeSchema.safeParse(obj);
  if (!parsed.success) {
    failures.push(`V1 ${slug}: ` + parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "));
  }
  v1Planned.push({ file: `${slug}.yaml`, obj });
}

/* Dedup index — the migrated V1 places, keyed by normalised name+prefecture. */
const v1Index = new Map();
for (const [slug, t] of Object.entries(V1_KEEP))
  v1Index.set(normKey(t.name, t.prefecture), `${t.name} (V1)`);

/* ── Process the CSV import ────────────────────────────────────────────── */
const rows = parseCsv(readFileSync(CSV, "utf8"));
const hdr = rows[0];
const col = (n) => hdr.indexOf(n);
const C = Object.fromEntries(
  ["name", "address_or_area", "region", "prefecture", "primary_category",
   "public_label", "planning_flags", "launch_tier", "status",
   "public_render", "address_verified", "source_type", "original_category"]
    .map((k) => [k, col(k)]),
);

const importPlanned = []; // { file, obj }
const conflicts = [];     // import rows skipped — matched a V1 place
const nearDupes = [];     // import rows that look close to a V1 place
const renamed = [];       // slug collisions resolved with a suffix
const labelFixes = [];    // with_kids label -> parks chip
const usedSlugs = new Set(Object.keys(V1_KEEP).map((s) => `${s}.yaml`));
const usedKeys = new Set(v1Index.keys());

for (const r of rows.slice(1)) {
  const name = r[C.name].trim();
  if (!name) continue;
  const prefecture = r[C.prefecture].trim();

  // Dedup against migrated V1 places (exact normalised name + prefecture).
  const key = normKey(name, prefecture);
  if (v1Index.has(key)) {
    conflicts.push(`${name} (${prefecture}) — matches ${v1Index.get(key)}; import row skipped`);
    continue;
  }
  // Soft near-duplicate flag (substring match, same prefecture) — not skipped.
  const nn = normName(name);
  for (const [slug, t] of Object.entries(V1_KEEP)) {
    if (t.prefecture.toLowerCase() !== prefecture.toLowerCase()) continue;
    const vn = normName(t.name);
    if (vn !== nn && (vn.includes(nn) || nn.includes(vn)))
      nearDupes.push(`${name} (${prefecture}) ~ ${t.name} (V1) — review`);
  }

  // public_label normalisation: `with_kids` is a planning flag, not an
  // experience chip; the 11 rows that used it as a label are parks.
  let label = r[C.public_label].trim();
  if (label === "with_kids") {
    label = "parks";
    labelFixes.push(`${name} (${prefecture})`);
  }

  const obj = {
    name,
    address_or_area: r[C.address_or_area].trim(),
    region: r[C.region].trim(),
    prefecture,
    primary_category: r[C.primary_category].trim(),
    public_label: label,
    planning_flags: r[C.planning_flags].trim(),
    launch_tier: r[C.launch_tier].trim() || "standard",
    status: r[C.status].trim() || "ready",
    public_render: /^true$/i.test(r[C.public_render].trim()),
    address_verified: /^true$/i.test(r[C.address_verified].trim()),
    source_type: r[C.source_type].trim(),
    original_category: r[C.original_category].trim(),
  };

  const parsed = placeSchema.safeParse(obj);
  if (!parsed.success) {
    failures.push(`${name}: ` + parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "));
    continue;
  }

  // Slug filename collision -> -2, -3 …
  let slug = slugify(name);
  let file = `${slug}.yaml`;
  if (usedSlugs.has(file)) {
    let n = 2;
    while (usedSlugs.has(`${slug}-${n}.yaml`)) n++;
    file = `${slug}-${n}.yaml`;
    renamed.push(`${name} -> ${file}`);
  }
  usedSlugs.add(file);
  usedKeys.add(key);
  importPlanned.push({ file, obj });
}

/* ── Abort on any validation failure — write nothing ───────────────────── */
if (failures.length) {
  console.error(`✗ Aborted — no files written. ${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

/* ── Execute: delete prior imports + dropped V1, write V1 + imports ────── */
for (const f of priorImports) rmSync(`${DIR}/${f}`);
for (const slug of Object.keys(V1_DROP)) {
  const f = `${DIR}/${slug}.yaml`;
  if (existsSync(f)) rmSync(f);
}
for (const { file, obj } of v1Planned) writeFileSync(`${DIR}/${file}`, toYaml(obj));
for (const { file, obj } of importPlanned) writeFileSync(`${DIR}/${file}`, toYaml(obj));

/* ── Report ────────────────────────────────────────────────────────────── */
const all = [...v1Planned, ...importPlanned].map((p) => p.obj);
const chipCount = {};
const flagCount = {};
const catCount = {};
let baseCount = 0;
for (const o of all) {
  chipCount[o.public_label || "(none)"] = (chipCount[o.public_label || "(none)"] || 0) + 1;
  catCount[o.primary_category] = (catCount[o.primary_category] || 0) + 1;
  if (o.launch_tier === "base") baseCount++;
  for (const fl of (o.planning_flags || "").split(";").map((x) => x.trim()).filter(Boolean))
    flagCount[fl] = (flagCount[fl] || 0) + 1;
}

const L = [];
L.push("# Phase B-2 — Places Import & V1 Migration Report", "");
L.push(`Generated by \`node scripts/populate-places.mjs\` on ${new Date().toISOString().slice(0, 10)}.`, "");
L.push(`**${all.length} place YAMLs total** — ${v1Planned.length} migrated from V1, ` +
  `${importPlanned.length} imported from \`japan_locations_v2.csv\`.`, "");

L.push("## V1 migration — 19 attractions kept", "");
L.push("Field assignments below are migration calls — spot-check them.", "");
L.push("| place | primary_category | chip | planning_flags |", "|---|---|---|---|");
for (const [slug, t] of Object.entries(V1_KEEP))
  L.push(`| ${t.name} | ${t.primary_category} | ${t.public_label || "—"} | ${t.planning_flags || "—"} |`);

L.push("", "## V1 dropped — 16 retail/lodging entries", "");
L.push("Not destinations — shops and hotels, already covered by the `stores` collection.", "");
for (const [slug, reason] of Object.entries(V1_DROP)) L.push(`- \`${slug}\` — ${reason}`);

L.push("", "## Import dedupe", "");
L.push(`- **${conflicts.length}** import row(s) skipped (exact name + prefecture match against a kept V1 place):`);
for (const c of conflicts) L.push(`  - ${c}`);
if (!conflicts.length) L.push("  - none");
L.push(`- **${nearDupes.length}** possible near-duplicate(s) — NOT skipped, review manually:`);
for (const c of nearDupes) L.push(`  - ${c}`);
if (!nearDupes.length) L.push("  - none");
L.push(`- **${renamed.length}** slug collision(s) resolved with a suffix:`);
for (const c of renamed) L.push(`  - ${c}`);
if (!renamed.length) L.push("  - none");

L.push("", "## Normalisations", "");
L.push(`- **${labelFixes.length}** rows arrived with \`public_label: with_kids\` ` +
  "(not a valid experience chip). Remapped to the `parks` chip — these are all " +
  "parks/playgrounds, and they keep `with_kids` as a planning flag:");
for (const c of labelFixes) L.push(`  - ${c}`);
L.push("- `day_trips` is in the planning taxonomy but **0 rows carry it** — the " +
  "\"Day Trips\" secondary chip is not rendered (matches the /products " +
  "\"only show non-empty chips\" rule).");

L.push("", "## Chip counts (whole collection)", "");
L.push("| chip | count |", "|---|---|");
for (const [k, v] of Object.entries(chipCount).sort((a, b) => b[1] - a[1]))
  L.push(`| ${k} | ${v} |`);
L.push("", "## Primary category counts", "");
for (const [k, v] of Object.entries(catCount).sort()) L.push(`- ${k}: ${v}`);
L.push(`- base-tier ("stay bases"): ${baseCount}`);
L.push("", "## Planning flag counts", "");
for (const [k, v] of Object.entries(flagCount).sort()) L.push(`- ${k}: ${v}`);
L.push("");
writeFileSync(REPORT, L.join("\n"));

console.log(`✓ ${all.length} place YAMLs written (${v1Planned.length} V1 + ${importPlanned.length} imported).`);
console.log(`  dropped ${Object.keys(V1_DROP).length} V1 retail/lodging entries`);
console.log(`  conflicts: ${conflicts.length}  near-dupes: ${nearDupes.length}  renamed: ${renamed.length}`);
console.log(`  chip counts: ${JSON.stringify(chipCount)}`);
console.log(`\nReport: ${REPORT}`);
