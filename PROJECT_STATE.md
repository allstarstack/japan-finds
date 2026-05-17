# Japan Finds — Project State

Cross-session orientation. Read this first when picking the project back up.

## What this is

Marketing site + content platform for **Japan Finds by AllstarSteven** — maps,
shopping lists, and travel cheat sheets for Japan travellers.

- **V1** — static landing page with a newsletter signup. **Shipped, live.**
- **V2** — expanding it into a data-driven content site. **Phase A done.**

## Live

| | |
|---|---|
| Production domain (target) | `https://japan.allstarsteven.com` — `japan` subdomain |
| Vercel URL (live now) | `https://japan-finds.vercel.app/` |
| Repo | `https://github.com/allstarstack/japan-finds` — branch `main`, Vercel auto-deploys on push |

DNS for the custom subdomain is the owner's Porkbun step — see `DEPLOY.md §1`.
Until then the site is reachable at the `.vercel.app` URL.

## Stack

Astro 6 (static output) · vanilla CSS with custom-property tokens · Vercel ·
Kit (ConvertKit) for email · Node 20+. No Tailwind, no React. V2 content runs
on Astro Content Collections.

## Status

### V1 — shipped ✅

Landing page (`/`) and accessibility statement (`/accessibility/`), translated
from locked design comps in `design/`. Lighthouse 100 / 96 / 100 / 100. Kit
inline form in the §05 Shop Waitlist section. Spec: `BUILD_SPEC.md`. Deploy &
maintenance: `DEPLOY.md`.

Open follow-ups (V1):
- "Get the Japan Map" CTA has no real destination — anchors to `#map`. Needs
  the actual Google My Maps URL.
- Imagery is licensed stock (Pexels / Wikimedia), not creator stills.
- White text on red/green buttons + chips is ~3.5–4:1 contrast — under AA 4.5
  for small text. Documented on `/accessibility/`.
- Footer social handles are plain text (no profile URLs yet).

### V2 Phase A — done ✅ (plumbing only — nothing renders publicly)

Content foundation: five Astro collections, all status-gated. Spec:
`V2_PHASE_A_BUILD_SPEC.md`. Records: `phase-a-column-audit.md`,
`phase-a-conversion-summary.md`.

| Collection | Entries | Notes |
|---|---|---|
| products | 460 | from the product XLSX |
| places | 35 | from the map XLSX |
| stores | 20 | from the where-to-buy XLSX |
| routes | 6 | from the where-to-buy XLSX |
| cheat-sheets | 0 | schema only — source DOCX is a plan, not copy |

**Every entry is `needs_verification` / `v1_candidate` / `hold` / `content_only`
— 0 are `ready`, so nothing renders publicly.** The public render gate is
`status === "ready"`, enforced in every V2 card component.

- Schemas: `src/content/schemas.ts` (shared) + `src/content.config.ts`.
- Conversion: `scripts/convert-source.mjs` (`npm run convert`) — reads
  `data/source/*.xlsx` (gitignored) → `src/content/<collection>/*.yaml`
  (committed).
- Components: `src/components/v2/*.astro` — five unstyled card scaffolds
  (`ProductCard`, `PlaceCard`, `StoreCard`, `RouteCard`, `CheatSheetCard`).

Open follow-ups (Phase A):
- Product `category`: 151 / 460 entries map to `other` (coarse 10-value enum vs
  29 source values). Remap in `convert-source.mjs` before the public
  category-filter UX. See the TODO in `phase-a-conversion-summary.md`.
- `JF-0446` skipped — a confirmed true duplicate of `JF-0373`.
- cheat-sheets need hand-authoring — the source DOCX is a research plan.

### V2 Phase B — next session

**Shopping Lists pages.** Expected scope:
- Select the verified launch products and promote `v1_candidate` → `ready` in
  the product YAML (from a verified launch list — not yet provided).
- Build the public Shopping Lists UI, with empty states where no `ready` rows
  exist yet.
- Remap product categories ahead of the filter UX.

## Key files & directories

```
BUILD_SPEC.md                 V1 spec
V2_PHASE_A_BUILD_SPEC.md       V2 Phase A spec
DEPLOY.md                      deploy, DNS, maintenance
phase-a-column-audit.md        Phase A — source audit
phase-a-conversion-summary.md  Phase A — conversion record + TODOs
design/                        locked V1 comps + HANDOFF.md
src/pages/                     index.astro, accessibility.astro
src/components/                V1 section components
src/components/v2/             V2 card scaffolds
src/content.config.ts          collection definitions
src/content/schemas.ts         shared Zod schemas
src/content/<collection>/      generated YAML (committed)
scripts/convert-source.mjs     XLSX → YAML conversion
data/source/                   source XLSX/DOCX (gitignored)
```

## Commands

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run convert` — regenerate content YAML from `data/source/`

## Conventions

- Locked palette, type stack, and banned-words list — in `BUILD_SPEC.md`.
- V2 extends V1 in the same project; V1 code is left untouched.
- Public render gate: only content with `status: "ready"` is shown.
