#!/usr/bin/env python3
"""
enrich_with_places_api.py — Phase D D1 enrichment
VERSION: 2026-05-19-v6 — pin description format + address cleanup + flag separator fix

COST WARNING (2026-05-24):
- Default mode: photos-only. Place Details Essentials ($5/1K) + Place Photos ($7/1K).
  Approx $4/run for 333 places.
- With --hours: Place Details Enterprise ($20/1K). Approx $20/run for 333 places.
  Use sparingly. Hours rarely change.

Enriches /places and /eat YAML frontmatter with:
  Step 1: place_id            (via Places API Text Search)
  Step 2: hours + cache date  (via Place Details, parsing `periods` not `weekdayDescriptions`)
  Step 3: hero_image .webp    (via Place Photos, cached locally)
  Step 4: My Maps re-import CSVs

Usage:
  # Dry-run a small sample (no writes, no API spend beyond the sample)
  python scripts/enrich_with_places_api.py --kind places --sample 3 --dry-run
  python scripts/enrich_with_places_api.py --kind eat --sample 2 --dry-run

  # Full batch — first run
  python scripts/enrich_with_places_api.py --kind both

  # Re-fetch hours where cache is > 90 days (idempotent revalidation)
  python scripts/enrich_with_places_api.py --kind both --refresh-stale

  # Weekly/daily cron — hours only, no photos, no place_id re-resolution
  python scripts/enrich_with_places_api.py --kind eat --hours-only --refresh-stale

  # Regenerate only My Maps CSVs from already-enriched YAML
  python scripts/enrich_with_places_api.py --csv-only

Requires: requests, ruamel.yaml, Pillow
  pip install requests ruamel.yaml Pillow

Env: GOOGLE_PLACES_API_KEY (in env or .env.local at repo root)
"""

import argparse
import csv
import io
import json
import logging
import os
import sys
import time
from datetime import date
from pathlib import Path

import requests
from PIL import Image
from ruamel.yaml import YAML  # preserves comments + ordering on round-trip

# -------------------------------------------------------------------- Config

API_BASE = "https://places.googleapis.com/v1"
TEXT_SEARCH_URL = f"{API_BASE}/places:searchText"
PLACE_DETAILS_URL_TMPL = f"{API_BASE}/places/{{place_id}}"
PHOTO_MEDIA_URL_TMPL = f"{API_BASE}/{{photo_name}}/media"

HOURS_STALE_DAYS = 90
PHOTO_MAX_W = 900
PHOTO_MAX_H = 600
PHOTO_QUALITY = 80  # drop to 70 if Lighthouse mobile Perf regresses > 1pt

# Our schema is monday-first; Google API uses 0=Sunday ... 6=Saturday
DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday",
                "friday", "saturday", "sunday"]

# TIME-SENSITIVE classification: which /places get the "open now" badge.
# Source field: `public_label` (see step 0 audit, May 19 2026).
# Excluded labels: nature_water, parks, photo_spots, "" — outdoor/scenic places
# where accessibility isn't gated by business hours.
TIME_SENSITIVE_LABELS = {
    "animals",
    "anime",
    "culture_history",
    "food_markets",
    "onsen_ryokan",
    "quirky_museums",
    "scenic_transport",
    "theme_parks",
    "workshops_crafts",
}

# Human-readable display labels for /places `public_label` values.
# Used in map pin descriptions when `original_category` isn't populated.
PUBLIC_LABEL_DISPLAY = {
    "animals": "Animals",
    "anime": "Anime",
    "culture_history": "Culture & history",
    "food_markets": "Food markets",
    "nature_water": "Nature",
    "onsen_ryokan": "Onsen & ryokan",
    "parks": "Parks",
    "photo_spots": "Scenic",
    "quirky_museums": "Quirky museums",
    "scenic_transport": "Scenic transport",
    "theme_parks": "Theme parks",
    "workshops_crafts": "Workshops & crafts",
}

# ruamel YAML config — round-trips comments + key ordering so existing
# hand-curated YAML doesn't get reformatted into oblivion.
rt_yaml = YAML(typ="rt")
rt_yaml.preserve_quotes = True
rt_yaml.indent(mapping=2, sequence=4, offset=2)
rt_yaml.width = 4096

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("enrich")


# -------------------------------------------------------------------- HTTP

def request_with_backoff(method, url, *, headers=None, json_body=None,
                         params=None, stream=False, max_retries=5):
    """Exponential backoff on 429 + 5xx. Returns Response or raises."""
    delay = 1.0
    for attempt in range(max_retries):
        try:
            r = requests.request(method, url, headers=headers, json=json_body,
                                 params=params, stream=stream, timeout=30)
            if r.status_code == 429 or r.status_code >= 500:
                log.warning(f"    {r.status_code} on {url[:80]}… retry in {delay:.1f}s")
                time.sleep(delay)
                delay *= 2
                continue
            return r
        except requests.RequestException as e:
            log.warning(f"    request error: {e} — retry in {delay:.1f}s")
            time.sleep(delay)
            delay *= 2
    raise RuntimeError(f"max retries exceeded for {url}")


# -------------------------------------------------------------------- API

LOCATION_BIAS_RADIUS_M = 500     # constrain Places search to this radius
MATCH_DISTANCE_THRESHOLD_M = 300  # reject matches farther than this from stored coords

# 5 req/sec throttle on Places Text Search — spec D7 §"Rate limiting".
# Google allows more, but slower run is fine and stays the safer default for
# any image-fetching script per the D5d Chrome-UA / per-host pattern.
SEARCH_MIN_INTERVAL_S = 0.2
_last_search_time = [0.0]


