/* Phase B-1 — catalog-launch population script.
   One-off: reads docs/decision_2_v4.csv (385 locked launch picks) and writes
   the launch fields back into the matching product YAMLs.

   Per row it sets: launch_category, fill_type, display_strategy, featured,
   sub_chip (konbini/drugstore only), where_found (from the CSV's merged
   retailer/where-found column), and flips status -> "ready".

   Conservative-display guard (Yawataya bug precedent): for creator_fill rows
   (display_strategy: hide_jp_and_brand_until_enriched) the unverified
   name_jp and brand are STRIPPED from the YAML — the launch data does not
   carry them; the post-launch enrichment pass restores confirmed values.

   Atomic: every modified YAML is validated against the product schema in
   memory; if any row fails, NOTHING is written. Re-runnable / idempotent.

   Run with: node scripts/populate-launch.mjs */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import yaml from "js-yaml";
import { productSchema } from "../src/content/schemas.ts";

const CSV = "docs/decision_2_v4.csv";
const DIR = "src/content/products";
const REPORT = "docs/phase-b1-populate-report.md";

/* Resolved duplicate — decision_2_v4.csv lists Bioré UV Aqua Rich Watery
   Essence twice. JF-0446 (grade A, no YAML) and JF-0373 (grade B, has YAML)
   are the same product. Per Steven's call the catalog keeps JF-0373 only;
   JF-0446 is skipped here. Launch = 384 distinct products, not 385. */
const RESOLVED_DUPES = new Set(["JF-0446"]);

/* Featured 6 hero cards — locked in the Phase B-1 prompt. */
const FEATURED = new Set([
  "JF-0228", // Famichiki
  "JF-0135", // Megrhythm Steam Eye Mask
  "JF-0010", // Daiso Tabi Socks (Toe-Split)
  "JF-0297", // Hanko Name Stamp
  "JF-0379", // Hada Labo Gokujyun Hyaluronic Lotion
  "JF-0099", // Donki Costume / Cosplay Floor Finds
]);

/* ── CSV parser — handles quoted fields with embedded commas ───────────── */
function parseCsv(str) {
  const rows = [];
  let row = [],
    cur = "",
    q = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (q) {
      if (c === '"') {
        if (str[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim()));
}

/* ── YAML emitter — JSON-quoted scalars, matches convert-source.mjs ────── */
function yamlScalar(v) {
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(String(v));
}
function toYaml(obj) {
  let out = "";
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      out += `${k}:\n`;
      for (const item of v) out += `  - ${yamlScalar(item)}\n`;
    } else {
      out += `${k}: ${yamlScalar(v)}\n`;
    }
  }
  return out;
}

