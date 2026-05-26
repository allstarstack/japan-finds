# /add-places

Batch-enrich places into the Japan Finds /places content collection.
Accepts Google Maps URLs, a queue of URLs, pasted research markdown, or
"name + area + city" as fallback.

Restaurants and food destinations route to `/eat` instead — see
**Routing rule** below.

## Inputs to check
1. `drafts/places/links.txt` — one Google Maps URL per line. Ignore blank lines and lines starting with `#`.
2. If the user pastes a single Google Maps URL in chat, process that and skip the folder scan.
3. If the user pastes a block of research markdown (natural-language paragraphs from Gemini DR / Meta AI / similar), parse it: each named place + neighborhood/area is one item.
4. If the user pastes a plain "name + area + city" string (no URL), treat it as a single item and resolve via Places API Text Search.

No photo input. Place photos come from Google Places Photos via the existing enrichment script.

## Required reads before processing
1. `src/content/schemas.ts` — get the live Zod schema for the `places` collection (`placeSchema`). Output must validate. If you can't find it, stop and ask.
2. Two example YAMLs from `src/content/places/` — one minimal (editorial-only, no Places-API fields) and one fully enriched (has `place_id`, `lat`, `lng`, `hours`, `hero_image`).
3. `docs/brand.md` — voice rules, banned words, palette / chip taxonomy. Place card descriptions use brand voice the same way product card descriptions do.
4. `src/data/place-chips.js` — canonical `PRIMARY_CHIPS` (public_label values + display labels + card colour) and `SECONDARY_CHIPS` (planning_flags + badge-flag values). The chip cascade below must reference these exact `value` strings, not labels.
5. `scripts/enrich_with_places_api.py` — the Python helper that resolves `place_id` (Text Search), fetches `hours` (Place Details), and downloads/converts the hero photo (Place Photos → `.webp`). Read its `--help` / docstring once before invoking.

## Field discipline (CRITICAL)
Write ONLY fields defined in the live `placeSchema`. Do NOT add synonym duplicates. Places do NOT have an `id` field — the filename slug IS the identifier. The schema is the contract. If unsure whether a field belongs, omit it.

## Per-item loop