def _throttle_search():
    elapsed = time.time() - _last_search_time[0]
    if elapsed < SEARCH_MIN_INTERVAL_S:
        time.sleep(SEARCH_MIN_INTERVAL_S - elapsed)
    _last_search_time[0] = time.time()


def haversine_m(lat1, lng1, lat2, lng2):
    """Great-circle distance in meters. Used to verify Google's match is geographically plausible."""
    from math import radians, sin, cos, asin, sqrt
    R = 6_371_000  # Earth radius, meters
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return 2 * R * asin(sqrt(a))


def text_search(api_key, query, *, bias_lat=None, bias_lng=None):
    """POST places:searchText. Returns top result dict or None.

    If bias_lat/lng provided, constrains search to a 500m radius — eliminates most
    wrong-branch / wrong-city false matches at the API level.
    """
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        # Field mask MUST be a header, not a query param, in Places API (New)
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
    }
    body = {"textQuery": query, "languageCode": "en"}
    if bias_lat is not None and bias_lng is not None:
        body["locationBias"] = {
            "circle": {
                "center": {"latitude": float(bias_lat), "longitude": float(bias_lng)},
                "radius": LOCATION_BIAS_RADIUS_M,
            }
        }
    _throttle_search()
    r = request_with_backoff("POST", TEXT_SEARCH_URL, headers=headers, json_body=body)
    if r.status_code != 200:
        log.error(f"    text_search failed: {r.status_code} {r.text[:200]}")
        return None
    places = r.json().get("places") or []
    if not places:
        return None
    top = places[0]
    return {
        "place_id": top.get("id"),
        "display_name": (top.get("displayName") or {}).get("text"),
        "formatted_address": top.get("formattedAddress"),
        "lat": (top.get("location") or {}).get("latitude"),
        "lng": (top.get("location") or {}).get("longitude"),
    }


def place_details(api_key, place_id, *, want_photos=True, want_hours=False):
    """GET place details. Returns {regularOpeningHours, photos} or None.

    The field mask is assembled from the flags: `photos` only when want_photos,
    `regularOpeningHours` only when want_hours. regularOpeningHours forces the
    Place Details Enterprise SKU ($20/1K vs $5/1K Essentials) — see the COST
    WARNING in the module docstring, which is why hours are opt-in. With neither
    flag there is nothing to fetch, so we skip the request entirely.
    """
    fields = []
    if want_photos:
        fields.append("photos")
    if want_hours:
        fields.append("regularOpeningHours")
    if not fields:
        log.info("    place_details skipped — nothing requested "
                 f"(photos={want_photos}, hours={want_hours})")
        return None
    field_mask = ",".join(fields)
    log.info(f"    place_details field mask: {field_mask}")
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": field_mask,
    }
    url = PLACE_DETAILS_URL_TMPL.format(place_id=place_id)
    r = request_with_backoff("GET", url, headers=headers)
    if r.status_code != 200:
        log.error(f"    place_details failed: {r.status_code} {r.text[:200]}")
        return None
    data = r.json()
    return {
        "regularOpeningHours": data.get("regularOpeningHours"),
        "photos": data.get("photos") or [],
    }


def fetch_photo_bytes(api_key, photo_name):
    """Two-step photo fetch: get photoUri JSON, then download bytes."""
    url = PHOTO_MEDIA_URL_TMPL.format(photo_name=photo_name)
    headers = {"X-Goog-Api-Key": api_key}
    params = {
        "maxHeightPx": PHOTO_MAX_H,
        "maxWidthPx": PHOTO_MAX_W,
        "skipHttpRedirect": "true",  # returns JSON {photoUri:...} instead of 302
    }
    r = request_with_backoff("GET", url, headers=headers, params=params)
    if r.status_code != 200:
        log.error(f"    photo step 1 failed: {r.status_code} {r.text[:200]}")
        return None
    photo_uri = r.json().get("photoUri")
    if not photo_uri:
        return None
    r2 = request_with_backoff("GET", photo_uri, stream=True)
    if r2.status_code != 200:
        log.error(f"    photo step 2 failed: {r2.status_code}")
        return None
    return r2.content


# -------------------------------------------------------------------- Parsing

def normalize_hours(google_hours):
    """
    Convert Google's regularOpeningHours.periods → our monday-first schema.

    Google period format:
      {"open":  {"day": 1, "hour": 11, "minute": 0},
       "close": {"day": 1, "hour": 23, "minute": 0}}
    Google days: 0=Sunday ... 6=Saturday
    Our schema: {monday: [["11:00", "23:00"]], tuesday: [], ...}

    Edge cases:
      - 24/7: open day=0 hour=0 minute=0, NO close key. Return open-all-days.
      - Cross-midnight: close.day != open.day. We bound at 23:59 on open day
        (good enough for the "open now" badge; bar/izakaya 2am-edge cases
        will read closed at 1am which is a minor false negative we can live with).
      - Empty/missing: return None and the badge component skips that card.
    """
    if not google_hours:
        return None
    periods = google_hours.get("periods") or []
    if not periods:
        return None

    # Google: 0=sun ... 6=sat. Ours: 0=mon ... 6=sun. Mapping: (gd - 1) % 7
    google_to_ours = lambda gd: (int(gd) - 1) % 7

    result = {day: [] for day in DAYS_OF_WEEK}

    for p in periods:
        o = p.get("open")
        c = p.get("close")
        if not o:
            continue
        # 24/7 sentinel: open day=0 hour=0 min=0, no close
        if c is None:
            return {day: [["00:00", "23:59"]] for day in DAYS_OF_WEEK}

        o_day_ours = google_to_ours(o.get("day", 0))
        o_time = f"{int(o.get('hour', 0)):02d}:{int(o.get('minute', 0)):02d}"
        c_time = f"{int(c.get('hour', 0)):02d}:{int(c.get('minute', 0)):02d}"

        # Cross-midnight: bound at end-of-day on open side
        if c.get("day") != o.get("day"):
            c_time = "23:59"

        result[DAYS_OF_WEEK[o_day_ours]].append([o_time, c_time])

    return result


