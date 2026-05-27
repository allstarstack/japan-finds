# /add-stays

Add new stays into the Japan Finds `/stay` content collection. Accepts
an official property URL, a booking-site link, pasted research markdown,
or a `name + city + prefecture` fallback.

Distinctive Japanese stays only — onsen ryokan, design hotels, machiya,
glamping, capsule novelty, mountain lodge, heritage hotel, temple stay,
or resort with a clear hook. Generic hotel chains route to nothing —
log + skip.

## Inputs to check
1. If the user pastes a single URL in chat (property site or booking
   site), process that as one item.
2. If the user pastes a block of research markdown (Gemini DR / Meta AI /
   guidebook excerpts / similar), parse it: each named stay + location
   anchor (city/prefecture) is one item.
3. If the user pastes a plain `name + city + prefecture` string, treat
   it as a single item — resolve canonical name via web search if the
   user-supplied name is ambiguous; otherwise write directly.
4. `drafts/stays/links.txt` — one URL per line — works the same way as
   the /places queue file. Ignore blank lines and `#`-comments. Process
   only if it exists.

No photo input. Stay photos come from Google Places Photos via the same
`scripts/enrich_with_places_api.py` helper that fills `place_id`, `lat`,
`lng`, and `photo_cache_path` during D7-style batch enrichment. The
`/add-stays` initial write leaves those four fields blank — the card
falls back to the Aizome Indigo colour-block until D7 runs.

## Required reads before processing
1. `src/content/schemas.ts` — get the live `staySchema`. Output must
   validate. If you can't find it, STOP and ask.
2. Two example YAMLs from `src/content/stays/` — one minimal seed entry
   (no enrichment fields) and one with enrichment fields if any exist
   yet, so the shape of optional fields is clear.
3. `docs/brand.md` — voice rules, banned words. The `description` and
   `distinctive` fields use brand voice the same way product card copy
   does. Present tense, witty/dry, useful first.
4. `src/data/stay-chips.js` — canonical `STAYS_PRIMARY_CHIPS`
   (`primary_cat` values + display labels) and `PRICE_TIER_GLYPH`. The
   category cascade below must reference these exact `value` strings,
   not labels.
5. `scripts/enrich_with_places_api.py` — read its docstring once. Used
   only when the user explicitly opts in to the per-item Places API
   enrichment (paid).

## Field discipline (CRITICAL)
Write ONLY fields defined in `staySchema`. Required: `id`, `name`,
`name_jp`, `city`, `prefecture`, `primary_cat`, `price_tier`,
`description`, `distinctive`, `source_url`. Optional (D7): `place_id`,
`lat`, `lng`, `photo_cache_path`. Do NOT invent fields. The schema is
the contract. If unsure whether a field belongs, omit it.

## ID generation
Each stay carries a stable `id` of the form `jf-stay-XXXX` (4-digit
zero-padded). To get the next id:

```
grep -h "^id: jf-stay-" src/content/stays/*.yaml \
  | sed 's/id: jf-stay-//' \
  | sort -n \
  | tail -1
```

