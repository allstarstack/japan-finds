# Japan Finds — Project State

**Last updated:** 2026-05-17 (late evening)
**Purpose:** Orientation doc for any new Claude/Claude Code session. Read this first before making changes.

---

## Live state

- **japan.allstarsteven.com** — V1 landing page shipped (Lighthouse 100/96/100/100). **Phase B-1 catalog launch built but not yet live.** PR #1 (`phase-b1-catalog-launch` branch) is open and Vercel preview is green. Awaiting Steven's pre-merge review, then merge → auto-deploy.
- **allstarsteven.com** — hub page deploying (separate repo: `allstarstack/allstarsteven-hub`, separate Vercel project).
- **shop.allstarsteven.com** — Shopify launching ~30 days from this update.
- **Kit form** — working, tested, list ID committed.
- **DNS** — Porkbun-managed. CNAME `japan` → `cname.vercel-dns.com` verified. Apex A record set during hub deployment.

---

## Phase B-1 outcomes (built 2026-05-17, awaiting merge)

- **384 launch products** (originally proposed 385; 1 dedupe caught mid-build: JF-0373 + JF-0446 = same Bioré sunscreen, kept JF-0373).
- **239 V (verified-fill) + 145 CF (creator-fill).** V rows render full info; CF rows render English name + generic where-to-buy only (Yawataya hallucination guard).
- **13 chips** with shopping-intent labels on the four store chips:
  - Konbini Run (47) · Drugstore Haul (41) · 100-Yen Stop (36) · Donki Trip (31)
  - Plus: Skincare, Regional Food, Snacks, Stationery, Travel Gear, Customization, Kids & Family, Kitchen, Gift