# -------------------------------------------------------------------- YAML

def load_yaml_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return rt_yaml.load(f) or {}


def save_yaml_file(path, data):
    with open(path, "w", encoding="utf-8") as f:
        rt_yaml.dump(data, f)


def is_hours_stale(data):
    cache_date = data.get("hours_cache_date")
    if not cache_date:
        return True
    if isinstance(cache_date, str):
        try:
            cache_date = date.fromisoformat(cache_date)
        except ValueError:
            return True
    elif not isinstance(cache_date, date):
        return True
    return (date.today() - cache_date).days > HOURS_STALE_DAYS


# -------------------------------------------------------------------- Pipeline

# Per-kind schema config — keeps process_row generic across YAML and JSON sources.
KIND_SPECS = {
    "places": {
        "source_type": "yaml_dir",
        "dir_default": "src/content/places",
        "slug_from": lambda data, fallback: data.get("slug") or fallback,
        "name_for_query": lambda data: data.get("name", ""),
        "name_for_display": lambda data: data.get("name", ""),
        "query_geo_fields": ["address_or_area", "city", "neighborhood",
                             "locality", "prefecture", "region"],
        "time_sensitive": "derive",  # use TIME_SENSITIVE_LABELS lookup
        "photo_field": "hero_image",
        "photo_attribution_field": "hero_attribution",
        "supports_hours": True,
        "emit_mymaps_csv": True,
        "mymaps_csv_path": "places_mymaps_v2.csv",
    },
    "eat": {
        "source_type": "json_file",
        "file_default": "src/data/restaurants.json",
        "slug_from": lambda data, fallback: data.get("id") or fallback,
        # Prefer Japanese for query — Romanized matches collide far more often
        "name_for_query": lambda data: data.get("name_jp") or data.get("name_en", ""),
        "name_for_display": lambda data: data.get("name_en") or data.get("name_jp", ""),
        "query_geo_fields": ["neighborhood", "city", "prefecture"],
        "time_sensitive": "always",  # /eat is universally time-sensitive
        "photo_field": "hero_image",
        "photo_attribution_field": "hero_attribution",
        "supports_hours": True,
        "emit_mymaps_csv": True,
        "mymaps_csv_path": "restaurants_mymaps_v5.csv",
    },
    # D7 — stays. Smaller, more specific properties; Japanese-name primary.
    # No stored lat/lng on the seed, so the haversine guard in process_row
    # never fires — address-text verification (formatted_address contains
    # prefecture OR city) is the safety net instead. Misses + mismatches go to
    # drafts/_d7_review/<slug>.yaml; live YAMLs are only written on HIGH match.
    "stays": {
        "source_type": "yaml_dir",
        "dir_default": "src/content/stays",
        # No `slug` field on the stays seed; the filename IS the slug.
        "slug_from": lambda data, fallback: fallback,
        "name_for_query": lambda data: data.get("name_jp") or data.get("name", ""),
        "name_for_display": lambda data: data.get("name", ""),
        "query_geo_fields": ["city", "prefecture"],
        "time_sensitive": "skip",  # stays schema has no time_sensitive field
        "photo_field": "photo_cache_path",
        "photo_attribution_field": None,  # stays schema has no attribution field
        "supports_hours": False,
        "emit_mymaps_csv": False,
        "address_verify_text": True,  # post-match check that formatted_address contains city|prefecture
    },
}


D7_REVIEW_DIR = Path("drafts/_d7_review")


def write_review_yaml(slug, data, api_result, reason):
    """D7 review-queue write: dump original entry + API response + reason
    to drafts/_d7_review/<slug>.yaml. Live YAML is NOT touched in this path.
    """
    D7_REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    review = {
        "reason": reason,
        "slug": slug,
        "original": {k: (v if not hasattr(v, "isoformat") else v.isoformat())
                     for k, v in dict(data).items()},
        "api_response": api_result or {},
    }
    out_path = D7_REVIEW_DIR / f"{slug}.yaml"
    with open(out_path, "w", encoding="utf-8") as f:
        rt_yaml.dump(review, f)
    log.warning(f"    [review] {slug} → {out_path} (reason: {reason})")


def address_text_match(formatted_address, prefecture, city):
    """Return True if formatted_address contains prefecture OR city (case-insensitive,
    accent-tolerant best-effort). The Google API mixes English + Japanese names;
    we check both raw text and lowercased."""
    if not formatted_address:
        return False
    haystack = str(formatted_address)
    haystack_lc = haystack.lower()
    for needle in (prefecture, city):
        if not needle:
            continue
        n = str(needle).strip()
        if not n:
            continue
        if n in haystack or n.lower() in haystack_lc:
            return True
    return False


