# Quick-Add Slash Commands Build Spec

**Branch:** `feat/quick-add-commands`
**Reference:** existing `.claude/commands/add-products.md` (the canonical pattern)
**Scope:** Two new slash commands mirroring `/add-products` for the other content collections that have list pages.

---

## Scope summary

Two new slash command files in `.claude/commands/`:

1. `add-places.md` — adds entries to `src/content/places/*.yaml`
2. `add-eats.md` — appends entries to `src/data/restaurants.json`

Each is self-contained (no shared helper module). Two commits on the same branch, one per command file, so either can be reverted independently.

**/add-stays is explicitly deferred.** The /stay list page doesn't exist yet (only the map renders stays). Without a shareable list URL, /add-stays would only add a map marker — breaking the workflow promise of "URL → live entry on list page AND map" that /add-places and /add-eats deliver. Defer until the /stay list page ships as its own workstream (probably Phase A.11 or alongside per-item pages). Then /add-stays becomes a 30-minute mirror task.

---

## What stays the same as /add-products

All three commands inherit this pattern from `/add-products` without change:

- **Three input modes:** link / photo / pasted text. Hybrid (photo + link) uses photo as image, link for ID.
- **Required reads before processing:** live Zod schema, 2 example entries (one simple, one with edge case), `brand.md`, highest existing ID.
- **Field discipline:** write ONLY fields defined in the live schema. Schema is the contract. No synonym duplicates.
- **HIGH confidence → live folder; MED/LOW → `drafts/_review/`** with `_notes` field.
- **Auto-commit HIGH items** (each as separate commit) and push to main. Commit format: `Add [entry name] (ID)`.
- **End-of-batch report** with counts, citations, flags.
- **Known bot-protected sites:** one WebFetch attempt with 20s timeout, then fall back. No curl retries.
- **One-at-a-time processing.** Voice consistency over speed.
- **Voice self-check every 5 items.**
- **Never overwrite existing files.** Slug collision → append -2, -3 etc.
- **Schema unreadable → STOP.** No guessing field names.

---

## What changes per command

### `/add-places`

**Target collection:** `src/content/places/<slug>.yaml` (Astro content collection, YAML files).

