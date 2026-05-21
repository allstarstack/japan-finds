# AllstarSteven Brand Spec

Canonical brand reference. When Claude makes design or copy decisions, this file is the source of truth. If something here conflicts with a code token file in a git repo, this file wins for principles; the code file wins for implementation values (they should match — flag drift if they don't).

**Maintenance order when values change:** update `brand.md` first → then code token files in each repo (`src/styles/*.css` etc.) → then any existing components using the changed value. Updating code without updating `brand.md` creates drift. Flag the drift; don't silently fix one and leave the other.

---

## Direction

Konbini Field Guide (refined). Useful-first, witty-second. Functional density over travel-magazine polish.

---

## Palette

| Token | Hex | Use |
|---|---|---|
| Rice White | #F7F3EA | Background |
| Ink Black | #151515 | Text, primary buttons |
| Tokyo Signal Red | #FF3B30 | Primary CTA, alerts |
| Konbini Blue | #176BFF | Japan Finds card accent (on the hub, this color appears only on JF references) |
| Matcha Green | #4D8B57 | Secondary accent |
| Egg Sando Yellow | #FFD84D | Highlight, callouts |
| Concrete Gray | #E6E1D8 | Borders, dividers, subtle surfaces |

**Hub palette restriction:** parent hub (`allstarsteven.com`) uses Rice White / Ink Black / Concrete Gray only. Konbini Blue appears exclusively as the Japan Finds card accent on the hub. Other accent colors are reserved for Japan Finds itself, so the hub stays neutral and future properties aren't visually constrained.

---

## Typography

- **Headlines:** Space Grotesk (700)
- **Body:** Inter (400)
- **Labels / mono:** IBM Plex Mono (500)

Self-host woff2 files. No external font CDNs.

---

## Voice

- Present tense for content scripts
- Natural, spoken English
- Witty and dry when tone allows
- Not corporate
- Useful information first, personality second
- No validation padding, no hedging when the conclusion is clear

---

## Tone examples

Voice rules are abstract until applied. These show what passing/failing copy looks like in real contexts.

| Context | Pass | Fail | Why |
|---|---|---|---|
| Hero headline | "Japan, but the useful parts." | "Discover the magic of Japan." | Banned: "discover," "magical." Concrete utility vs vague abstraction. |
| Product card one-liner | "Onigiri tuna mayo. Lawson does it best." | "An unforgettable Japanese snacking experience." | Specific brand name + recommendation vs generic hype. Present tense. |
| Email signup CTA | "Notify me when it launches" | "Subscribe now!" | Specific future action vs generic marketing yell. |
| Subhead under hero | "Snacks, drugstore wins, donki finds. The stuff people DM me about." | "Your ultimate guide to authentic Japan travel experiences." | Banned: "ultimate," "authentic." Names categories + cites real demand. |
| Empty state | "Nothing here yet. Back when there is." | "Stay tuned — exciting things coming soon!" | Honest absence vs hype filler. |
| Error message | "That email's already on the list." | "Oops! Something went wrong." | States what happened in plain English vs faux-friendly evasion. |
| Product safety callout | "Heads up: NSAID. Skip if you're on transplant meds." | "Please consult your physician before consuming this product." | Direct + specific vs corporate hedging. |

---

## Photography direction

What to use, not just what to avoid:

- Real creator stills from Steven's actual content (IG, Reels, TikTok)
- Visible Japanese signage, packaging, prices — the context is the point
- Convenience store fluorescent lighting, train station signage, vending machine glow
- Food shot from the angle you actually eat it (sandwich in hand, ramen as you'd see it sitting at the counter), not stylized overhead
- Mild imperfection — slight motion blur, real hands in frame, asymmetric crops — feels honest
- Reference frame: documentary travel zine, not travel magazine

Product cards are an exception (see "Product card imagery" below). For all other contexts — hero shots, lifestyle, places, restaurants, editorial — when stock or AI images are temporarily used as placeholders, mark them in code comments and replace before launch.

---

## Product card imagery

Product cards are functional grid items, not editorial. Retailer and official product images are acceptable as final imagery — not placeholders. E-commerce convention is clean product shots; users expect them, and forcing creator-style photography here creates a permanent bottleneck without a brand payoff.

Acceptable sources:
- Official manufacturer/brand product photography
- Retailer product images (Amazon JP, Rakuten, Don Quijote, brand sites)
- Conbini product shots from the chain's official site

Quality bar:
- Single product clearly in frame (not a category group shot)
- Clean background (white or simple — not a busy retailer page crop)
- No watermarks, price overlays, or retailer branding
- Resolution sufficient for the card size (no obvious pixelation)

Steven's own creator stills are still preferred when they exist — they're more distinctive and earn more dwell. But they're an upgrade, not a requirement.

This carve-out applies ONLY to product cards in the /products collection. Places, restaurants, cheat sheets, hero imagery, blog posts, social — all still require creator stills or editorial-grade photography per the rules above.

AI-generated product imagery is still banned across the board, including product cards.

---

## CTA & microcopy conventions

- **Buttons:** action verb + specific object. "Get the map" not "Click here." "Notify me when it launches" not "Subscribe."
- **Active voice, present tense.** "Saving your finds" not "Your finds will be saved."
- **Form helper text states the value, not the obligation.** "Useful Japan finds and launch updates. No spam." Not "We respect your privacy and won't share your information."
- **Confirmation messages state what happened in plain English.** "Check your email to confirm." Not "Thanks for subscribing!" with no instruction.
- **Empty states:** honest absence with a forward signal. "Nothing here yet. Back when there is." Not "Stay tuned!"
- **Loading text:** avoid generic "Loading..." Prefer specifics ("Pulling latest data") or just a spinner with no text.
- **Links:** descriptive, not "click here." "See the full product list" not "click here to see products."

---

## Banned words

Do not use anywhere — copy, alt text, meta descriptions, comments:

ultimate, hidden gems, hidden gem, magical, wanderlust, authentic journey, unforgettable, discover Japan, explore, must-see, curated experiences, local secrets, comprehensive guide, uncover, delve

---

## Banned imagery

Do not generate, source, or recommend:

- Mt. Fuji
- Torii gates
- Cherry blossoms
- Shibuya neon at night
- Shrines/temples as decorative imagery
- Luxury travel magazine styling
- AI-generated Japan photography

For editorial, hero, lifestyle, places, and restaurants: use real creator-shot stills from Steven's IG/Reels content where possible. Stock imagery is a placeholder, never a final state in these contexts.

For product cards specifically: see "Product card imagery" section above.

---

## URL architecture

| URL | Property | Stack |
|---|---|---|
| allstarsteven.com | Parent hub | Astro 6 + vanilla CSS + Vercel |
| japan.allstarsteven.com | Japan Finds | Astro 6 + vanilla CSS + Kit + Vercel |
| shop.allstarsteven.com | Shop | Shopify |

Current build state of each property lives in session handoff docs or each property's git README, not here. Update this table only when architecture changes (new stack, new property, retired URL).

---

## Safety flags (product content)

When recommending or writing product content involving consumables, electronics, or medications, these flags apply:

- **Alcohol** (sake, beer, highball): needs transplant team clearance before featuring. Grapefruit Strong Zero is hard-avoid entirely.
- **NSAIDs** (Loxonin, Eve): hard-avoid pending clearance. Content angle when featured: "many travelers love this; transplant patients should avoid."
- **Multi-active cold meds** (Pabron, Lulu A Gold): clearance needed.
- **Aspirin-related** (Salonpas): clearance needed.
- **Citrus/grapefruit family ingestion:** clearance needed.
- **Voltage:** Japan 100V vs US 120V. Note the Zojirushi NW-YQH 220V tourist model (launched Dec 2025) for rice cookers specifically.

Flags render on product cards as a small callout, not as verification metadata.