def process_row(data, kind, slug, name_query, name_display, api_key, args, stats):
    """Process one record dict. Mutates in place. Caller handles persistence.

    Args:
      data:         the record dict (a YAML doc or a JSON object)
      kind:         "places" or "eat"
      slug:         stable identifier for hero_image filename
      name_query:   string used in the Places API query (prefer name_jp for /eat)
      name_display: human-readable name for logs + verification CSV
    """
    spec = KIND_SPECS[kind]
    photo_field = spec["photo_field"]
    photo_attr_field = spec.get("photo_attribution_field")
    supports_hours = spec.get("supports_hours", True)

    # Track per-category total before any early-return so hit rate is accurate.
    if kind == "stays":
        cat = (data.get("primary_cat") or "uncategorized")
        stats["per_category"].setdefault(cat, {"hits": 0, "total": 0})
        stats["per_category"][cat]["total"] += 1

    needs_place_id = (
        not args.hours_only and ("place_id" not in data or args.force)
    )
    # Hours are opt-in as of the 2026-05-24 cost kill: regularOpeningHours forces
    # the Place Details Enterprise SKU, so default runs are photos-only. --hours
    # re-enables hours (explicit ask → refetch every touched row, or only stale
    # ones when paired with --refresh-stale); the legacy --hours-only path still
    # implies hours.
    want_hours = supports_hours and (args.hours or args.hours_only)
    needs_hours = want_hours and (
        args.force
        or args.hours_only
        or "hours" not in data
        or not args.refresh_stale
        or is_hours_stale(data)
    )
    needs_photo = (
        args.photos
        and not args.hours_only
        and (photo_field not in data or args.force_photos or args.force)
    )

    if not (needs_place_id or needs_hours or needs_photo):
        log.info(f"  [skip   ] {slug:50s} (already enriched, fresh)")
        stats["skipped"] += 1
        return

    log.info(f"  [process] {slug:50s} pid={needs_place_id} hrs={needs_hours} pic={needs_photo}")

    # --- Step 1: place_id (with locationBias + distance verification)
    if needs_place_id:
        # Query construction: stack the most specific geographic descriptors available
        # per the kind's spec. Minimizes false matches against same-name businesses elsewhere.
        query_parts = [name_query] if name_query else []
        for field in spec["query_geo_fields"]:
            val = data.get(field)
            if val and val not in query_parts and not any(val in p for p in query_parts):
                query_parts.append(str(val))
        query = " ".join(query_parts).strip()

        # Use stored lat/lng to constrain the search and verify the match.
        # First-run /places + /eat have none (lat/lng captured from API response below);
        # subsequent --refresh-stale runs get the safety net for free.
        stored_lat = data.get("lat") or data.get("latitude")
        stored_lng = data.get("lng") or data.get("longitude")
        if stored_lat is None or stored_lng is None:
            log.info(f"    no stored lat/lng — query specificity carries the match: {query!r}")

        result = text_search(api_key, query, bias_lat=stored_lat, bias_lng=stored_lng)

        if not (result and result.get("place_id")):
            log.warning(f"    [miss] no result — query: {query!r}")
            stats["place_id_missed"] += 1
            stats["misses"].append({"slug": slug, "kind": kind, "reason": "no_result", "query": query})
            if kind == "stays":
                stats["review_no_match"] += 1
                write_review_yaml(slug, data, None, "no_match")
            return

        # Distance verification: reject matches farther than threshold from stored coords
        distance_m = None
        if stored_lat is not None and stored_lng is not None and result.get("lat") and result.get("lng"):
            distance_m = haversine_m(stored_lat, stored_lng, result["lat"], result["lng"])
            if distance_m > MATCH_DISTANCE_THRESHOLD_M:
                log.warning(f"    [reject] distance {distance_m:.0f}m > {MATCH_DISTANCE_THRESHOLD_M}m threshold — refusing match")
                stats["place_id_rejected"] += 1
                stats["misses"].append({
                    "slug": slug, "kind": kind, "reason": "distance_mismatch",
                    "query": query, "distance_m": round(distance_m),
                    "stored_lat": stored_lat, "stored_lng": stored_lng,
                    "matched_name": result.get("display_name"),
                    "matched_address": result.get("formatted_address"),
                })
                return

        # D7 stays-specific: address-text verification.
        # Stays have no stored lat/lng on first run, so the haversine guard
        # above never fires. This is the Matsuyama-Castle safety net — only
        # accept the match if `formatted_address` mentions city or prefecture.
        if spec.get("address_verify_text"):
            if not address_text_match(result.get("formatted_address"),
                                      data.get("prefecture"), data.get("city")):
                log.warning(
                    f"    [reject] address mismatch — addr={result.get('formatted_address')!r} "
                    f"prefecture={data.get('prefecture')!r} city={data.get('city')!r}")
                stats["place_id_rejected"] += 1
                stats["misses"].append({
                    "slug": slug, "kind": kind, "reason": "address_mismatch",
                    "query": query,
                    "city": data.get("city"), "prefecture": data.get("prefecture"),
                    "matched_address": result.get("formatted_address"),
                    "matched_name": result.get("display_name"),
                })
                if kind == "stays":
                    stats["review_address_mismatch"] += 1
                    write_review_yaml(slug, data, result, "address_mismatch")
                return

        # Accept the match
        data["place_id"] = result["place_id"]
        if not data.get("lat") and result.get("lat"):
            data["lat"] = result["lat"]
        if not data.get("lng") and result.get("lng"):
            data["lng"] = result["lng"]
        stats["place_id_resolved"] += 1
        if kind == "stays":
            stats["per_category"][cat]["hits"] += 1

        # Log to verification CSV — Steven eyeballs first ~30 before trusting batch
        stats["verifications"].append({
            "slug": slug,
            "kind": kind,
            "your_name": name_display,
            "google_name": result.get("display_name") or "",
            "google_address": result.get("formatted_address") or "",
            "distance_m": round(distance_m) if distance_m is not None else "",
            "google_url": f"https://www.google.com/maps/place/?q=place_id:{result['place_id']}",
        })

    place_id = data.get("place_id")
    if not place_id:
        return

    # --- Steps 2 + 3: hours + photo (one Place Details call, photos field optional)
    if needs_hours or needs_photo:
        details = place_details(api_key, place_id, want_photos=needs_photo,
                                want_hours=needs_hours)
        if details:
            if needs_hours:
                hours = normalize_hours(details.get("regularOpeningHours"))
                if hours:
                    data["hours"] = hours
                    data["hours_cache_date"] = date.today().isoformat()
                    stats["hours_resolved"] += 1
                else:
                    data["hours"] = None
                    data["hours_cache_date"] = date.today().isoformat()
                    log.warning(f"    [miss] hours (unparseable — likely seasonal/by-appointment)")
                    stats["hours_missed"] += 1

            if needs_photo:
                photos = details.get("photos") or []
                photo_name = photos[0].get("name") if photos else None
                if photo_name:
                    photo_bytes = fetch_photo_bytes(api_key, photo_name)
                    if photo_bytes:
                        out_dir = Path(f"public/{kind}")
                        out_path = out_dir / f"{slug}.webp"
                        if not args.dry_run:
                            out_dir.mkdir(parents=True, exist_ok=True)
                            img = Image.open(io.BytesIO(photo_bytes)).convert("RGB")
                            img.save(out_path, "WEBP", quality=PHOTO_QUALITY, method=6)
                        data[photo_field] = f"/{kind}/{slug}.webp"
                        if photo_attr_field:
                            data[photo_attr_field] = "Photo via Google"
                        stats["photo_resolved"] += 1
                    else:
                        log.warning(f"    [miss] photo bytes")
                        stats["photo_missed"] += 1
                else:
                    log.warning(f"    [miss] no photo reference returned by API")
                    stats["photo_missed"] += 1

    # Derive time_sensitive based on spec
    ts_mode = spec["time_sensitive"]
    if ts_mode == "always":
        data["time_sensitive"] = True
    elif ts_mode == "derive":
        label = (data.get("public_label") or "").strip().strip('"').strip("'")
        data["time_sensitive"] = label in TIME_SENSITIVE_LABELS
    # ts_mode == "skip" (stays) → leave the field absent.

    if args.dry_run:
        log.info(f"    [dry-run] would write {slug}")


