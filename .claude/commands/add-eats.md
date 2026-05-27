# /add-eats

Append Tabelog Hyakumeiten restaurants into the Japan Finds /eat collection
(`src/data/restaurants.json`). Accepts a Tabelog restaurant URL, a queue of
URLs, pasted research markdown, or a "name + neighborhood + city" string as
fallback. No photo input — restaurant heroes come from Google Places Photos
via the existing enrichment script.

Restaurants not on a Tabelog Hyakumeiten list are gated behind an explicit
policy override (see **Hyakumeiten gate** below). The /eat collection's
curation framing — "Steven aggregates Tabelog Hyakumeiten. Honest about it." —
depends on every entry having a Hyakumeiten lineage OR a documented exception
in the `policy_exception` field.

## Inputs to check
1. `drafts/eats/links.txt` — one Tabelog URL per line. Ignore blank lines and `#`-prefixed comments.
2. If the user pastes a single Tabelog URL in chat, process that and skip the folder scan.
3. If the user pastes research markdown (Hyakumeiten-list scrapes from blog posts, summary tables, etc.), parse it: each named restaurant + neighborhood/city is one item.
4. If the user pastes a plain "name + neighborhood + city" string (no URL), treat as a single item and resolve via Tabelog search + Places API Text Search.

No photo input. Restaurant heroes come from Google Places Photos via the existing enrichment workflow — venue photos rarely identify a specific restaurant well enough to be the hero, and Tabelog/Places already deliver high-quality dish/storefront shots.

