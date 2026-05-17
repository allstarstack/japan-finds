# Japan Finds — Project State

**Last updated:** 2026-05-17
**Purpose:** Orientation doc for any new Claude/Claude Code session. Read this first before making changes.

---

## Live state

- **japan.allstarsteven.com** — V1 landing page shipped (Lighthouse 100/96/100/100), V2 Phase A data layer shipped (commit `7b16b19`). 521 entries seeded across products/places/stores/routes/cheat-sheets, all `status === "ready"` gated.
- **allstarsteven.com** — hub page deploying (separate repo: `allstarstack/allstarsteven-hub`, separate Vercel project).
- **shop.allstarsteven.com** — Shopify launching ~30 days from this update.
- **Kit form** — working, tested, list ID committed
- **DNS** — Porkbun-managed. CNAME `japan` → `cname.vercel-dns.com` verified. Apex A record will be set during hub deployment.

---

## Stack (locked)

Astro 6 + vanilla CSS + Vercel + Kit + GitHub. **No Tailwind, React, or TypeScript anywhere.** Mobile-first. Self-hosted fonts (Space Grotesk, Inter, IBM Plex Mono).

## URL architecture (Pattern B, locked)

- Apex `allstarsteven.com` → hub
- `japan.allstarsteven.com` → Japan Finds
- `shop.allstarsteven.com` → Shopify (future)

## Brand spec (locked)

**Direction:** B v2 · Konbini Field Guide (refined)

**Palette:** Rice White `#F7F3EA`, Ink Black `#151515`, Tokyo Signal Red `#FF3B30`, Konbini Blue `#176BFF`, Matcha Green `#4D8B57`, Egg Sando Yellow `#FFD84D`, Concrete Gray `#E6E1D8`.

**Typography:** Space Grotesk (headlines) / Inter (body) / IBM Plex Mono (small caps labels).

**Voice:** useful-first, witty-second. Direct, mobile-first, no marketing puffery.

**Banned words:** ultimate, hidden gems, magical, wanderlust, authentic journey, unforgettable, discover Japan, explore, must-see, curated experiences, local secrets, comprehensive guide, uncover, delve.

**Banned imagery:** Mt. Fuji, torii, cherry blossoms, Shibuya neon, shrines, luxury travel mag style, AI-generated Japan photography.

---

## Phase B prep — locked decisions

### Decision #1: Product category enum (14 values)

```
konbini (~50)          hundred_yen (~46)     drugstore (~39)
donki (~31)            skincare_beauty (~47) regional_food (~48)
snacks (~26)           stationery (~21)      kitchen (~18)
kids_family (~24)      customization (~40)   travel_gear (~21)
gift (~8)              other (~0)
```

Covers ~94% of the 460-product catalog. Solves the 151/460→other problem from Phase A.

### Decision #1B: Places schema + 17 public chips

**`primary_category` enum (5 values):** See | Do | Eat | Shop | Stay

**Tiebreaker:** See for landmarks, Do for hands-on, Stay for overnight bases. "Kids" rejected as primary (audience, not place-type) — lives in public_labels.

**17 public_labels (chips):**
- STORE (4): Konbini Hauls · Donki Finds · Drugstore Finds · 100-Yen Finds
- FOOD (2): Food Markets · Food Alleys
- EXPERIENCE (5): Onsen & Ryokan · Nature & Water · Workshops · Anime · Quirky
- POI (2): Photo Spots · Scenic Trains
- PLANNING (3): Day Trips · By Train · Rainy Day
- AUDIENCE (1): With Kids
- DISCOVERY (1): Local Favorites

**Schema fields for all places (V1 + 272-row backlog):**
- Required: name, address_or_area, region, prefecture, original_category, primary_category, public_labels, planning_flags, source_type, status, launch_tier, public_render (default false), address_verified (default false)
- Optional on promotion: url, hours, ticket_rules, lat, lng
- Deferred: search_aliases (until search ships)

**Enums:**
- `launch_tier`: v1 | v2_candidate | backlog | reject
- `source_type`: v1_curated | regional_seed_backlog

**Dedupe required** for V1 35 places ↔ backlog 272 by name + prefecture. Conflicts → `places-import-conflicts.md`.

### Decision #4 (workflow): Two-tier quick-add product capture

