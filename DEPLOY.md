# Japan Finds — Deploy & Maintenance

Everything needed to take this site from its Vercel URL to
`japan.allstarsteven.com`, and to keep it running afterward.

## Where it lives

| | |
|---|---|
| **Live now** | https://japan-finds.vercel.app/ |
| **Production domain (target)** | https://japan.allstarsteven.com — a subdomain |
| **Repo** | https://github.com/allstarstack/japan-finds (branch `main`) |
| **Host** | Vercel — every push to `main` auto-builds and deploys |
| **Email capture** | Kit (ConvertKit) — inline form, ID `9451873` |

The apex domain `allstarsteven.com` is **not touched** by this project — it
stays free for the separate AllstarSteven hub page.

The canonical URL is already set to `https://japan.allstarsteven.com` in
`astro.config.mjs`, so canonical tags, Open Graph, and the sitemap are correct
the moment the domain resolves — **no code change is needed after DNS.**

---

## 1 — Point japan.allstarsteven.com at Vercel

Two steps, **Vercel first** — it tells you the exact DNS record to create.

### a. Add the domain in Vercel

1. Vercel → the **japan-finds** project → **Settings → Domains**.
2. Type `japan.allstarsteven.com` and click **Add**.
3. Vercel shows the DNS record it expects. For a subdomain this is a
   **CNAME**. Copy the **value** it displays — it is normally
   `cname.vercel-dns.com`, but use whatever Vercel actually shows.

### b. Create the record in Porkbun

1. Log in to **Porkbun** → **Domain Management** → `allstarsteven.com` →
   **DNS Records**.
2. Add one record:

   | Field | Value |
   |---|---|
   | Type | `CNAME` |
   | Host | `japan` |
   | Answer / Value | `cname.vercel-dns.com` — *use exactly what Vercel showed* |
   | TTL | leave default (`600`) |

3. Save. **Leave the apex (`allstarsteven.com`) and `www` records alone** —
   those belong to the hub page. If Porkbun already has a record for the
   `japan` host, delete it first so it doesn't conflict.

### c. Wait for propagation

DNS takes a few minutes to a couple of hours to spread. Vercel issues the
HTTPS certificate automatically once it sees the record resolve — the domain
gets a green check in **Settings → Domains** when it's done. The site stays
reachable at the `.vercel.app` URL the whole time.

> Until the custom domain resolves, the Open Graph preview image
> (`og:image`) points at `japan.allstarsteven.com/og-image.jpg` and won't load
> in social-share previews. It resolves on its own once DNS is live.

---

## 2 — The newsletter form (Kit)

The §05 "Shop Waitlist" form is a **Kit inline embed**.

- Kit form ID **`9451873`**, embed uid **`76cc3abd13`**.
- It lives in `src/components/ShopWaitlist.astro`.
- On success it shows Kit's inline message ("You're subscribed!").
- Kit's `ck.5.js` is loaded on the visitor's first interaction (keeps it off
  the initial page load — better performance, no third-party cookie at load).

**Test it (last item on the launch checklist):** submit a real email on the
live site, then confirm the subscriber appears in your Kit dashboard.

**To swap in a different Kit form later:**

1. In Kit, build or pick an **Inline**-format form and copy its **HTML embed**.
2. In `src/components/ShopWaitlist.astro`, replace the `<form>…</form>` block
   and the Kit `<style>` block with the new embed.
3. The small override `<style>` just below the form targets the current uid
   (`76cc3abd13`). Update those selectors to the new form's uid.
4. Commit and push.

---

## 3 — Editing the site

Everything is in `src/`:

| Want to change… | Edit… |
|---|---|
| Section copy or layout | `src/components/<Section>.astro` — one file per section |
| Page assembly / section order | `src/pages/index.astro` |
| Accessibility statement | `src/pages/accessibility.astro` |
| Colors, fonts, spacing | `src/styles/tokens.css` |
| Resets, buttons, chips, base type | `src/styles/global.css` |
| `<title>` / meta description / OG | `src/layouts/Base.astro` |

Sections, in page order: `Header`, `Hero`, `StartHere`, `MapSection`,
`Shopping`, `CheatSheets`, `ShopWaitlist`, `Partner`, `SiteFooter`.

- **Change copy:** edit the text in the relevant component → commit → push.
- **Add a section:** create `src/components/NewSection.astro`, import it in
  `src/pages/index.astro`, and place it inside `<main>`.
- **Swap an image:** replace the file in `public/images/`. Keep **both** a
  `.jpg` and a `.webp` for each slot (the site serves WebP with a JPG
  fallback). If the new image has a different aspect ratio, update its `w`/`h`
  in `src/data/images.json` to the new pixel dimensions — this prevents layout
  shift. The current photos are licensed stock (see
  `assets/images/source-manifest.csv`); swapping in real creator stills is a
  known follow-up.
- **Run it locally:** `npm install`, then `npm run dev` → http://localhost:4321

---

## 4 — Deploys & rollback

- **Deploy:** push to `main`. Vercel builds and deploys automatically (~1 min).
- **Preview:** push to any other branch or open a pull request — Vercel posts a
  preview URL on it, separate from production.
- **Roll back a bad deploy:** Vercel → the project → **Deployments** → find the
  last good deployment → **⋯ menu → Promote to Production**. This is instant
  (no rebuild) and swaps production back to that version.

---

## 5 — Open follow-ups

Flagged during the build — none block launch, but worth knowing:

- **"Get the Japan Map" CTA** currently scrolls to the on-page map section; it
  has no external destination yet. When the Google My Maps link exists, replace
  the `href="#map"` / `href="/#map"` values in `Hero.astro`, `MapSection.astro`,
  and `Header.astro` with the real URL.
- **Imagery is licensed stock** (Pexels / Wikimedia Commons — provenance in
  `assets/images/source-manifest.csv`), not creator-shot. Swap in real stills
  when ready.
- **Color contrast:** white text on the red and green buttons/chips measures
  ~3.5–4:1 — fine for large text and UI elements, under the WCAG AA 4.5:1 mark
  for small text. This is documented on the `/accessibility/` page. A darker
  red or ink-black labels would clear it; both are brand decisions.
- **Social handles** in the footer are plain text — add real profile URLs in
  `src/components/SiteFooter.astro` when you have them.
