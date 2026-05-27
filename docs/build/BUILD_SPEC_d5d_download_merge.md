# D5d Download + Merge — CC Handoff

Context: D5d ran a Claude-prompt-driven ChatGPT web search image pass on the 208 launch products whose images came up null in D5b. Output: `d5d_master.json` at repo root. Hit rate 42% (89/208 returned URLs). This task downloads those URLs and merges into YAMLs.

## Input
- `d5d_master.json` at repo root — 208 products, schema: slug, product_name, image_url, image_source, confidence, notes

## Task
For each product in d5d_master.json with non-null image_url:
1. Download the URL (Chrome UA, per-host throttle 1 req/sec, 10s timeout)
2. Validate magic bytes — accept JPEG/PNG/WebP, REJECT AVIF and HTML error pages
3. Convert to .webp via Pillow
4. Save to public/products/{slug}.webp
5. Update src/content/products/{slug}.yaml — set image: /products/{slug}.webp

For products with null image_url or download failure: leave YAML image field as null.

## Critical constraints
- ONLY touch the image field in YAMLs. Do not modify any other field.
- Log all failures to docs/d5/d5d_failed.txt
- Don't redownload products that already have an image set

## Expected outcomes
- ~75-85 successful downloads
- Launch card image coverage rises from 172/385 (45%) toward ~250/385 (65%)

## Branch
Cut phase-d-d5d-images from main. Commit + push. Include PR description with stats.
