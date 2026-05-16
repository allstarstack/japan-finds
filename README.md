# Japan Finds — V1 Build

Static marketing site for Japan Finds by AllstarSteven. Newsletter 
signup over a curated landing page.

## Status

- Mobile design: locked (Direction B v2, Konbini Field Guide refined)
- Desktop design: in progress (Claude Design)
- HANDOFF.md extraction: pending
- Image assets: pending
- Code build: not started

## Stack (locked)

- Astro (latest stable)
- Vanilla CSS with CSS custom properties
- Vercel (deploy)
- Kit (email)
- Porkbun (domain registrar)
- GitHub (source)

## Folder map

- `BUILD_SPEC.md` — master spec for Claude Code. Read this first.
- `/design/` — locked HTML comps and HANDOFF.md extraction
  - `mobile.html`
  - `desktop.html`
  - `HANDOFF.md`
- `/assets/images/` — real creator-sourced IG/Reels stills

## How to run the build

1. Make sure `/design/` and `/assets/images/` are populated.
2. From inside this folder, run `claude` in the terminal.
3. Tell it: "Read BUILD_SPEC.md and execute. Halt when the spec says to halt."

Claude Code drives from there. It halts when it needs human input 
(Kit embed code, GitHub repo name, Vercel import confirmation).

## Locked design decisions (canonical truth — see BUILD_SPEC.md for full)

- Palette: Rice White #F7F3EA, Ink Black #151515, Tokyo Signal Red 
  #FF3B30, Konbini Blue #176BFF, Matcha Green #4D8B57, Egg Sando 
  Yellow #FFD84D, Concrete Gray #E6E1D8.
- Type: Space Grotesk (headlines) / Inter (body) / IBM Plex Mono (labels).
- Wordmark: "Japan Finds" with "BY ALLSTARSTEVEN" tagline.
- No AI Japan photography. No banned imagery (Mt. Fuji, torii, 
  cherry blossoms, Shibuya neon, shrines, luxury travel mag style).
- No banned words (see BUILD_SPEC.md for full list).
