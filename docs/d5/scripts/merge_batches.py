#!/usr/bin/env python3
"""
Merge all cleaned batch JSON files into one master file.

Each batch_NN.json contains a JSON array of enriched product objects.
This script flattens them into a single array in products_enriched_master.json.

Usage:
    python3 merge_batches.py

Reads:
    batches/outputs/batch_*.json (sorted alphabetically)

Writes:
    products_enriched_master.json
"""

import glob
import json
import os
import sys


def main():
    INPUT_DIR = "batches/outputs"
    OUTPUT_FILE = "products_enriched_master.json"

    if not os.path.isdir(INPUT_DIR):
        sys.exit(f"ERROR: {INPUT_DIR} not found. Run from ~/Desktop/builds/japan-finds/")

    batch_files = sorted(glob.glob(f"{INPUT_DIR}/batch_*.json"))
    if not batch_files:
        sys.exit(f"ERROR: no batch_*.json files found in {INPUT_DIR}")

    print(f"Found {len(batch_files)} batch files to merge:")

    all_products = []
    skipped = []

    for filepath in batch_files:
        filename = os.path.basename(filepath)
        try:
            with open(filepath) as f:
                products = json.load(f)
            if not isinstance(products, list):
                skipped.append((filename, "not a JSON array"))
                continue
            all_products.extend(products)
            print(f"  {filename}: {len(products)} products")
        except json.JSONDecodeError as e:
            skipped.append((filename, f"invalid JSON: {e}"))
        except Exception as e:
            skipped.append((filename, str(e)))

    if skipped:
        print()
        print("WARNING: skipped files:")
        for filename, reason in skipped:
            print(f"  {filename}: {reason}")

    # Write master
    with open(OUTPUT_FILE, "w") as f:
        json.dump(all_products, f, indent=2, ensure_ascii=False)

    print()
    print(f"Wrote {OUTPUT_FILE}: {len(all_products)} products total")

    # Quick stats
    if all_products:
        with_images = sum(1 for p in all_products if p.get("image_url"))
        with_safety = sum(1 for p in all_products if p.get("safety_flags"))
        confidences = {}
        for p in all_products:
            c = p.get("confidence", "unknown")
            confidences[c] = confidences.get(c, 0) + 1
        print()
        print("Quick stats:")
        print(f"  Products with image_url:  {with_images}/{len(all_products)} ({100*with_images//len(all_products)}%)")
        print(f"  Products with safety_flags: {with_safety}/{len(all_products)}")
        print(f"  Confidence breakdown: {confidences}")


if __name__ == "__main__":
    main()
