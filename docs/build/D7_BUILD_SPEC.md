# D7 — Stay Enrichment Build Spec

**Branch:** `feat/d7-stay-enrichment` (single branch, one PR)
**Cost budget:** ~$10 (136 × ~$0.07 worst case Google Places API)
**Auto-mode:** **OFF in CC** for this entire session (paid API, supervised)
**Outcome:** 136 stay YAMLs populated with `place_id`, `lat`, `lng`, `photo_cache_path`. `/map` STAY mode shows 136 indigo pins (up from 0). `/stay` cards render with photos (up from color blocks). Empty-state message disappears.

---

## Pre-flight checks (before any paid call)

Run these in order. If any fail, stop and resolve before proceeding.

**1. Schema accepts D7 fields.**

```bash
rg "place_id|photo_cache_path" src/content/schemas.ts
```

Confirm the stays schema has `place_id`, `lat`, `lng`, `photo_cache_path` as optional fields. Phase A.9 should have shipped this. If missing, schema update is commit 0 — Astro silently strips unknown fields, and "Updated 136" with broken YAML structure is a real failure mode per `preferences.md`.

**2. API key present.**

```bash
grep GOOGLE_PLACES_API_KEY .env
```

Same key as D1. If missing or stale, fix before proceeding.

**3. Photo cache directory exists and matches StayCard expectations.**

```bash
cat src/components/v2/StayCard.astro | grep -i "photo_cache_path\|images/stays"
```

Confirm: where does StayCard read photos FROM? The script must WRITE to that exact path. If StayCard reads `/images/stays/<slug>.jpg`, script writes to `public/images/stays/<slug>.jpg`. If the directory doesn't exist, `mkdir -p public/images/stays` before run.

**4. Existing script audited for collection-agnosticism.**

```bash
rg "places/|content/places" scripts/enrich_with_places_api.py
```

If the script has hardcoded `places/` paths, refactor to take collection name + photo output dir as args. Commit this as commit 1 before running anything paid. If the script is already parameterized, no work needed.

**5. Backup before run.**

```bash
git add src/content/stays/ && git commit -m "checkpoint: stays/ before D7 enrichment" --allow-empty
```

Trivial rollback if the batch goes wrong.

---

## Commit 1: Script parameterization (if needed)

Skip this commit if pre-flight check 4 passes.

If the existing script has hardcoded `places/` paths, refactor to accept:

- `--collection <name>` — reads `src/content/<name>/*.yaml`
- `--photo-dir <path>` — writes photos to `public/images/<name>/` or whatever's passed
- `--query-template <string>` — customizable search query (see below)

Don't add features. Don't change behavior for existing /places calls. Pure refactor — parameterize the constants, leave the logic untouched.

Verify with a dry-run against `/places` (no API call) that the behavior is unchanged.

---

## Commit 2: Stays-specific config + dry-run

### Search query strategy for stays

`/places` likely uses `{name} {city} Japan` or similar. For stays, properties tend to be smaller, more specific, and benefit from Japanese-name primacy. Recommended query template:

**Primary:** `{name_jp} {city}` (Japanese name → tighter match for ryokan, kominka, design hotel properties)
**Fallback if primary returns no results:** `{name} {city} {prefecture}` (romanized)
**If both fail:** log as `needs_review: no_match`, skip entry, do NOT write partial YAML

For categories that historically fragment (temple stays with multiple temple locations, ryokan chains with multiple branches, generic-named glamping sites), the query template won't be enough. Those land in the review queue.

### Verification logic — mandatory

After each successful API hit, before writing to YAML:

1. Pull `formatted_address` from the API response.
2. Check: does it contain the stay's `prefecture` OR `city`?
3. If yes → write YAML.
4. If no → log as `needs_review: address_mismatch`, write to a separate `_review/<slug>.yaml` (not the live entry), include both the original YAML and the API response so manual review has full context.