### If input is a GOOGLE MAPS URL:
1. Extract `place_id` from the URL if directly embedded (`?q=place_id:ChIJ...` or `/place/...!1s0x...:0x...!`). If only a short share URL or name-search URL, capture the resolvable name + area instead and let Text Search fetch the `place_id` in step 3.
2. Shell out to the Python helper for resolution + enrichment in dry-run first to verify the match:
   ```
   python3 scripts/enrich_with_places_api.py --resolve "<name or place_id>" --dry-run
   ```
   (If the script doesn't expose this exact flag, fall back to invoking it on a single-item temp YAML in `--sample 1 --dry-run` mode, OR call the Places API directly using `GOOGLE_PLACES_API_KEY` from `.env.local`.)
3. Verify the resolved place name matches the URL's place. A mismatch (wrong store of the same chain, wrong city for a common name) is a HARD STOP — don't write the YAML, log the mismatch, move on.
4. Extract from the API response: official Japanese name + romanized name, address (trim postal codes + prefecture noise per the existing Python script's address cleanup convention), lat, lng.
5. Apply the **Type chip cascade** (below) to set `public_label`, then derive `primary_category` from it.
6. Apply the **Planning flags rules** (below) to set `planning_flags`.
7. Apply the **Badge field rules** (below) to set `local_favorite` and `viral` (and `viral_signal` when viral=true).
8. Run the **Routing rule** (below). If it routes to /eat, STOP — don't write to /places.
9. Set confidence per the **Confidence levels** section.
10. Hero photo: invoke the Python helper's photo-fetch path for this single place's `place_id` so the .webp lands at `public/places/<slug>.webp`. If no photo available, leave `hero_image` unset and flag for manual override (D3 workstream).

### If input is the URL QUEUE (`drafts/places/links.txt`):
1. Read the file. Skip blank lines and `#`-prefixed comment lines.
2. Process each URL through the LINK loop above, one at a time. Don't parallelize.
3. After every 5 items, briefly self-check the last 5 descriptions against `docs/brand.md` voice exemplars. Flag drift if you see it.

### If input is PASTED RESEARCH MARKDOWN:
1. Parse line by line / paragraph by paragraph. Extract distinct places: each named venue with a clear locational anchor (neighborhood / station / city) is one item.
2. For each parsed item, build a Text Search query: `"<name> <neighborhood> <city>"`. Resolve via the Python helper (or direct Places API call) to get `place_id` + lat/lng/address.
3. Use the research markdown text as the source for description hooks and the WHY — the natural-language framing of the place often beats the dry Places API metadata. Strip marketing words; rewrite in brand voice (see `docs/brand.md`).
4. Continue from step 4 of the LINK loop (verify match → cascade → flags → routing → confidence → photo).
5. Cite the research source in commit message if a single source generated multiple items in this batch.

### If input is PLAIN "NAME + AREA + CITY":
1. Treat as a single Text Search query. Resolve via Places API.
2. Continue from step 3 of the LINK loop (verify match → extract → cascade → ...).
3. If Text Search returns multiple candidates with similar names, STOP and ask which one. Don't guess across multiple Tokyo cafés with the same English name.

### Common to all input types:
1. **Slug generation:** NFKD-romanize the name, lowercase, hyphens between words, ASCII only, max 60 chars. Drop the Japanese parenthetical (the schema's render layer splits that out at runtime; the slug is romanized-name-only). Example: `teamLab Planets Toyosu (チームラボプラネッツ TOKYO)` → `teamlab-planets-toyosu`.
2. **Collision check:** `src/content/places/<slug>.yaml` and `drafts/_review/<slug>.yaml`. On collision append `-2`, `-3` etc. Never overwrite.
3. **Region derivation:** the schema requires `region` and `prefecture`. Get prefecture from the API response; derive region by importing `prefectureToRegion` from `src/data/regions.js` (don't hardcode — the JNTO mapping is the source of truth).
4. **Address cleanup:** trim postal codes and full prefecture-prefixed addresses to `<neighborhood>, <city>` form for `address_or_area`. Match the existing convention in `src/content/places/`.
5. **Hours and time_sensitive:** the Python helper writes these when invoked with hours enabled. Leave them blank on the initial write unless the user explicitly wants them (hours hit a more expensive API tier — see the helper's COST WARNING).
6. **Write copy in brand voice:** present tense, witty/dry, useful first. Banned words from `docs/brand.md` are blockers — rewrite if you hit one. Place descriptions go in the eventual write-out only if `placeSchema` carries a description field for places — at present it does not. Most editorial signal lives in the chip + planning_flags + booleans rather than free text on `/places` (this is intentional; place cards are text-light per BUILD_SPEC Step 5).
7. **Skip runtime schema validation.** Trust the field-discipline rule, write the YAML, and let Astro validate against `placeSchema` at build time. If a build fails due to bad YAML, we'll revisit.
8. **Confidence routing:** HIGH → write to `src/content/places/<slug>.yaml`. MED or LOW → write to `drafts/_review/<slug>.yaml` with a `_notes` field stating why (the cascade had plausible alternatives, the Text Search match was uncertain, etc.).
9. **Auto-commit (HIGH only):** immediately after an item lands in `src/content/places/`, `git add` its YAML (and `.webp` if fetched), commit, AND push to main without asking. Commit message format: `Add [place name]`. In batch runs, commit each item separately so they can be reverted individually. MED/LOW items in `drafts/_review/` are NOT auto-committed — those stay local for user review.

## Type chip cascade

First match wins. Set `public_label` per this priority order, then derive `primary_category`:

| Priority | Test | `public_label` |
|---|---|---|
| a | Specific Japanese cultural form — onsen, ryokan stay, shrine/temple/castle/garden, historic streetscape | `onsen_ryokan` (overnight) / `culture_history` |
| a | Anime / character / IP-driven destination — Pokémon Center, Ghibli Museum, anime cafés, manga shrines | `anime` |
| b | Specific physical setting — beach/lake/river/waterfall/cape/mountain trail/cave | `nature_water` |
| b | Open green space — urban park, botanical garden, themed park grounds | `parks` |
| b | Market/yokocho/depachika/morning market — the place IS the food experience | `food_markets` |
| c | Theme park, amusement park, ropeway-as-attraction | `theme_parks` |
| c | Unusual / niche museum (not a big national institution) | `quirky_museums` |
| c | Workshop / class / hands-on craft experience | `workshops_crafts` |
| c | Scenic train / sightseeing boat / ferry / observation transport — the journey IS the destination | `scenic_transport` |
| d | Primary draw is the place as something to photograph (viewpoint, bridge, neon street) | `photo_spots` |
| e | Primary draw is the café / coffee experience itself | `cafes` |
| f | Primary draw is being around animals (aquarium, zoo, animal café, rabbit island) | `animals` |

**`primary_category` derivation from `public_label`:**

| `public_label` | `primary_category` |
|---|---|
| `onsen_ryokan` if overnight ryokan | `Stay` |
| `onsen_ryokan` if day onsen | `See` |
| `culture_history`, `nature_water`, `photo_spots`, `quirky_museums`, `animals`, `anime` (museum/center types) | `See` |
| `theme_parks`, `parks`, `workshops_crafts`, `anime` (theme park types) | `Do` |
| `food_markets`, `cafes` | `Eat` |
| `scenic_transport` | `See` (sightseeing experience, not overnight accommodation — the blue chip color is aesthetic grouping, not categorical) |

## Planning flags

`planning_flags` is a semicolon-separated string. Apply each of these independently — a place can carry multiple:

- `rainy_day` — primary indoor venue OR substantially sheltered (covered yokocho, depachika basement, indoor museum/aquarium/onsen, fully-roofed market).
- `with_kids` — appropriate for under-12 AND engaging at that age. Not "tolerates kids" — "kids actually have a good time here." Aquariums, zoos, hands-on museums, theme parks, parks with playgrounds qualify. Most temples, gardens, and craft workshops do not.
- `day_trips` — reachable as a day trip from at least one of Tokyo / Osaka / Kyoto without an overnight. Sets the chip that filters tourist itineraries.

## Badge fields (local_favorite, viral)

Default `false`. Set `true` only when the bar below is cleared. The cost of a false positive is brand-damaging — be conservative.

- `local_favorite: true` — clear signal of Japanese-side endorsement. Any of:
  - Tabelog rating ≥ 3.5 with majority-Japanese reviews
  - Strong presence in Japanese-language guidebooks / blogs / culture press
  - Google Maps reviews majority Japanese-language
  - Featured in respected Japanese culinary or travel guides
  
  If signal is mixed (tourists rave, locals quiet) → leave false.

- `viral: true` — documented 50K+ engagement on at least one social post about this specific place. Populate `viral_signal` when true:
  ```yaml
  viral: true
  viral_signal:
    source: "TikTok"   # or "Instagram", "X", "YouTube"
    engagement: "1.2M views"   # raw metric, free-form string
    date: "2026-03-15"   # ISO date of the post
  ```
  If multiple posts qualify, pick the highest-engagement one. If only generic tourist-circuit buzz without a specific viral post (no 50K+ post), leave false.

A place can be both `local_favorite: true` AND `viral: true` — these are orthogonal validation dimensions.

## Routing rule

Apply during processing, before any write:

- → `/places` if: primary draw is destination / attraction / cultural experience / atmospheric café (places where the food is incidental and the experience is the location).
- → `/eat` if: primary draw is food or drink quality AND Tabelog rating ≥ 3.5 (Japanese-side review weight) OR explicit mention in a Japanese culinary guide (Hyakumeiten, Michelin Japan, etc.).
- Ambiguous → STOP and ask the user which collection.

When an item routes to `/eat`, do NOT attempt to write to `src/data/restaurants.json`. That file has Tabelog-Hyakumeiten-specific fields (`list_url`, `list_year`, `rank_in_city`, `is_shokudo`, etc.) that this skill can't invent. Log the item, surface it in the end-of-batch report under "/eat handoffs," and let the user route it through the /eat workflow.

## Confidence levels

- HIGH: chip cascade match is unambiguous; Places API resolution matched the right place; primary_category derivation is clean. Write to `src/content/places/`.
- MED: cascade has 2 plausible chips (e.g., `food_markets` vs `cafes` for a market with strong café energy); OR the Text Search match is plausible but uncertain. Write to `drafts/_review/` with `_notes` listing the alternatives.
- LOW: cascade has 3+ plausible chips; OR Text Search returned multiple candidates and the right one isn't obvious; OR research markdown was ambiguous about which physical venue. Write to `drafts/_review/` with `_notes`.

Identification (correct place resolved) is the gating factor for HIGH, the same way it is in `/add-products`. A clean cascade match on the wrong place isn't HIGH.

## End-of-batch report
- Total items found (split by input source: chat URL / queue file / pasted markdown / plain text) / processed / skipped.
- HIGH confidence count (committed live to `/places`).
- MED/LOW count (in `drafts/_review/`).
- `/eat` handoffs (routed elsewhere — list with reason).
- Skipped items with reason (place_id resolution failed, Text Search returned no good match, slug collision after 3 attempts, etc.).
- Hero photos: fetched successfully / missing (flagged for D3 manual override).
- Local-favorite / viral booleans set in this batch (with the signal that triggered each).
- Web-search citations for the descriptions and the local_favorite / viral signals — for spot-checking.

## Rules
- One item at a time. Don't parallelize — voice consistency matters more than speed.
- After every 5 items, briefly self-check the last 5 against voice exemplars in `docs/brand.md`. Flag drift if you see it.
- Never overwrite existing files. Always collision-check both `src/content/places/` and `drafts/_review/`.
- If `placeSchema` can't be read, STOP. Don't guess at field names.
- If Text Search returns multiple plausible candidates, STOP and ask. Don't pick at random.
- If the chip cascade hits MED or LOW, route to `drafts/_review/` — don't write live and hope.
- If routing is ambiguous (could be /places or /eat), STOP and ask.

## Failure handling
- Place_id resolution fails (Text Search returns nothing or all matches are clearly wrong) → log the input, skip the item.
- Place_id resolves to the wrong place (e.g. wrong city for a common chain name) → log + skip. Don't write a YAML for the wrong location.
- Photo fetch fails (API photo missing, rate limit, network) → save the YAML without `hero_image`, flag for manual D3 override. Do NOT block the YAML write on photo failure.
- Slug collision unresolvable after 3 attempts (`<slug>`, `<slug>-2`, `<slug>-3` all taken) → skip, log reason.
- Cascade match has 3+ plausible chips for an item → write to `drafts/_review/` with `_notes` listing the alternatives; don't auto-commit.
- `GOOGLE_PLACES_API_KEY` missing from `.env.local` → STOP. Tell the user, don't proceed with degraded mode.

## Cost awareness

The Python helper has cost-tier handling baked in. Default mode (Place Details Essentials + Place Photos) is the cheap path; `--hours` is the expensive opt-in. `/add-places` should NOT request hours by default — hours rarely change, and the existing weekly cron handles refresh. Only invoke the hours fetch if the user explicitly asks for it on a specific high-priority item.

## Known issues
- The schema's `launch_tier` enum still carries the `"base"` value, but the `STAY BASES` chip was removed from the UI rail (PR #28). `/add-places` should NEVER write `launch_tier: "base"` — those rows aren't browse-reachable, only search-reachable. Always write `launch_tier: "standard"` (or omit, since `standard` is the schema default).
- The boolean badge fields (`local_favorite`, `viral`, `viral_signal`) shipped in PR #28. If for any reason the current branch doesn't carry the schema additions, surface that and stop — don't write the fields against a schema that rejects them.
