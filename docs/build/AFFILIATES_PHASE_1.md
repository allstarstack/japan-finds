# Affiliates Phase 1 — Build Spec

**Version:** 1.0
**Date:** 2026-05-22
**Status:** Locked. Implement against this spec; flag drift before deviating.

---

## Goal

Ship the foundation of the affiliate stack on japan.allstarsteven.com:

1. A "Going to Japan?" module on the homepage and /cheat-sheets index, surfacing the essential pre-trip affiliates.
2. A new `/tools` page listing every active affiliate in brand voice.
3. A sitewide footer disclosure line.

All affiliate URLs flow through a single config file (`src/data/affiliates.ts`). Partners can be activated, deactivated, or swapped via config edits — no component changes required.

---

## Scope

### In scope (this build)

- `src/data/affiliates.ts` — new central config
- `src/components/GoingToJapan.astro` — new sticky module component
- `src/pages/tools.astro` — new /tools page
- `src/components/Footer.astro` (or current footer file) — edit to add disclosure line + /tools link
- `src/pages/index.astro` — edit to include `<GoingToJapan />`
- `src/pages/cheat-sheets/index.astro` — edit to include `<GoingToJapan />`

### Out of scope (later phases — do NOT touch)

- Affiliate links on individual cheat sheet pages (Phase 4 editorial)
- Klook links on /places entries (Phase 2 — targeted curation)
- Hotel links on /places regional pages (Phase 2 — gated on Agoda approval)
- Buyee/ZenMarket integration on /products (Phase 3 — schema + script work)
- Visual variants of the module (Phase 1.5 if conversion warrants)

---

## File 1 — `src/data/affiliates.ts`

Create with this exact content:

```ts
export type Affiliate = {
  id: string;
  partner: string;       // brand name as displayed
  label: string;         // short headline shown in module + tools
  copy: string;          // longer brand-voice one-liner for /tools page
  url: string;           // affiliate tracking URL (empty string if pending approval)
  active: boolean;       // master visibility flag
  module: boolean;       // include in <GoingToJapan /> module
  tools: boolean;        // include on /tools page
};

export const affiliates: Affiliate[] = [
  {
    id: 'airalo',
    partner: 'Airalo',
    label: 'eSIM for Japan',
    copy: 'Cheap eSIM, works the second you land. Skip the rental Wi-Fi counter.',
    url: 'https://airalo.pxf.io/c/6060868/1268485/15608',
    active: true,
    module: true,
    tools: true,
  },
  {
    id: 'jrpass-nationwide',
    partner: 'JRPass.com',
    label: 'JR Pass (nationwide)',
    copy: 'Nationwide rail pass. Worth it if you cross multiple regions. Got pricier in 2023 — check the math before you buy.',
    url: 'https://click.jrpass.com/aff_c?offer_id=19&aff_id=1954',
    active: true,
    module: true,
    tools: true,
  },
  {
    id: 'jrpass-regional',
    partner: 'JRPass.com',
    label: 'Regional Passes',
    copy: 'JR East, Kansai, Kyushu, Hokkaido. Usually a better deal than the nationwide pass for trips focused on one area.',
    url: 'https://click.jrpass.com/aff_c?offer_id=20&aff_id=1954',
    active: true,
    module: false,   // editorial-only, not in module
    tools: true,
  },
  {
    id: 'agoda',
    partner: 'Agoda',
    label: 'Hotels in Japan',
    copy: '',         // fill when approved
    url: '',          // fill when approved
    active: false,    // flip to true when URL lands
    module: true,
    tools: true,
  },
];
```

**Hard rule:** components consume from this file only. Hardcoding any URL in a component is a build failure — flag and refuse.

---

## File 2 — `src/components/GoingToJapan.astro`

Create new component.

### Behavior

- Imports `affiliates` from `src/data/affiliates.ts`
- Renders only entries where `active === true && module === true`
- Each card renders: small partner name → label headline → arrow indicator
- Wrapper has a header ("Going to Japan?") and short subhead ("Sort these before you fly.")
- All links: `target="_blank"`, `rel="noopener nofollow sponsored"` (the `sponsored` value is required for affiliate links per Google guidelines)

