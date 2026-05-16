# Japan Finds — Claude Code Handoff
**Direction:** B v2 · Konbini Field Guide (refined)
**Files of record:** `direction-b-v2.jsx` (mobile), `direction-b-v2-desktop.jsx` (desktop), `shared.jsx` (primitives), `Japan-Finds-V1.html` (standalone bundle)
**Approved viewport pair:** 390 mobile · 1440 desktop (max content width 1280)

---

## 1. BRAND COMPLIANCE CHECK

| Locked decision | Status | Evidence |
|---|---|---|
| Rice White `#F7F3EA` | ✅ | CSS var `--rice`; page bg of `.jf-frame` |
| Ink Black `#151515` | ✅ | CSS var `--ink`; body text + outlines |
| Tokyo Signal Red `#FF3B30` | ✅ | CSS var `--red`; primary CTA, FOOD chip, status dot, map pins |
| Konbini Blue `#176BFF` | ✅ | CSS var `--blue`; SHOPS chip, WEIRD tag |
| Matcha Green `#4D8B57` | ✅ | CSS var `--green`; RAINY DAY chip, YES tag, cheat-sheet highlighter |
| Egg Sando Yellow `#FFD84D` | ✅ | CSS var `--yellow`; WEIRDLY USEFUL chip, §03 slab, SHOPPING stripe, Save Pin sparkle |
| Concrete Gray `#E6E1D8` | ✅ | CSS var `--concrete`; §05 background |
| Space Grotesk (headlines) | ✅ | CSS var `--fh`; class `.jf-hd` and all `h1`/`h2`/CTA labels |
| Inter (body) | ✅ | CSS var `--fb`; body copy default |
| IBM Plex Mono (labels) | ✅ | CSS var `--fm`; eyebrows, chips, microcopy, prices |
| Wordmark: "Japan Finds" + "BY ALLSTARSTEVEN" tagline | ✅ | Header + footer on both viewports |
| No "V1" in public copy | ✅ | All eyebrows updated |
| No JF initials | ✅ | Replaced with Save Pin |
| No yellow-star-on-red flag composition | ✅ | Star demoted to small sparkle accent on Save Pin |
| No fake metrics ("142 pins", "38 lists") | ✅ | Removed; replaced with "UPDATED REGULARLY" |
| Email = welfmgmt@gmail.com | ✅ | Partner section |
| Footer descriptor "MAPS · LISTS · WEIRDLY USEFUL FINDS" | ✅ | Mobile + desktop |
| Footer sign-off "© 2026 ALLSTARSTEVEN" + "Made with egg sando and anxiety." | ✅ | Mobile + desktop |
| **No deviations from locked palette/type/brand decisions detected.** | ✅ | — |

---

## 2. DESIGN TOKENS

### 2.1 Colors

| Token | Hex / value | Role | Where applied |
|---|---|---|---|
| `--rice` | `#F7F3EA` | Primary page background | `body` background area, Save Pin teardrop fill, input field bg |
| `--ink` | `#151515` | Primary text + outlines | All body/heading text default, all 1.5px outlines, ink-button bg, footer bg |
| `--concrete` | `#E6E1D8` | Secondary surface | §05 Shop Waitlist background |
| `--red` | `#FF3B30` | Primary CTA, category accent (FOOD) | Primary buttons, FOOD chip, status dots, Save Pin center, highlighter sticker in §02 map h2 |
| `--blue` | `#176BFF` | Category accent (SHOPS, WEIRD) | SHOPS chip, WEIRD tag in receipts |
| `--green` | `#4D8B57` | Category accent (RAINY DAY, YES) | RAINY DAY chip, YES tag, §04 highlighter sticker |
| `--yellow` | `#FFD84D` | Category accent (WEIRDLY USEFUL, SHOPPING) | WEIRDLY USEFUL chip, SHOPPING category stripe, §03 background slab, Save Pin sparkle |
| `--ink-60` | `#1515159e` (rgba ≈ 0.62) | Secondary text | Captions, microcopy, support line, eyebrow accent |
| `--ink-30` | `#1515154d` (rgba ≈ 0.30) | Dashed borders | Receipt row dividers, hero trust-strip top border |
| `--ink-15` | `#15151526` (rgba ≈ 0.15) | Hairline dividers | Logo card lockup container border |
| `--hair` | `#1515151a` (rgba ≈ 0.10) | Section hairlines | Partner section internal dividers |
| Header tagline ink | `rgba(21,21,21,0.75)` | Tagline | "BY ALLSTARSTEVEN" under wordmark (light bg) |
| Footer tagline white | `rgba(255,255,255,0.75)` | Tagline | "MAPS · LISTS · WEIRDLY USEFUL FINDS" (dark bg) |
| Footer body white | `#fff` | Footer text | Footer column links |
| Footer dim white 1 | `rgba(255,255,255,0.55)` | Footer copyright row | "© 2026 ALLSTARSTEVEN" line |
| Footer dim white 2 | `#fff8` (≈ 0.53) | Footer column labels | "SITE", "MORE", "FOLLOW" |
| Footer dim white 3 | `#fff6` (≈ 0.40) | Sign-off italics | "Made with egg sando and anxiety." |
| Section background variant | `#f1ecdd` | §01 Start Here background | Warm rice tint, between rice and concrete |
| Photo placeholder · sand | bg `#ddd5c4` / stripe `#cfc6b1` / ink `#5a5142` | Warm imperfect-photo tone | Soba, default warm imagery |
| Photo placeholder · moss | bg `#c9d3c3` / stripe `#bcc6b3` / ink `#3b4a36` | Green imperfect-photo tone | Ramen, rainy-day mall |
| Photo placeholder · sky | bg `#c7d4e6` / stripe `#b7c6db` / ink `#2d3e58` | Blue imperfect-photo tone | (defined but unused in current pages) |
| Photo placeholder · cream | bg `#ece4cf` / stripe `#dfd6bb` / ink `#5d5238` | Cream imperfect-photo tone | Egg sando, food row thumbs |
| Photo placeholder · grey | bg `#cfcbc1` / stripe `#bebab0` / ink `#3a3833` | Neutral imperfect-photo tone | Skip row in receipt |
| Photo placeholder · pink | bg `#e8cfc7` / stripe `#dabfb6` / ink `#5a3e36` | Warm imperfect-photo tone | Cafe au lait, Donki |
| Photo placeholder · char | bg `#3a3833` / stripe `#2e2c28` / ink `#d8d4c8` | Dark imperfect-photo tone | (available, not used in current pages) |

### 2.2 Typography styles

Font stacks:
- `--fh` = `"Space Grotesk", system-ui, sans-serif`
- `--fb` = `"Inter", system-ui, sans-serif`
- `--fm` = `"IBM Plex Mono", ui-monospace, monospace`

