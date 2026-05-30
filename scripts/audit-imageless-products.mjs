/* Phase 1 image-hunt triage.

   Lists every product YAML that is `status: ready` + `launch_category` set
   + missing an image, and tags each row with a class so we know what
   actually needs a photo hunt vs. what can ship text-only.

   Classes:
     product — a discrete branded SKU; a clean official/retailer shot
               exists somewhere. Worth hunting an image for.
     service — concept/service with no natural product shot (IC cards,
               eSIM, luggage forwarding, lockers, pocket WiFi, rail
               passes). Fine to ship text-only.
     generic — real items but no single canonical SKU shot (origami
               paper, omamori, station/eki stamps, hanko, goshuin,
               furoshiki, etc.). Image hunt is low-value.

   Heuristics live in SERVICE_PATTERNS / GENERIC_PATTERNS below — anything
   else falls to `product`. The class column is a starting point, not a
   contract: re-run after corrections to refresh the CSV.

   Read-only. Writes docs/build/imageless-products.csv and prints counts.
   Run from repo root:  node scripts/audit-imageless-products.mjs */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const productsDir = join(root, "src/content/products");
const outPath = join(root, "docs/build/imageless-products.csv");

const field = (text, key) => {
  const m = text.match(new RegExp("^" + key + ":\\s*(.*)$", "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};

// Parse a simple YAML list block (`key:\n- a\n- b\n`) into an array.
const listField = (text, key) => {
  const re = new RegExp("^" + key + ":\\s*\\n((?:[ \\t]*-[^\\n]*\\n?)+)", "m");
  const m = text.match(re);
  if (!m) return [];
  return m[1]
    .split("\n")
    .map((line) => line.replace(/^[ \t]*-\s*/, "").trim())
    .filter(Boolean)
    .map((s) => s.replace(/^["']|["']$/g, ""));
};

const isEmptyImage = (v) => v === "" || v === "null" || v === "~";

// Service: concept/service rows where there is no SKU to photograph.
const SERVICE_PATTERNS = [
  /\bic[\s-]?card\b/i, /\bsuica\b/i, /\bicoca\b/i, /\bpasmo\b/i, /\bwelcome[\s-]?suica\b/i,
  /\besim\b/i, /\bsim[\s-]?card\b/i, /\bpocket[\s-]?wifi\b/i, /\bwi[\s-]?fi[\s-]?rental\b/i,
  /\bluggage[\s-]?(?:forward|delivery|storage)\b/i, /\btakuhaibin\b/i, /\btakkyubin\b/i,
  /\byamato[\s-]?(?:transport|delivery)\b/i,
  /\bcoin[\s-]?locker\b/i, /\blocker\b/i,
  /\b(?:jr|rail|metro|subway|tokyo|kansai|hakone|nikko)[\s-]?pass\b/i,
  /\b(?:tax[\s-]?free|tax[\s-]?refund)\b/i,
  /\bairport[\s-]?(?:bus|express|limousine|shuttle)\b/i,
  /\bcurrency[\s-]?exchange\b/i, /\batm[\s-]?(?:withdrawal|access)\b/i,
];

// Generic: real but uncanonical — no single SKU shot tells the story.
const GENERIC_PATTERNS = [
  /\borigami\b/i, /\bomamori\b/i, /\bgoshuin\b/i, /\bema\b/i, /\bofuda\b/i,
  /\b(?:station|eki)[\s-]?stamp/i, /\bstamp[\s-]?rally\b/i,
  /\bhanko\b/i, /\binkan\b/i, /\bname[\s-]?seal\b/i,
  /\bfuroshiki\b/i, /\btenugui\b/i,
  /\bchopstick[s]?\b/i, /\bhashioki\b/i, /\bohashi\b/i,
  /\bpochi[\s-]?bukuro\b/i, /\benvelope\b/i,
  /\bdaruma\b/i, /\bmaneki[\s-]?neko\b/i,
  /\bcoin[\s-]?purse\b/i, /\bchange[\s-]?tray\b/i,
  /\bkoinobori\b/i, /\bsenbazuru\b/i,
  /\bwashi\b/i, /\bshuji\b/i, /\bcalligraphy[\s-]?(?:paper|set)?\b/i,
];

const classify = (slug, name) => {
  const hay = `${slug} ${name}`.toLowerCase();
  if (SERVICE_PATTERNS.some((re) => re.test(hay))) return "service";
  if (GENERIC_PATTERNS.some((re) => re.test(hay))) return "generic";
  return "product";
};

const csvEscape = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const rows = [];
const counts = { product: 0, service: 0, generic: 0 };

for (const f of readdirSync(productsDir).sort()) {
  if (!f.endsWith(".yaml")) continue;
  const text = readFileSync(join(productsDir, f), "utf8");
  const status = field(text, "status");
  const launchCategory = field(text, "launch_category");
  const image = field(text, "image");
  if (status !== "ready" || !launchCategory) continue;
  if (!isEmptyImage(image)) continue;

  const slug = field(text, "slug") || f.replace(/\.yaml$/, "");
  const nameEn = field(text, "name_en");
  const nameJp = field(text, "name_jp");
  const brand = field(text, "brand");
  const whereToBuy = listField(text, "where_to_buy");
  const cls = classify(slug, nameEn);
  counts[cls]++;
  rows.push({
    slug,
    name_en: nameEn,
    name_jp: nameJp,
    brand,
    launch_category: launchCategory,
    where_to_buy: whereToBuy.join("; "),
    class: cls,
  });
}

const header = ["slug", "name_en", "name_jp", "brand", "launch_category", "where_to_buy", "class"];
const csv = [
  header.join(","),
  ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(",")),
].join("\n") + "\n";

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, csv);

console.log(`Wrote ${rows.length} rows -> ${outPath.replace(root + "/", "")}`);
console.log(`  product: ${counts.product}`);
console.log(`  service: ${counts.service}`);
console.log(`  generic: ${counts.generic}`);