/* Canonical key order — every launch YAML emits keys in this sequence. */
const KEY_ORDER = [
  "id", "slug", "name_en", "category", "intent", "status",
  "name_jp", "brand", "where_found", "price_yen", "what_it_is",
  "why_travelers_care", "risk_flags", "verification_notes", "source_links",
  "confidence", "trip_score", "suitcase_score",
  "launch_category", "fill_type", "display_strategy", "featured", "sub_chip",
];
function ordered(obj) {
  const out = {};
  for (const k of KEY_ORDER) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

/* ── Sub-chip derivation (Decision #3) ─────────────────────────────────── */
/* Explicit jf_id -> sub_chip tables. Hand-classified rather than regex: the
   88 konbini + drugstore launch items were each classified by product type,
   so there are no keyword false positives (a soda-flavoured ice BAR is sweet,
   not drink; an eye DROP is comfort, an eye MASK is skincare). The script
   warns on any konbini/drugstore jf_id missing from these tables so a future
   CSV change can't silently ship an unclassified row.

   Drugstore "Beauty" sub-chip is intentionally empty: colour cosmetics
   (Canmake/Cezanne etc.) live under the skincare_beauty launch_category, not
   drugstore. The filter UI renders only sub-chips that have items. */
const KONBINI_SUB = {
  // drink
  "JF-0216": "drink", "JF-0217": "drink", "JF-0218": "drink",
  "JF-0219": "drink", "JF-0220": "drink", "JF-0221": "drink",
  "JF-0222": "drink", "JF-0223": "drink", "JF-0224": "drink",
  "JF-0225": "drink", "JF-0244": "drink", "JF-0245": "drink",
  "JF-0250": "drink", "JF-0270": "drink", "JF-0282": "drink",
  // sweet
  "JF-0235": "sweet", "JF-0238": "sweet", "JF-0239": "sweet",
  "JF-0240": "sweet", "JF-0241": "sweet", "JF-0242": "sweet",
  "JF-0243": "sweet", "JF-0248": "sweet", "JF-0251": "sweet",
  "JF-0252": "sweet", "JF-0253": "sweet", "JF-0256": "sweet",
  "JF-0263": "sweet",
  // food
  "JF-0227": "food", "JF-0228": "food", "JF-0229": "food",
  "JF-0230": "food", "JF-0231": "food", "JF-0232": "food",
  "JF-0233": "food", "JF-0234": "food", "JF-0236": "food",
  "JF-0237": "food", "JF-0246": "food", "JF-0249": "food",
  "JF-0255": "food", "JF-0257": "food", "JF-0258": "food",
  "JF-0260": "food", "JF-0262": "food", "JF-0265": "food",
  // JF-0247 Convenience Wear socks — non-food konbini item, no sub_chip
};
const DRUGSTORE_SUB = {
  // skincare — peels, pore strips, Megrhythm steam eye masks
  "JF-0127": "skincare", "JF-0135": "skincare", "JF-0153": "skincare",
  "JF-0155": "skincare",
  // comfort — eye drops, bath/warming/cooling, wipes, oral care, masks
  "JF-0128": "comfort", "JF-0131": "comfort", "JF-0132": "comfort",
  "JF-0137": "comfort", "JF-0141": "comfort", "JF-0142": "comfort",
  "JF-0145": "comfort", "JF-0146": "comfort", "JF-0147": "comfort",
  "JF-0149": "comfort", "JF-0150": "comfort", "JF-0151": "comfort",
  "JF-0152": "comfort", "JF-0156": "comfort", "JF-0157": "comfort",
  "JF-0159": "comfort", "JF-0160": "comfort", "JF-0163": "comfort",
  "JF-0164": "comfort", "JF-0268": "comfort", "JF-0279": "comfort",
  // meds — OTC medications, pain patches, anti-itch
  "JF-0129": "meds", "JF-0130": "meds", "JF-0133": "meds",
  "JF-0134": "meds", "JF-0136": "meds", "JF-0138": "meds",
  "JF-0139": "meds", "JF-0143": "meds", "JF-0144": "meds",
  "JF-0148": "meds", "JF-0154": "meds", "JF-0158": "meds",
  "JF-0161": "meds", "JF-0162": "meds", "JF-0165": "meds",
  "JF-0276": "meds",
};

/* ── Build id -> file index ────────────────────────────────────────────── */
const files = readdirSync(DIR).filter((f) => f.endsWith(".yaml"));
const byId = new Map();
for (const f of files) {
  const data = yaml.load(readFileSync(`${DIR}/${f}`, "utf8"));
  if (data && data.id) byId.set(data.id, { file: f, data });
}

/* ── Read CSV ──────────────────────────────────────────────────────────── */
const rows = parseCsv(readFileSync(CSV, "utf8"));
const hdr = rows[0];
const col = (name) => hdr.indexOf(name);
const C = {
  launch_category: col("launch_category"),
  jf_id: col("jf_id"),
  fill_type: col("fill_type"),
  retailer: col("retailer_or_where_found"),
  display_strategy: col("display_strategy"),
};
const dataRows = rows.slice(1);

/* ── Process every CSV row ─────────────────────────────────────────────── */
const planned = []; // { file, obj }
const missing = [];
const failures = [];
const dupesSkipped = [];
const unmapped = []; // konbini/drugstore rows with no sub_chip table entry
const subLog = { konbini: [], drugstore: [] };
const seen = new Set();

for (const r of dataRows) {
  const id = r[C.jf_id].trim();
  if (!id) continue;
  if (RESOLVED_DUPES.has(id)) {
    dupesSkipped.push(id);
    continue;
  }
  if (seen.has(id)) {
    failures.push(`${id}: duplicate jf_id in CSV`);
    continue;
  }
  seen.add(id);

  const entry = byId.get(id);
  if (!entry) {
    missing.push(id);
    continue;
  }

  const launch_category = r[C.launch_category].trim();
  const fill_type = r[C.fill_type].trim();
  const display_strategy = r[C.display_strategy].trim();
  const where = r[C.retailer]
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean);

  // start from existing YAML data, then apply launch fields
  const obj = { ...entry.data };
  obj.status = "ready";
  obj.launch_category = launch_category;
  obj.fill_type = fill_type;
  obj.display_strategy = display_strategy;
  if (where.length) obj.where_found = where;
  if (FEATURED.has(id)) obj.featured = true;
  else delete obj.featured;

  // Conservative-display guard: creator_fill rows drop unverified jp/brand.
  if (display_strategy === "hide_jp_and_brand_until_enriched") {
    delete obj.name_jp;
    delete obj.brand;
  }

  // sub_chip — konbini and drugstore only, from the explicit tables
  delete obj.sub_chip;
  if (launch_category === "konbini") {
    const sc = KONBINI_SUB[id];
    if (sc) obj.sub_chip = sc;
    else unmapped.push(`${id} (konbini) ${obj.name_en}`);
    subLog.konbini.push(`${(sc || "—").padEnd(6)} ${id}  ${obj.name_en}`);
  } else if (launch_category === "drugstore") {
    const sc = DRUGSTORE_SUB[id];
    if (sc) obj.sub_chip = sc;
    else unmapped.push(`${id} (drugstore) ${obj.name_en}`);
    subLog.drugstore.push(`${(sc || "—").padEnd(9)} ${id}  ${obj.name_en}`);
  }

  const final = ordered(obj);
  const parsed = productSchema.safeParse(final);
  if (!parsed.success) {
    failures.push(
      `${id} (${entry.file}): ` +
        parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; "),
    );
    continue;
  }
  planned.push({ file: entry.file, obj: final });
}