# -------------------------------------------------------------------- CSV

def generate_mymaps_csv(records, kind, out_path):
    """Step 4: emit Name,Description,Latitude,Longitude,Cluster CSV.

    `records` is an iterable of dicts (works for both YAML loaded files and
    JSON list items).
    """
    spec = KIND_SPECS[kind]
    rows = []
    for d in records:
        slug = spec["slug_from"](d, "")
        name = spec["name_for_display"](d) or slug
        lat = d.get("lat") or d.get("latitude")
        lng = d.get("lng") or d.get("longitude")
        if not (lat and lng):
            log.warning(f"  [csv-skip] {slug} — missing lat/lng")
            continue
        place_id = d.get("place_id")
        # /eat uses map_cluster (already human-readable: 'Ramen', 'Sushi' etc.)
        # /places uses public_label slug (e.g. 'culture_history') — humanize it for the legend
        if kind == "eat":
            cluster = d.get("map_cluster") or d.get("cluster") or ""
        else:
            cluster = labelize_public_label(d.get("public_label") or d.get("cluster") or "")
        if place_id:
            url = f"https://www.google.com/maps/place/?q=place_id:{place_id}"
        else:
            from urllib.parse import quote
            url = f"https://www.google.com/maps/search/?api=1&query={quote(name + ' ' + (d.get('city') or ''))}"

        if kind == "eat":
            description = build_eat_pin_description(d, url)
        else:
            description = build_places_pin_description(d, url)

        rows.append({
            "Name": name,
            "Description": description,
            "Latitude": lat,
            "Longitude": lng,
            "Cluster": cluster,
        })
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["Name", "Description", "Latitude", "Longitude", "Cluster"])
        w.writeheader()
        w.writerows(rows)
    log.info(f"  wrote {len(rows)} rows → {out_path}")


def labelize_public_label(label):
    """Convert a /places public_label slug to human-readable text for pin descriptions."""
    if not label:
        return ""
    clean = str(label).strip().strip('"').strip("'")
    return PUBLIC_LABEL_DISPLAY.get(clean, clean.replace("_", " ").capitalize())


