# HANDOFF — "Going to Japan?" section

> ## AMENDED 2026-05-27 — pivot to cheat-sheet previews
>
> The spec below (V2: ordered by lead time, 6 affiliate cards) shipped
> against this handoff and was force-pushed away the same day. The
> affiliate-checklist direction duplicated `/cheat-sheets`, which is
> the canonical depth surface for the same information. Affiliate
> links live inside individual cheat sheets and were untouched by this
> pivot.
>
> **What the section is now:** a homepage-only 6-card preview of
> featured cheat sheets that funnels into `/cheat-sheets/<slug>`. No
> outbound affiliate links from this surface.
>
> **What changed vs the spec below:**
>
> - **Content source:** the `cheat-sheets` content collection
>   (`src/content/cheat-sheets/*.md`) instead of `src/data/affiliates.ts`.
>   Affiliate placeholders that were added in the first PR (SafetyWing,
>   Wise, Ninja WiFi, Welcome Suica) were reverted; `affiliates.ts`
>   returns to pre-PR state and `/tools` continues consuming it
>   unchanged.
> - **Featured slugs (hardcoded, editorial order):** `first-24-hours`,
>   `phone-setup`, `ic-cards`, `jr-pass`, `cash-cards-atms`,
>   `luggage-forwarding`. Intentionally different from the
>   `/cheat-sheets` index `SHEET_ORDER` so the two surfaces stay
>   decoupled.
> - **Per-card content:** 01–06 numeral (kept from V2), cheat-sheet
>   title (Inter 700), tagline pulled by `extractLede(entry.body)`
>   from `src/data/cheat-sheets.js` (Inter 400, ink-60), "Updated
>   YYYY-MM-DD" chip using `last_verified` from frontmatter (same
>   bordered concrete-pill styling as the V2 lead-time chip), "Read
>   the guide →" CTA pointing at `/cheat-sheets/<slug>`. Brand label
>   slot dropped.
> - **Tagline flag:** cheat-sheet frontmatter carries no `tagline`
>   field. The brand one-liner already lives in the markdown body and
>   is pulled by `extractLede()` for the existing `/cheat-sheets`
>   list — reused here so the source files remain the single source of
>   truth. No `.md` migration required.
> - **Section copy:** title "Going to Japan?" and subtitle "Sort these
>   before you fly." kept verbatim. Eyebrow updated to "Practical
>   first · verified before publish". Desktop right-aligned tag updated
>   to "6 guides · before you fly".
> - **Section footer:** added a "View all cheat sheets →" link to
>   `/cheat-sheets` below the card grid.
> - **Visual treatment kept from V2:** mobile-first single-column
>   timeline rows with shared borders, 3-up card grid at ≥1024px,
>   palette and type stack unchanged (Rice / Ink / Concrete +
>   `--color-ink-60`; Space Grotesk 700, Inter 400/700, IBM Plex Mono
>   500).
> - **Homepage placement:** moved below `<StartHere />` (§01). After
>   the pivot the section reads as deeper-reading downstream of the
>   four orientation cards, not as a pre-Hero affiliate checklist.
> - **`/cheat-sheets` adoption:** dropped. The `fluid` prop was
>   removed from the component and the `<GoingToJapan fluid />` call
>   site was removed from `src/pages/cheat-sheets/index.astro` — the
>   section would otherwise have made `/cheat-sheets` link to itself.
>   Component is homepage-only.
>
> The original spec is preserved below as historical record. Do not
> implement it again — use the amended direction.
>
> ---

**Surface:** "Going to Japan?" section
**Repo / file path:** [FILL IN — e.g. allstarsteven.com/components/sections/GoingToJapan.jsx]
**Finalist:** V2 — Ordered by lead time
**Visual source of truth:** `Going_to_Japan_-_Variants_v3__standalone_.html` (attached). Extract V2 only. Ignore V1 and V3.
**Status:** brief-compliant, structurally sound. Implement as-spec'd. Do not improvise.

---