/* ── Abort if anything is wrong — write nothing ────────────────────────── */
if (missing.length || failures.length) {
  console.error("✗ Aborted — no files written.\n");
  if (missing.length)
    console.error(`Missing YAMLs for ${missing.length} jf_id(s): ${missing.join(", ")}`);
  if (failures.length) {
    console.error(`\nSchema / data failures (${failures.length}):`);
    for (const f of failures) console.error(`  - ${f}`);
  }
  process.exit(1);
}

/* ── Write the 385 launch YAMLs ────────────────────────────────────────── */
for (const { file, obj } of planned) {
  writeFileSync(`${DIR}/${file}`, toYaml(obj));
}

/* ── Report ────────────────────────────────────────────────────────────── */
const catCount = {};
const fillCount = {};
const dispCount = {};
const konSub = {};
const drugSub = {};
for (const { obj } of planned) {
  catCount[obj.launch_category] = (catCount[obj.launch_category] || 0) + 1;
  fillCount[obj.fill_type] = (fillCount[obj.fill_type] || 0) + 1;
  dispCount[obj.display_strategy] = (dispCount[obj.display_strategy] || 0) + 1;
  if (obj.launch_category === "konbini")
    konSub[obj.sub_chip] = (konSub[obj.sub_chip] || 0) + 1;
  if (obj.launch_category === "drugstore")
    drugSub[obj.sub_chip || "(none)"] =
      (drugSub[obj.sub_chip || "(none)"] || 0) + 1;
}

const L = [];
L.push("# Phase B-1 — Catalog Population Report", "");
L.push(`Generated by \`node scripts/populate-launch.mjs\` on ${new Date().toISOString().slice(0, 10)}.`, "");
L.push(`**${planned.length} product YAMLs populated and flipped to \`status: ready\`.**`, "");
L.push(
  "",
  `Resolved duplicate: \`${[...dupesSkipped].join(", ")}\` skipped — Bioré UV ` +
    "Aqua Rich Watery Essence is in the CSV twice (JF-0373 + JF-0446); the " +
    "catalog keeps JF-0373. Launch list is 384 distinct products.",
);
L.push("## Launch category counts", "");
L.push("| launch_category | count |", "|---|---|");
for (const [k, v] of Object.entries(catCount).sort()) L.push(`| ${k} | ${v} |`);
L.push("", "## Fill type / display strategy", "");
for (const [k, v] of Object.entries(fillCount)) L.push(`- \`${k}\`: ${v}`);
for (const [k, v] of Object.entries(dispCount)) L.push(`- \`${k}\`: ${v}`);
L.push("", "## Featured hero cards", "");
for (const { obj } of planned)
  if (obj.featured) L.push(`- ${obj.id} — ${obj.name_en}`);
L.push("", "## Sub-chip derivation — SPOT-CHECK THESE", "");
L.push(`Konbini Run split: ${JSON.stringify(konSub)}`);
L.push(`Drugstore Haul split: ${JSON.stringify(drugSub)}`, "");
L.push(
  "Drugstore `beauty` is empty by design — colour cosmetics live under the " +
    "`skincare_beauty` launch category. The filter UI shows only non-empty " +
    "sub-chips.",
  "",
);
if (unmapped.length) {
  L.push(`Unmapped (no sub_chip — render in parent chip only): ${unmapped.length}`, "");
  for (const u of unmapped) L.push(`- ${u}`);
  L.push("");
}
L.push("### Konbini Run — food / drink / sweet", "", "```");
L.push(...subLog.konbini.sort());
L.push("```", "", "### Drugstore Haul — skincare / comfort / beauty / meds", "", "```");
L.push(...subLog.drugstore.sort());
L.push("```", "");
writeFileSync(REPORT, L.join("\n"));

console.log(`✓ ${planned.length} launch YAMLs written.`);
console.log(`  categories: ${JSON.stringify(catCount)}`);
console.log(`  fill: ${JSON.stringify(fillCount)}`);
console.log(`  konbini sub-chips: ${JSON.stringify(konSub)}`);
console.log(`  drugstore sub-chips: ${JSON.stringify(drugSub)}`);
console.log(`\nReport: ${REPORT}`);