Increment by 1, zero-pad to 4 digits. If the directory is empty
(shouldn't be — Phase A.9 seeded 136), start at `jf-stay-0001`.

## Per-item loop

### If input is a PROPERTY OR BOOKING URL:
1. **Fetch the page** via WebFetch. Property-site URLs are first-choice
   input — they have canonical Japanese + English names, room/onsen
   detail, and the source-of-truth `source_url`. Booking-site URLs
   (Booking.com, Rakuten Travel, Ikyu) are second-choice — pull the
   name and concept but always try to find the official property URL
   to use for the YAML `source_url` field (booking-site URLs decay and
   change format).
2. **Collision pre-check.** Stays don't have a `place_id` at write time
   (D7 fills it later), so the collision key is the property name +
   city. Grep:
   ```
   grep -l -i "name: <property name>" src/content/stays/*.yaml
   grep -l -i "city: <city>" src/content/stays/*.yaml | xargs grep -l -i "name: <property name>"
   ```
   A hit on the same name in the same city is a re-import. STOP for that
   item — log as "duplicate of `<existing-id>` / `<existing-slug>`".
3. **Extract from the page:** official English name, Japanese name
   (look for `<title>` / `<meta>` tags with CJK; falls back to none if
   the property has no Japanese branding), city, prefecture, what the
   stay actually is in one factual sentence (no marketing words), the
   one thing that makes it distinctive enough to belong in the
   collection.
4. **Verify the resolved name matches** the URL's property. A mismatch
   (booking-site landing page for a chain's listings, wrong location)
   is a HARD STOP — log and skip.
5. Apply the **Category cascade** (below) to set `primary_cat`.
6. Apply the **Price tier rule** (below) to set `price_tier`.
7. Set confidence per the **Confidence levels** section.
8. **Places API enrichment (OPTIONAL, paid).** Before writing the YAML,
   if confidence is HIGH, ask the user: `"Enrich [name] via Google Places
   API now (~$0.07: place_id + lat/lng + photo)? [y/N]"`. Default = no.
   - If yes: run the per-item Places API flow from `/add-places` step 4
     adapted for stays — Text Search to resolve `place_id`, Place
     Details for canonical address/location, Place Photos for the hero,
     `python3 -c "from PIL import Image; …"` to `.webp`, save to
     `public/stays/<slug>.webp`, set `photo_cache_path` to that path.
   - If no: write the YAML with `place_id`, `lat`, `lng`,
     `photo_cache_path` omitted. The card renders the indigo
     colour-block; D7 will fill them in batch later.

### If input is PASTED RESEARCH MARKDOWN:
1. Parse line by line / paragraph by paragraph. Each named stay with a
   clear locational anchor (city or prefecture) is one item.
2. For each parsed item, find the property's official URL via web search.
   Booking-site links are acceptable for `source_url` only if no
   official site exists.
3. Use the research blob as the source for the `description` and
   `distinctive` field signals — but strip marketing language and
   rewrite in brand voice. Banned words from `docs/brand.md` are
   blockers; rewrite if you hit one.
4. Continue from step 4 of the URL loop (verify → cascade → price →
   confidence → enrichment prompt).
5. Cite the research source in commit messages if a single source
   generated multiple items in the batch.

### If input is PLAIN `NAME + CITY + PREFECTURE`:
1. Web-search for the property's official URL.
2. If the search returns multiple plausible candidates with similar
   names (e.g. two unrelated machiya stays in Kyoto with the same kanji),
   STOP and ask. Don't guess.
3. Continue from step 1 of the URL loop with the resolved URL.

### Common to all input types:
1. **Slug (filename) generation:** NFKD-romanize the name, lowercase,
   hyphens between words, ASCII only, max 60 chars. Drop any Japanese
   parenthetical — the filename is romanized-name-only. Example:
   `Hoshinoya Karuizawa (星のや軽井沢)` → `hoshinoya-karuizawa`.
2. **Slug collision (secondary).** If two genuinely *different* stays
   resolve to the same slug, append `-2`, `-3`. Check both
   `src/content/stays/<slug>.yaml` and `drafts/_review/<slug>.yaml`.
   Never overwrite. If you find yourself appending `-2` for what looks
   like the same property, the name+city collision pre-check above
   should have caught it — surface the bug.
3. **Region derivation:** stays don't carry a `region` field — the
   `/stay` page derives it at build time via
   `prefectureToRegion(prefecture)` from `src/data/regions.js`. Just
   write `prefecture` accurately (English form, e.g. `Kyoto`, `Nagano`).
4. **Address / city cleanup:** city is the locality name only (`Kyoto`,
   not `Kyoto, Kyoto Prefecture`). Match the convention in the existing
   136 seed YAMLs.
5. **Write copy in brand voice:**
   - `description`: one or two sentences. Factual, plain. What kind of
     stay it is + what's on-site. ~150-200 chars.
   - `distinctive`: one sentence, ~80-120 chars. The actual reason this
     property belongs in the collection — the bath, the architect, the
     view, the food kaiseki philosophy. If your `distinctive` reads like
     it could apply to any hotel in this category, the property
     probably doesn't clear the bar; route to `drafts/_review/`.
6. **Skip runtime schema validation.** Write the YAML and let Astro
   validate against `staySchema` at build time. If the build fails, fix
   the YAML — don't widen the schema.
7. **Confidence routing:** HIGH → write to `src/content/stays/<slug>.yaml`.
   MED or LOW → write to `drafts/_review/<slug>.yaml` with a `_notes`
   field stating why.
8. **Auto-commit (HIGH only):** immediately after the YAML (and any
   fetched `.webp`) lands in `src/content/stays/`, `git add`, commit,
   and push to main without asking. Commit message format:
   `Add [stay name]`. In batch runs, commit each item separately so
   they can be reverted individually. MED/LOW items in `drafts/_review/`
   are NOT auto-committed.

## Category cascade

First match wins. Set `primary_cat`:

| Test | `primary_cat` |
|---|---|
| Traditional ryokan, especially with onsen — futons, tatami, kaiseki, anything badged as a ryokan | `onsen_ryokan` |
| Architect-led / aesthetic-driven hotel without a ryokan format — design hotels, boutique hotels with a named architect | `design_hotel` |
| Restored townhouse (machiya) or farmhouse (kominka), often whole-house rental | `machiya_kominka` |
| Outdoor accommodation with substantial structure — luxury tents, dome glamping, treehouses | `glamping` |
| Coastal or destination resort that isn't ryokan-format (no tatami/kaiseki framing) | `resort` |
| Capsule hotel, themed sleep box, novelty pod | `capsule_themed` |
| Mountain hut, alpine lodge, ski-area inn (not ryokan-format) | `mountain_lodge` |
| Heritage / historic building converted to hotel — castle stay, renovated kura, classic Western-style heritage | `heritage_hotel` |
| Working temple offering shukubo (overnight guest stays with monks) | `temple_stay` |

If the property doesn't fit one chip cleanly, write to `drafts/_review/`
with `_notes` listing the candidates — don't force-fit. A "generic
business hotel with an onsen tacked on" probably doesn't belong in the
collection at all; log + skip.

## Price tier rule

Set `price_tier`:

| Test | `price_tier` | Glyph |
|---|---|---|
| Under ¥15,000 / room / night (typical low-season weekday) | `budget` | ¥ |
| ¥15,000–¥40,000 / room / night | `mid` | ¥¥ |
| ¥40,000–¥80,000 / room / night | `upscale` | ¥¥¥ |
| Over ¥80,000 / room / night | `luxury` | ¥¥¥¥ |

If the property publishes per-person-with-meals pricing (common for
ryokan), use the per-person rate doubled as a room-rate proxy. If pricing
isn't visible on the source page and a quick search doesn't surface a
recent rate range, write to `drafts/_review/` with `_notes`.

## Confidence levels

- HIGH: category cascade match is clean; the property genuinely belongs
  in the collection (`distinctive` field has real content that isn't
  generic hotel marketing); price tier is unambiguous. Write to
  `src/content/stays/`.
- MED: cascade has 2 plausible categories OR the `distinctive` field is
  borderline marketing-copy OR price tier is unclear. Write to
  `drafts/_review/` with `_notes` listing the alternatives.
- LOW: cascade has 3+ plausible categories, OR the property may not
  belong in the collection at all, OR the source URL didn't fully
  resolve. Write to `drafts/_review/` with `_notes`.

Identification (correct property resolved) is the gating factor for
HIGH. A clean cascade match on the wrong property isn't HIGH.

## End-of-batch report
- Total items found (split by input source: chat URL / queue file /
  pasted markdown / plain text) / processed / skipped.
- HIGH count (committed live to `/stay`).
- MED/LOW count (in `drafts/_review/`).
- Generic-chain skips (logged as "doesn't belong in the distinctive
  stays collection — log and skip").
- Skipped items with reason (URL didn't resolve, property name +
  city collision, slug collision after 3 attempts, etc.).
- Places API enrichments accepted vs declined this batch.
- Hero photos: fetched successfully (only counts the enrichments user
  accepted) / pending D7 batch (all others).
- Web-search citations for the descriptions — for spot-checking.

`/stay` doesn't have a downstream My Maps mirror the way `/places` does,
so no CSV refresh / pending-file step is needed at end-of-batch. When D7
populates lat/lng, the `/map` STAY layer picks the new entries up
automatically from the geojson rebuild.

## Rules
- One item at a time. Voice consistency matters more than speed.
- After every 5 items, briefly self-check the last 5 descriptions
  against `docs/brand.md` voice exemplars. Flag drift if you see it.
- Never overwrite existing files. Always collision-check
  `src/content/stays/` and `drafts/_review/`.
- If `staySchema` can't be read, STOP.
- If a web search returns multiple plausible candidates for the same
  property name, STOP and ask.
- If the cascade hits MED or LOW, route to `drafts/_review/` — don't
  write live and hope.
- If the property feels like a generic hotel without a distinctive
  hook, log and skip — don't force-fit it into the collection.
- The Places API enrichment is OPT-IN per item. Never call it without
  the user's `y` reply. Auto-mode does NOT bypass the prompt — the
  cost gate is per-item regardless of mode.

## Failure handling
- URL doesn't fetch (timeout, 4xx/5xx, bot wall) → log, skip.
- Name + city collision pre-check finds an existing YAML → log
  "duplicate of `<existing-id>` / `<existing-slug>`", skip, no further
  API calls.
- Property name resolves to a chain landing page (not a single
  property) → log + skip.
- Properties without a Japanese name field → write `name_jp: ""` (the
  card renders without the subtitle if empty). Don't invent a kanji
  name.
- Photo fetch fails (API photo missing, rate limit) → save the YAML
  without `photo_cache_path`. The card renders the indigo block;
  surface the miss in the report.
- Slug collision after 3 attempts (`<slug>`, `<slug>-2`, `<slug>-3` all
  taken by *different* property identities) → skip, log reason.
- Cascade match has 3+ plausible categories → write to
  `drafts/_review/` with `_notes`; don't auto-commit.
- `GOOGLE_PLACES_API_KEY` missing from `.env.local` AND the user said
  yes to enrichment → STOP and tell the user; don't proceed with the
  enrichment for that item. Writing the YAML without enrichment is
  fine; the card just shows the colour-block until D7.

## Cost awareness

The Places API enrichment runs at the same cost as `/add-places`: Place
Details Essentials + Place Photos, ~$0.07 per accepted item. The
per-item prompt is the cost gate. D7 will batch-enrich the entire stays
collection in one supervised run; declining the per-item prompt here
defers cost to that batch (preferred for ordinary additions).

## Known issues
- The stays schema's `place_id`, `lat`, `lng`, `photo_cache_path` are
  all optional. The seed 136 rows all carry them blank. `/add-stays`
  should NEVER invent values for these — either get them from a real
  Places API call (user-opted-in) or leave them out. Empty strings
  are NOT acceptable; omit the keys entirely.
- The `/stay` page sorts alphabetically by `name` (mirrors `/places`).
  A new entry's position in the grid is whatever its name's
  alphabetical slot is — no "newest first" sort yet.
