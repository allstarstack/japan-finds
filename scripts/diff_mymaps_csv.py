#!/usr/bin/env python3
"""Diff two My Maps CSVs by place name.

Usage: diff_mymaps_csv.py <last_sent.csv> <current.csv>

Reads the "Name" column from each CSV and prints added / removed names.
Empty output (and exit 0) when the two sets are identical. Stdlib only.
"""
import csv
import sys


def names(path):
    with open(path, newline="", encoding="utf-8") as f:
        return {row["Name"] for row in csv.DictReader(f) if row.get("Name")}


def main():
    if len(sys.argv) != 3:
        print("usage: diff_mymaps_csv.py <last_sent.csv> <current.csv>", file=sys.stderr)
        sys.exit(2)
    last = names(sys.argv[1])
    curr = names(sys.argv[2])
    added = sorted(curr - last)
    removed = sorted(last - curr)
    if not added and not removed:
        return  # empty stdout signals no changes to the caller
    if added:
        print(f"NEW PLACES ({len(added)}):")
        for n in added:
            print(f"  + {n}")
    if added and removed:
        print()
    if removed:
        print(f"REMOVED PLACES ({len(removed)}):")
        for n in removed:
            print(f"  - {n}")


if __name__ == "__main__":
    main()