def build_eat_pin_description(d, url):
    """Two-line pin for /eat: cuisine·price·loc / list provenance + reservation."""
    # Line 1: structural
    parts_l1 = []
    genre = d.get("genre") or d.get("cuisine_chip")
    if genre:
        if d.get("is_shokudo") and "shokudo" not in str(genre).lower():
            genre = f"{genre} (shokudo)"
        parts_l1.append(str(genre))
    price = d.get("price_tier")
    if price:
        parts_l1.append(str(price))
    locality = ", ".join([s for s in [d.get("neighborhood"), d.get("city")] if s])
    if locality:
        parts_l1.append(locality)
    line1 = " · ".join(parts_l1)

    # Line 2: list provenance + practical
    line2_parts = []
    list_year = d.get("list_year")
    if list_year:
        line2_parts.append(f"{list_year} Tabelog Hyakumeiten")

    reservation_raw = (d.get("reservation_required") or "").strip()
    notes_lower = (d.get("notes") or "").lower()
    has_queues = "queue" in notes_lower

    res_text = ""
    if reservation_raw:
        rlow = reservation_raw.lower().strip()
        # Known values in restaurants.json: 'walk-in OK', 'recommended', 'yes'
        if rlow in ("walk-in ok", "walk in ok", "walk-in"):
            res_text = "Walk-in OK"
        elif rlow == "recommended":
            res_text = "Reservations recommended"
        elif rlow in ("yes", "required", "reservation required", "reservations required"):
            res_text = "Reservation required"
        elif rlow in ("no",):
            res_text = "Walk-in only"
        else:
            # Unknown future value — capitalize first letter, don't drop it silently
            res_text = reservation_raw[0].upper() + reservation_raw[1:]
    if res_text and has_queues:
        res_text += "; expect queues"
    elif not res_text and has_queues:
        res_text = "Expect queues"
    if res_text:
        line2_parts.append(res_text)

    line2 = ". ".join(line2_parts)
    if line2 and not line2.endswith("."):
        line2 += "."

    body = line1
    if line2:
        body += f"\n{line2}"
    return f"{body}\n\nOpen in Google Maps: {url}"


def _looks_like_street_address(s):
    """True if the string looks like a full Japanese street address (has postal code or street number)."""
    if not s:
        return False
    import re
    # Japanese postal code: 3 digits + dash + 4 digits, possibly preceded by 〒
    if re.search(r"\b\d{3}-\d{4}\b", s):
        return True
    # Leading street number like "1-13 Maihama" or "5-6-1 Shinnishihara"
    if re.match(r"^\d+(-\d+)+\s+\S", s):
        return True
    return False


def build_places_pin_description(d, url):
    """One-line pin for /places: category · location · planning_flag."""
    parts = []
    category = (str(d.get("original_category") or "")).strip().strip('"').strip("'")
    if not category:
        category = labelize_public_label(d.get("public_label"))
    if category:
        parts.append(category)

    locality = (str(d.get("address_or_area") or "")).strip().strip('"').strip("'")
    # If address_or_area is a full street address (with postal code or leading street number),
    # fall back to prefecture-level location — pins shouldn't display GPS-precise addresses.
    if _looks_like_street_address(locality):
        prefecture = (str(d.get("prefecture") or "")).strip().strip('"').strip("'")
        region = (str(d.get("region") or "")).strip().strip('"').strip("'")
        locality = prefecture or region or ""
    elif not locality:
        prefecture = (str(d.get("prefecture") or "")).strip().strip('"').strip("'")
        region = (str(d.get("region") or "")).strip().strip('"').strip("'")
        locality = ", ".join([s for s in [prefecture, region] if s])
    if locality:
        parts.append(locality)

    planning = (str(d.get("planning_flags") or "")).strip().strip('"').strip("'")
    if planning:
        # planning_flags may use ',' or ';' as separator depending on the row
        import re
        flags = [f.strip().replace("_", " ") for f in re.split(r"[,;]", planning) if f.strip()]
        if flags:
            parts.append(" · ".join(flags))

    line1 = " · ".join(parts)
    return f"{line1}\n\nOpen in Google Maps: {url}"


# -------------------------------------------------------------------- Main