| Style name | Family | Size | Weight | Line-height | Letter-spacing | Where applied |
|---|---|---|---|---|---|---|
| Display / H1 (mobile) | fh | 40px | 700 | 0.98 | -0.03em | Mobile hero H1 |
| Display / H1 (desktop) | fh | 84px | 700 | 0.96 | -0.035em | Desktop hero H1 |
| Display / H1 map (mobile) | fh | 34px | 700 | 1.0 | -0.03em | /map mobile H1 |
| Display / H1 map (desktop) | fh | 88px | 700 | 0.96 | -0.035em | /map desktop H1 |
| H2 section (mobile) | fh | 30px | 700 | 1.02 | -0.02em | §01–§05 mobile h2s |
| H2 section (desktop) | fh | 48–54px | 700 | 1.0–1.05 | -0.025em | §01 48px / §02 54px / §03–§05 52px / §06 52px |
| H2 partner (mobile) | fh | 30px | 500 | 1.05 | -0.025em | §06 partner h2 (lower weight by design) |
| H3 / Card title (mobile) | fh | 24px | 700 | 1.05 | -0.02em | Resource cards mobile + desktop |
| H3 / Receipt card title | fh | 18–20px | 700 | 1.0–1.15 | (default) | Receipt h3, list-preview card title |
| H4 / Sticker title | fh | 16px | 700 | 1.15 | (default) | Cheat-sheet sticker, place card, partner spec key |
| Wordmark (mobile/desktop) | fh | 16px / 20px | 700 | 1 | -0.02em | Header + footer "Japan Finds" |
| Body large (desktop) | fb | 19px | 400 | 1.5 | (default) | Desktop hero subhead |
| Body | fb | 14–16px | 400 | 1.45–1.6 | (default) | Section body copy |
| Body support (mobile) | fb | 13px | 400 | 1.55 | (default) | Hero support line (`--ink-60`) |
| Body support (desktop) | fb | 15px | 400 | 1.55 | (default) | Hero support line (`--ink-60`) |
| Tagline | fm | 11px | 400 | 1 | 0.08em | "BY ALLSTARSTEVEN" / "MAPS · LISTS · WEIRDLY USEFUL FINDS" |
| Eyebrow (mobile) | fm | 10–11px | 600 | 1 | 0.14em–0.16em | Hero eyebrow (10px), section eyebrow (11px), microcopy (10px) |
| Eyebrow (desktop) | fm | 11–12px | 600 | 1 | 0.14em–0.16em | Hero eyebrow (11px), section eyebrow (12px) |
| Chip / category label | fm | 10px | 500 | 1 | 0.04em | All chips; uppercase |
| Receipt item name | fh | 14–15px | 600 | 1.2 | (default) | Receipt row left col (mobile 14px / desktop 15px) |
| Receipt item note | fm | 10–11px | 400 | 1 | (default) | Receipt row sub-text (`--ink-60`) |
| Receipt item price | fm | 11–12px | 700 | 1 | (default) | Receipt right col |
| Microcopy italic | fm | 11px | 400 italic | 1.5 | 0.02em | Resource card micro line, partner spec value |
| Button primary | fh | 14–17px | 600 | 1 | -0.01em | Primary CTAs (14 sm / 17 lg) |
| Button secondary | fh | 16px | 500 | 1 | -0.01em | Outline buttons |
| Button ink dark | fh | 15px | 700 | 1 | (default) | "Notify me when it launches" |
| Nav link | fh | 15px | 500 | 1 | (default) | Desktop nav links |
| Status bar | fh | 15px | 600 | 1 | (default) | "9:41" mock |
| Footer column label | fm | 10px | 400 | 1 | 0.1em | "SITE" / "MORE" / "FOLLOW" |
| Footer body | fb | 13–14px | 400 | 1.9–2 | (default) | Footer link rows (mobile 13/1.9 · desktop 14/2.0) |
| Footer copyright | fm | 10–11px | 400 | 1 | 0.06em | Sign-off line(s) |

### 2.3 Spacing

| Value | Used for |
|---|---|
| 3px | Tagline marginTop under wordmark (mobile) |
| 4px | Tagline marginTop under wordmark (desktop), small inline gaps inside chips, partner spec value marginTop |
| 5px | Footer tagline marginTop (desktop) |
| 6px | Chip vertical gap inside flex rows, footer column label marginBottom |
| 8px | Section eyebrow gap; resource card stripe→content gap; primary CTA inner gap; chip horizontal gap in chip rows |
| 10px | Mobile hero eyebrow gap; chip strip gap; sticker padding (small); receipt row gap (mobile) |
| 12px | Mobile section h2 marginBottom; nav SavePin→wordmark gap; sticker padding; receipt row gap (desktop) |
| 14px | Sticker card padding; receipt cell horizontal padding; partner spec grid gap |
| 16px | Mobile resource card padding; mobile section padding (one side); sticker padding |
| 18px | Mobile hero eyebrow marginBottom; sticker grid card padding; receipt grid card padding; ink rule width above eyebrow |
| 20px | Mobile section horizontal padding; CTA padding L/R (lg); chip strip padding |
| 22px | §06 partner mobile h-padding |
| 24px | Mobile hero CTA marginTop; desktop CTA padding L/R; desktop hero eyebrow marginBottom; mobile partner h2 marginBottom |
| 26px | Mobile §06 partner middle band marginBottom |
| 28px | Mobile footer top padding; desktop §06 partner spec marginBottom |
| 30px | Mobile hero vertical padding |
| 32px | Mobile §04 / §05 vertical padding (top); desktop hero CTA marginBottom; desktop nav link gap; desktop §04 cheat-sheet spec marginBottom |
| 34px | Mobile §02 top padding |
| 36px | Mobile footer bottom padding; mobile §05 bottom padding; desktop §01 h2 marginBottom; desktop footer copyright row marginTop |
| 38px | Mobile menu button size |
| 40px | Desktop SavePin size; mobile SavePin in header is 36px |
| 44px | Status bar height |
| 48px | Desktop footer column gap; desktop §06 mobile partner section vertical padding |
| 56px | Desktop footer vertical padding (top); desktop §01 vertical padding (top); desktop /map hero bottom padding |
| 60px | (not used directly — design-canvas internal) |
| 64px | Desktop §02–§05 inter-column gap; desktop §03 / §04 / §05 padding |
| 72px | Desktop hero, §02, §04, §05 vertical padding |
| 80px | Desktop container horizontal padding (`padding:'0 80px'`); desktop hero column gap, §06 column gap; nav height |
| 88px | Desktop §06 partner top padding |
| 1280px | Desktop content max-width |
| 1440px | Desktop viewport target |
| 390px | Mobile viewport target |

