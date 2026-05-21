#!/usr/bin/env python3
"""D5d: download image URLs from d5d_master.json, validate, convert to .webp, merge into product YAMLs.

Pipeline per product with a non-null image_url:
  1. Download (Chrome UA, per-host 1 req/sec throttle, 10s timeout)
  2. Validate magic bytes — accept JPEG/PNG/WebP; reject AVIF/HEIF, HTML error pages, tiny blobs
  3. Convert to .webp via Pillow (downscale to <=1000px long edge, preserve alpha)
  4. Save public/products/{slug}.webp
  5. Set image: /products/{slug}.webp in src/content/products/{slug}.yaml

YAMLs on main mix quoted (top block) and unquoted (appended enrichment block) styles, so we do a
TARGETED TEXT EDIT of the image field only — never a YAML round-trip, which would reformat every field.
Products that already have an image set are skipped. Failures are logged to docs/d5/d5d_failed.txt.
"""
import io
import json
import os
import re
import socket
import time
from collections import defaultdict
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from PIL import Image

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
MASTER = os.path.join(REPO, "d5d_master.json")
PUBLIC = os.path.join(REPO, "public", "products")
YDIR = os.path.join(REPO, "src", "content", "products")
FAILED = os.path.join(REPO, "docs", "d5", "d5d_failed.txt")

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
TIMEOUT = 10        # seconds
THROTTLE = 1.0      # seconds between requests to the same host
MIN_BYTES = 1024    # smaller than this is an error page / tracking pixel
MIN_DIM = 64        # px on either side — reject thumbnails/spacers
MAX_DIM = 1000      # px long edge — downscale only

NULLISH = {"", "null", "~", "none", "''", '""'}
_last_req = {}


def throttle(host):
    wait = THROTTLE - (time.time() - _last_req.get(host, 0))
    if wait > 0:
        time.sleep(wait)
    _last_req[host] = time.time()


def sniff(b):
    """Return a format label from magic bytes."""
    if b[:3] == b"\xff\xd8\xff":
        return "jpeg"
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return "webp"
    if len(b) >= 12 and b[4:8] == b"ftyp":
        return "avif" if b[8:12] in (b"avif", b"avis") else "heif"
    head = b[:512].lstrip().lower()
    if head[:1] == b"<" or b"<html" in head or b"<!doctype" in head:
        return "html"
    return "unknown"


def current_image(ytxt):
    """Return the current image value (stripped) or None if no image field."""
    m = re.search(r"^image:[ \t]*(.*)$", ytxt, re.M)
    return m.group(1).strip() if m else None


def set_image_field(slug):
    """Targeted edit: set image: /products/{slug}.webp, preserving all other bytes."""
    p = os.path.join(YDIR, slug + ".yaml")
    txt = open(p, encoding="utf-8").read()
    line = "image: /products/%s.webp" % slug
    m = re.search(r"^image:[ \t]*.*$", txt, re.M)
    if m:
        txt = txt[:m.start()] + line + txt[m.end():]
    else:
        if not txt.endswith("\n"):
            txt += "\n"
        txt += line + "\n"
    open(p, "w", encoding="utf-8").write(txt)


def download(url):
    host = urlparse(url).netloc
    throttle(host)
    req = Request(url, headers={
        "User-Agent": UA,
        "Accept": "image/avif,image/webp,image/png,image/jpeg,*/*",
        "Referer": "https://%s/" % host,
    })
    with urlopen(req, timeout=TIMEOUT) as r:
        return r.read()


def main():
    socket.setdefaulttimeout(TIMEOUT)
    data = json.load(open(MASTER, encoding="utf-8"))
    os.makedirs(PUBLIC, exist_ok=True)
    failed = []
    stats = defaultdict(int)

    for x in data:
        slug, url = x["slug"], x.get("image_url")
        if not url:
            stats["null_url"] += 1
            continue

        ypath = os.path.join(YDIR, slug + ".yaml")
        if not os.path.exists(ypath):
            failed.append((slug, url, "no YAML file"))
            stats["no_yaml"] += 1
            continue

        cur = current_image(open(ypath, encoding="utf-8").read())
        if cur is not None and cur.lower() not in NULLISH:
            stats["already_set"] += 1
            continue

        webp_path = os.path.join(PUBLIC, slug + ".webp")
        if os.path.exists(webp_path):  # prior run produced the file; just ensure the field
            set_image_field(slug)
            stats["existing_webp"] += 1
            print("KEEP %-52s (webp already on disk)" % slug)
            continue

        try:
            raw = download(url)
        except HTTPError as e:
            failed.append((slug, url, "HTTP %s" % e.code)); stats["http_err"] += 1; continue
        except (URLError, TimeoutError, socket.timeout) as e:
            failed.append((slug, url, "network: %s" % getattr(e, "reason", e))); stats["net_err"] += 1; continue
        except Exception as e:  # noqa: BLE001 - log and move on
            failed.append((slug, url, "download: %s" % e)); stats["dl_err"] += 1; continue

        if len(raw) < MIN_BYTES:
            failed.append((slug, url, "too small (%d bytes)" % len(raw))); stats["too_small"] += 1; continue

        kind = sniff(raw)
        if kind not in ("jpeg", "png", "webp"):
            failed.append((slug, url, "rejected magic bytes (%s)" % kind)); stats["bad_magic"] += 1; continue

        try:
            im = Image.open(io.BytesIO(raw))
            im.load()
        except Exception as e:  # noqa: BLE001
            failed.append((slug, url, "decode: %s" % e)); stats["decode_err"] += 1; continue

        w, h = im.size
        if w < MIN_DIM or h < MIN_DIM:
            failed.append((slug, url, "too small (%dx%d)" % (w, h))); stats["dim_small"] += 1; continue

        if max(w, h) > MAX_DIM:
            im.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")

        try:
            im.save(webp_path, "WEBP", quality=82, method=6)
        except Exception as e:  # noqa: BLE001
            failed.append((slug, url, "save: %s" % e)); stats["save_err"] += 1; continue

        set_image_field(slug)
        stats["ok"] += 1
        print("OK   %-52s %s -> %dx%d" % (slug, kind, im.size[0], im.size[1]))

    with open(FAILED, "w", encoding="utf-8") as f:
        for slug, url, reason in failed:
            f.write("%s\t%s\t%s\n" % (slug, url, reason))

    print("\n=== STATS ===")
    for k in sorted(stats):
        print("%-14s %d" % (k, stats[k]))
    print("failed_logged  %d" % len(failed))
    print("downloaded_ok  %d" % stats["ok"])


if __name__ == "__main__":
    main()
