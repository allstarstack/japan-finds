# BUILD_SPEC: /cheat-sheets

**Phase:** B-3 (Travel Cheat Sheets)
**Branch:** `phase-b3-cheat-sheets`
**Estimated build time:** 3–4 hr Claude Code
**Author chat:** Japan Finds — Phase B-3 content + spec

---

## Goal

Add the cheat-sheets section to **japan.allstarsteven.com**. Render 9 sheets at `/cheat-sheets/[slug]`, an index at `/cheat-sheets`, a 301 redirect for the dropped Rainy-Day Saves sheet, and add "How" to the main nav.

Content is already written and lives at `/mnt/user-data/outputs/` from the Phase B-3 content chat (9 .md files). Claude Code's job is to render them, not edit them.

---

## Stack constraints

- **Astro 6 + vanilla CSS + Vercel.** No frameworks beyond what the site already uses.
- **No external font CDNs.** Space Grotesk, Inter, IBM Plex Mono are self-hosted woff2.
- **Brand spec is the source of truth** (`brand.md` in Claude project files). Palette, type, voice rules apply.
- Existing `/products` and `/places` content collections set the pattern. Follow them.

---

## 1. Routes

| Route | Purpose |
|---|---|
| `/cheat-sheets` | Index — list of 9 sheets with title, lede, last_verified |
| `/cheat-sheets/[slug]` | Individual sheet rendering |
| `/cheat-sheets/rainy-day-saves` | 301 redirect → `/places?rainy_day` |

---

## 2. Content collection

Create `src/content/cheat-sheets/` collection. Place the 9 .md files there:

```
src/content/cheat-sheets/
  first-24-hours.md
  ic-cards.md
  phone-setup.md
  cash-cards-atms.md
  luggage-forwarding.md
  jr-pass.md
  donki-drugstore-taxfree.md
  konbini.md
  japan-with-kids.md
```

Update `src/content/config.ts` to register the collection with the schema below. Match the conventions used for the existing `products` and `places` collections.

---

## 3. Frontmatter schema

```typescript
import { z, defineCollection } from 'astro:content';

const cheatSheets = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    last_verified: z.date(),
    verify_before_publish: z.array(z.object({
      field: z.string(),
      note: z.string(),
    })).optional(),
    medical_caution: z.boolean().optional(),
  }),
});

export const collections = {
  // ... existing collections
  'cheat-sheets': cheatSheets,
};
```

---

## 4. Sheet page rendering

`src/pages/cheat-sheets/[slug].astro`

Each .md file is structured as:

```
# {title from H1}

{subtitle/frame line — short directive about what the sheet covers}

{lede — the brand-voice declarative one-liner}

## {section 1}
...
## {section 2}
...
---

Last verified: 2026-05-18
```

Astro renders the Markdown as-is. Don't transform the body. Just inherit the existing site layout, apply the brand type tokens, and let the H1/H2 hierarchy carry the structure.

### Frontmatter rendering

- `<title>` and `<meta name="description">` come from frontmatter `title` and the lede line (extract at build time — second paragraph after H1).
- Footer `Last verified: {{last_verified}}` is rendered from frontmatter, formatted as `YYYY-MM-DD`. **The `---` and "Last verified:" line at the bottom of each .md file should be stripped** during render so it doesn't double up — render the footer from frontmatter only.
  - Implementation note: easiest path is to leave the trailing line in source and let the renderer ignore it, OR run a small content transform on import. Pick whichever is cleaner in this codebase.

### Link rendering

All Markdown links render as descriptive text — no bare URLs displayed inline. External links: same tab, no `target="_blank"` unless explicitly requested elsewhere.

### Medical caution flag

For sheets where `medical_caution: true` (currently only `donki-drugstore-taxfree.md`), render a small callout **above** the H1:

> Some content covers medications and import rules. Not medical advice — official sources linked inline.

Style:
- Concrete Gray (`#E6E1D8`) border, 1px, full width of content column
- Padding: small, ~12px vertical
- Text: Inter 400, slightly smaller than body
- Label "Heads up" in IBM Plex Mono 500, before the message
- Not alarming. No red, no icons, no warning shapes.

---

## 5. Index page rendering

`src/pages/cheat-sheets/index.astro`

Lists all 9 sheets. Each item:

- **Title** — Space Grotesk 700, H2-sized
- **Lede** — single paragraph (the brand-voice one-liner from the source file)
- **`Last verified: YYYY-MM-DD`** — small, Concrete Gray, IBM Plex Mono
- **Entire card links to the sheet**

No hero image. No decorative styling. Match the dense `/products` and `/places` listing aesthetic.

### Order

Hardcoded, matches source-of-truth publish order:

1. `first-24-hours`
2. `ic-cards`
3. `phone-setup`
4. `cash-cards-atms`
5. `luggage-forwarding`
6. `jr-pass`
7. `donki-drugstore-taxfree`
8. `konbini`
9. `japan-with-kids`

Either hardcode the slug array in `index.astro` or add an `order: number` field to frontmatter. Prefer the hardcoded array — fewer moving parts, order is editorial not data.

### Page subtitle

Above the list, render a short intro line:

> The stuff people actually DM about. Practical first, witty second. Verified before publish.

H1 of the index: **Cheat sheets**

---