## Required reads before processing
1. `src/content/schemas.ts` — restaurants.json is NOT a Zod-validated content collection (it's served as a data import, read by /eat at build time). The contract lives in the existing file's entry shape.
2. **Two existing entries from `src/data/restaurants.json`** — one walk-in casual (`price_tier: "¥"`, `reservation_required: "walk-in OK"`) and one splurge with reservations (`price_tier: "¥¥¥¥"` or `"¥¥¥"`, `reservation_required: "yes"`). The field set of an existing entry IS the contract.
3. `src/data/eat-chips.js` — canonical `CUISINE_CHIPS` (13 values), `CITY_CHIPS` (4 named + Elsewhere), `FLAG_CHIPS` (reservation + price dimensions). Cuisine chip values from this file MUST be used verbatim in `cuisine_chip` / `map_cluster`.
4. `docs/brand.md` — voice rules. The `notes` field uses brand voice (terse, useful, present tense).
5. `scripts/enrich_with_places_api.py` — the Python helper that batch-enriches `place_id`, `hours`, hero photo. Same role as in /add-places: NOT for single-item resolution.

## Field discipline (CRITICAL)
Write ONLY fields present in existing restaurants.json entries. Do NOT invent synonym fields (no `name` if the existing convention is `name_en`; no `hyakumeiten_year` if the existing field is `list_year`). The first 2 sample entries you read define the field set — adhere to it strictly. If the build spec's field list conflicts with what you observe in the actual file, the file shape wins.

The one new field this skill introduces is `policy_exception` (see **Hyakumeiten gate**). It is the only field that doesn't appear in existing entries — and only on entries that override the curation policy.

## Per-item loop

### If input is a TABELOG URL:
1. **Tabelog is bot-protected on individual restaurant pages.** One WebFetch attempt with 20s timeout. If it succeeds, extract `name_jp`, `name_en` (romanization shown on the page), neighborhood, address, dinner price range, reservation policy, genre. If it fails, go to step 3.
2. **Extract the Tabelog restaurant ID** from the URL path (e.g. `13123456` in `/tokyo/A1303/A130301/13123456/`). Keep as a fallback identifier for web search.
3. **Fallback path on fetch failure:** web-search by URL slug + city; cross-reference with `award.tabelog.com/hyakumeiten/<cuisine>_<city>` pages (the award subdomain is less aggressively bot-protected than individual restaurant pages); also check any byFood / Tabelog English mirror that surfaces. Cite all source URLs in `notes` if used as primary sources.
4. **Hyakumeiten verification (CRITICAL).** Run the **Hyakumeiten gate** (below) BEFORE any paid API call. A declined gate costs $0.
5. **Place_id collision pre-check.** Once name + neighborhood + city are known, resolve a candidate `place_id` via Places API Text Search (`textQuery: "<name_jp> <neighborhood> <city>"` — the Japanese name resolves more reliably than romanization). Then:
   ```
   grep -o '"place_id": "<ChIJ...>"' src/data/restaurants.json
   ```
   A hit means re-import. STOP for that item, log as "duplicate of `<existing-id>`," skip without writing. No further API calls, no spend.
6. **Resolve place_id + lat/lng/address** via Places API directly (same direct-curl pattern as /add-places — don't shell out to the Python helper for a single new entry). Use `GOOGLE_PLACES_API_KEY` from `.env.local`:
   ```
   curl -s -X POST "https://places.googleapis.com/v1/places:searchText" \
     -H "Content-Type: application/json" \
     -H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
     -H "X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents" \
     -d '{"textQuery": "<name_jp> <neighborhood> <city>"}'
   ```
   Verify the resolved Japanese name matches the Tabelog page. Chain stores with the same English name are a common failure mode — Japanese-name agreement is the safest match. A mismatch is a HARD STOP for that item.
7. Apply the **Cuisine + city chip rules** (below) to set `cuisine_chip`, `map_cluster`, `city`, `prefecture`, `region`, `neighborhood`, `is_shokudo`.
8. Apply the **Price + reservation rules** (below) to set `price_tier`, `price_range_jpy`, `reservation_required`.
9. Set confidence per the **Confidence levels** section below.
10. Hero photo: fetch from Places API directly using the `photos` field from Place Details, convert to `.webp` matching the existing Python script's conversion convention, save to `public/eat/<id>.webp`. If no photo available, leave `hero_image` unset and flag for manual override.

### If input is the URL QUEUE (`drafts/eats/links.txt`):
1. Read the file. Skip blank lines and `#`-prefixed comments.
2. Process each URL through the TABELOG URL loop above, one at a time. Don't parallelize.
3. After every 5 items, briefly self-check the last 5 `notes` strings against `docs/brand.md` voice exemplars. Flag drift if you see it.

### If input is PASTED RESEARCH MARKDOWN:
1. Parse line by line / paragraph by paragraph. Extract distinct restaurants — each named venue with a clear cuisine + neighborhood anchor is one item.
2. Pasted markdown often comes from a Hyakumeiten list directly (a blog summarising "Tabelog Hyakumeiten Ramen Tokyo 2025"), in which case `list_year` and `list_url` are derivable from the source context. Capture those before running the gate — verification then succeeds without a fetch.
3. For each parsed item, build a Tabelog search query (`<name_jp> tabelog`) to find the canonical Tabelog restaurant page if not provided in the markdown; use that URL going forward.
4. Continue from step 5 of the TABELOG URL loop (place_id pre-check → resolve → chips → flags → confidence → photo).
5. Cite the research source in the closing commit message if a single source generated multiple items in this batch.

### If input is PLAIN "NAME + NEIGHBORHOOD + CITY":
1. Search Tabelog (`<name_jp or romanization> <neighborhood> <city> site:tabelog.com`) to find the canonical restaurant page URL.
2. Continue from step 1 of the TABELOG URL loop with the resolved URL.
3. If Tabelog search returns multiple plausible candidates, STOP and ask which one. Don't guess across multiple Tokyo ramen shops with similar names.

### Common to all input types:
1. **ID generation.** The existing convention is `tabelog-<cuisine_slug>-<name_slug>-<neighborhood_slug>` (e.g. `tabelog-ramen-tantantei-hamadayama`). Lowercase, hyphens, ASCII only. Before writing the first new entry in a batch, grep existing IDs in restaurants.json to confirm this is still the dominant pattern — adapt if the convention has shifted.
2. **ID-collision check.** Check both `src/data/restaurants.json` (for live entries) and `drafts/_review/restaurants_<id>.json` (for drafts). On collision append `-2`, `-3` etc. Never overwrite. If you find yourself appending `-2` for what looks like the same restaurant, STOP — the place_id pre-check should have caught it; surface the bug instead of silently skipping.
3. **Region derivation.** For the `region` field, import `prefectureToRegion` from `src/data/regions.js` (don't hardcode — the JNTO mapping is the source of truth). Tokyo and Osaka are their own region values; other cities roll into Kansai / Kanto / Kyushu / etc.
4. **`is_shokudo` derivation.** `true` only when `cuisine_chip == "Shokudo"`. Otherwise `false`. The chip is the determinant, not the free-form genre description.
5. **`rank_in_city`.** Populated from the Hyakumeiten source page (`award.tabelog.com/hyakumeiten/<cuisine>_<city>` lists 100 restaurants in display order). Omit the field if the source doesn't expose a rank or if the entry is a policy override.
6. **Hours and time_sensitive.** The Python helper writes these when invoked with hours enabled (expensive API tier — see the helper's COST WARNING). Leave blank on the initial write unless the user explicitly wants them.
7. **`notes` field in brand voice.** Present tense, useful first. Banned words from `docs/brand.md` are blockers. The standard `"<year> list; expect queues"` pattern is fine for popular Hyakumeiten entries; rewrite if it doesn't fit (lottery-only seating, multi-month reservation lead time, etc.).
8. **Skip runtime schema validation.** restaurants.json has no Zod schema. Trust the field-discipline rule, write the entry, let the /eat build pick up the new row at build time. If a build fails, revisit.
9. **Confidence routing.** HIGH → append to `src/data/restaurants.json`. MED or LOW → write to `drafts/_review/restaurants_<id>.json` (single-entry file) with a `_notes` field stating why.
10. **Append, don't reorder.** New entries go at the END of the restaurants.json array. Don't try to maintain alphabetical or by-cuisine grouping — the /eat render layer sorts on read, and reordering 280+ entries to insert one item is a large diff for no payoff.
11. **Auto-commit (HIGH only).** Immediately after a new entry lands in restaurants.json, `git add` the JSON file (and `.webp` hero if fetched), commit, AND push to main without asking. Commit message format: `Add [restaurant name] (<id>)`. One commit per restaurant so they can be reverted individually.

## Hyakumeiten gate

Tabelog Hyakumeiten (百名店) is Tabelog's annual top-100 list per cuisine per city. The /eat collection is curated to this list. Non-Hyakumeiten entries require an explicit policy override captured in the `policy_exception` field.

### Verification steps (in order):
1. **On the Tabelog restaurant page itself** — look for the award badge HTML / image / link to award.tabelog.com. Successful Hyakumeiten entries link to their list page.
2. **Cross-check the cuisine's award page** — `award.tabelog.com/hyakumeiten/<cuisine>_<city>` lists the 100 restaurants for that year. The award subdomain is less aggressively bot-protected than restaurant pages. Confirm the input restaurant appears on the list AND extract `list_year`, `list_url`, `rank_in_city` from the page.
3. **Web-search fallback** — `<name_jp> 百名店` or `<name_en> hyakumeiten` + year. Confirm at least one Japanese-language source (byFood, Tabelog news, restaurant's own page, reputable food blog) attests to the designation.

### If verified (Hyakumeiten confirmed):
- Set `list_year` = the verified year (most recent if multi-year listed).
- Set `list_url` = the `award.tabelog.com/hyakumeiten/<cuisine>_<city>` URL.
- Set `rank_in_city` = the rank if the source page exposes one; otherwise omit the field.
- Set `notes` to the standard pattern: `"<year> list; expect queues"` — adapt for unusual reservation friction (lottery-only, multi-month leadtime).
- Do NOT set `policy_exception` — the absence of that field is the implicit signal that the entry is policy-clean.
- Proceed to chips + flags + write.

### If NOT verified:
Prompt the user with this exact gate (one prompt per item, never bypass):

```
[Restaurant Name] — no Hyakumeiten designation found in:
  - Tabelog page (no award badge)
  - award.tabelog.com cuisine page (not on <cuisine>_<city> list)
  - web search (no 百名店 / hyakumeiten hit)

The /eat collection is curated to Tabelog Hyakumeiten lists:
  "Steven aggregates Tabelog Hyakumeiten. Honest about it."

Add as a policy exception? [y/N]
```

Adapt the bullet list to reflect what was actually checked. If the Tabelog page returned a bot block, write `"Tabelog page (bot-blocked, not verifiable)"` instead of `"no award badge"`. Honesty about what failed lets the user judge whether the override is informed.

### On policy-exception override (`y`):
Follow up immediately with this prompt:

```
Reason for override (will be stored in policy_exception field):
```

Capture the user's response verbatim — single line, no editorialising. Then:
- Set `list_year` = `null`.
- Set `list_url` = `null`.
- Omit `rank_in_city` (no rank exists for non-Hyakumeiten).
- Set `policy_exception` = `"<the user's reason verbatim>"`. String, not boolean — the rationale matters as much as the flag.
- Set `notes` to a brief contextual line that reads well on the /eat card (e.g. `"Personal recommendation; not on Hyakumeiten list"`). The `policy_exception` field is the structured override marker; `notes` is the human-readable card copy.
- Proceed to chips + flags + write.

The `policy_exception` field is the structured signal that this entry lives outside the curation policy. A future audit script can list all live entries with a non-null `policy_exception` and surface them for review.

### On decline (`N` or empty):
- Skip the entry.
- Log it in the end-of-batch report under "Hyakumeiten gate declines" with the restaurant name + source URL.

## Cuisine + city chip rules

`cuisine_chip` must be one of the 13 values from `CUISINE_CHIPS` in `src/data/eat-chips.js` (verbatim — case-sensitive, including the ampersand in `"Sukiyaki & Shabu-shabu"`). The same value goes into `map_cluster` (the two currently always match — `map_cluster` exists to allow the map view to group differently in the future).

| Tabelog `genre` (free-form) | `cuisine_chip` (canonical) |
|---|---|
| Sushi, Edomae sushi | `Sushi` |
| Tempura | `Tempura` |
| Unagi, Eel | `Unagi` |
| Sukiyaki, Shabu-shabu, Beef hot pot | `Sukiyaki & Shabu-shabu` |
| Yakiniku, Korean BBQ, Wagyu grill | `Yakiniku` |
| Yakitori, Chicken skewers | `Yakitori` |
| Tonkatsu, Pork cutlet | `Tonkatsu` |
| Ramen, Tsukemen, Shoyu/Shio/Miso/Tonkotsu ramen | `Ramen` |
| Soba | `Soba` |
| Udon | `Udon` |
| Izakaya, Sake bar, Japanese pub | `Izakaya` |
| Okonomiyaki, Monjayaki | `Okonomiyaki` |
| Shokudo, Teishoku, Lunch counter | `Shokudo` |

If the genre doesn't fit any of the 13 chips (a Hyakumeiten-listed sweet shop, a French restaurant in Tokyo, a kaiseki specialist), STOP. The collection's chip set is fixed by `eat-chips.js`. Either the chip set needs expanding (separate spec) or the restaurant doesn't belong in /eat. Log it under "Cuisine chip miss" in the report and let the user decide.

`city` must match an entry from `CITY_CHIPS` exactly — `Tokyo`, `Osaka`, `Kyoto`, `Fukuoka` — for named-bucket placement on /eat. Any other city is fine; it rolls into "Elsewhere" via `restaurantCity()` in eat-chips.js.

`prefecture` comes from the Places API `addressComponents` response (the `administrative_area_level_1` component). Don't infer from city name — for cities like Yokohama the prefecture is Kanagawa, not Tokyo.

`neighborhood` is the ward / district name (Hamadayama, Roppongi, Pontocho). Get it from the Tabelog page (which usually leads with the district) or Places API `formattedAddress`. Avoid station names unless the station IS the colloquial neighborhood reference (e.g. Ekoda).

## Price + reservation rules

`price_tier` is one of `¥`, `¥¥`, `¥¥¥`, `¥¥¥¥`. Derive from `price_range_jpy` (Tabelog's dinner range):

| `price_range_jpy` (dinner) | `price_tier` |
|---|---|
| Under ¥3,000 | `¥` |
| ¥3,000-7,000 | `¥¥` |
| ¥7,000-15,000 | `¥¥¥` |
| ¥15,000+ | `¥¥¥¥` |

Use Tabelog's dinner range when available — lunch is usually ¥-equivalent regardless of the restaurant's actual tier. For ranges that span boundaries (e.g. `"¥5,000-10,000"`), pick the tier matching the LOWER bound; Tabelog's lower bound is the more accurate reflection of a typical visit cost.

`reservation_required` is one of three exact strings: `"walk-in OK"`, `"recommended"`, `"yes"`.

| Tabelog signal | `reservation_required` |
|---|---|
| "Reservations: Required" / 予約必須 / 完全予約制 | `yes` |
| "Reservations: Recommended" / 予約をお勧めします / phone-only booking | `recommended` |
| "Reservations: Not accepted" / walk-in counter / family shokudo | `walk-in OK` |

Default to `walk-in OK` ONLY when the Tabelog page explicitly indicates so. When the page is ambiguous and the restaurant is high-tier (`¥¥¥`+), default to `recommended` — the FLAG_CHIPS planning filter treats `recommended` as un-filterable (neither walk-in nor reservation-only), which is the correct UX for ambiguous cases.

## Routing rule

Apply during processing, before any write:

- → `/eat` if: primary draw is the food itself AND (Hyakumeiten-verified OR explicit policy override accepted). Café-quality coffee at a destination spot is NOT /eat — that's `/places` under `cafes`.
- → `/places` HANDOFF if: the venue's primary draw is experience / atmosphere / view / setting, with food as supporting element. Includes most "scenic café" or "themed-restaurant" inputs.
- Ambiguous → STOP and ask. Don't guess.

When an item routes to /places, do NOT attempt to write to `src/content/places/`. That collection has its own schema-specific fields (`primary_category`, `public_label`, `planning_flags`, etc.) that this skill can't invent. Log the item, surface it in the end-of-batch report under "/places handoffs," and let the user run it through `/add-places`.

## Confidence levels

- HIGH: Hyakumeiten designation verified (or policy override explicitly accepted with reason); Tabelog page or award page resolved cleanly; place_id resolution matched the right restaurant; cuisine chip is unambiguous. Write to `src/data/restaurants.json`.
- MED: chip cascade has 2 plausible cuisines (a yakitori-izakaya that could land either way); OR Tabelog page wasn't fetchable and web-search yielded a plausible-but-uncertain match; OR price tier is borderline. Write to `drafts/_review/restaurants_<id>.json` with `_notes`.
- LOW: cuisine chip is unclear (3+ plausible); OR multiple Tabelog candidates returned and the right one isn't obvious; OR Hyakumeiten verification was inconclusive AND the gate prompt couldn't be cleanly run. Write to `drafts/_review/`.

Identification (correct restaurant resolved AND Hyakumeiten status known) is the gating factor for HIGH. Don't write HIGH when either is uncertain.

## End-of-batch CSV refresh + My Maps sync reminder

Same pattern as `/add-places` (the Restaurants Map is downstream of `restaurants_mymaps_v5.csv`). If HIGH count > 0 this batch:

1. Run `python3 scripts/enrich_with_places_api.py --csv-only` to regenerate the CSVs (~1s, free, no API spend).
2. Touch / append to `drafts/_review/SYNC_MY_MAPS_PENDING.md` per the same workflow as /add-places — append a new dated entry under "Batches pending," update the cumulative count. The Restaurants Map section is in the same template; add an `/eat`-flavoured entry there.
3. Bundle the CSV regen + pending-file update into a single closing commit AFTER all per-item commits have landed:
   ```
   git add restaurants_mymaps_v5.csv places_mymaps_v2.csv drafts/_review/SYNC_MY_MAPS_PENDING.md
   git commit -m "csv: refresh My Maps data after /eat batch (+<N> restaurants)"
   git push origin main
   ```

Where `<N>` is the count of HIGH items appended to restaurants.json THIS BATCH. Push direct to main, same as the per-item commits.

If HIGH count is 0, skip the CSV refresh AND the pending-file update entirely.

## End-of-batch report
- Total items found (split by input source: chat URL / queue file / pasted markdown / plain text) / processed / skipped.
- HIGH confidence count (appended live to /eat).
- MED/LOW count (in `drafts/_review/`).
- **Hyakumeiten gate stats:** count verified-and-accepted, override-accepted (list each with its `policy_exception` reason verbatim), declined (with restaurant name + source URL).
- `/places` handoffs (routed elsewhere, list with reason).
- Cuisine chip misses (genres that didn't fit the 13 chips — these are signals the chip set may need expanding).
- Skipped items with reason (Tabelog unreachable + web search inconclusive, place_id resolution failed, multiple plausible Tabelog candidates, slug collision after 3 attempts, etc.).
- Hero photos: fetched successfully / missing (flagged for manual override).
- Web-search citations for the descriptions and the Hyakumeiten verifications — for spot-checking.
- **Manual My Maps re-import needed:** `YES (see drafts/_review/SYNC_MY_MAPS_PENDING.md)` if HIGH items were added. Otherwise `NO (no HIGH items added)`.

## Rules
- One item at a time. Don't parallelize — voice consistency matters more than speed.
- After every 5 items, briefly self-check the last 5 `notes` strings against `docs/brand.md` voice exemplars. Flag drift if you see it.
- Never overwrite existing entries. ID collision-check both `src/data/restaurants.json` and `drafts/_review/`.
- If `eat-chips.js` is missing or doesn't carry the 13 cuisine values, STOP — don't guess at chip names.
- If Tabelog and Places API both fail to verify a restaurant's identity, STOP and ask.
- The Hyakumeiten gate must run BEFORE any paid Places API call. A declined gate costs $0.
- If a cuisine doesn't fit the 13 chips, STOP and surface as a chip-set-expansion question — don't pick the nearest chip and write.
- If routing is ambiguous (could be /eat or /places), STOP and ask.

## Failure handling
- Tabelog restaurant page fetch fails (503 / bot block) → fall back to `award.tabelog.com` + web search. Cite all sources used in `notes`.
- `award.tabelog.com` fetch fails too → web-search Hyakumeiten verification, run the gate with `"award.tabelog.com (bot-blocked, not verifiable)"` in the bullet list.
- Place_id pre-check finds an existing entry with the same `place_id` → log "duplicate of `<existing-id>`," skip, no further API calls, no spend.
- Place_id resolves to the wrong restaurant (chain-name confusion, common name in multiple cities) → log + skip. Don't write to the wrong restaurant.
- Photo fetch fails (API photo missing, rate limit, network) → write the entry without `hero_image`, flag for manual override. Don't block the entry write on photo failure.
- ID collision after 3 attempts (`<id>`, `<id>-2`, `<id>-3` all taken by *different* place_ids) → skip, log reason. If the collisions share a `place_id`, the pre-check is broken — surface the bug instead of silently skipping.
- `GOOGLE_PLACES_API_KEY` missing from `.env.local` → STOP. Don't proceed with degraded mode.

## Cost awareness

Same envelope as /add-places: the Python helper has cost-tier handling, and the direct-curl inline pattern uses the cheap path (Place Details Essentials + Place Photos). Don't request hours by default — the weekly cron handles refresh, and the hours API tier is materially more expensive.

The Hyakumeiten gate runs BEFORE any paid call. A declined gate costs $0. A duplicate caught by the place_id pre-check costs $0 (the Text Search needed to resolve the candidate place_id has already been issued — but no Place Details or Photo call follows).

Approximate cost per HIGH entry: ~$0.07 (one Text Search + one Place Details + one Photo). Per /add-places: this is small enough that the per-invocation cost confirmation prompt is over-engineering — the collision pre-check and gate together already prevent the real waste-modes (re-imports, off-policy entries).

## Known issues
- `restaurants.json` has no Zod schema — its contract is the file shape itself. If the file structure shifts (someone reorganizes the entry shape), this skill will silently write the old shape. Periodically re-read the latest 2 entries before a batch.
- The `policy_exception` field is new with this skill. If no existing entries carry it yet, that's expected — don't drop it for that reason, and don't treat its absence as a schema violation.
- `region` derivation depends on `src/data/regions.js`'s `prefectureToRegion` export. If that file is restructured, region writes will need updating.
- The `map_cluster` field currently always equals `cuisine_chip`. If a future change diverges them (e.g. grouping Sukiyaki and Shabu-shabu separately on the map), this skill's chip-rule table will need updating.
