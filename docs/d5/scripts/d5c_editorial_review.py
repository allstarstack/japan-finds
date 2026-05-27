"""
D5c Editorial Review (Voice/Format Pass).

Reads the 362 queued slugs in docs/d5/d5_review_queue.txt against
docs/d5/products_enriched_master.json. Maps records to slugs via
YAML name_en <-> JSON input_name. Applies the format / voice / safety
calibration bar from docs/build/BUILD_SPEC_d5c_editorial_review.md
and writes docs/d5/d5_review_flagged.txt.

Read-only: produces only the flagged-rows file.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
MASTER_JSON = REPO / "docs" / "d5" / "products_enriched_master.json"
QUEUE = REPO / "docs" / "d5" / "d5_review_queue.txt"
YAML_DIR = REPO / "src" / "content" / "products"
OUT = REPO / "docs" / "d5" / "d5_review_flagged.txt"

REQUIRED_KEYS = [
    "description",
    "english_name",
    "japanese_name",
    "category",
    "subcategory",
    "price_range_jpy",
    "where_to_buy",
    "image_url",
    "image_source",
    "safety_flags",
    "source_url",
    "confidence",
    "notes",
]

# Fields where null/empty is a fail (image fields and notes are excluded per spec).
NON_NULL_FIELDS = [
    "description",
    "english_name",
    "japanese_name",
    "category",
    "subcategory",
    "price_range_jpy",
    "where_to_buy",
    "safety_flags",  # array, can be empty list — checked separately
    "source_url",
    "confidence",
]

ARRAY_FIELDS = ["where_to_buy", "safety_flags"]
STRING_FIELDS = [
    "description",
    "english_name",
    "japanese_name",
    "category",
    "subcategory",
    "price_range_jpy",
    "image_url",
    "image_source",
    "source_url",
    "confidence",
    "notes",
]

# ---------- regexes ----------

MD_LINK = re.compile(r"\[[^\]]+\]\([^)]+\)")
REF_MARKER = re.compile(r"\(\[[^\]]+\]\[\d+\]\)|\[\d+\](?!\()")

BANNED_WORDS = [
    "ultimate",
    "hidden gems",
    "hidden gem",
    "magical",
    "wanderlust",
    "authentic journey",
    "unforgettable",
    "discover japan",
    "explore",
    "must-see",
    "curated experiences",
    "local secrets",
    "comprehensive guide",
    "uncover",
    "delve",
]
BANNED_RE = re.compile(
    r"\b(" + "|".join(re.escape(w) for w in BANNED_WORDS) + r")\b",
    re.IGNORECASE,
)

CORPORATE_HEDGES = [
    "please note",
    "we recommend",
    "it is advisable",
    "consumers should",
    "it should be noted",
    "please consult",
    "widely available",
    "it is important",
    "it is worth noting",
    "be advised",
    "kindly",
    "we suggest",
]
HEDGE_RE = re.compile(
    r"\b(" + "|".join(re.escape(w) for w in CORPORATE_HEDGES) + r")\b",
    re.IGNORECASE,
)

GENERIC_HYPE = [
    "amazing",
    "incredible",
    "fantastic",
    "wonderful",
    "delightful",
    "exquisite",
    "stunning",
]
HYPE_RE = re.compile(
    r"\b(" + "|".join(re.escape(w) for w in GENERIC_HYPE) + r")\b",
    re.IGNORECASE,
)

# Wikipedia-style fact-dump signals.
WIKI_FACTDUMP_SIGNALS = [
    re.compile(r"\bis a (traditional )?(japanese|popular)\b", re.IGNORECASE),
    re.compile(r"\btraditionally\b", re.IGNORECASE),
    re.compile(r"\boriginated\b", re.IGNORECASE),
    re.compile(r"\bdates back\b", re.IGNORECASE),
    re.compile(r"\bwas (created|developed|invented|launched|introduced|founded|established)\b", re.IGNORECASE),
    re.compile(r"\bin (the )?(meiji|heian|edo|taisho|showa|reiwa|kamakura|muromachi|nara) (era|period)\b", re.IGNORECASE),
    re.compile(r"\bin (1[89]\d{2}|20\d{2})\b"),  # historical year
    re.compile(r"\bhas become (a )?(popular|widespread|common|beloved)\b", re.IGNORECASE),
    re.compile(r"\bvarious (ingredients|fillings|flavors|types|varieties)\b", re.IGNORECASE),
    re.compile(r"\bthroughout japan\b", re.IGNORECASE),
    re.compile(r"\boften (made|consumed|enjoyed|served|eaten)\b", re.IGNORECASE),
    re.compile(r"\bcommonly (made|consumed|enjoyed|served|eaten|found)\b", re.IGNORECASE),
    re.compile(r"\bknown for (its|their) ", re.IGNORECASE),
]

# Voice anchor signals — presence means it's not Wikipedia-style.
WIKI_ANCHOR_SIGNALS = [
    re.compile(r"\b(lawson|7-eleven|seven-eleven|familymart|family mart|seicomart|seiko mart|ministop)\b", re.IGNORECASE),
    re.compile(r"\b(donki|don quijote|matsumoto kiyoshi|matsukiyo|muji|daiso|loft|tokyu hands|seria|cando)\b", re.IGNORECASE),
    re.compile(r"\b(grab|try|skip|cop|snag|swipe|find it at|find them at|hunt|go for|hit up|stash|stock up)\b", re.IGNORECASE),
    re.compile(r"\b(best|favorite|go-to|benchmark|winner|the move|the play|the win|the one|the pick)\b", re.IGNORECASE),
    re.compile(r"\b(my|i|you|your)\b", re.IGNORECASE),
    re.compile(r"\bdo (yourself|not sleep|nott|n't sleep)\b", re.IGNORECASE),
    re.compile(r"\b(konbini|drugstore|station kiosk|combini)\b", re.IGNORECASE),
    re.compile(r"\b(amazon japan|rakuten|japanesetaste)\b", re.IGNORECASE),
]

# Present-tense violation signals (past/future where present should be).
PAST_FUTURE_PATTERNS = [
    re.compile(r"\b(was|were) (created|developed|invented|launched|introduced|founded|established|made|produced|sold|served|released)\b", re.IGNORECASE),
    re.compile(r"\bhas become\b", re.IGNORECASE),
    re.compile(r"\bhad been\b", re.IGNORECASE),
    re.compile(r"\bwill be (a|the)\b", re.IGNORECASE),
    re.compile(r"\bgoing to be\b", re.IGNORECASE),
]

# Safety-flag candidate patterns.
NSAID_PATTERNS = [
    re.compile(r"\b(loxonin|loxoprofen|eve|bufferin)\b", re.IGNORECASE),
    re.compile(r"\b(painkiller|pain reliever|fever reducer|headache)\b", re.IGNORECASE),
    re.compile(r"\b(ibuprofen|naproxen)\b", re.IGNORECASE),
]
MULTI_COLD_MED_PATTERNS = [
    re.compile(r"\b(pabron|lulu a gold|lulu gold|benza|benzablock|stona)\b", re.IGNORECASE),
    re.compile(r"\bcold (medicine|tablets|capsules)\b", re.IGNORECASE),
]
ASPIRIN_PATTERNS = [
    re.compile(r"\b(salonpas)\b", re.IGNORECASE),
    re.compile(r"\b(aspirin)\b", re.IGNORECASE),
]
ALCOHOL_CATEGORY_PATTERNS = [
    re.compile(r"\b(beer|sake|shochu|highball|whisky|whiskey|wine|chu-?hai|strong zero|umeshu|awamori|sour|cocktail|spirits?|liquor|nihonshu)\b", re.IGNORECASE),
]
GRAPEFRUIT_STRONG_ZERO = re.compile(r"\bgrapefruit\b.*\bstrong zero\b|\bstrong zero\b.*\bgrapefruit\b", re.IGNORECASE)
CITRUS_PATTERNS = [
    re.compile(r"\b(grapefruit|yuzu|sudachi|kabosu)\b", re.IGNORECASE),
]
VOLTAGE_PATTERNS = [
    re.compile(r"\b(rice cooker|kettle|hair dryer|hair-dryer|iron|electric razor|electric shaver|toaster|microwave|coffee maker|hot plate|induction|kotatsu|electric pot|water heater)\b", re.IGNORECASE),
]
ZOJIRUSHI_RICE_COOKER = re.compile(r"\b(zojirushi|tiger|panasonic).*\brice cooker\b|\brice cooker\b", re.IGNORECASE)


# ---------- helpers ----------

def load_queue() -> list[str]:
    slugs = []
    for line in QUEUE.read_text().splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        # Strip trailing tab-annotations like `slug\t[AMBIGUOUS: ...]`
        slug = s.split("\t", 1)[0].strip()
        slug = slug.split(" ", 1)[0].strip()  # in case it's space-separated
        if slug:
            slugs.append(slug)
    return slugs


def load_records() -> list[dict]:
    return json.loads(MASTER_JSON.read_text())


def _norm_quotes(s: str) -> str:
    """Normalize typographic quotes to ASCII so name lookups match."""
    return (
        s.replace("’", "'")
        .replace("‘", "'")
        .replace("“", '"')
        .replace("”", '"')
    )


def build_name_to_slug() -> dict[str, str]:
    """Map normalized YAML name_en -> slug (file stem)."""
    mapping: dict[str, str] = {}
    for yaml_file in YAML_DIR.glob("*.yaml"):
        slug = yaml_file.stem
        text = yaml_file.read_text()
        # Find first `name_en:` line at top level
        m = re.search(r"^name_en:\s*(.+)$", text, re.MULTILINE)
        if not m:
            continue
        name_en = m.group(1).strip().strip('"\'')
        mapping[_norm_quotes(name_en)] = slug
    return mapping


def slugify(value: str) -> str:
    s = value.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s


def collapse(text: str) -> str:
    if text is None:
        return ""
    return re.sub(r"\s+", " ", text).strip()


# ---------- flag detectors ----------

def format_flags(rec: dict) -> list[tuple[str, str]]:
    flags: list[tuple[str, str]] = []

    # Required keys present
    for k in REQUIRED_KEYS:
        if k not in rec:
            flags.append(("missing_field", f"key absent: {k}"))

    # Type checks
    for k in ARRAY_FIELDS:
        if k in rec and rec[k] is not None and not isinstance(rec[k], list):
            flags.append(("wrong_type", f"{k} expected array, got {type(rec[k]).__name__}"))
    for k in STRING_FIELDS:
        if k in rec and rec[k] is not None and not isinstance(rec[k], (str,)):
            flags.append(("wrong_type", f"{k} expected string, got {type(rec[k]).__name__}"))

    # Non-null/non-empty checks for content fields
    for k in NON_NULL_FIELDS:
        v = rec.get(k)
        if k == "safety_flags":
            # array can be empty — only flag if not a list or None
            if v is None:
                flags.append(("missing_value", f"{k} is null (expected array, can be empty)"))
            continue
        if v is None:
            flags.append(("missing_value", f"{k} is null"))
        elif isinstance(v, str) and not v.strip():
            flags.append(("missing_value", f"{k} is empty"))
        elif isinstance(v, list) and len(v) == 0:
            flags.append(("missing_value", f"{k} is empty array"))

    # source_url URL shape
    src = rec.get("source_url")
    if isinstance(src, str):
        if not src.startswith("https://"):
            flags.append(("bad_source_url", f"does not start with https://: {src[:60]}"))
        else:
            # Trailing prose detection — URL should not contain whitespace
            if re.search(r"\s", src):
                flags.append(("bad_source_url", f"contains whitespace / trailing prose: {src[:80]}"))

    # image_url shape if non-null
    img = rec.get("image_url")
    if isinstance(img, str) and img.strip():
        if not (img.startswith("http://") or img.startswith("https://")):
            flags.append(("bad_image_url", f"not an http(s) URL: {img[:60]}"))
        if re.search(r"\s", img):
            flags.append(("bad_image_url", f"contains whitespace / trailing prose: {img[:80]}"))

    # Markdown link / reference markers in any field
    for k, v in rec.items():
        targets: list[str] = []
        if isinstance(v, str):
            targets = [v]
        elif isinstance(v, list):
            targets = [x for x in v if isinstance(x, str)]
        for t in targets:
            if MD_LINK.search(t):
                flags.append(("markdown_link", f"in field '{k}': {collapse(t)[:80]}"))
            if REF_MARKER.search(t):
                flags.append(("reference_marker", f"in field '{k}': {collapse(t)[:80]}"))

    # description length bounds
    desc = rec.get("description")
    if isinstance(desc, str):
        L = len(desc)
        if L < 20:
            flags.append(("desc_too_short", f"{L} chars (<20)"))
        elif L > 400:
            flags.append(("desc_too_long", f"{L} chars (>400)"))

    return flags


def voice_flags(rec: dict) -> list[tuple[str, str]]:
    flags: list[tuple[str, str]] = []
    desc = rec.get("description") or ""
    if not isinstance(desc, str) or not desc.strip():
        return flags

    # Banned words
    for m in BANNED_RE.finditer(desc):
        flags.append(("banned_word", f'"{m.group(0)}"'))

    # Corporate hedging
    for m in HEDGE_RE.finditer(desc):
        flags.append(("corporate_hedging", f'"{m.group(0)}"'))

    # Generic hype
    for m in HYPE_RE.finditer(desc):
        flags.append(("generic_hype", f'"{m.group(0)}"'))

    # Wikipedia-style: BOTH impersonal AND fact-dump
    factdump_hits: list[str] = []
    for pat in WIKI_FACTDUMP_SIGNALS:
        m = pat.search(desc)
        if m:
            factdump_hits.append(m.group(0))
    anchor_hits = 0
    for pat in WIKI_ANCHOR_SIGNALS:
        if pat.search(desc):
            anchor_hits += 1
    if len(factdump_hits) >= 2 and anchor_hits == 0:
        flags.append((
            "wikipedia_style",
            f"impersonal + fact-dump (signals: {', '.join(repr(h) for h in factdump_hits[:4])})",
        ))

    # Present-tense violations
    for pat in PAST_FUTURE_PATTERNS:
        m = pat.search(desc)
        if m:
            flags.append(("present_tense_violation", f'"{m.group(0)}"'))

    # De-dup flags (same tag + detail)
    seen = set()
    out = []
    for f in flags:
        if f in seen:
            continue
        seen.add(f)
        out.append(f)
    return out


def safety_flags_candidates(rec: dict) -> list[tuple[str, str]]:
    flags: list[tuple[str, str]] = []
    existing = rec.get("safety_flags")
    has_safety = isinstance(existing, list) and len(existing) > 0

    name = " ".join(
        x for x in [
            rec.get("english_name") or "",
            rec.get("input_name") or "",
            rec.get("japanese_name") or "",
        ] if isinstance(x, str)
    )
    cat = (rec.get("category") or "") if isinstance(rec.get("category"), str) else ""
    sub = (rec.get("subcategory") or "") if isinstance(rec.get("subcategory"), str) else ""
    desc = (rec.get("description") or "") if isinstance(rec.get("description"), str) else ""
    haystack = f"{name} {cat} {sub} {desc}"

    # NSAIDs
    for pat in NSAID_PATTERNS:
        m = pat.search(haystack)
        if m and not has_safety:
            flags.append(("nsaid_candidate", f"matched '{m.group(0)}' — safety_flags empty"))
            break

    # Multi-active cold med
    for pat in MULTI_COLD_MED_PATTERNS:
        m = pat.search(haystack)
        if m and not has_safety:
            flags.append(("multi_active_cold_med", f"matched '{m.group(0)}' — safety_flags empty"))
            break

    # Aspirin-related
    for pat in ASPIRIN_PATTERNS:
        m = pat.search(haystack)
        if m and not has_safety:
            flags.append(("aspirin_related", f"matched '{m.group(0)}' — safety_flags empty"))
            break

    # Alcohol
    alcohol_hit = None
    for pat in ALCOHOL_CATEGORY_PATTERNS:
        m = pat.search(f"{cat} {sub} {name}")
        if m:
            alcohol_hit = m.group(0)
            break
    if alcohol_hit:
        # Spec says safety_flags is null OR empty is the issue — also flag if it lacks alcohol-relevant flag
        flags_lower = [s.lower() for s in (existing or []) if isinstance(s, str)]
        if not any("alcohol" in f for f in flags_lower):
            flags.append(("alcohol_candidate", f"matched '{alcohol_hit}' — no alcohol safety flag"))
    if GRAPEFRUIT_STRONG_ZERO.search(haystack):
        flags.append((
            "grapefruit_strong_zero_hard_avoid",
            "explicit hard-avoid candidate per brand.md",
        ))

    # Citrus/grapefruit ingestion — skip if category is beauty (skincare)
    if cat.lower() != "beauty":
        for pat in CITRUS_PATTERNS:
            m = pat.search(haystack)
            if m and not has_safety:
                flags.append((
                    "citrus_ingestion_candidate",
                    f"matched '{m.group(0)}' (non-beauty category) — safety_flags empty",
                ))
                break

    # Voltage candidates — only when the PRODUCT is a plug-in appliance
    # (match against name/category/subcategory, not description copy).
    voltage_haystack = f"{name} {cat} {sub}"
    for pat in VOLTAGE_PATTERNS:
        m = pat.search(voltage_haystack)
        if m:
            flags_lower = [s.lower() for s in (existing or []) if isinstance(s, str)]
            if not any(
                "voltage" in f or "220v" in f or "100v" in f for f in flags_lower
            ):
                detail = f"matched '{m.group(0)}' in name/category"
                if "rice cooker" in m.group(0).lower():
                    detail += " — consider Zojirushi NW-YQH 220V tourist model note"
                flags.append(("voltage_candidate", detail + " — no voltage safety flag"))
            break

    return flags


# ---------- main ----------

def main() -> int:
    queue_slugs = load_queue()
    records = load_records()
    name_to_slug = build_name_to_slug()

    # Map record -> slug via input_name (with smart-quote normalization)
    slug_to_record: dict[str, dict] = {}
    unmatched_records: list[dict] = []
    for r in records:
        in_name = r.get("input_name")
        slug = (
            name_to_slug.get(_norm_quotes(in_name))
            if isinstance(in_name, str)
            else None
        )
        if not slug:
            # Fallback: slugify the english_name and check existence
            en = r.get("english_name") or ""
            if isinstance(en, str) and en:
                cand = slugify(en)
                if cand in {p.stem for p in YAML_DIR.glob("*.yaml")}:
                    slug = cand
        if slug:
            slug_to_record[slug] = r
        else:
            unmatched_records.append(r)

    # Reverse: for each queue slug, find the record
    missing_slugs: list[str] = []
    matched_blocks: list[tuple[str, str, str, dict]] = []  # slug, confidence, desc, flag_buckets

    for slug in queue_slugs:
        rec = slug_to_record.get(slug)
        if rec is None:
            missing_slugs.append(slug)
            continue

        fmts = format_flags(rec)
        voices = voice_flags(rec)
        safes = safety_flags_candidates(rec)

        if not (fmts or voices or safes):
            continue

        buckets: dict[str, list[tuple[str, str]]] = {}
        if fmts:
            buckets["format"] = fmts
        if voices:
            buckets["voice"] = voices
        if safes:
            buckets["safety_candidate"] = safes

        conf = rec.get("confidence") or ""
        desc = collapse(rec.get("description") or "")
        matched_blocks.append((slug, conf, desc, buckets))

    flagged_n = len(matched_blocks)
    passed_n = len(queue_slugs) - flagged_n - len(missing_slugs)

    # Sort by slug ASC
    matched_blocks.sort(key=lambda x: x[0])

    today = date.today().isoformat()
    lines: list[str] = []
    lines.append("D5c Editorial Review Flagged Rows")
    lines.append(f"Generated: {today}")
    lines.append(f"Input: docs/d5/products_enriched_master.json ({len(records)} records)")
    lines.append(f"Queue: docs/d5/d5_review_queue.txt ({len(queue_slugs)} slugs)")
    lines.append(f"Flagged: {flagged_n} rows")
    lines.append(f"Passed: {passed_n} rows")
    if missing_slugs:
        lines.append(f"Unmatched queue slugs (no record found): {len(missing_slugs)}")
        for s in missing_slugs:
            lines.append(f"  - {s}")
    lines.append("")
    lines.append("")

    for slug, conf, desc, buckets in matched_blocks:
        lines.append(f"slug: {slug}")
        lines.append(f"confidence: {conf}")
        lines.append(f"description: {desc}")
        lines.append("flags:")
        for bucket_name in ("format", "voice", "safety_candidate"):
            if bucket_name not in buckets:
                continue
            lines.append(f"  {bucket_name}:")
            for tag, detail in buckets[bucket_name]:
                lines.append(f"    - {tag}: {detail}")
        lines.append("")
        lines.append("")

    # Trim trailing blank lines, then ensure single newline at EOF
    text = "\n".join(lines).rstrip() + "\n"
    OUT.write_text(text)

    # Summary to stdout
    print(f"queue: {len(queue_slugs)}  records: {len(records)}  matched: {len(queue_slugs) - len(missing_slugs)}")
    print(f"flagged: {flagged_n}  passed: {passed_n}  unmatched: {len(missing_slugs)}")
    print(f"wrote: {OUT}")
    if missing_slugs:
        print("first unmatched slugs:", missing_slugs[:10])
    return 0


if __name__ == "__main__":
    sys.exit(main())