## 6. Redirect

`/cheat-sheets/rainy-day-saves` returns **HTTP 301** → `/places?rainy_day`.

Use whichever pattern the existing repo handles redirects in:
- If `vercel.json` already has a `redirects` block — add it there.
- If Astro middleware (`src/middleware.ts`) handles redirects — add it there.
- Don't introduce a new pattern just for this one redirect.

Test: visiting `/cheat-sheets/rainy-day-saves` should land on `/places?rainy_day` with the `rainy_day` filter chip already active.

---

## 7. Nav update

Add "How" to main nav, linking to `/cheat-sheets`.

**Final nav order:**

```
Finds (products) · Where (places) · Eat (restaurants) · How (cheat sheets)
```

### ⚠ Coordinate with Phase C /eat

Phase C (`/eat`) is being built in a parallel chat (Chat C) and is also adding a nav item. Both will touch the nav component file.

- Whichever PR merges first adds its item.
- The second PR rebases on main and adds the remaining item.
- Final state after both merge: all four nav items present, in the order above.

Watch for merge conflicts on the nav file. If both PRs target the same lines, the second-merged PR needs a manual rebase.

---

## 8. Verification surfacing (dev-only)

Goal: surface unresolved `verify_before_publish` entries so Steven can review before publishing each sheet.

### MVP: build-time script

Add an npm script:

```json
"scripts": {
  "verify-status": "node scripts/verify-status.mjs"
}
```

`scripts/verify-status.mjs` reads all `src/content/cheat-sheets/*.md` frontmatter and prints:

```
Cheat sheets — unresolved verify entries:

first-24-hours.md (last verified: 2026-05-18)
  • atm_fees_by_card_network
    Seven Bank / Japan Post current fees by card network
  • esim_provider_prices
    Airalo / Ubigi / Sakura / Mobal / Klook pricing changes frequently
  • yamato_route_specific_pricing
    Bag forwarding fees vary by destination route

ic-cards.md (last verified: 2026-05-18)
  • suica_refund_handling_fee
    Confirm current handling fee on remaining balance at refund
  ...

Sheets with zero unresolved entries: 0/9
```

When Steven verifies an item, he removes that entry from the frontmatter and (optionally) bumps `last_verified`. The script re-run shows progress.

### Phase 2 (nice-to-have, not v1 blocker)

A dev-only banner on the rendered sheet page showing unresolved entries when `import.meta.env.DEV === true`. Hidden in production.

Don't build the banner if it adds significant time. The CLI script is enough for v1.

### Not a build blocker

Sheets with unresolved verify entries should still build and render fine. This is informational, not gating.

---

## 9. Acceptance criteria

- [ ] All 9 sheets render at `/cheat-sheets/[slug]` with frontmatter schema enforced (build fails on bad frontmatter)
- [ ] Index renders at `/cheat-sheets` in the order specified
- [ ] 301 redirect works at `/cheat-sheets/rainy-day-saves` → `/places?rainy_day`
- [ ] Nav adds "How" pointing to `/cheat-sheets`
- [ ] `npm run verify-status` lists unresolved verify entries per sheet
- [ ] `medical_caution: true` callout renders on `donki-drugstore-taxfree.md`, not on others
- [ ] Lighthouse mobile 95+ on `/cheat-sheets` index and on at least 3 sampled sheet pages
- [ ] No layout shift on font load (Space Grotesk, Inter, IBM Plex Mono — all self-hosted woff2)
- [ ] No external font CDN calls in the build output
- [ ] Existing `/products` and `/places` pages render unchanged
- [ ] Brand palette adhered to (Rice White / Ink Black / Concrete Gray base, accents only where existing site already uses them)

---

## 10. Out of scope (v1)

Park these. Iterate after launch based on traffic.

- Search across cheat sheets
- Per-sheet TOC sidebar
- "Related sheets" footer links
- Print stylesheet
- RSS feed
- Multilingual versions
- OG image generation per sheet (use existing site default OG for now)

---

## 11. Files to create/modify

**New:**
- `src/content/cheat-sheets/*.md` — 9 content files (from /mnt/user-data/outputs/)
- `src/pages/cheat-sheets/index.astro` — index
- `src/pages/cheat-sheets/[slug].astro` — dynamic sheet page
- `scripts/verify-status.mjs` — verify surfacing script

**Modified:**
- `src/content/config.ts` — add `cheat-sheets` collection schema
- `vercel.json` or `src/middleware.ts` — add rainy-day redirect
- Nav component (whichever file) — add "How" item
- `package.json` — add `verify-status` script

---

## 12. Voice and brand notes

- The 9 .md files were drafted to brand voice in the content chat. **Do not edit content during the build.** If a sentence reads oddly during dev: leave it. Voice changes happen in the content chat, not at build time.
- Banned words list in `brand.md` is already enforced editorially — no build-time lint rule needed.
- The `medical_caution` callout text above is approved copy. Don't paraphrase.

---

## 13. Reporting back

When the build is done, the Claude Code chat should report:

- Vercel preview URL
- Lighthouse scores (mobile) for index + 3 sample sheets
- Any acceptance criteria not met, with reason
- A short note on whether nav coordination with Phase C is resolved at merge time

Steven updates PROJECT_STATE.md when the merge lands.