## Brand tokens — do not introduce others

**Palette (only these hex values):**
```
--rice:     #F7F3EA
--ink:      #151515
--concrete: #E6E1D8
```
Opacity derivatives on ink (0.55, 0.7, 0.75) acceptable for hierarchy. No introduced hues.

**Typography (only these three families/weights):**
```
--fh: "Space Grotesk", 700  — heads, CTAs, numerals at display size if used
--fb: "Inter", 400          — body, detail strings
--fm: "IBM Plex Mono", 500  — eyebrow, brand label, lead-time chip, mono numerals, CTA
```

---

## Voice rules — do not violate

**Banned words anywhere in copy or microcopy:** ultimate, hidden gem, magical, wanderlust, authentic, unforgettable, discover, explore, must-see, curated, uncover, delve, journey, embark, comprehensive guide, local secrets.

**Banned imagery:** Mt. Fuji, torii, cherry blossoms, Shibuya neon, shrines as decoration, AI-generated Japan photography, travel-magazine aesthetics. No travel-mood imagery of any kind.

---

## Component spec — V2

**Section title:** "Going to Japan?"
**Subtitle:** "Sort these before you fly."
**Item count:** 6
**Items — lead-time ordered, DO NOT reorder:**

| # | Brand | Name | Detail | Lead time |
|---|---|---|---|---|
| 01 | SafetyWing | Travel insurance | Active before non-refundable bookings. | Before booking |
| 02 | Wise | Multi-currency card | Order, receive, activate. | 2 weeks ahead |
| 03 | JRPass.com | JR Pass (nationwide) | Buy online, voucher arrives by mail. | 1 week ahead |
| 04 | Ninja WiFi | Pocket WiFi rental | Reserve airport-counter pickup. | 3 days ahead |
| 05 | Airalo | eSIM for Japan | Install now, activates on landing. | Day before |
| 06 | Welcome Suica | IC card for tourists | Grab from an airport kiosk. | On arrival |

**Layout:**
- Mobile (≤768px): single-column connected list, shared borders between rows
- Desktop (≥1024px): 3-column grid, 14px gap, equal-weight cards
- Mobile-first build. Implement mobile, then progressively enhance.

**Per-item rendering:**
- Numeral 01–06 — mono, top-left
- Brand label — mono, uppercase, top-right
- Lead-time chip — mono, uppercase, bordered with concrete 1px, top of card body
- Item name — Inter 700, primary ink
- Detail string — Inter 400, ink at ~0.7 opacity
- "Open →" CTA — mono, uppercase, bottom of card. Single verb across all six. No variation.

**CTA behavior:** outbound link to affiliate destination per item. Placeholder URLs acceptable for first pass.

---

## Acceptance criteria

1. Renders correctly at 390px and 1200px without overflow or layout collapse.
2. No introduced colors, fonts, or imagery — match palette and type stack exactly.
3. All six items present in lead-time order (do not re-sort).
4. CTA `href` wired per item; placeholders fine for v1.
5. Lead-time chip visible on both mobile and desktop renderings.
6. FTC affiliate disclosure present somewhere on the page if not already site-wide.

---

## Deferred — do not guess, do not improvise

1. **Copy in voice.** The current detail strings are operationally accurate but written flat. Steven owns the voice rewrite. Ship with current copy; do not rewrite during implementation.
2. **Editorial layout move.** Candidate moves (64–96pt mono numerals, asymmetric grid with one promoted card, single editorial pull-quote between rows) deferred to a second pass after first implementation. Do not add unsolicited.
3. **Affiliate URLs per item.** Placeholder OK for v1.

---

## Flag, do not reconcile silently

- If existing brand tokens in repo differ from those above → flag, do not auto-reconcile.
- If existing component patterns conflict with this spec (different grid system, different font import) → flag before adapting.
- If a "Going to Japan?" section already exists in the codebase → flag and confirm replacement vs new file.
- If anything in the V2 source JSX is ambiguous or conflicts with this spec → flag, do not guess.
