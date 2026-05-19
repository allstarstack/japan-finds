/* Cheat-sheet render helpers (Phase B-3).

   The lede — the brand-voice one-liner used as each sheet's index blurb and
   its <meta description> — is not in frontmatter. It lives in the markdown
   body as the last intro paragraph, before the first H2. extractLede pulls
   it from entry.body so the source files stay the single source of truth.
   fmtDate renders the last_verified Date as a stable YYYY-MM-DD string. */

/* Last intro paragraph: the text after the H1 and before the first H2.
   Most sheets have two intro paragraphs (a frame line, then the lede); a
   couple have only one — either way the last one is the brand one-liner. */
export function extractLede(body) {
  const blocks = body
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const h1 = blocks.findIndex((b) => b.startsWith("# "));
  const intro = [];
  for (let i = h1 + 1; i < blocks.length; i++) {
    if (blocks[i].startsWith("#")) break;
    intro.push(blocks[i]);
  }
  return intro.length ? intro[intro.length - 1] : "";
}

/* A last_verified Date rendered YYYY-MM-DD, in UTC so the calendar date
   matches the frontmatter regardless of build-server timezone. */
export function fmtDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}