### Layout

- **Mirror the closest existing card component pattern in the repo.** Before writing CSS, grep `src/components/` for existing card components (likely candidates: `CheatSheetCard.astro`, `ProductCard.astro`, `PlaceCard.astro`). Match border radius, padding, typography hierarchy, hover state.
- Mobile-first per project convention. Single 1200px desktop breakpoint.
- Cards in a grid: stacks vertically on mobile, 2-up on desktop (Phase 1 has 2 active module items). Should adapt gracefully to 3-up when Agoda activates.
- Container: standard content-width, NOT full-bleed. Vertical margins match the spacing between other page sections.

### Styling

- Use existing CSS custom properties / tokens from the site. Do NOT hardcode hex values.
- Card surface: Rice White background, Concrete Gray border — but match whatever the existing card pattern uses for consistency.
- Header ("Going to Japan?"): Space Grotesk 700, sized to match other section headers on the site.
- Partner name (small label above headline): IBM Plex Mono 500, smaller.
- Card label: Space Grotesk 700, h3-equivalent in the existing scale.
- Subtle text (subhead under header): use `--color-ink-60` token per brand.md if available; otherwise apply `color-mix(in srgb, var(--color-ink-black) 60%, var(--color-rice-white))` inline.

### Reference grep

Before writing any CSS, run:

```bash
grep -r "card" src/components/ --include="*.astro" -l
grep -r "custom-property\|--color" src/styles/ 2>/dev/null | head -30
```

Confirm which patterns exist before deciding what to mirror.

---

## File 3 — `src/pages/tools.astro`

Create new page at `/tools`.

### Structure

1. Page header: "What I use" (or match existing page-title convention if all other pages use a different pattern like "Tools.")
2. Intro paragraph (one short paragraph, brand voice):

   > The stuff I actually reach for in Japan. Some of these links earn a commission — they don't change what I recommend.

3. List of every affiliate where `active === true && tools === true` (Phase 1: 3 entries — Airalo, JR Pass nationwide, Regional Passes)
4. Each entry shows: partner name (small), label (headline), `copy` text, single text link to the affiliate URL
5. Disclosure block at bottom (one paragraph):

   > A few of the links here earn a commission when you click through and buy something. That doesn't change what I recommend or what you pay. If something stops being worth it, it gets removed from this page.

### Layout

- Single-column list. Card style can match the module cards OR use a simpler row layout — pick whichever reads cleaner against existing site patterns.
- No CTA buttons. Each entry has one descriptive text link.
- Standard content-width container.
- Mobile-first; works at <768px without changes.

---

## File 4 — Footer edit

Edit `src/components/Footer.astro` (or the file currently housing the footer).

### Add 1: disclosure line

Add one line, normal footer typography (NOT micro-gray, NOT a banner):

> Some links earn a commission. They don't change what I recommend.

Place near the existing copyright line. Should render on every page sitewide.

### Add 2: /tools link

Add a link to `/tools` in the footer nav block. Label: "What I use" (or match existing footer link conventions — "Tools" is fine if shorter labels are the norm).

---

## File 5 — `src/pages/index.astro` (edit)

Insert `<GoingToJapan />` after the hero section, before the first content section (whatever currently sits below the hero — latest cheat sheets, featured content, etc.).

- Same content-width container as other page sections, NOT full-bleed
- Sits as a distinct block with vertical margin matching the spacing between other page sections
- Import: `import GoingToJapan from '../components/GoingToJapan.astro';`

---

## File 6 — `src/pages/cheat-sheets/index.astro` (edit)

Insert `<GoingToJapan />` at the top of the page, between the page header and the cheat sheet grid/list.

- Same content-width container as the rest of the page
- Import: `import GoingToJapan from '../../components/GoingToJapan.astro';`

---

