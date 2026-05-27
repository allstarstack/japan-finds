# Cost Kill Spec — Google Places API spend
Date: 2026-05-24
Status: locked

## Goal
Reduce future enrichment runs of `scripts/enrich_with_places_api.py` from ~$20/run to ~$5/run by making hours opt-in. Remove "open now" rendering since cached hours data goes stale and "live status" implies freshness we don't have. Photos stay (already self-hosted).

## Context
- May 20–22: 3 manual runs against ~333 places → $78.34.
- Driver: `regularOpeningHours` field at line 193 of the script forces Place Details into Enterprise tier ($20/1K vs $5/1K Essentials).
- No cron exists. Future cost = future manual runs only.
- Photos are already cached locally at `/places/<slug>.webp`. No render-time API calls.

## Locked decisions
1. Drop "open now" / "currently open" UI from `/places` cards.
2. Add a "Check current hours on Google Maps →" link-out using existing `place_id`.
   URL format: https://www.google.com/maps/place/?q=place_id:PLACE_ID
3. Leave existing `hours:` data in 333 YAML files untouched.
4. Make enrichment script default to photos-only. Hours behind `--hours` flag.
5. No Zod schema change.

## Files to modify

### scripts/enrich_with_places_api.py
- Add CLI flag `--hours` (default False) to argparse setup.
- Modify `place_details(api_key, place_id, *, want_photos=True, want_hours=False)`:
  - Field mask is built dynamically based on flags.
  - If `want_hours=False`, do NOT include `regularOpeningHours` in field mask.
  - Default field mask = `["photos"]` only when `want_photos=True`. Skip the call entirely if neither flag is set.
- Update the orchestrator (around line 440–460) to pass `want_hours=args.hours` through.
- Add a cost-warning block at the top of the docstring with this exact text:

      COST WARNING (2026-05-24):
      - Default mode: photos-only. Place Details Essentials ($5/1K) + Place Photos ($7/1K).
        Approx $4/run for 333 places.
      - With --hours: Place Details Enterprise ($20/1K). Approx $20/run for 333 places.
        Use sparingly. Hours rarely change.

### Astro card component
Locate the card component via this grep command:

    grep -rln "isOpenNow\|open now\|currently open\|hours\.monday" src/

- Remove the live-status pill or badge that shows whether a place is currently open.
- Add a link-out element with class `hours-link`, href pointing to Google Maps using the place_id, target `_blank`, rel `noopener`, link text "Check current hours on Google Maps →".
- URL format for the href: https://www.google.com/maps/place/?q=place_id:PLACE_ID where PLACE_ID is the existing `place_id` field from the YAML.
- Style consistent with existing card link styles. No new tokens needed.

### docs/PROJECT_STATE.md
Add a one-line note under "Active project decisions":
- "Enrichment script (`enrich_with_places_api.py`) defaults to photos-only as of 2026-05-24. Re-run with `--hours` only when hours actually need refresh — costs ~4x more."

## Out of scope
- Existing 333 YAML hours data — leave intact.
- Photo storage — already working.
- Google My Maps embeds — free, not part of this.
- Zod schema — no changes.
- Deleting the API key — that's Steven's post-deploy step.

## Acceptance
- [ ] `python scripts/enrich_with_places_api.py --help` shows new `--hours` flag.
- [ ] Default run (no `--hours`) does NOT include `regularOpeningHours` in any field mask. Confirm by adding a print/log of the assembled field mask before the request fires, or by running against a single test place and checking the request payload.
- [ ] Run with `--hours` DOES include it.
- [ ] `/places` cards no longer show live open/closed status.
- [ ] Link-out to Google Maps works for 3 sample places (african-safari, akita-citizen-s-market, akiyoshidai-area-base).
- [ ] `npm run build` succeeds with zero errors.
- [ ] No console errors on `/places` in preview deploy.

## Verification checklist for Steven post-merge
- GCP billing alert: Budgets & alerts → $5/month threshold, email at 50/90/100%.
- Confirm SKU breakdown in GCP billing (group by SKU) — should match the model above. If not, flag.