This is the lesson from Matsuyama Castle. Don't trust the first API hit.

### Run output

The script writes to two places:

1. **Live YAMLs** for HIGH-confidence matches (no review flags).
2. **`drafts/_d7_review/<slug>.yaml`** for entries needing review (address mismatch, no match, ambiguous result).

And produces a final report `d7_run_log.json`:

```json
{
  "total": 136,
  "live_writes": 0,
  "review_queue": 0,
  "no_match": 0,
  "actual_cost_usd": 0.00,
  "per_category_hit_rate": {
    "onsen_ryokan": "X/63",
    "design_hotel": "X/22",
    ...
  }
}
```

Per-category hit rate matters because hit rate is probably uneven — design hotels are likely 95%+, temple stays and rural glamping likely lower.

### Dry-run before paid run

Before running against all 136, dry-run against a 5-stay sample stratified across categories (1 onsen ryokan, 1 design hotel, 1 machiya, 1 glamping, 1 temple stay). Stratified per the D5 pattern — un-stratified pilots overstate hit rates.

This costs ~$0.35 and validates: query construction, verification logic, photo download, file write paths, log format. If the 5-sample run shows >2 mismatches, stop. Don't run the full 136.

Per `preferences.md`: pilots that aren't stratified overstate hit rates. 5-sample is small but cheap and catches structural script bugs (wrong photo path, broken verification logic) before they burn $10.

---

## Commit 3: Full run

Only after pre-flight + dry-run sample shows clean results.

### Cost pre-approval

Before the full run, print the estimate to terminal and require explicit y/N confirmation:

```
D7 full run plan:
  - Entries: 131 remaining (5 already processed in dry-run)
  - Estimated cost: $9.17 (worst case, 131 × $0.07)
  - Estimated time: ~5 min (rate-limited 5 req/sec)
  - Live writes go to: src/content/stays/<slug>.yaml
  - Review queue goes to: drafts/_d7_review/<slug>.yaml
Proceed? [y/N]
```

This is the "supervised mode" gate Steven explicitly called out. After y, the run goes unattended.

### Idempotency

Script must skip entries that already have `place_id`. This means:

- Dry-run's 5 entries are NOT re-processed in full run (already enriched).
- If full run is interrupted (network failure, rate limit), re-running picks up from where it left off.
- Re-running with different query templates against ONLY the review queue is supported (delete `_d7_review/<slug>.yaml`, re-run with `--only-review` flag or similar).

### Rate limiting

5 req/sec throttle. Google Places allows more, but slower run is fine — 136 entries / 5 req/sec = 30 seconds of API time. The bottleneck is photo download, not search.

### Per-host headers for photo downloads

Per `preferences.md` working pattern: Chrome UA + per-host Referer + 1 req/sec for any image-fetching script. D5d cleared 100% of downloads (77/77) with this combo where UA-only had 22 failures. Use the same default for D7 photo downloads.

---

## Verification after full run

**1. Build passes.**

```bash
npm run build
```

Zod schema errors = something wrong with the YAML writes. Stop and investigate before push.

**2. Pin count in build log.**

`/map`'s build process should log STAY pin count. Should match `live_writes` from `d7_run_log.json` (i.e. 136 minus the review queue size).

**3. Spot-check 3-5 stay cards on /stay.**

Local dev server. Pick across categories. Photos rendering? Cards swapped from color blocks?

**4. Spot-check 3-5 markers on /map.**

Same. Click pins → popup shows correct stay name + correct location? Verify against the YAML's city/prefecture.

**5. Review queue size sanity check.**

If `review_queue > 20` (15% of 136), stop and investigate. Either the query template needs tuning or there's a structural issue with the stay data. Don't ship with that many followups.

Target: ≤10 entries in review queue (≤7% mismatch rate). D1 hit 99% on /places; stays will be lower due to property-name specificity but ≥93% is the bar.

---

## Manual review queue (post-run)