**Stub state** (minimal schema, captures fast at video time, lives in `/just-added/` feed, doesn't touch main chips).
**Ready state** (full schema, lives in main catalog, populates chips, promoted from stub on weekly review).

Phase 0 (manual stub YAML editing via mobile, ~15min build) → Phase 1 (GitHub Issue Form + Action, ~1-2h) → Phase 2 (optional iOS Shortcut/Telegram).

Spec: `QUICK_ADD_WORKFLOW_SPEC.md`.

---

## In-flight at last update

- **Hub page build** — Claude Code session active. Astro scaffolded. Fonts self-hosted. Components and CSS in progress. Expected halts: Kit embed paste, DNS apex change.
- **Targeted verification gap-fill** — 90-row run (drugstore safety meds + kitchen + gift + design + konbini heroes + 2 Donki uniques). First attempt via ChatGPT agent failed; rerunning via Claude in Chrome.
- **Verification state:** 241/461 rows verified and saved to `verification_results_v1.csv`. Grade distribution: A:80, B:155, C:5, D:1.

---

## Pending decisions (priority order)

1. **Phase B Decision #2** — finalize 80-product launch list from A-grade pool. Claude proposes, Steven edits.
2. **Phase B Decision #3** — filter UX scope: chip layout, simultaneous filter rules, primary vs secondary chip hierarchy.
3. **Phase B BUILD_SPEC.md** — written after Decisions #2 + #3 lock.
4. **Places Backlog Import BUILD_SPEC** — 272-row regional places import with V1 dedupe.
5. **Phase B build session** — Claude Code, ~4 hours, Shopping Lists feature.
6. **Quick-add Phase 0 build** — ~15 minutes, after Phase B build session.

---

## Background queue (no rush)

- Spot-check the 80 A-grade verifications (2-4 hrs of Steven's time)
- Product card copy writing (8-20 hrs — largest remaining lift on Phase B)
- Cheat sheets content synthesis from research DOCX (Phase C blocker)
- Real image swap from stock to creator-shot stills
- Color contrast fix on red/green chips (current ~3.5-4:1, target AA 4.5:1)
- Google My Maps real URL needed for "Get the Japan Map" CTAs
- Sponsor outreach to Klook, MIMARU, @cosme, JNTO, Matsumoto Kiyoshi (top 5 from sponsor leads XLSX)

---

## Steven's transplant safety flags (apply always to product content)

- **Alcohol** (JF-0082 sake brewery tours, JF-0083 distillery tours, JF-0170 sake mini gift, JF-0220 highball, JF-0226 Strong Zero, JF-0282 Strong Zero Double Lemon): clear with transplant team
- **NSAIDs** (Loxonin JF-0134, Eve JF-0130): liver concern, hard avoid pending clearance
- **Multi-active cold meds** (Pabron JF-0139, JF-0158): transplant team clearance
- **Aspirin-related** (Salonpas JF-0143, JF-0162): clearance
- **Citrus/grapefruit family** (Yuzu kosho JF-0214, Muji yuzu oil/incense JF-0287, Strong Zero grapefruit variant JF-0226): ingestion content needs clearance; **grapefruit Strong Zero is HARD AVOID entirely**
- **Voltage** (Zojirushi JF-0215, Tepra JF-0438, tax-free electronics JF-0460): Japan 100V vs US 120V — note new Zojirushi NW-YQH 220V tourist model launched Dec 11, 2025

## Key pricing/product intel surfaced by verification (apply to product cards)

- **Brand correction:** Yawataya shichimi is 八幡屋礒五郎 (Isogoro), NOT Isobei — fix source XLSX
- **Corporate:** Bathclin merged into Earth Corp Jan 1, 2026
- **Reformulations/launches:** Strong Zero relaunched Jan 19, 2024 as 196 line (¥148/350ml, ¥200/500ml); Biore UV Aqua Rich Airy Hold Cream launched Feb 7, 2026; Pitta Mask UV REGULAR GRAY launched Jan 23, 2026
- **Recent price changes:** Famichiki ¥248 (Mar 2026), Garigari-kun ¥90 (Mar 2026), Pino ¥195 (Sept 2025), Cup Noodle ¥248 (April 2026), Loxonin S +40% (June 2026), Hada Labo +10% across 38 SKUs (Jan 2026), Pocky/Glico +¥35 (Dec 2024) +¥7 (May 2026 across 247 SKUs)

---

## Reference docs (in `/mnt/user-data/outputs/` from chat sessions)

- `verification_results_v1.csv` — 241 verified rows
- `verification_intel_notes.md` — pricing and corporate-change intel for unverified rows
- `ALLSTARSTEVEN_HUB_BUILD_SPEC.md` — hub page build spec
- `QUICK_ADD_WORKFLOW_SPEC.md` — two-tier product capture workflow
- `JF_VERIFICATION_GAP_RUN.txt` — original 260-row gap-fill prompt
- `SESSION_HANDOFF_2026-05-17.md` — session handoff for new chats
