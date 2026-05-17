/* V2 Phase A — conversion script.
   Reads the source XLSX files in data/source/ and emits one validated YAML
   file per row into src/content/<collection>/. Idempotent: clears and
   regenerates the four generated collections each run.

   Collections handled: products, places, stores, routes.
   cheat-sheets are NOT generated — the source DOCX is a research/verification
   plan, not publishable content (see phase-a-conversion-summary.md).

   Column→field mapping and enum mapping tables are explicit, below.
   Run with: npm run convert */

import XLSX from "xlsx";
import { writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "fs";
import {
  productSchema,
  placeSchema,
  storeSchema,
  routeSchema,
} from "../src/content/schemas.ts";

const SRC = "data/source";
const CONTENT = "src/content";

/* ── Banned words (V1 BUILD_SPEC) — a row fails if copy contains any ──── */
const BANNED = [
  "ultimate", "hidden gems", "hidden gem", "magical", "wanderlust",
  "authentic journey", "unforgettable", "discover Japan", "explore",
  "must-see", "curated experiences", "local secrets", "comprehensive guide",
  "uncover", "delve",
];
const BANNED_RE = BANNED.map((w) => ({
  word: w,
  re: new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}\\b`, "i"),
}));
function scanBanned(text) {
  if (!text) return [];
  return BANNED_RE.filter((b) => b.re.test(text)).map((b) => b.word);
}

/* ── Enum mapping tables (audit decisions D1–D3, D10) ─────────────────── */
const STATUS = {
  "ready": "ready",
  "v1 candidate": "v1_candidate",
  "needs verification": "needs_verification",
  "hold": "hold",
  "backlog": "hold",
  "reject": "reject",
  "content only / hold": "content_only",
};
const PRODUCT_CATEGORY = {
  "100-yen": "100-yen",
  "100-yen shop / kitchen / travel helpers": "100-yen",
  "donki": "donki-drugstore", "donki finds": "donki-drugstore",
  "drugstore": "donki-drugstore", "drugstore basics & otc comfort": "donki-drugstore",
  "konbini drink": "konbini", "konbini food": "konbini",
  "konbini sweet": "konbini", "konbini foods & drinks": "konbini",
  "skincare": "skincare", "skincare / beauty / sunscreen": "skincare", "sunscreen": "skincare",
  "snacks": "snacks", "regional souvenir foods": "snacks",
  "stationery": "stationery", "kitchen": "kitchen",
  "customize": "other", "personalization / customization": "other", "design": "other",
  "gift": "other", "kid": "other", "kid / family products": "other", "packing": "other",
  "regional": "other", "travel": "other",
  "avoid": "other", "content-only / caution": "other",
  "manual pasted additions / audit": "other",
};
const INTENT = {
  "try in japan": "try_in_japan", "stock up": "stock_up", "bring home": "bring_home",
  "gift easy": "gift_easy", "local editions": "local_editions",
  "day-one fixes": "day_one_fixes", "make it yours": "make_it_yours",
  "content only": "content_only",
};
const PLACE_CATEGORY = {
  "konbini hauls": "konbini-hauls",
  "donki & drugstore missions": "donki-drugstore-missions",
  "donki missions": "donki-drugstore-missions",
  "100-yen finds": "100-yen-finds",
  "hobby pilgrimages": "hobby-pilgrimages",
  "rain-proof": "rain-proof",
  "family-ready": "family-ready",
  "local food streets": "local-food-streets",
  "transit anchors": "transit-anchors",
  "quiet japan towns": "quiet-japan-towns",
};
const LAYER = {
  "retail chain": "retail_chain", "drugstore": "drugstore",
  "konbini chain": "konbini", "100-yen chain": "100_yen",
  "department-store food hall": "depachika", "district": "district",
  "lifestyle store": "specialty", "lifestyle / diy store": "specialty",
  "stationery specialist": "specialty", "regional specialty retail": "specialty",
  "retail complex": "specialty", "transit retail hub": "district",
};

/* ── Helpers ──────────────────────────────────────────────────────────── */
const clean = (v) => String(v ?? "").trim();
const opt = (v) => clean(v) || undefined;
const lc = (v) => clean(v).toLowerCase();

function slugify(s) {
  return clean(s).toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function splitList(v, re = /[;,\n]/) {
  const parts = clean(v).split(re).map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}
function numOpt(v) {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function mapStatus(v) {
  return STATUS[lc(v)] || "needs_verification"; // default-safe (audit D3)
}
function mapIntent(v) {
  const out = [];
  for (let p of clean(v).split("/")) {
    p = p.replace(/\(.*?\)/g, "").trim().toLowerCase();
    const m = INTENT[p];
    if (m && !out.includes(m)) out.push(m);
  }
  return out;
}

/* YAML emitter — every string is JSON-quoted (always valid YAML). */
function yamlScalar(v) {
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(String(v));
}
function toYaml(obj, indent = 0) {
  const pad = "  ".repeat(indent);
  let out = "";
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      out += `${pad}${k}:\n`;
      for (const item of v) {
        if (item && typeof item === "object") {
          const lines = toYaml(item, 0).trimEnd().split("\n");
          out += `${pad}  - ${lines[0]}\n`;
          for (const l of lines.slice(1)) out += `${pad}    ${l}\n`;
        } else {
          out += `${pad}  - ${yamlScalar(item)}\n`;
        }
      }
    } else if (v && typeof v === "object") {
      out += `${pad}${k}:\n${toYaml(v, indent + 1)}`;
    } else {
      out += `${pad}${k}: ${yamlScalar(v)}\n`;
    }
  }
  return out;
}

/* Read a sheet as an array of rows (each row an array of cells). */
function readSheet(file, sheetName) {
  const wb = XLSX.readFile(`${SRC}/${file}`);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`sheet "${sheetName}" not found in ${file}`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false });
}
const colFinder = (headerRow) => (name) => headerRow.findIndex((h) => clean(h) === name);

/* ── Per-collection conversion ────────────────────────────────────────── */
const report = {};
const catCount = {}; // product category distribution, for the summary note

function convert(collection, schema, rows) {
  const dir = `${CONTENT}/${collection}`;
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".yaml")) rmSync(`${dir}/${f}`);
  }
  const seenSlugs = new Map();
  const r = { total: rows.length, written: 0, skipped: [] };
  for (const { ref, data } of rows) {
    // banned-word scan on rendered copy fields
    const bannedHits = [];
    for (const field of ["what_it_is", "why_travelers_care", "why_it_belongs"]) {
      for (const w of scanBanned(data[field])) {
        bannedHits.push(`"${w}" in ${field}`);
      }
    }
    if (bannedHits.length) {
      r.skipped.push({ ref, reason: `banned word — ${bannedHits.join("; ")}`, banned: true });
      continue;
    }
    // slug collision
    if (seenSlugs.has(data.slug)) {
      r.skipped.push({ ref, reason: `slug collision "${data.slug}" (already used by ${seenSlugs.get(data.slug)})` });
      continue;
    }
    // schema validation
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      r.skipped.push({ ref, reason: issues });
      continue;
    }
    seenSlugs.set(data.slug, ref);
    writeFileSync(`${dir}/${data.slug}.yaml`, toYaml(parsed.data));
    r.written++;
    if (collection === "products") {
      catCount[parsed.data.category] = (catCount[parsed.data.category] || 0) + 1;
    }
  }
  report[collection] = r;
}

/* ── products ── data/source product file, sheet "Product Master" ─────── */
function buildProducts() {
  const rows = readSheet("japan_finds_product_source_of_truth_v1.xlsx", "Product Master");
  const col = colFinder(rows[0]);
  const C = {
    id: col("Master ID"), name: col("Product name"), jp: col("Japanese name"),
    brand: col("Brand / maker"), category: col("Category"), where: col("Where found"),
    intent: col("Intent label"), price: col("Approx price"), what: col("What it is"),
    why: col("Why travelers care"), trip: col("Trip score"), suit: col("Suitcase score"),
    risk: col("Risk flags"), verify: col("Verification needed"),
    src: col("Source links / reference"), conf: col("Confidence"),
    status: col("Publish status"),
  };
  return rows.slice(1).filter((row) => clean(row[C.name])).map((row) => {
    const name = clean(row[C.name]);
    const conf = lc(row[C.conf]);
    return {
      ref: clean(row[C.id]) || name,
      data: {
        id: clean(row[C.id]),
        slug: slugify(name),
        name_en: name,
        category: PRODUCT_CATEGORY[lc(row[C.category])] || "other",
        intent: mapIntent(row[C.intent]),
        status: mapStatus(row[C.status]),
        name_jp: opt(row[C.jp]),
        brand: opt(row[C.brand]),
        where_found: splitList(row[C.where], /[;,]/),
        price_yen: opt(row[C.price]),
        what_it_is: opt(row[C.what]),
        why_travelers_care: opt(row[C.why]),
        risk_flags: splitList(row[C.risk], /;/),
        verification_notes: opt(row[C.verify]),
        source_links: splitList(row[C.src], /[;\n|]/),
        confidence: ["high", "medium", "low"].includes(conf) ? conf : undefined,
        trip_score: numOpt(row[C.trip]),
        suitcase_score: numOpt(row[C.suit]),
      },
    };
  });
}

/* ── places ── map file, sheet "Candidate Pins" ───────────────────────── */
function buildPlaces() {
  const rows = readSheet("japan_finds_map_source_of_truth_v1.xlsx", "Candidate Pins");
  const col = colFinder(rows[0]);
  const C = {
    name: col("Candidate"), area: col("Area / City"), label: col("Suggested Label"),
    why: col("Why it belongs"), verify: col("Verification needed"), notes: col("Notes"),
  };
  return rows.slice(1).filter((row) => clean(row[C.name])).map((row) => {
    const name = clean(row[C.name]);
    const first = clean(row[C.label]).split("/")[0].trim().toLowerCase();
    const verifyNote = [clean(row[C.verify]), clean(row[C.notes])].filter(Boolean).join(" — ");
    return {
      ref: name,
      data: {
        slug: slugify(name),
        name_en: name,
        area: clean(row[C.area]),
        category: PLACE_CATEGORY[first] || `UNMAPPED:${first}`,
        status: "needs_verification", // audit D3 — no canonical status in source
        why_it_belongs: opt(row[C.why]),
        verification_notes: verifyNote || undefined,
      },
    };
  });
}

/* ── stores ── where-to-buy file, sheet "Where-to-Buy Master" ─────────── */
function buildStores() {
  const rows = readSheet("japan_finds_where_to_buy_source_of_truth_v1.xlsx", "Where-to-Buy Master");
  const col = colFinder(rows[1]); // row 0 is a title; real headers on row 1
  const C = {
    name: col("Store / Chain / District"), jp: col("Japanese Name"), layer: col("Layer"),
    bestFor: col("Best For"), cats: col("Core Product Categories"),
    taxFree: col("Tax-Free / Coupon Notes"), airport: col("Airport Availability"),
    risk: col("Risk / Safety Flags"), src: col("Source URLs"),
  };
  return rows.slice(2).filter((row) => clean(row[C.name])).map((row) => {
    const name = clean(row[C.name]);
    return {
      ref: name,
      data: {
        slug: slugify(name),
        name_en: name,
        layer: LAYER[lc(row[C.layer])] || `UNMAPPED:${lc(row[C.layer])}`,
        status: "needs_verification", // audit D3 — no status column in source
        name_jp: opt(row[C.jp]),
        best_for: opt(row[C.bestFor]),
        core_categories: splitList(row[C.cats], /;/),
        tax_free_notes: opt(row[C.taxFree]),
        airport_availability: opt(row[C.airport]),
        risk_flags: splitList(row[C.risk], /;/),
        source_links: splitList(row[C.src], /[;\n|]/),
        // example_products / traveler_locations omitted — source is free text,
        // not slugs (audit D6); cross-linking is a later phase.
      },
    };
  });
}

/* ── routes ── where-to-buy file, sheet "Shopping Circuits" ───────────── */
function buildRoutes() {
  const rows = readSheet("japan_finds_where_to_buy_source_of_truth_v1.xlsx", "Shopping Circuits");
  const col = colFinder(rows[1]);
  const C = { name: col("Circuit") };
  return rows.slice(2).filter((row) => clean(row[C.name])).map((row) => {
    const name = clean(row[C.name]);
    return {
      ref: name,
      data: {
        slug: slugify(name),
        name_en: name,
        route_type: "shopping_circuit", // audit D10 — all 5 are shopping circuits
        status: "needs_verification",   // audit D3 — no status column in source
        // stops omitted — source is arrow-joined free text, not place slugs (D6)
      },
    };
  });
}

/* ── Run ──────────────────────────────────────────────────────────────── */
console.log("Converting V2 source files…\n");
convert("products", productSchema, buildProducts());
convert("places", placeSchema, buildPlaces());
convert("stores", storeSchema, buildStores());
convert("routes", routeSchema, buildRoutes());

/* ── Summary ──────────────────────────────────────────────────────────── */
let totalIn = 0, totalOut = 0, totalSkip = 0, bannedCount = 0;
const lines = [];
lines.push("# Phase A — Conversion Summary", "");
lines.push(`Generated by \`npm run convert\` on ${new Date().toISOString().slice(0, 10)}.`, "");
lines.push("| Collection | Source rows | Written | Skipped |");
lines.push("|---|---|---|---|");
for (const [name, r] of Object.entries(report)) {
  totalIn += r.total; totalOut += r.written; totalSkip += r.skipped.length;
  bannedCount += r.skipped.filter((s) => s.banned).length;
  lines.push(`| ${name} | ${r.total} | ${r.written} | ${r.skipped.length} |`);
}
lines.push(`| **total** | **${totalIn}** | **${totalOut}** | **${totalSkip}** |`, "");
lines.push("cheat-sheets: **not converted** — the source DOCX is a research /");
lines.push("verification plan, not publishable content. The collection and schema");
lines.push("exist; entries are authored by hand during content synthesis.", "");

for (const [name, r] of Object.entries(report)) {
  if (!r.skipped.length) continue;
  lines.push(`## ${name} — ${r.skipped.length} skipped`, "");
  for (const s of r.skipped) lines.push(`- \`${s.ref}\` — ${s.reason}`);
  lines.push("");
}

/* ── Notes & follow-ups ───────────────────────────────────────────────── */
lines.push("## Notes & follow-ups", "");
const catLine = Object.entries(catCount)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `${k} ${v}`)
  .join(" · ");
lines.push(`Product category distribution: ${catLine}`, "");
lines.push(
  `- **TODO — product \`category\` is coarse.** ${catCount.other || 0} of ` +
    `${report.products.written} products map to \`other\` (the source had 29 ` +
    "free-form category values vs the 10-value schema enum — audit D1/D2). " +
    "Remap before the public category-filter UX is finalized: edit the " +
    "`PRODUCT_CATEGORY` table in `scripts/convert-source.mjs` and re-run.",
);
lines.push(
  "- places / stores / routes are all `needs_verification` — none render " +
    "publicly until a row is explicitly verified and promoted to `ready`.",
);
lines.push(
  "- No rows are promoted to `ready` in Phase A — every entry stays gated. " +
    "Selecting the verified launch set and promoting `v1_candidate` → `ready` " +
    "is a Phase B task (Shopping Lists).",
);
lines.push("");

const md = lines.join("\n");
writeFileSync("phase-a-conversion-summary.md", md);
writeFileSync(".convert-log", `${new Date().toISOString()}\n\n${md}\n`);

console.log(md);
console.log(`\nBanned-word skips: ${bannedCount}`);
console.log("\nWrote phase-a-conversion-summary.md");
if (totalSkip > 0) {
  console.log(`\n⚠  ${totalSkip} row(s) skipped — review before promoting any to status: ready.`);
}
