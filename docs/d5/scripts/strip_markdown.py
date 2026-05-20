#!/usr/bin/env python3
"""
Strip markdown link wrapping from URL fields in batch JSON outputs.

ChatGPT auto-wraps URLs in markdown link syntax inside the JSON string values:
    "image_url": "[https://example.com/img.jpg](https://example.com/img.jpg)"

This script restores them to raw URL strings:
    "image_url": "https://example.com/img.jpg"

Run after each batch lands, or once at the end across the whole outputs directory.

Usage:
    python3 strip_markdown.py batches/outputs/batch_01.json   # single file
    python3 strip_markdown.py batches/outputs/                # whole directory
"""

import os
import re
import sys

# Match [URL](URL) where both halves are identical
# Captures the URL once, replaces the whole wrapped construct with just the URL
PATTERN = re.compile(r"\[(https?://[^\]]+)\]\(\1\)")


def clean_file(path: str) -> int:
    """Strip markdown wrapping from a single file. Returns the number of replacements made."""
    with open(path, "r") as f:
        content = f.read()
    cleaned, count = PATTERN.subn(r"\1", content)
    if count > 0:
        with open(path, "w") as f:
            f.write(cleaned)
    return count


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 strip_markdown.py <file_or_directory>")
    target = sys.argv[1]

    if os.path.isfile(target):
        n = clean_file(target)
        print(f"{target}: stripped {n} markdown-wrapped URL(s)")
    elif os.path.isdir(target):
        total = 0
        files_changed = 0
        for fname in sorted(os.listdir(target)):
            if not fname.endswith(".json"):
                continue
            n = clean_file(os.path.join(target, fname))
            if n > 0:
                files_changed += 1
                total += n
            print(f"  {fname}: stripped {n} markdown-wrapped URL(s)")
        print()
        print(f"Done. {total} URLs cleaned across {files_changed} files.")
    else:
        sys.exit(f"Path not found: {target}")


if __name__ == "__main__":
    main()