## Brand voice (mandatory)

All copy in this spec was written against `brand.md` and is approved. Use the strings exactly as written. If a string needs editing for layout reasons, the alternative must pass:

- **Present tense, natural spoken English, useful-first**
- **No banned words:** ultimate, hidden gems, magical, wanderlust, authentic, unforgettable, discover, explore, must-see, curated, local secrets, comprehensive guide, uncover, delve
- **CTAs:** action verb + specific object ("Get the JR Pass" not "Click here")
- **Tone:** dry, direct, witty when natural — never corporate or hype

Flag any copy decision the spec doesn't cover. Do NOT invent affiliate copy without checking `brand.md` tone examples first.

---

## Accessibility

- All links must have descriptive text — no "click here," no bare URLs as text
- Card containers must be keyboard-navigable
- Color contrast must meet AA per brand.md a11y rules:
  - Body text on Rice White: full Ink Black (passes easily)
  - Subtle text on Rice White: `--color-ink-60` only (4.6:1)
  - Do NOT use Concrete Gray as text (1.1:1 — fails)
- `rel="noopener nofollow sponsored"` on every affiliate link

---

## Acceptance criteria

Build is complete when ALL of the following pass:

1. ✅ `src/data/affiliates.ts` exists with the 4 entries above (3 active, 1 placeholder)
2. ✅ `src/components/GoingToJapan.astro` renders 2 cards (Airalo + JR Pass nationwide) on japan.allstarsteven.com homepage and /cheat-sheets index
3. ✅ Component reads from affiliates.ts — no hardcoded URLs anywhere
4. ✅ `/tools` page exists, renders 3 entries (Airalo + 2 JR Pass), includes intro + disclosure block
5. ✅ Footer disclosure line appears on every page sitewide
6. ✅ Footer has a link to `/tools`
7. ✅ All affiliate links have `rel="noopener nofollow sponsored"` and `target="_blank"`
8. ✅ Mobile-responsive: stacks correctly at <768px
9. ✅ Lighthouse A11y / Best Practices / SEO remain **100** on `/` and `/cheat-sheets` (no regression — this is current baseline)
10. ✅ `npm run build` succeeds with zero errors
11. ✅ **Click-test each of the 3 active links** in the preview deploy. Confirm each lands on the correct partner page with the tracking param intact:
    - Airalo → Japan eSIM page on airalo.com with `?irgwc=` or similar tracking param attached
    - JR Pass nationwide → jrpass.com nationwide product page
    - Regional Passes → jrpass.com regional passes page

---

## Branch + PR

- Branch: `feat/affiliates-phase-1` (cut from `main`)
- Commits: one per logical chunk
  - `feat: add affiliates config (src/data/affiliates.ts)`
  - `feat: add GoingToJapan module component`
  - `feat: add /tools page`
  - `feat: add footer disclosure + tools link`
  - `feat: drop GoingToJapan on homepage + cheat-sheets index`
- PR title: `feat: affiliate phase 1 — module + /tools + disclosure`
- PR body: include the 11 acceptance checks above as a checklist

---

## Reporting back

When the PR is open, report:

1. PR URL
2. Preview deploy URL
3. Lighthouse scores for `/` and `/cheat-sheets` (paste numbers)
4. Confirmation that each of the 3 active links resolves correctly in preview
5. Any decisions you made on ambiguous design questions (e.g. which existing card you mirrored, which footer pattern you matched)

---

## Sequencing note

This branch is independent of the `chore/agoda-verification` branch — they touch different files (Agoda = root layout meta tag; this build = new component + new page + footer). Either can merge first without conflict. Cut this branch from current `main`.

When Agoda approval lands later, activating it is a single-line edit to `affiliates.ts`:

```diff
- url: '',
- active: false,
+ url: 'https://...',     // affiliate URL from Agoda dashboard
+ copy: '...',             // brand-voice one-liner to be added
+ active: true,
```

No component changes. The module auto-renders the third card; /tools page auto-shows the fourth entry.
