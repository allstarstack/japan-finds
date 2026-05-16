# Japan Finds V1 — Build Spec

Mission: Build, test, and deploy the V1 marketing site for Japan Finds 
by AllstarSteven. Static landing page with newsletter signup. Translate 
the locked comps in /design/ to an Astro project, integrate Kit for 
email capture, deploy to Vercel. Domain DNS is a separate human step 
at the end.

## Folder contents

- /design/mobile.html — locked mobile comp
- /design/desktop.html — locked desktop comp
- /design/HANDOFF.md — structured extraction: tokens, components, 
  verbatim copy, image slot spec, responsive logic, open questions
- /assets/images/ — real creator-sourced IG/Reels stills
- BUILD_SPEC.md (this file)

## Stack — locked

- Astro (latest stable)
- Vanilla CSS with CSS custom properties for tokens. No Tailwind. 
  No CSS-in-JS.
- No React. No client-side JS framework. Use .astro components.
- TypeScript optional — use only if it speeds you up.
- Deploy: Vercel via GitHub auto-deploy
- Email: Kit HTML form embed
- Domain registrar: Porkbun (DNS is a human step in Phase 8)
- Node 20+

## Source of truth hierarchy

- Layout, structure, component arrangement → /design/ comps win.
- Color values, typography, wordmark → BUILD_SPEC tokens win 
  (this file). If a comp deviates from a locked value, use the 
  locked value and flag the drift.
- Component breakdown, verbatim copy, image slot spec → HANDOFF.md.
- If HANDOFF and comps disagree on something material → halt and ask.

## Design tokens — canonical values

Palette → /src/styles/tokens.css as :root variables:
- --color-rice-white: #F7F3EA  (background)
- --color-ink-black: #151515  (text)
- --color-tokyo-red: #FF3B30  (primary CTA)
- --color-konbini-blue: #176BFF
- --color-matcha-green: #4D8B57
- --color-egg-yellow: #FFD84D
- --color-concrete-gray: #E6E1D8

Type:
- Headlines: Space Grotesk
- Body: Inter
- Labels / mono: IBM Plex Mono
- Load via Google Fonts with font-display: swap. Preload the primary 
  headline weight used in the hero.

Wordmark: "Japan Finds" with "BY ALLSTARSTEVEN" tagline.
Logo mark: Save Pin — map-pin teardrop, ink outline, red center dot, 
yellow sparkle accent. SVG, inline where used.

## Copy rules

- All copy verbatim from HANDOFF.md → COPY INVENTORY.
- Do not invent taglines, descriptions, microcopy, alt text drafts.
- If a slot has no copy in HANDOFF, halt and ask.

Banned words — do not use anywhere (copy, alt, meta, comments):
ultimate, hidden gems, hidden gem, magical, wanderlust, authentic 
journey, unforgettable, discover Japan, explore, must-see, curated 
experiences, local secrets, comprehensive guide, uncover, delve.

## Image rules

- Use only files in /assets/images/ (move to /public/images/ in Phase 1).
- Never use stock, AI-generated, or placeholder services.
- Banned imagery — do not source, reference, or suggest: Mt. Fuji, 
  torii gates, cherry blossoms, Shibuya neon, shrines, luxury travel 
  magazine imagery.
- If /assets/images/ is missing files for slots in HANDOFF.md → IMAGE 
  SLOT SPEC, halt and ask. Do not substitute.
- Optimize: WebP with JPG fallback, lazy load below the fold, explicit 
  width/height to prevent CLS.

## Component structure

One .astro component per major section, named from HANDOFF.md → 
COMPONENT INVENTORY. Do not over-abstract. A landing page does not 
need twenty components.

- /src/styles/tokens.css — CSS variables
- /src/styles/global.css — resets, typography, base styles
- /src/components/ — section components
- /src/layouts/Base.astro — meta, fonts, global styles
- /src/pages/index.astro — composes the sections
- /public/images/ — image assets
- /public/favicon.* — generated from Save Pin mark

## Accessibility baseline (must pass)