### 2.4 Radius, shadows, borders

| Token | Value | Used for |
|---|---|---|
| Radius xs | 3px | Tiny checkbox inside list-preview card |
| Radius sm | 4px | Chip, lockup card thumb in logos page, hero trust-strip dot (8px circle uses 50%) |
| Radius md | 6px | Photo slot small thumb (42–64px), form input, ink-button in form |
| Radius lg | 8px | Photo slot medium (88px), nav menu icon button, back button on /map, JF tile (legacy) |
| Radius card | 10px | All stickers / receipts / resource cards / form cards |
| Radius pill | 999px | Primary + secondary CTAs |
| Radius circle | 50% | Status dots (8/9px), nav menu button (38px) |
| Border default | `1.5px solid var(--ink)` | All sticker cards, receipts, form cards, resource cards, dividers between top/bottom of sections |
| Border accent | `1.5px dashed var(--ink)` | Receipt header divider, list-card "Open list →" divider |
| Border item | `1px dashed var(--ink-30)` | Receipt row dividers, list-preview item dividers |
| Border hair | `1px solid var(--hair)` | Partner section internal dividers |
| Border hairline-15 | `1px solid var(--ink-15)` | Lockup container in logos page |
| Border footer hairline (desktop) | `1px solid rgba(255,255,255,0.15)` | Above footer copyright row |
| Shadow card | `3px 3px 0 var(--ink)` | All sticker / resource / receipt / form cards |
| Shadow ink-button | `2px 2px 0 var(--ink)` | Nav menu button, /map back button, highlighter span behind H2 phrases |
| Shadow ink-button lg | `4px 4px 0 var(--ink)` | Desktop /map H1 highlighter span |

### 2.5 Breakpoints

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | 390px (design target; assume 360–430 in practice) | All mobile artboards built at this width |
| Desktop | 1440px viewport, content max-width 1280px (80px horizontal padding) | Single desktop comp produced; brief noted "1280 if materially different" — not produced because layout is identical with reduced padding |

**No tablet (768–1024) comp produced.** Mid-range behavior is an open question (see §9).

---

## 3. COMPONENT INVENTORY

### Header / Nav

| Field | Mobile | Desktop |
|---|---|---|
| Container | `display:flex; justify-content:space-between; padding:8px 20px 14px; border-bottom:1.5px solid #151515` | `height:80px; max-width:1280px; padding:0 80px` |
| Left cluster | SavePin (36px) + wordmark stack (gap 12) | SavePin (40px) + wordmark stack (gap 12) |
| Wordmark line 1 | "Japan Finds" — fh 16/700/-0.02em | "Japan Finds" — fh 20/700/-0.02em |
| Wordmark line 2 | "BY ALLSTARSTEVEN" — fm 11/400/0.08em/`rgba(21,21,21,0.75)` | Same; marginTop 4 |
| Middle | (omitted on mobile — replaced by hamburger) | 5 nav links flex centered, gap 32, fh 15/500. Active state = `color: var(--red)` (used on /map page) |
| Right | Hamburger menu button: 38×38, 50% radius, 1.5px ink border, two 16×1.5 ink lines stacked, gap 3.5 | "Get the Japan Map →" red primary button, padding 11/18, fh 14/600 |
| States | Hamburger: default only (no open state in comp) | Nav links: default only specified. Active-route uses red. Hover not specified. |

### Hero

| Field | Mobile | Desktop |
|---|---|---|
| Container padding | `30px 20px 30px` | `72px 0 80px` (inside 1280 container) |
| Layout | Single column | 2-col grid `minmax(0,1fr) minmax(0,0.92fr)`, gap 80, alignItems center |
| Eyebrow | Red 8px dot + "JAPAN MAPS · LISTS · TRAVEL SHORTCUTS" fm 10/600/0.14em | Same; dot 9px, fm 11 |
| H1 | 40/700/0.98/-0.03em — 3 lines, 3rd line color = `--ink-60` (Version A) or `--ink` (Version B, A/B test active) | 84/700/0.96/-0.035em; same 3-line structure; 3rd line `--ink-60` |
| Subhead | 15px / lh 1.5 / `--ink` / mb 14 | 19px / lh 1.5 / mb 16 / maxWidth 560 |
| Support | 13px / lh 1.55 / `--ink-60` / mb 24 | 15px / lh 1.55 / `--ink-60` / mb 32 / maxWidth 540 |
| CTA stack | Primary (full-width) then Secondary (full-width), gap 10 | Primary + Secondary inline, gap 12, mb 32 |
| Trust strip | Below CTAs, marginTop 24, paddingTop 18, borderTop 1px dashed `--ink-30`; fm 10/0.06em; 3 items: "● UPDATED REGULARLY" / "● ONE EMAIL · INSTANT MAP LINK" / "FREE" right-aligned | Same items; fontSize 11; paddingTop 18 above border |
| Right column | (none) | "Saved-finds preview": 4 sticker cards absolute-positioned inside a 560px-tall relative container; varied rotation -2°/+2°/-1°/+3°; each card = PhotoSlot + chip row |

### Resource cards (×4)

| Field | Mobile | Desktop |
|---|---|---|
| Container | Vertical stack, mb 14 each | 4-col grid `repeat(4, 1fr)`, gap 20 |
| Card | bg #fff, border 1.5px ink, radius 10, shadow 3/3/0 ink, overflow hidden, height auto | Same, height 380px (fixed) |
| Left stripe | 8px wide × full height, color = category | 10px wide |
| Header row | Category chip (left) + `§0{n}` muted (right, fm 10) | Same |
| Title | fh 24/700/1.05/-0.02em | Same |
| Body | 14px / lh 1.45 / `--ink` / mb 8 | 14px / lh 1.5 / mb 10 |
| Micro | fm 11/italic/`--ink-60` / mb 14 / lh 1.5 | fm 11/italic/`--ink-60` / mb 18 / lh 1.5; bottom-aligned via `margin-top:auto` on button |
| CTA | Ink-button pill: bg #151515, color #fff, padding 10/14, radius 999, fh 14/600 | Same |
| States | Default only specified | Default only; hover behavior unspecified |

### Map preview card (in §02)

| Field | Mobile | Desktop |
|---|---|---|
| Container | Full-width sticker card | Right column of 2-col grid |
| Header strip | 10/12 padding, 1.5px solid bottom border, red 8/9px status dot + "JAPAN-FINDS-MAP / UPDATED REGULARLY" fm 10–11/0.06em | Same |
| Map body | `<MapPreview h={220}>` with 8 pins | `<MapPreview h={420}>` with 9 pins |
| Pin spec | 22×22, teardrop, color = category, white 2px border, ink shadow | Same |
| Filter chips (below card on mobile) | 4 chips with leading bullet | 4 chips, in left column above CTA |

