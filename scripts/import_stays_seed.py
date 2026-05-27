#!/usr/bin/env python3
"""Phase A.9 stays seed import (PHASE_A9_BUILD_SPEC §1).

Reads docs/build/stays_seed.csv and writes one YAML per row to
src/content/stays/. Assigns jf-stay-#### ids in CSV order
(Hoshinoya Karuizawa → jf-stay-0001). Slugs are NFKD-normalized and
lowercased kebab-case, asserted unique before any file is written.

Self-verify after write:
  - row count must equal CSV row count
  - round-trip parse every emitted YAML
  - sample print first 3 and last 3 written files

No third-party slug library — the dependency surface here is python-yaml
only (already installed for the existing scripts).
"""
from __future__ import annotations

import csv
import re
import sys
import unicodedata
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
CSV_PATH = REPO / "docs" / "build" / "stays_seed.csv"
OUT_DIR = REPO / "src" / "content" / "stays"
EXPECTED_ROW_COUNT = 136

FIELDS = [
    "name",
    "name_jp",
    "city",
    "prefecture",
    "primary_cat",
    "price_tier",
    "description",
    "distinctive",
    "source_url",
]


def slugify(value: str) -> str:
    """NFKD-fold to ASCII, lowercase, collapse non-alnum runs to single hyphens.
    Matches the kebab-case shape used elsewhere in the repo (see places/*.yaml).
    """
    norm = unicodedata.normalize("NFKD", value)
    ascii_only = norm.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_only.lower()
    kebab = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return kebab


def build_record(idx: int, row: dict[str, str]) -> tuple[str, dict]:
    """Return (slug, record) for one CSV row. idx is 1-based."""
    slug = slugify(row["name"])
    record = {
        "id": f"jf-stay-{idx:04d}",
        "name": row["name"],
        "name_jp": row["name_jp"],
        "city": row["city"],
        "prefecture": row["prefecture"],
        "primary_cat": row["primary_cat"],
        "price_tier": row["price_tier"],
        "description": row["description"],
        "distinctive": row["distinctive"],
        "source_url": row["source_url"],
    }
    return slug, record


def main() -> int:
    if not CSV_PATH.exists():
        print(f"[FATAL] missing {CSV_PATH}", file=sys.stderr)
        return 1

    with CSV_PATH.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        missing = [f for f in FIELDS if f not in (reader.fieldnames or [])]
        if missing:
            print(f"[FATAL] CSV missing columns: {missing}", file=sys.stderr)
            return 1
        rows = list(reader)

    if len(rows) != EXPECTED_ROW_COUNT:
        print(
            f"[FATAL] expected {EXPECTED_ROW_COUNT} rows, got {len(rows)}",
            file=sys.stderr,
        )
        return 1

    # Build all records first so we can assert no slug collisions before
    # touching the filesystem.
    plan: list[tuple[str, dict]] = []
    seen: dict[str, int] = {}
    for idx, row in enumerate(rows, start=1):
        slug, record = build_record(idx, row)
        if slug in seen:
            print(
                f"[FATAL] slug collision '{slug}': "
                f"row {seen[slug]} ({rows[seen[slug] - 1]['name']}) "
                f"vs row {idx} ({row['name']})",
                file=sys.stderr,
            )
            return 1
        seen[slug] = idx
        plan.append((slug, record))

    # Fresh write — clear any prior YAMLs so a re-run is deterministic.
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for existing in OUT_DIR.glob("*.yaml"):
        existing.unlink()

    for slug, record in plan:
        path = OUT_DIR / f"{slug}.yaml"
        with path.open("w", encoding="utf-8") as fh:
            yaml.safe_dump(
                record,
                fh,
                allow_unicode=True,
                sort_keys=False,
                default_flow_style=False,
            )

    # Self-verify: count + round-trip parse.
    written = sorted(OUT_DIR.glob("*.yaml"))
    if len(written) != EXPECTED_ROW_COUNT:
        print(
            f"[FATAL] wrote {len(written)} files, expected {EXPECTED_ROW_COUNT}",
            file=sys.stderr,
        )
        return 1

    for path in written:
        with path.open(encoding="utf-8") as fh:
            parsed = yaml.safe_load(fh)
        if not isinstance(parsed, dict) or "id" not in parsed:
            print(f"[FATAL] round-trip failed for {path.name}", file=sys.stderr)
            return 1

    print(f"[ok] wrote {len(written)} stay YAMLs to {OUT_DIR.relative_to(REPO)}")
    print(f"[ok] round-trip parse passed for all {len(written)} files")
    print(f"[ok] zero slug collisions across {len(plan)} rows\n")

    # Sample print: first 3 + last 3 with full body.
    samples = plan[:3] + plan[-3:]
    for slug, _ in samples:
        path = OUT_DIR / f"{slug}.yaml"
        print(f"--- {path.relative_to(REPO)} ---")
        print(path.read_text(encoding="utf-8"))

    return 0


if __name__ == "__main__":
    sys.exit(main())
