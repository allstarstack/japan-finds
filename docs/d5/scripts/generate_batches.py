#!/usr/bin/env python3
"""
D5 batch generator — creates copy-paste-ready batch files for the 455-product
enrichment run on ChatGPT regular chat.

Reads:
    product_list.txt       — one product name per line
    PROMPT_v2_1.md         — the v2.1 prompt template

Writes:
    batches/batch_01.txt   — full v2.1 prompt + first 25 products, copy-paste ready
    batches/batch_02.txt   — next 25 products, etc.
    ...
    batches/batch_NN.txt   — final batch (may be smaller)

Workflow:
    1. python3 generate_batches.py
    2. For each batch_NN.txt: open it, copy the whole file, paste into a fresh
       ChatGPT chat with search enabled.
    3. Save the JSON output to outputs/batch_NN.json.
    4. Run 5 batches in parallel (5 browser tabs) for ~4 waves total.

Settings: see the constants at the top of main().
"""

import os
import sys


def main():
    # ---- settings ----
    PRODUCT_LIST = "product_list.txt"
    PROMPT_FILE = "PROMPT_v2_1.md"
    OUTPUT_DIR = "batches"
    BATCH_SIZE = 25
    PLACEHOLDER = "[paste your product names here, one per line]"
    # ------------------

    # Read prompt template
    if not os.path.exists(PROMPT_FILE):
        sys.exit(f"ERROR: prompt template not found at {PROMPT_FILE}")
    with open(PROMPT_FILE) as f:
        prompt_template = f.read()

    if PLACEHOLDER not in prompt_template:
        sys.exit(
            f"ERROR: placeholder '{PLACEHOLDER}' not found in {PROMPT_FILE}. "
            "Did the template change?"
        )

    # Read product list
    if not os.path.exists(PRODUCT_LIST):
        sys.exit(f"ERROR: product list not found at {PRODUCT_LIST}")
    with open(PRODUCT_LIST) as f:
        products = [line.strip() for line in f if line.strip()]

    total = len(products)
    print(f"Loaded {total} products from {PRODUCT_LIST}")

    # Split into batches
    batches = [products[i : i + BATCH_SIZE] for i in range(0, total, BATCH_SIZE)]
    print(f"Splitting into {len(batches)} batches of up to {BATCH_SIZE} products each")

    # Make output dir
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate each batch file
    for idx, batch in enumerate(batches, start=1):
        filename = f"{OUTPUT_DIR}/batch_{idx:02d}.txt"
        batch_products = "\n".join(batch)
        content = prompt_template.replace(PLACEHOLDER, batch_products)
        with open(filename, "w") as f:
            f.write(content)
        print(f"  wrote {filename}: products {(idx-1)*BATCH_SIZE + 1}-{(idx-1)*BATCH_SIZE + len(batch)} ({len(batch)} products)")

    # Print summary + parallel-wave plan
    waves = (len(batches) + 4) // 5  # ceil(N/5)
    print()
    print(f"Done. {len(batches)} batch files ready in {OUTPUT_DIR}/.")
    print(f"At 5 parallel: {waves} waves to complete the full run.")
    print()
    print("Suggested workflow:")
    print(f"  Wave 1: open 5 ChatGPT tabs, paste batches 01-05, save outputs as batch_01.json ... batch_05.json")
    for w in range(2, waves + 1):
        start = (w - 1) * 5 + 1
        end = min(w * 5, len(batches))
        print(f"  Wave {w}: open 5 ChatGPT tabs, paste batches {start:02d}-{end:02d}, save outputs as batch_{start:02d}.json ... batch_{end:02d}.json")


if __name__ == "__main__":
    main()