### /map page place card

| Field | Mobile | Desktop |
|---|---|---|
| Container | Sticker, padding 12, absolute-positioned bottom 84 within map area | Inside map sticker, bottom panel, padding 14/16, separated by 1.5px ink top border |
| Thumb | PhotoSlot 56×56, r 6, tone cream | 64×64 |
| Chip + meta | FOOD chip + "SHIMOKITAZAWA" fm 10/`--ink-60` | Same; fm 11 |
| Title | fh 15/700/1.15 "Tiny standing soba · 7 seats" | fh 17/700/1.15 |
| Meta | fm 10/`--ink-60` "CASH · NO ENGLISH · WORTH IT" | fm 11/`--ink-60` |

### Receipt card (mobile §03)

| Field | Spec |
|---|---|
| Container | Sticker card, margin 10/20/0, overflow hidden |
| Header | padding 14/14/12, 1.5px dashed ink bottom; title fh 18/700/1.0; subtitle "SAMPLE LIST · LAWSON / 7-ELEVEN" fm 10/`--ink-60`/0.04em mt 5 |
| Row | padding 11/14, 1px dashed `--ink-30` bottom; `opacity: 0.55` on SKIP rows |
| Row elements | 18×18 checkbox (ink-filled on SKIP, ✕ glyph) + 42×42 PhotoSlot + name (fh 14/600, line-through on skip) + note (fm 10/`--ink-60`) + tag chip + price (fm 11/700, minWidth 40, right) |
| Items | 5 hardcoded items: Egg sando ¥285 YES, Tamago onigiri ¥138 YES, Cafe au lait ¥128 YES, Frozen mikan ¥168 WEIRD, Plastic-wrapped salad ¥498 SKIP |

### List-preview card (desktop §03, ×3)

| Field | Spec |
|---|---|
| Container | bg #fff, 1.5px ink, radius 10, shadow 3/3/0 ink, overflow hidden, flex-column |
| Top photo | PhotoSlot h 140, r 0, label = category tag, tone varies (cream/sand/moss) |
| Title block | padding 14/14/12, 1.5px ink top border; category chip + title fh 20/700/1.15 + meta fm 10/`--ink-60`/0.04em |
| Items | padding 0/14/14; 4 rows with 14×14 checkbox + name (13px) + tag (fm 10/700, color = category) + price |
| Footer "Open list →" | padding 10/14/14, marginTop auto, 1.5px dashed ink top, fh 13/700 |
| Cards | 3: Konbini midnight haul (14 items), Donki without crying (22 items), Drugstore basics that work (11 items) — items lists are sample/illustrative |

### Trust strip (hero)

| Field | Spec |
|---|---|
| Layout | flex row, gap 14/18 (mobile/desktop), align center; mobile mt 24 ptop 18; desktop ptop 18 |
| Top border | 1px dashed `--ink-30` |
| Items | "● UPDATED REGULARLY" / "● ONE EMAIL · INSTANT MAP LINK" / "FREE" (last right-aligned via `margin-left:auto`) |
| Type | fm 10/600/0.06em mobile · fm 11/600/0.06em desktop, color `--ink-60` |

### Sticker grid (§04 cheat sheets)