After the script finishes, `drafts/_d7_review/` has the entries needing human review. Process pattern:

For each `_review/<slug>.yaml`:

1. Read both the original entry and the API response.
2. If the API response is wrong place → manually correct query in original YAML (add disambiguating field like full address from stay's source_url), delete `_review/<slug>.yaml`, re-run script against this slug only.
3. If no match exists in Google's database → leave `place_id` empty, accept that this stay won't have a /map pin or photo. Add to D3 manual photo override candidates (Steven's IG/Reels stills).
4. If ambiguous (multiple plausible matches) → pick by checking the source_url, write `place_id` manually, no re-run needed.

This is exactly the Matsuyama Castle pattern from the existing PROJECT_STATE followup: edit YAML → delete place_id fields → re-run enrichment for the specific slug. Don't invent a new procedure.

---

## What's NOT in this workstream

- Backfilling /places photos that D1 missed (the 6 /615 unmatched). Out of scope — that's the existing "Matsuyama Castle re-enrichment" followup and should be a separate small PR.
- Adjusting `/map` cluster colors or marker styles. STAY uses Aizome Indigo per Phase A.9 lock.
- D3 photo overrides on top-N cards. Separate manual workstream.
- Adding the small housekeeping PR (untracked files + /map ↔ MapView dedup). Separate PR after D7.
- Cost monitoring infrastructure for future runs. The cost-kill incident was fixed via prebuild hook removal; recurring monitoring is a separate concern.

---

## CC working defaults

- **Auto-mode OFF** for the entire session. Reminded twice because this is the cost-incident lesson — the prebuild hook leak was $90.62 from a script call that nobody supervised. Don't let CC blow through 136 API calls without the cost gate.
- **First action:** read `scripts/enrich_with_places_api.py` (or wherever the script lives) end-to-end. Then read `src/components/v2/StayCard.astro` to confirm photo path expectations. Then sample 2 stay YAMLs to confirm field shapes.
- **Pre-flight first.** Don't write any code before all 5 pre-flight checks pass.
- **Dry-run sample is mandatory.** Even if pre-flight passes. The 5-sample dry-run is the bug-catcher; skipping it because pre-flight looked clean is exactly the failure mode D1's mismatches taught us about.
- **One commit per phase.** Script refactor → stays config + dry-run → full run + review queue commit. Don't squash.
- **Stop conditions:** dry-run shows >2 mismatches in 5 samples → stop. Full-run review queue >20 → stop. Build fails after run → revert via checkpoint commit, investigate.

---

## Open questions for Steven before CC kickoff

1. **Photo cache path convention.** If StayCard reads `/images/stays/<slug>.jpg` (most likely from naming convention), confirm. If the actual path is something else (`/images/stays/photo_cache/<slug>-0.jpg` matching D1's /places pattern), the script needs that.
2. **Review queue handling pace.** Process manual review during the same CC session, or open as a separate followup chat? Recommendation: log the review queue, push the live writes to main, handle review as a separate session — keeps this session's git history clean and lets you spot-check the live entries first.
3. **Per-category hit rate target.** Worth tracking? If onsen ryokan hits 95% but temple stays hits 40%, that's actionable information for D3 prioritization (focus Steven's manual photo overrides on low-hit-rate categories).

---

## End-state user experience

After merge:

- `/stay` cards render with hero photos for all live-write entries. Color blocks remain for any entries that landed in the review queue (template fall-through still works).
- `/map` STAY mode shows N indigo pins where N = live_writes from the run log. Click any pin → popup with stay name + "More about this stay →" link to `/stay#<slug>`.
- Empty-state message on `/map` STAY mode disappears (it triggered on zero-pin state).
- `drafts/_d7_review/` has the queue of entries needing manual reattachment. Each is workable in <5 min.
- `d7_run_log.json` is committed to `docs/build/` as the audit trail. Useful for future enrichment runs as the cost + hit-rate baseline.