**Schema differences from products:**
- No `where_to_buy` (places aren't products)
- No `safety_flags` (no consumable safety concerns)
- Required: `prefecture`, `category` (one of the 13 Where clusters), `address_or_area`
- Optional: `planning_flags`, plus D1-enrichment fields (`place_id`, `lat`, `lng`, `hours`, `photo_cache_path`)
- Inspect `src/content/schemas.ts` for the live places schema and 2 example YAMLs from `src/content/places/` before writing.

**ID generation:** confirm in schema whether places use a `JF-XXXX`-style prefix or just the slug as the de-facto id. If the schema has an `id` field, follow the existing convention from sample YAMLs. If not, slug is the identifier.

**Category constraint:** the 13 Where clusters are the legitimate values. Match against the live cluster list in `MapView.astro` / `map.astro`. If the new place doesn't fit any existing cluster, write to `drafts/_review/` with a `_notes` explaining and let Steven decide.

**Input priority for places:** Google Maps share URL > JNTO official page > brand/attraction site > pasted text/research blob. Photo input is supported but less useful for places (a venue photo can identify the place but the user photo is rarely the right hero image — defer to Google Places photo via enrichment).

**Places API enrichment — CRITICAL DIVERGENCE FROM /add-products:**
- After writing the YAML but BEFORE auto-commit, call `enrich_with_places_api.py` (or equivalent) against the new entry to populate `place_id`, `lat`, `lng`, `photo_cache_path`.
- This is a paid Google Places API call (~$0.07 per entry per the D1 cost benchmark).
- Before the enrichment call, prompt the user: `"About to enrich [entry name] via Google Places API (~$0.07). Proceed? [y/N]"` — this is the per-invocation cost gate.
- If user declines, commit the YAML without enrichment fields (entry appears on /places list page but not on /map until enrichment runs later).
- If user accepts, run enrichment, then commit YAML with all fields populated (entry appears on both list page AND map immediately).

**Why enrichment is in the command:** Steven's posting cadence wants "URL → live entry on both list and map" in one shot. Deferring enrichment to a batch step would mean every new entry sits invisible on the map until the next batch run. Per-invocation cost gate is the right tradeoff.

---

### `/add-eats`

**Target collection:** `src/data/restaurants.json` (single JSON file, append entry — NOT a YAML collection).

**Schema differences from products:**
- Data lives in JSON not YAML — write logic differs
- Inspect `src/data/restaurants.json` for actual entry shape before writing
- Required fields likely include: `name`, `name_jp`, `city`, `prefecture`, `cuisine` (one of 13 cuisine chips), `price`, `hyakumeiten_year`, `reservation_status`
- No `where_to_buy`, no `safety_flags`
- Plus D1-enrichment fields (`place_id`, `lat`, `lng`, etc.)

**Hyakumeiten gate — CRITICAL POLICY ENFORCEMENT:**
- Per the locked curation framing ("Steven aggregates Tabelog Hyakumeiten. Honest about it."), /add-eats should refuse restaurants NOT on a Tabelog Hyakumeiten list.
- Check the Tabelog URL or web-search results for explicit Hyakumeiten designation (year + cuisine category).
- If not Hyakumeiten: prompt user `"[Name] is not on a Tabelog Hyakumeiten list. Add anyway? This breaks the /eat curation policy. [y/N]"`
- If user accepts override, write with `hyakumeiten_year: null` and a `_notes` field flagging the policy break.
- If user declines, skip the entry.

**ID generation:** confirm the existing restaurants.json entry shape. May not use IDs at all (just an array of objects keyed by slug or name).

**Input priority for eats:** Tabelog URL (canonical, contains the Hyakumeiten data) > brand/restaurant site > pasted text. Photo input is supported but rarely useful — venue photos rarely identify the specific restaurant without text.

**Places API enrichment:** same paid-API pattern as /add-places. Per-invocation cost gate before enrichment call.

---

## Auto-mode considerations

- **Writing the slash command files themselves (this workstream):** auto-mode ON is fine. CC is creating three new markdown files, no paid APIs, no destructive ops.
- **Using the slash commands later (post-merge):** the paid API gate is built INTO each command (per-invocation user confirmation before the enrichment call). So auto-mode can stay ON when using /add-places, /add-eats, /add-stays in practice — the cost confirmation is asked per item regardless of CC's auto-mode state.

This is the right design: cost gates belong in the command, not in CC's global mode setting. Removes the "did I remember to turn auto-mode off?" cognitive load.

---

## CC working defaults for this session

- **First action:** read `.claude/commands/add-products.md` as the reference pattern. Then read `src/content/schemas.ts` to understand the three target schemas.
- **Inspect 2 sample entries from each target collection** before writing parallel commands. Mirror the actual field shapes.
- **Inspect `enrich_with_places_api.py`** (likely at repo root or in `scripts/`) to confirm the API call interface — what arguments it takes, what it writes back.
- **Confirm Hyakumeiten gate logic with Steven** before shipping /add-eats — the policy override prompt is a real product decision.
- **Two separate commits** on `feat/quick-add-commands`, one per command file. Don't squash.
- **No tests required** for these commands (they're prompt files, not code). Validation happens by using them after merge.
- **PR review:** open PR after both commits, no Lighthouse pass needed (these don't touch site rendering).

---

## What's NOT in this phase

- Updating the existing /add-products command (it works, leave it alone)
- Refactoring shared logic into a helper module (premature — three independent files first, refactor only if maintenance pain emerges)
- Building any UI for invoking these commands (they're CC slash commands, invoked from Claude Code)
- Backfilling lat/lng for the existing 136 stays (that's D7, separate workstream)
- Documentation site updates (not required)

---

## End-state user experience

Steven posts an Instagram reel about a new ramen shop. After:

```
/add-eats https://tabelog.com/tokyo/A1303/A130301/13123456/
```

CC:
1. Fetches the Tabelog page, extracts name/cuisine/Hyakumeiten year/city/price/reservation
2. Confirms Hyakumeiten status (Tokyo Ramen 2024)
3. Asks: "Enrich via Google Places API (~$0.07)? [y/N]"
4. On yes: runs enrichment, gets lat/lng/place_id
5. Appends entry to restaurants.json
6. Commits and pushes to main
7. Vercel auto-deploys
8. New ramen shop is live on /eat list page AND /map within ~60 seconds

Steven links japan.allstarsteven.com/eat in the reel caption. Done. That's the workflow this PR ships.