- **Sub-chips** on Konbini Run (Food / Drink / Sweet) and Drugstore Haul (Skincare / Comfort / Meds — Beauty is empty by design).
- **Filter rules:** primary single-select, sub multi-select, URL-shareable via `?chip=&sub=`, client-side, instant.
- **Fonts:** Google CDN swapped to self-hosted woff2. Latin subsets for Space Grotesk 700, Inter 400, IBM Plex Mono 500. (PROJECT_STATE previously claimed fonts were self-hosted — that was wrong; it's true now.)
- **Lighthouse:** all routes clear ≥95/95/100/95. `/products` 99/96/100/100 mobile, 100/96/100/100 desktop. `/products?chip=konbini` 99/96/100/100.
- **21 items deferred to v2 wave** (the original "skip" chip concept dropped — items need Steven's per-item review for product card / cheat-sheet / cut classification).

---

## Stack (locked)

Astro 6 + vanilla CSS + Vercel + Kit + GitHub. **No Tailwind, React, or TypeScript anywhere.** Mobile-first. Self-hosted fonts (Space Grotesk, Inter, IBM Plex Mono) — actually self-hosted as of PR #1.

## URL architecture (Pattern B, locked)

- Apex `allstarsteven.com` → hub
- `japan.allstarsteven.com` → Japan Finds
- `shop.allstarsteven.com` → Shopify (future)

## Brand spec (locked, with one drift to reconcile)

**Direction:** B v2 · Konbini Field Guide (refined)

**Palette:** Rice White `#F7F3EA`, Ink Black `#151515`, Tokyo Signal Red `#FF3B30`, Konbini Blue `#176BFF`, Matcha Green `#4D8B57`, Egg Sando Yellow `#FFD84D`, Concrete Gray `#E6E1D8`.

**Typography:** Space Grotesk (headlines) / Inter (body) / IBM Plex Mono (small caps labels).

**Voice:** useful-first, witty-second. Direct, mobile-first, no marketing puffery.

**Banned words:** ultimate, hidden gems, magical, wanderlust, authentic journey, unforgettable, discover Japan, explore, must-see, curated experiences, local secrets, comprehensive guide, uncover, delve.

**Banned imagery:** Mt. Fuji, torii, cherry blossoms, Shibuya neon, shrines, luxury travel mag style, AI-generated Japan photography.

**⚠ Brand.md drift to reconcile:** brand.md currently says "Flags render on product cards as a small callout." Phase B-1 launch strips safety flags entirely (transplant flags are personal-use notes for Steven, not audience-facing). brand.md should be updated to reflect the launch behavior — flags are curation aid only, never render on public cards.

---

## Decisions locked

### Decision #1: Product category enum (14 values)
Documented in prior PROJECT_STATE. Now implemented in product schema as `launch_category` (13 of 14 enum values used in launch — "other" / catch-all not used; 14th was provisional "skip" which got dropped).

### Decision #1B: Places schema + 17 public chips
Documented in prior PROJECT_STATE. Not yet implemented — pending Places Backlog Import build.

### Decision #2: Launch list (LOCKED 2026-05-17)
- 384 products selected from 461-item catalog
- Methodology: catalog-scope launch with conservative-display safeguard on CF rows
- Strategy: all V-eligible + iconic CF in zero-V categories
- 21 items deferred for per-item review (former "skip" concept)
- File: `docs/decision_2_v4.csv` (committed to repo)
- 3 harm-exclusions: JF-0067 vape, JF-0069 strong laxatives, JF-0070 unverified contacts
- 8 dupes resolved (7 in CSV, 1 caught mid-build)

### Decision #3: Filter UX (LOCKED 2026-05-17)
- 13 primary chips, 4 with shopping-intent labels (Konbini Run / Drugstore Haul / 100-Yen Stop / Donki Trip)
- Sub-chips on Konbini Run and Drugstore Haul only
- Primary single-select, sub multi-select
- Sort: V-first → CF, then alphabetical
- URL-shareable filter state via `?chip=&sub=`
- Mobile-first horizontal-scroll chip rail, sticky on scroll

### Decision #4 (workflow): Two-tier quick-add product capture
Documented in prior PROJECT_STATE. Spec: `QUICK_ADD_WORKFLOW_SPEC.md`. Phase 0 not yet built.

---

## In-flight (Steven's plate)

**Pre-merge review of PR #1** (3 items):
1. Visit Vercel preview URL, tap through chips on mobile + desktop, eyeball anything wrong.
2. Spot-check `docs/phase-b1-populate-report.md` — Claude Code hand-classified 88 konbini/drugstore items into sub-chips. Flag any obvious mis-classifications.
3. Reconcile brand.md safety flags section (see drift note above).

After merge, Vercel auto-deploys to japan.allstarsteven.com.

---

## Pending decisions / queued work (priority order)

1. **Pre-merge tasks above** — must clear before merge.
2. **Enrichment LLM pass on 145 CF rows** — run `japan-finds-creator-fill-enrichment v1.0` prompt (drafted in chat 2026-05-17) against CF rows. Upgrades them from English-only display to full-info. Runs post-launch.
3. **21 v2-deferred items review** — Steven decides per-item: regular product card, behavioral tip → cheat-sheets, or cut.
4. **Places Backlog Import BUILD_SPEC** — 272-row regional places import with V1 dedupe. Needs Claude proposal + Steven review. Parallel prep Steven can do tonight/tomorrow: locate the 272-row source file, audit address quality, decide on Google My Maps integration pattern (recommended: option 2 — master Google My Map with "Get the Japan Map" CTA).
5. **Phase B-2 Shopping Lists feature BUILD_SPEC** — original Phase B headline feature, deferred. ~3-4 hr Claude Code build.
6. **Quick-Add Phase 0** — 15 min, can run in parallel after Phase B-1 merges.
7. **Quick-Add Phase 1** — GitHub Issue Form + Action, ~1-2 hr build.
8. **Cheat sheets content synthesis** — Phase C content lift.

---

## Background queue (no rush)

- Spot-check the 80 A-grade verifications (2-4 hrs of Steven's time)
- Product card copy writing in brand voice (30-60 hrs across the 384 launch cards; polish high-traffic ones first)
- Real image swap from stock to creator-shot stills
- Color contrast fix on red/green chips (current Lighthouse a11y 96 — known background-queue item, identical to live homepage score)
- Google My Maps real URL needed for "Get the Japan Map" CTAs
- Sponsor outreach to Klook, MIMARU, @cosme, JNTO, Matsumoto Kiyoshi (top 5 from sponsor leads XLSX)

---

## Steven's transplant safety flags (PERSONAL — curation aid only, NEVER render on public cards)

Per Decision #2: the launch site is for the audience, not Steven personally. Transplant flags are kept as private metadata for Steven's curation work but never surface on product cards. Audience-facing copy treats flagged products as regular recommendations.

- **Alcohol** (sake, beer, highball variants — including JF-0220, JF-0282; grapefruit Strong Zero JF-0226 was dropped as harm-exclude during dedupe)
- **NSAIDs** (Loxonin S JF-0134, Eve A JF-0130)
- **Multi-active cold meds** (Pabron JF-0139, JF-0158)
- **Aspirin-related** (Salonpas JF-0143, JF-0162)
- **Citrus/grapefruit family** (Yuzu kosho JF-0214, Muji yuzu oil/incense JF-0287)
- **Voltage** (Zojirushi JF-0215, Tepra JF-0438) — Japan 100V vs US 120V. Note Zojirushi NW-YQH 220V tourist model launched Dec 11, 2025.

---

## Key pricing/product intel surfaced by verification (apply to product cards when copy gets written)

- **Brand correction:** Yawataya shichimi is 八幡屋礒五郎 (Isogoro), NOT Isobei — fix source XLSX
- **Corporate:** Bathclin merged into Earth Corp Jan 1, 2026
- **Reformulations/launches:** Strong Zero relaunched Jan 19, 2024 as 196 line (¥148/350ml, ¥200/500ml); Biore UV Aqua Rich Airy Hold Cream launched Feb 7, 2026; Pitta Mask UV REGULAR GRAY launched Jan 23, 2026
- **Recent price changes:** Famichiki ¥248 (Mar 2026), Garigari-kun ¥90 (Mar 2026), Pino ¥195 (Sept 2025), Cup Noodle ¥248 (April 2026), Loxonin S +40% (June 2026), Hada Labo +10% across 38 SKUs (Jan 2026), Pocky/Glico +¥35 (Dec 2024) +¥7 (May 2026 across 247 SKUs)

---

## Reference docs

**In repo at `docs/`:**
- `PHASE_B1_CATALOG_LAUNCH_BUILD_SPEC.md` — executed
- `decision_2_v4.csv` — 384-product launch list, locked
- `phase-b1-populate-report.md` — Claude Code's sub-chip classification report (needs Steven spot-check)
- `brand.md` — brand spec (one section needs reconcile, see drift note above)

**In `/mnt/user-data/outputs/` from chat sessions:**
- `verification_results_v1.csv` — 241 verified rows from prior verification work
- `verification_intel_notes.md` — pricing and corporate-change intel for unverified rows
- `ALLSTARSTEVEN_HUB_BUILD_SPEC.md` — hub page build spec
- `QUICK_ADD_WORKFLOW_SPEC.md` — two-tier product capture workflow
- `JF_VERIFICATION_GAP_RUN.txt` — original 260-row gap-fill prompt

**Pending creation:**
- `PLACES_BACKLOG_IMPORT_BUILD_SPEC.md` — next major spec to write
- `PHASE_B2_SHOPPING_LISTS_BUILD_SPEC.md` — after Places import
- Session handoff for next major work session (generate when next session approaches)