| Field | Mobile | Desktop |
|---|---|---|
| Layout | grid 1fr 1fr, gap 12 | grid 1fr 1fr 1fr, gap 14 |
| Card | bg #fff, 1.5px ink, radius 10, shadow 3/3/0 ink, padding 14 (mobile) / 16 (desktop) |
| Sheet label | "SHEET · 0X" fm 9–10/0.1em/opacity 0.7, marginBottom 8 |
| Title | fh 16/700/1.15 |
| Open arrow | fh 12/700 "OPEN →", marginTop 12–14 |
| Cards count | 6: Haneda arrival, Suica vs PASMO, eSIMs that actually work, Luggage forwarding (yamato), JR Pass basics, Tipping (don't) |

### Shop Waitlist form card

| Field | Spec |
|---|---|
| Container | bg #fff, 1.5px ink, radius 10, shadow 3/3/0 ink, padding 16 (mobile) / 24 (desktop) |
| Header banner | fm 10–11/0.1em "*** WAITLIST · JAPAN FINDS SHOP ***", border-bottom 1.5px dashed ink, paddingBottom 10/12, marginBottom 14/18 |
| Input | placeholder "your@email.com"; bg #f7f3ea; 1.5px ink border; radius 6; padding 12 mobile / 14 desktop; fb 14/15; marginBottom 10/12 |
| Submit button | full-width; bg `--ink`; color #fff; radius 6; padding 13/14; fh 15/700; label "Notify me when it launches →" |
| Helper text | fm 10/`--ink-60`/0.04em/center "Useful Japan finds and launch updates. No spam." marginTop 12/14, lh 1.5 |
| States | Default specified. Validation/success/error unspecified (see §6 + §9) |

### Save Pin brand mark

| Element | Spec |
|---|---|
| Outer SVG viewBox | `0 0 100 112` |
| Teardrop path | `M50 8 C72 8 90 26 90 48 C90 76 60 104 50 110 C40 104 10 76 10 48 C10 26 28 8 50 8 Z` |
| Teardrop fill / stroke | `#F7F3EA` / `#151515` 7px |
| Center dot | circle cx 50 cy 46 r 14, fill `#FF3B30`, stroke `#151515` 3px |
| Sparkle (optional accent) | Diamond/4-point glyph, fill `#FFD84D`, stroke `#151515` 1.8px; positioned NE of pin via absolute offset (right `-size*0.12`, top `-size*0.06`); size = `max(10, size*0.38)` |
| Sizes used | Mobile header 36 with sparkle; /map header 30 without sparkle; desktop header 40 with sparkle; logos artboard preview 88 with sparkle / 28 lockup no-sparkle / 16 favicon no-sparkle |

### Photo slot (placeholder)

Defined in `shared.jsx`:
- Renders a diagonal repeating-stripe background with a mono-label glyph
- Props: `w`, `h`, `r` (radius), `tone` (sand/moss/sky/cream/grey/pink/char), `label`
- Used as: hero saved-finds preview, resource card thumbnails, receipt row thumbs, partner reels, place cards, list-preview headers

### Footer

| Field | Mobile | Desktop |
|---|---|---|
| Container | bg `--ink`, color #fff, padding 28/20/36 | bg `--ink`, padding 48/0/56, container 1280 |
| Wordmark | fh 24/700/-0.02em "Japan Finds" | fh 28/700/-0.02em "Japan Finds" |
| Descriptor | fm 11/`rgba(255,255,255,0.75)`/0.08em "MAPS · LISTS · WEIRDLY USEFUL FINDS" mt 3 | Same; mt 5 |
| Link grid | 2-col, gap 10, fontSize 13/lh 1.9, mt 22 | 4-col grid `1.4fr 1fr 1fr 1fr`, gap 48, fontSize 14/lh 2 |
| Link columns | "Map / Shopping Lists / Cheat Sheets" then "Shop Waitlist / Partner" | SITE: Map, Shopping Lists, Cheat Sheets · MORE: Shop Waitlist, Partner · FOLLOW: @allstarsteven (IG, TT, YT) |
| Social row (mobile only) | fm 11/`#fff9`/0.04em "@allstarsteven · IG · TT · YT" | (Folded into FOLLOW column) |
| Sign-off row 1 | fm 10/`#fff8`/0.06em "© 2026 ALLSTARSTEVEN", mt 22 | Same; in a justify-between row with sign-off |
| Sign-off row 2 | fm 10/`#fff6`/0.06em italic "Made with egg sando and anxiety." mt 4 | Same; placed right side |

---

## 4. COPY INVENTORY

All copy is verbatim from the comp. Placeholder text is flagged with `[PLACEHOLDER]`.

### 4.1 Site lockup

- Wordmark line 1: **Japan Finds**
- Wordmark line 2 (tagline): **BY ALLSTARSTEVEN**
- Footer descriptor: **MAPS · LISTS · WEIRDLY USEFUL FINDS**

### 4.2 Navigation

- Map
- Shopping Lists
- Cheat Sheets
- Shop Waitlist
- Partner
- (Header CTA) **Get the Japan Map**

### 4.3 Hero

- Eyebrow: **JAPAN MAPS · LISTS · TRAVEL SHORTCUTS**
- H1: **Japan finds worth saving before your trip.** (rendered as three lines: "Japan finds" / "worth saving" / "before your trip.")
- Subhead: **Maps, food picks, shopping cheat sheets, and travel shortcuts from the weirdly useful side of Japan.**
- Support: **For people who saved way too many Japan videos and still don't know what's worth pinning, buying, or skipping.**
- Primary CTA: **Get the Japan Map**
- Secondary CTA: **Browse Shopping Lists**
- Trust strip: **● UPDATED REGULARLY** | **● ONE EMAIL · INSTANT MAP LINK** | **FREE**

### 4.4 §01 Start Here

- Eyebrow: **§01 · START HERE** (mobile after-tag: "FOUR USEFUL THINGS")
- H2: **Start here.**
- Card 1: chip "MAP", title "The Japan Map", body "Food spots, shops, rainy-day saves, and weirdly useful places worth pinning before you land.", micro "For when "I saw it in a Reel once" is not a travel plan.", CTA "Get the map"
- Card 2: chip "SHOPPING", title "Shopping Lists", body "Konbini foods, Donki finds, drugstore basics, snacks, skincare, and oddly useful products.", micro "For when you walk into Donki and immediately lose your sense of self.", CTA "Browse the lists"
- Card 3: chip "CHEAT SHEETS", title "Travel Cheat Sheets", body "Suica, eSIMs, luggage forwarding, airport arrival, JR Pass basics, and first-trip friction killers.", micro "Tiny panic reducers for your first 24 hours.", CTA "Open cheat sheets"
- Card 4: chip "SHOP", title "Shop Waitlist", body "A future shop for Japanese snacks, tools, travel items, design finds, and weirdly useful things people keep asking about.", micro "Some of it is genius. Some of it is ridiculous. That's usually the sweet spot.", CTA "Join the waitlist"

### 4.5 §02 The Map

- Eyebrow: **§02 · THE MAP** (after-tag: "OPENS IN GOOGLE MAPS")
- H2 (with highlighter on phrase): **A Japan map you'll** / *actually use.* (sticker)
- Body: **Built for your first Japan trip. Food, shopping, rainy-day, and useful saves — not every place from every video. Just the ones worth pinning.**
- Map card header strip: **JAPAN-FINDS-MAP / UPDATED REGULARLY**
- Filter chips: **● FOOD** / **● SHOPS** / **● RAINY DAY** / **● WEIRDLY USEFUL** (mobile/desktop /map adds **● KID-FRIENDLY**)
- Primary CTA: **Get the Japan Map**
- Microcopy under CTA: **OPENS IN GOOGLE MAPS · NO COPY-PASTING ADDRESSES LIKE A MANIAC**

### 4.6 §03 Shopping

- Eyebrow: **§03 · SHOPPING LISTS**
- H2: **Shopping lists for the good stuff.**
- Body: **Konbini snacks. Donki finds. Drugstore basics. 100-yen gems. The products that make you ask, "why is this better designed than my apartment?"**
- Sub-category chips: **KONBINI** / **DONKI** / **DRUGSTORE** / **100¥ SHOP** / **SNACKS** / **SKINCARE**
- CTA: **Browse Shopping Lists**
- **Receipt sample (mobile)** — `[PLACEHOLDER]` data, illustrative only:
  - Title: "Konbini midnight haul" — sub "SAMPLE LIST · LAWSON / 7-ELEVEN"
  - Egg sando — "Don't fight it" — ¥285 — YES
  - Tamago onigiri — "Filter is better than salmon" — ¥138 — YES
  - Cafe au lait paper carton — "Cold. Not optional." — ¥128 — YES
  - Frozen mikan — "Underrated dessert tech" — ¥168 — WEIRD
  - Plastic-wrapped salad — "Skip. You're on vacation." — ¥498 — SKIP
- **List-preview grid (desktop)** — `[PLACEHOLDER]` data, illustrative only:
  - Konbini midnight haul — "14 items · LAWSON / 7-ELEVEN" — Egg sando ¥285 / Tamago onigiri ¥138 / Cafe au lait ¥128 / Plastic salad ¥498 SKIP
  - Donki without crying — "22 items · SKINCARE / SNACKS / WEIRD" — Eye drops (cold) ¥780 / Cushion compact ¥1,490 / Frozen mikan ¥168 WEIRD / Mystery cleanser ¥2,180 SKIP
  - Drugstore basics that work — "11 items · MATSUKIYO / WELCIA" — Sunscreen (good one) ¥1,320 / Plasters (cute) ¥298 / Eye drops (mild) ¥528 / Heating pads ¥498 WEIRD

### 4.7 §04 Travel Cheat Sheets

- Eyebrow: **§04 · TRAVEL CHEAT SHEETS**
- H2 (with highlighter): **Japan logistics,** *made less cursed.* (sticker)
- Body: **Arrival, Suica, eSIMs, luggage forwarding, JR Pass basics, and the tiny details that can ruin your day if nobody explains them.**
- 6 cards (label "SHEET · 0N"): **Haneda arrival, step by step** / **Suica vs PASMO, simply** / **eSIMs that actually work** / **Luggage forwarding (yamato)** / **JR Pass basics** / **Tipping (don't)** — each ends "OPEN →"
- CTA: **Open all cheat sheets →**

### 4.8 §05 Shop Waitlist

- Eyebrow: **§05 · SHOP**
- H2: **Japan Finds Shop — Coming Soon.** (rendered as two lines)
- Body 1: **I'm putting together Japanese snacks, tools, design finds, travel items, and weirdly useful things people keep asking about.**
- Body 2 (in `--ink-60`): **Some of it is genius. Some of it is ridiculous. That's usually the sweet spot.**
- Form banner: **\*\*\* WAITLIST · JAPAN FINDS SHOP \*\*\***
- Input placeholder: **your@email.com**
- Submit: **Notify me when it launches →**
- Helper: **Useful Japan finds and launch updates. No spam.**

### 4.9 §06 Partner

- Eyebrow: **§06 · PARTNER WITH ALLSTARSTEVEN**
- H2: **Short-form Japan content that gets sent to the group chat.**
- Body: **For brands, destinations, restaurants, hotels, and products that want people to stop scrolling — not just see an ad.**
- Spec grid (4 cells):
  - **Branded reels** · "Made in Steven's voice"
  - **Destinations** · "Hotels, restaurants, regions"
  - **Product** · "Snacks, design objects, tools"
  - **Distribution** · "IG · TikTok · YouTube Shorts"
- CTA: **Start a partnership →**
- Microcopy: **REPLIES WITHIN A WEEK · welfmgmt@gmail.com**
- Reel placeholder labels: **REEL · DONKI** / **REEL · RAMEN**

### 4.10 Footer

- Wordmark: **Japan Finds**
- Descriptor: **MAPS · LISTS · WEIRDLY USEFUL FINDS**
- Site links: **Map · Shopping Lists · Cheat Sheets · Shop Waitlist · Partner**
- Social links: **@allstarsteven · IG · TT · YT** (three handles for the three platforms)
- Sign-off row 1: **© 2026 ALLSTARSTEVEN**
- Sign-off row 2 (italic): **Made with egg sando and anxiety.**

### 4.11 /map page

- Header: back arrow, SavePin (30, no sparkle), "Japan Map" + tagline "UPDATED REGULARLY"; right-aligned "SHARE"
- Eyebrow: **§02 · THE MAP**
- H1 (with highlighter on word): **Japan** *Map* (sticker)
- Body: **Places, food, shops, rainy-day saves, and weirdly useful spots curated by Steven.**
- Chip row: same 4 + (desktop only) **● KID-FRIENDLY**
- Primary CTA: **Open in Google Maps →**
- Secondary CTA (desktop only): **Save to your account**
- Microcopy (desktop): **NO COPY-PASTING ADDRESSES LIKE A MANIAC**

---

## 5. IMAGE SLOT SPEC

All photo placeholders need to be replaced with real iPhone-shot, varied-aspect imagery per the brand brief.

| ID | Section | Mobile dimensions | Desktop dimensions | Aspect | Role | Suggested content | Alt text guidance |
|---|---|---|---|---|---|---|---|
| `hero.preview.1` | Hero right cluster | (n/a) | ~240×150 | 16:10 | Saved find (shopping) | Egg sando packaging, konbini shelf | "Egg sando from a Lawson konbini" |
| `hero.preview.2` | Hero right cluster | (n/a) | ~260×180 | ~13:9 | Saved find (food) | Standing soba shop interior or bowl | "Tiny standing soba shop in Shimokitazawa" |
| `hero.preview.3` | Hero right cluster | (n/a) | ~280×140 | 2:1 | Saved find (rainy-day) | Indoor mall corridor, KITTE Marunouchi | "Rainy-day mall stop in Marunouchi" |
| `hero.preview.4` | Hero right cluster | (n/a) | ~220×150 | ~3:2 | Saved find (weird) | Donki aisle / 100¥ shop haul | "100-yen haul from Donki in Umeda" |
| `card.thumbnail.{1-4}` | §01 resource cards | (none used currently — cards are text-only) | (none) | — | — | (Optional) small hero thumbnail per card | — |
| `map.preview.thumb` | §02 map card | inside MapPreview SVG — drawn, not photographic | inside MapPreview SVG | — | Map background | Replace with screenshot of real My Maps export when ready | — |
| `place.thumb` | /map place card | 56×56 r 6 | 64×64 r 6 | 1:1 | Place icon | iPhone shot of the actual spot's storefront / dish | "Tiny standing soba shop — Shimokitazawa" |
| `receipt.thumb.{1-5}` | §03 receipt rows (mobile) | 42×42 r 6 | (n/a) | 1:1 | Product thumb | Tight crop of each product on a flat surface | Per-product (e.g., "Egg sando from Lawson") |
| `list.cover.{1-3}` | §03 list-preview cards (desktop) | (n/a) | 100%×140 r 0 | ~5:2 wide | List cover image | Konbini exterior / Donki neon / drugstore aisle, iPhone shot | "Konbini aisle at 1am" etc. |
| `partner.reel.1` | §06 partner | 100%×180 | 100%×300 | ~3:2 (mobile), ~5:6 (desktop) | Reel preview | Vertical IG/Reels still — Donki haul | "Reel — Donki haul" |
| `partner.reel.2` | §06 partner | 100%×180 | 100%×300 | ~3:2 / ~5:6 | Reel preview | Vertical IG/Reels still — ramen | "Reel — ramen breakdown" |

**Image treatment rules (preserve from brand brief):**
- Imperfect iPhone shots, varied aspect ratios
- No full-bleed magazine spreads, no parallax
- No Mt. Fuji / torii / cherry blossom / Shibuya neon / shrine / anime tropes
- More desktop space ≠ bigger photos (preserved density)

---

## 6. INTERACTIONS / STATES

### Forms (Shop Waitlist)

| State | Specified in comp | Behavior |
|---|---|---|
| Default | ✅ | Placeholder visible, ink-filled submit button below |
| Focus | ⚠️ Unspecified | Recommend: 2px solid `--red` outline on input, no inner border change. Submit button focus = 2px solid `--red` outline. |
| Loading | ⚠️ Unspecified | Recommend: submit becomes disabled, copy → "Adding you…", spinner glyph optional |
| Success | ⚠️ Unspecified | Recommend: replace form with confirmation card matching same chrome (1.5px ink, radius 10, shadow 3/3/0). Copy: "You're on the list. Useful Japan finds and launch updates coming." |
| Error (invalid email) | ⚠️ Unspecified | Recommend: input border becomes `--red`, helper text turns `--red` and reads "That doesn't look like an email yet." |
| Error (network) | ⚠️ Unspecified | Recommend: helper text turns `--red` and reads "Couldn't sign you up — try again in a sec." |

### Buttons / Links

| State | Specified | Recommended behavior |
|---|---|---|
| Default | ✅ | (existing) |
| Hover | ⚠️ Unspecified | Primary red: darken to `oklch(60% 0.18 27)` ≈ `#E5342B` (subtle). Ink-button: darken to `#000`. Outline (secondary): bg → `var(--ink)`, color → `#fff`. Hover transitions: 120ms ease-out on `background-color`. |
| Active / pressed | ⚠️ Unspecified | Translate shadow by 2/2 → 0/0 (i.e., "press" the chunky shadow). |
| Focus-visible | ⚠️ Unspecified | 2px `--red` outline at 2px offset for keyboard-only focus. |
| Disabled | ⚠️ Unspecified | 0.5 opacity, `cursor: not-allowed`. |

### Nav links (desktop)

| State | Specified | Recommended |
|---|---|---|
| Default | ✅ | Color `--ink` |
| Active route | ✅ | Color `--red` (see /map nav) |
| Hover | ⚠️ Unspecified | Underline 1.5px solid current color at offset 4px |
| Focus | ⚠️ Unspecified | Same outline rule as buttons |

### Cards

| State | Specified | Recommended |
|---|---|---|
| Default | ✅ | (existing) |
| Hover | ⚠️ Unspecified | Optional: translate `transform: translate(1px,1px)`; shadow shrinks to `2px 2px 0 var(--ink)`. Subtle press feel. Cursor: pointer on clickable cards. |
| Focus | ⚠️ Unspecified | 2px `--red` outline at 2px offset on the card itself. |

### Map CTA — "Get the Japan Map" → Google Maps

| Behavior | Notes |
|---|---|
| Click | Opens canonical Google My Maps URL in new tab (`target="_blank" rel="noopener"`). URL not yet specified — see §9. |
| Hover | Per button rules above. |

### Shop CTA — "Notify me when it launches"

| Behavior | Notes |
|---|---|
| Click | Submits email to mailing-list provider. Provider not specified — see §9. |

### A/B test (hero H1 third line opacity)

| Variant | Spec | Currently live |
|---|---|---|
| A | 3rd line color = `var(--ink-60)` (60% opacity) | Default per `DirBHomeA` |
| B | 3rd line color = `var(--ink)` (100% opacity) | Available via `DirBHomeB` |
| Decision rule | Comp ships both; production must pick one based on Steven's call. |

---

## 7. RESPONSIVE BEHAVIOR

| Section | Mobile (390) | Desktop (1440) | Stack-order change | Type scale | Image / layout change |
|---|---|---|---|---|---|
| Nav | Wordmark + hamburger | Wordmark + centered 5 links + right red CTA | Same horizontal direction; hamburger replaced by full link list + CTA | Wordmark 16→20 / Tagline 11 stays | (n/a) |
| Hero | Vertical stack: eyebrow → H1 → subhead → support → CTAs → trust strip | 2-col: left identical stack, right = 4-card saved-finds preview | Right-column preview is **net-new content on desktop only** (4 sample finds with category chips). | H1 40→84 / subhead 15→19 / support 13→15 / eyebrow 10→11 | Adds 4 photo placeholders (none on mobile) |
| §01 Start Here | 4 cards stacked vertically | 4 cards in single row | Same order | H2 30→48 | Card height becomes fixed 380px; stripe widens 8→10px |
| §02 Map | Title → body → map card → chips → CTA | 2-col: title/body/chips/CTA left, map card right | Chips move into the same column as title on desktop | H2 30→54 | MapPreview h 220→420; 8→9 pins |
| §03 Shopping | Title → body → receipt card (5 items) → sub-chips → CTA | 2-col header (title left, intro+chips right) then 3-card list-preview grid full-width | **Major restructure**: one receipt becomes three list-preview cards. Receipt removed from desktop. | H2 30→52 | Adds 3 list-cover photo placeholders |
| §04 Cheat Sheets | Title → body → 2-col 6-card grid → CTA | 2-col: title/body/CTA left, 3-col 6-card grid right | Grid columns 2→3 | H2 30→52 | (n/a) |
| §05 Shop Waitlist | Title → body → form | 2-col: title/body left, form right | Same | H2 30→52 | (n/a) |
| §06 Partner | Eyebrow → H2 → body → 2-up reels → 2x2 spec → CTA | 2-col: eyebrow/H2/body/2x2 spec/CTA left, 2-up reels right | Reels move from below to alongside | H2 30→52 | Reel placeholders h 180→300 |
| Footer | Wordmark + tagline / 2-col link grid / social row / sign-off | 4-col `1.4 / 1 / 1 / 1`: wordmark + 3 link columns (SITE, MORE, FOLLOW) | Social links absorbed into FOLLOW column. Sign-off becomes inline justify-between row. | Wordmark 24→28 / link 13→14 / lh 1.9→2 | (n/a) |

**Hidden on each viewport:** nothing is hidden. Saved-finds hero preview is **added** on desktop. Receipt is **replaced** with list-preview grid on desktop.

---

## 8. DRIFT FLAGS

Issues where mobile and desktop disagree on token, copy, or behavior. Resolve before production.

| # | Drift | Mobile value | Desktop value | Recommendation |
|---|---|---|---|---|
| D1 | §03 Shopping is materially different content between mobile and desktop. Mobile shows one receipt card with 5 items; desktop shows 3 list-preview cards each with 4 sample items. | 1 receipt (Konbini midnight haul) | 3 list-preview cards (Konbini, Donki, Drugstore) | **Decide on a single content model for production.** Recommend: production renders 1–3 most recent / most popular lists. Same component on both viewports, mobile shows 1 (or vertically-stacked all), desktop shows 3-up. The receipt is a strong moment — consider keeping receipt-style typography (dashed dividers, ¥ alignment) as the list-preview card body so mobile/desktop share visual language. |
| D2 | Hero saved-finds preview exists on desktop only (4 cards), not mobile. | (none) | 4 cards | **Either:** add a horizontal-scroll version on mobile (recommended; preserves density), **or** explicitly accept that the hero preview is desktop-only enhancement. |
| D3 | "Bullet" status dot size: 8px mobile / 9px desktop. | 8×8 | 9×9 | Standardize to 9×9 across both (or 8×8). Currently a 1px drift. |
| D4 | Footer tagline rendered with `marginTop: 3` mobile and `marginTop: 5` desktop. | 3px | 5px | Standardize to 4px across both. |
| D5 | Section eyebrow font-size: mobile §xx is 11px, mobile hero eyebrow is 10px (mixed). Desktop eyebrow is 11–12px. | 10–11 | 11–12 | Pick one eyebrow size per viewport. Recommend: mobile uniformly 11px, desktop uniformly 12px. |
| D6 | Resource-card chip uses ink color (white-on-yellow vs white-on-others). On YELLOW stripe, chip background is yellow with **ink text**; on other stripes, chip is colored with **white text**. | Same | Same | Confirmed intentional (yellow's low contrast on white text). Document in chip component as: `text-color: stripe === yellow ? ink : white`. |
| D7 | Mobile §03 has the receipt rendered as a sample list; sub-category chips below; CTA at bottom. Desktop §03 has the same sub-category chips in the intro block (not below the cards). | Below receipt | Above the grid (in intro) | Sub-category chips should appear in the same logical position on both. Recommend: chips below the grid (mobile pattern). |
| D8 | "Open list →" affordance exists on the desktop list-preview card but not the mobile receipt. | — | "Open list →" footer row | Either add an equivalent "Open list →" row at the bottom of the mobile receipt card, or accept that the entire mobile receipt is one tappable card. |
| D9 | /map page secondary CTA "Save to your account" exists on desktop only. | (not shown) | Yes | Confirm whether accounts/auth exist in V1. If no auth, drop the desktop secondary CTA. |
| D10 | Sticker shadow is `3px 3px 0 var(--ink)` for cards but `2px 2px 0` for buttons and `4px 4px 0` for the desktop /map H1 highlighter. Three values, no clear scale. | — | — | Define a scale: `--shadow-sm: 2px 2px 0`, `--shadow-md: 3px 3px 0`, `--shadow-lg: 4px 4px 0`. Document which is used where. |
| D11 | Highlighter sticker spans (the red/green sticker behind certain h2 phrases) rotate `-1deg`. This rotation is preserved on desktop. | -1deg | -1deg | Confirm acceptable at very large desktop H2 sizes (52–88px). The rotation amplifies at scale and may need to be reduced (e.g., `-0.5deg`) on desktop. |
| D12 | Email displayed in Partner microcopy: `welfmgmt@gmail.com`. Brief earlier mentioned `steven@shhh.consulting` and then was overridden to `welfmgmt@gmail.com`. | welfmgmt@gmail.com | welfmgmt@gmail.com | Confirm this is the production address Steven wants visible to brand partners. |
| D13 | Hero CTA is full-width on mobile and inline on desktop. Trust strip is below CTAs on both. | Full-width primary + secondary | Inline | Confirmed intentional. |

---

## 9. OPEN QUESTIONS

These need a decision before build starts.

1. **A/B hero H1 third line opacity** — Which is the production default? Version A (60% opacity on "before your trip.") or Version B (100%)? The comp ships both.

2. **Logo mark — final pick** — Three options were presented (Save Pin, Field Tag, Japan Dot Marker). Save Pin is currently applied in the header. Confirm Save Pin is the production primary, and decide whether Field Tag / Japan Dot are kept as system marks for shopping / map respectively.

3. **Brand mark sparkle accent** — Currently rendered NE of the pin and gets clipped at small sizes. Confirm whether the sparkle is part of the favicon (16px) or only the header lockup.

4. **Tablet breakpoint** — No comp produced between 390 (mobile) and 1440 (desktop). At what width does the layout swap? Recommend: 1024px (≥ → desktop layout, < → mobile layout, with intermediate fluid type).

5. **Canonical URL** — Brief lists `allstarsteven.com/japan` as canonical, `japanfinds.co` as optional redirect. Confirm production canonical and configure DNS + redirects. Confirm whether internal links in nav / footer should be relative paths or absolute to `allstarsteven.com/japan/*`.

6. **Map CTA destination** — Where exactly does "Get the Japan Map" link? The expected behavior is "opens Google My Maps in a new tab". Production needs the actual My Maps URL. (No URL is in the comp.)

7. **Shop Waitlist email provider** — Where does the form submit? Options: ConvertKit, Buttondown, Beehiiv, Mailchimp, custom. Helper copy is "Useful Japan finds and launch updates. No spam." — confirm the actual list cadence.

8. **Form states (success / error / validation)** — Not in comp. Decide copy + visuals per §6 recommendations.

9. **Shopping content model on mobile** — Will mobile show 1 sample list (receipt-style), N stacked list-preview cards, or a horizontal scroll? See drift flag D1.

10. **Hero "saved-finds preview" on mobile** — Add as horizontal scroll, hide entirely, or move below the trust strip? See drift flag D2.

11. **Mobile menu (hamburger) panel** — No open state in comp. What does the panel look like? Recommend: full-bleed overlay with the 5 nav links + a primary "Get the Japan Map" CTA at the bottom. Confirm.

12. **Cheat sheet / shopping list / map detail pages** — Only the homepage and the /map hero are designed. The card destinations (shop list detail, individual cheat sheet, etc.) need comps OR a written content spec. At minimum: list/index pages and detail-page templates.

13. **"Featured in Japan Finds by ALLSTARSTEVEN" sponsor-facing line** — Brief flagged this as optional. Decide whether it goes on the Partner section in V1 or waits.

14. **Receipt / list-preview data source** — Currently hardcoded `[PLACEHOLDER]`. Confirm CMS choice (Notion, Sanity, Airtable, plain MD?) so list/item records can be modeled.

15. **About page** — Removed from footer. Brief leaves room for one. Confirm whether it ships in V1 or post-launch.

16. **JR Pass card title** — "JR Pass basics" with the parenthetical "(don't)" on the Tipping card uses an apostrophe in JSX. Confirm typographic preference (straight `'` vs curly `'`). Currently straight `\'` is used; production should normalize.

17. **Accessibility commitments** — WCAG target (AA / AAA)? Note: yellow chip on yellow background (`bg=yellow` chip on `--yellow` section) on §03 mobile receipt sub-chip area may need a check. Also confirm motion-reduced support since stickers are slightly rotated.

18. **Print stylesheet** — Out of scope unless requested; flag if needed for printable shopping lists.

19. **Analytics events** — Recommend an event spec for: hero primary CTA click, secondary CTA click, each resource-card CTA, each map filter chip, list-card open, cheat-sheet open, waitlist submit. Not in comp.

20. **Locale / language** — English only? Confirm no JP translation required for V1.

---

## End notes

- Files referenced in this handoff: `direction-b-v2.jsx`, `direction-b-v2-desktop.jsx`, `shared.jsx`, `design-canvas.jsx` (Figma-canvas wrapper, not production), `index.html` / `Japan Finds V1.html` (assemblies), `Japan-Finds-V1.html` (standalone bundle).
- No new components, copy, sections, or design decisions were introduced in this document beyond clearly-flagged drift / open-question recommendations.
- Verify against the standalone HTML export — it is the source of truth.