- Semantic HTML — nav, main, section, footer, not div soup.
- All images have alt text from HANDOFF (halt if missing).
- Visible focus states on all interactive elements.
- Form inputs have labels (visible or sr-only, never placeholder-only).
- WCAG AA contrast — verify Ink Black on Rice White and Rice White on 
  Tokyo Red.
- prefers-reduced-motion respected on any animation.

## SEO + meta

- Open Graph + Twitter card meta in Base layout.
- OG image: use the slot designated for social share in HANDOFF; if not 
  designated, halt and ask which image.
- Title and description from HANDOFF COPY INVENTORY.
- Favicon: generate from Save Pin (.ico + PNG 32/192/512).
- sitemap.xml and robots.txt at /public root.

## Kit form integration (V1)

Approach: HTML embed.

When you reach Phase 3, halt and ask the user for:
1. Kit form embed HTML (Kit dashboard → Grow → Landing Pages & Forms 
   → [form] → Embed → HTML).
2. Confirmation that success behavior (redirect / inline message) is 
   configured in Kit itself.

Drop the embed into the signup component. Style only what's needed to 
match the comp — do not override Kit's form markup. If the comp 
styling conflicts with the embed structure, flag and propose the 
minimal-CSS resolution before changing anything.

## Build phases — execute in order

### Phase 1 — Scaffold
- Initialize Astro in this directory.
- Create folder structure above.
- Move /assets/images/ → /public/images/.
- Write tokens.css and global.css with locked tokens.
- Wire Google Fonts in Base layout.

### Phase 2 — Translate comps
- Build each component from HANDOFF → COMPONENT INVENTORY.
- Compose into /src/pages/index.astro.
- Match mobile comp below the breakpoint, desktop comp at and above.
- Visually verify against both comps before continuing.

### Phase 3 — Kit form
- Halt and request Kit embed code from the user.
- Integrate. Style minimally to match the comp.

### Phase 4 — A11y + SEO
- Add meta, OG, favicon, sitemap, robots.txt.
- Run an accessibility check. Fix any AA violations.
- Verify keyboard nav and focus order.

### Phase 5 — Local test
- Dev server. Verify both breakpoints against comps.
- Production build. Confirm clean.
- Lighthouse — target 95+, fix anything below 90.

### Phase 6 — GitHub
- git init. .gitignore for node_modules, .env, dist.
- Halt and ask for repo name (default: japan-finds) and visibility 
  (default: private).
- Create repo via gh CLI (or instruct the user step-by-step if gh isn't 
  installed). Push initial commit.

### Phase 7 — Vercel
- Halt and ask the user to import the repo at vercel.com → Add New → 
  Project.
- Confirm framework preset auto-detects as Astro.
- Default build settings (npm run build, output: dist).
- After first deploy, capture the *.vercel.app URL.

### Phase 8 — Handoff doc
Write DEPLOY.md in the project root with:
- Live *.vercel.app URL.
- Step-by-step Porkbun DNS instructions: A record for apex pointing at 
  Vercel's IP, CNAME for www pointing at cname.vercel-dns.com (or 
  whatever Vercel's domain panel actually shows — pull from there, do 
  not assume).
- How to add the custom domain in Vercel's project settings.
- Kit form name in use and how to swap it later.
- How to edit copy, add a section, push updates.
- How to roll back a bad deploy via Vercel.

## Halt conditions — stop and ask

- /assets/images/ empty or missing files for HANDOFF slots.
- HANDOFF.md missing or incomplete sections.
- Comp ↔ HANDOFF material disagreement.
- Kit embed needed (Phase 3).
- GitHub repo name + visibility (Phase 6).
- Vercel import confirmation (Phase 7).
- Any ambiguous copy or alt text slot.

Do not invent. Halting is correct behavior.

## Definition of done

- Live at a *.vercel.app URL.
- Mobile and desktop match comps at target breakpoints.
- Test email submitted successfully — verified in Kit dashboard.
- Lighthouse 90+ on all four categories.
- DEPLOY.md written with everything needed to wire Porkbun → Vercel.

Then stop. Custom domain DNS is the user's step.

---
Version: 1.0
Date: 2026-05-16