def load_api_key():
    key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if key:
        return key
    env_path = Path(".env.local")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line.startswith("GOOGLE_PLACES_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def select_stratified_stays(files, n_per_cat):
    """Group stay YAML paths by primary_cat, return up to N from each.
    Sorted within each category by filename so the selection is stable
    across runs (idempotency-friendly)."""
    by_cat = {}
    for path in files:
        try:
            data = load_yaml_file(path)
            cat = data.get("primary_cat") or "uncategorized"
            by_cat.setdefault(cat, []).append(path)
        except Exception:
            continue
    selected = []
    for cat in sorted(by_cat.keys()):
        selected.extend(sorted(by_cat[cat])[:n_per_cat])
    return selected


def cost_gate_prompt(remaining_count, review_dir):
    """Print the D7 full-run plan and require explicit y/N. The supervised-mode
    gate Steven called out — prevents another cost-incident."""
    est = remaining_count * 0.07
    eta_min = max(1, round(remaining_count * SEARCH_MIN_INTERVAL_S / 60))
    print()
    print("D7 full run plan:")
    print(f"  - Entries: {remaining_count} remaining (already-enriched rows are skipped)")
    print(f"  - Estimated cost: ${est:.2f} (worst case, {remaining_count} × $0.07)")
    print(f"  - Estimated time: ~{eta_min} min (rate-limited 5 req/sec)")
    print(f"  - Live writes go to: src/content/stays/<slug>.yaml")
    print(f"  - Review queue goes to: {review_dir}/<slug>.yaml")
    print()
    try:
        resp = input("Proceed? [y/N] ").strip().lower()
    except EOFError:
        resp = ""
    return resp == "y"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--kind", choices=["places", "eat", "stays", "both"], default="both",
                   help="'both' = places + eat (legacy). Use 'stays' explicitly for D7.")
    p.add_argument("--dry-run", action="store_true",
                   help="Hit the API but don't write YAML/JSON/photos to disk")
    p.add_argument("--sample", type=int, default=0,
                   help="Limit to N rows per kind (filename-sorted prefix)")
    p.add_argument("--stratified-sample", type=int, default=0,
                   help="Stays only: pick N entries per primary_cat (preferred over "
                        "--sample for dry-runs; un-stratified pilots overstate hit rates)")
    p.add_argument("--hours", action="store_true",
                   help="Opt in to fetching opening hours (Place Details "
                        "Enterprise SKU, ~4x cost). Default is photos-only — "
                        "see COST WARNING in the module docstring.")
    p.add_argument("--hours-only", action="store_true",
                   help="Skip place_id + photo work; only refresh hours "
                        "(implies --hours)")
    p.add_argument("--refresh-stale", action="store_true",
                   help="Re-fetch hours where cache > 90 days")
    p.add_argument("--force", action="store_true",
                   help="Re-fetch everything regardless of cache state")
    p.add_argument("--force-photos", action="store_true",
                   help="Re-fetch only photos, leave place_id/hours alone")
    p.add_argument("--no-photos", dest="photos", action="store_false",
                   help="Skip photo fetching entirely (cheaper, smaller diff)")
    p.add_argument("--csv-only", action="store_true",
                   help="Only regenerate My Maps CSVs from existing data")
    p.add_argument("--no-cost-gate", action="store_true",
                   help="Stays full-run only: skip the y/N cost prompt (CI use)")
    p.add_argument("--places-dir", default=KIND_SPECS["places"]["dir_default"],
                   help="Path to /places YAML directory")
    p.add_argument("--stays-dir", default=KIND_SPECS["stays"]["dir_default"],
                   help="Path to /stays YAML directory")
    p.add_argument("--eat-file", default=KIND_SPECS["eat"]["file_default"],
                   help="Path to /eat JSON file (restaurants.json)")
    p.set_defaults(photos=True)
    args = p.parse_args()

    api_key = None
    if not args.csv_only:
        api_key = load_api_key()
        if not api_key:
            log.error("GOOGLE_PLACES_API_KEY missing in env and .env.local")
            sys.exit(1)

    kinds = ["places", "eat"] if args.kind == "both" else [args.kind]

    # Cost gate fires once before any API call on a real (non-sample) stays run.
    if (
        "stays" in kinds
        and not args.csv_only
        and not args.dry_run
        and not args.sample
        and not args.stratified_sample
        and not args.no_cost_gate
    ):
        stays_dir = Path(args.stays_dir)
        if stays_dir.exists():
            remaining = 0
            for path in sorted(stays_dir.glob("*.yaml")):
                try:
                    d = load_yaml_file(path)
                    if "place_id" not in d:
                        remaining += 1
                except Exception:
                    remaining += 1
            if remaining == 0:
                log.info("D7 cost gate: 0 entries remaining (all already have place_id) — nothing to do.")
                sys.exit(0)
            if not cost_gate_prompt(remaining, D7_REVIEW_DIR):
                log.info("D7 run aborted at cost gate.")
                sys.exit(0)

    stats = {
        "skipped": 0,
        "place_id_resolved": 0, "place_id_missed": 0, "place_id_rejected": 0,
        "hours_resolved": 0,    "hours_missed": 0,
        "photo_resolved": 0,    "photo_missed": 0,
        "review_address_mismatch": 0, "review_no_match": 0,
        "per_category": {},
        "misses": [],
        "verifications": [],
    }

    t0 = time.time()
    for kind in kinds:
        spec = KIND_SPECS[kind]
        log.info(f"=== {kind} ===")

        if spec["source_type"] == "yaml_dir":
            # One YAML file per record. Source dir is kind-specific.
            if kind == "stays":
                d = Path(args.stays_dir)
            else:
                d = Path(args.places_dir)
            if not d.exists():
                log.warning(f"directory not found: {d} — skipping {kind}")
                continue
            log.info(f"    source: {d}")

            records_for_csv = []
            if not args.csv_only:
                all_files = sorted(d.glob("*.yaml"))
                if kind == "stays" and args.stratified_sample:
                    files = select_stratified_stays(all_files, args.stratified_sample)
                    log.info(f"    stratified-sample selected {len(files)} files across "
                             f"{len(set((load_yaml_file(p).get('primary_cat') or 'uncategorized') for p in files))} categories")
                elif args.sample:
                    files = all_files[: args.sample]
                else:
                    files = all_files
                for path in files:
                    try:
                        data = load_yaml_file(path)
                        slug = spec["slug_from"](data, path.stem)
                        name_q = spec["name_for_query"](data)
                        name_d = spec["name_for_display"](data) or slug
                        process_row(data, kind, slug, name_q, name_d, api_key, args, stats)
                        if not args.dry_run:
                            save_yaml_file(path, data)
                    except Exception as e:
                        log.exception(f"  [error] {path.name}: {e}")
                        stats["misses"].append({"slug": path.stem, "kind": kind, "reason": str(e)})

                if spec.get("emit_mymaps_csv"):
                    # Reload all files for CSV (includes rows we just enriched + unchanged ones)
                    records_for_csv = [load_yaml_file(p) for p in sorted(d.glob("*.yaml"))]
            elif spec.get("emit_mymaps_csv"):
                records_for_csv = [load_yaml_file(p) for p in sorted(d.glob("*.yaml"))]

            if spec.get("emit_mymaps_csv"):
                csv_out = Path(spec["mymaps_csv_path"])
                generate_mymaps_csv(records_for_csv, kind, csv_out)

        elif spec["source_type"] == "json_file":
            # /eat: single JSON file with a list of records
            jf = Path(args.eat_file)
            if not jf.exists():
                log.warning(f"file not found: {jf} — skipping {kind}")
                continue
            log.info(f"    source: {jf}")

            with open(jf, "r", encoding="utf-8") as f:
                restaurants = json.load(f)

            if not args.csv_only:
                items = restaurants[: args.sample] if args.sample else restaurants
                for i, data in enumerate(items):
                    slug = spec["slug_from"](data, f"row-{i}")
                    name_q = spec["name_for_query"](data)
                    name_d = spec["name_for_display"](data) or slug
                    try:
                        process_row(data, kind, slug, name_q, name_d, api_key, args, stats)
                    except Exception as e:
                        log.exception(f"  [error] {slug}: {e}")
                        stats["misses"].append({"slug": slug, "kind": kind, "reason": str(e)})

                # Write the entire list back (atomic; preserves untouched records)
                if not args.dry_run:
                    with open(jf, "w", encoding="utf-8") as f:
                        json.dump(restaurants, f, indent=2, ensure_ascii=False)
                    log.info(f"  wrote {jf}")
                else:
                    log.info(f"  [dry-run] would write {jf}")

            if spec.get("emit_mymaps_csv"):
                csv_out = Path(spec["mymaps_csv_path"])
                generate_mymaps_csv(restaurants, kind, csv_out)

    elapsed = time.time() - t0
    log.info("=== Summary ===")
    for k, v in stats.items():
        if k in ("misses", "verifications"):
            continue
        log.info(f"  {k}: {v}")
    log.info(f"  elapsed: {elapsed:.1f}s")
    if stats["misses"]:
        miss_path = Path("enrichment_misses.json")
        miss_path.write_text(json.dumps(stats["misses"], indent=2))
        log.info(f"  misses logged to {miss_path} ({len(stats['misses'])} rows)")
    if stats["verifications"]:
        verify_path = Path("enrichment_verifications.csv")
        with open(verify_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=[
                "slug", "kind", "your_name", "google_name", "google_address",
                "distance_m", "google_url",
            ])
            w.writeheader()
            w.writerows(stats["verifications"])
        log.info(f"  verification CSV written to {verify_path} ({len(stats['verifications'])} matches — eyeball before trusting batch)")

    # D7 run log — only for stays kinds. Lands in docs/build/ as the audit trail.
    if "stays" in kinds:
        per_cat_rate = {
            cat: f"{v['hits']}/{v['total']}"
            for cat, v in sorted(stats["per_category"].items())
        }
        total_processed = sum(v["total"] for v in stats["per_category"].values())
        live_writes = stats["place_id_resolved"]
        review_queue = stats["review_address_mismatch"] + stats["review_no_match"]
        no_match = stats["review_no_match"]
        # Worst-case cost estimate using $0.07/entry — actual SKU mix would need
        # the Cloud billing console, this is the same ballpark the spec uses.
        actual_cost_usd = round(total_processed * 0.07, 2)
        d7_log = {
            "total": total_processed,
            "live_writes": live_writes,
            "review_queue": review_queue,
            "no_match": no_match,
            "address_mismatch": stats["review_address_mismatch"],
            "skipped_already_enriched": stats["skipped"],
            "actual_cost_usd_estimate": actual_cost_usd,
            "per_category_hit_rate": per_cat_rate,
            "elapsed_seconds": round(elapsed, 1),
        }
        log_path = Path("docs/build/d7_run_log.json")
        log_path.parent.mkdir(parents=True, exist_ok=True)
        # Merge with prior run log so the dry-run sample's stats aren't clobbered.
        if log_path.exists():
            try:
                prior = json.loads(log_path.read_text())
                d7_log = {
                    "total": d7_log["total"] + prior.get("total", 0),
                    "live_writes": d7_log["live_writes"] + prior.get("live_writes", 0),
                    "review_queue": d7_log["review_queue"] + prior.get("review_queue", 0),
                    "no_match": d7_log["no_match"] + prior.get("no_match", 0),
                    "address_mismatch": d7_log["address_mismatch"] + prior.get("address_mismatch", 0),
                    "skipped_already_enriched": d7_log["skipped_already_enriched"]
                                                + prior.get("skipped_already_enriched", 0),
                    "actual_cost_usd_estimate": round(
                        d7_log["actual_cost_usd_estimate"]
                        + prior.get("actual_cost_usd_estimate", 0.0), 2),
                    "per_category_hit_rate": _merge_per_cat(
                        prior.get("per_category_hit_rate", {}),
                        d7_log["per_category_hit_rate"]),
                    "elapsed_seconds": round(
                        d7_log["elapsed_seconds"]
                        + prior.get("elapsed_seconds", 0.0), 1),
                }
            except Exception:
                pass
        log_path.write_text(json.dumps(d7_log, indent=2, ensure_ascii=False))
        log.info(f"  d7 run log → {log_path}")


def _merge_per_cat(prior, current):
    """Merge per-category hit-rate strings 'hits/total' across runs."""
    out = {}
    keys = set(prior.keys()) | set(current.keys())
    for k in sorted(keys):
        ph, pt = _parse_ratio(prior.get(k, "0/0"))
        ch, ct = _parse_ratio(current.get(k, "0/0"))
        out[k] = f"{ph + ch}/{pt + ct}"
    return out


def _parse_ratio(s):
    try:
        h, t = s.split("/")
        return int(h), int(t)
    except Exception:
        return 0, 0


if __name__ == "__main__":
    main()
