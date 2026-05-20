/* Prefecture -> JNTO region lookup — single source of truth for the /places
   location chip row (BUILD_SPEC §D6). Covers all 47 prefectures so every
   place has a home region; no "Elsewhere" rollup is needed on /places.
   Mirrors eat-chips.js / place-chips.js: a slug for URL params, a label for
   display, and a helper that the data layer calls at build time. */

/* Prefecture string (matches the YAML `prefecture:` field verbatim) -> region
   slug. Yamanashi is grouped with Kanto per D6 decision: Mt. Fuji / Fuji Five
   Lakes content reads as day-trip-from-Tokyo intent, not Chubu travel. */
export const PREFECTURE_TO_REGION = {
  // Hokkaido
  "Hokkaido": "hokkaido",

  // Tohoku
  "Aomori": "tohoku",
  "Iwate": "tohoku",
  "Miyagi": "tohoku",
  "Akita": "tohoku",
  "Yamagata": "tohoku",
  "Fukushima": "tohoku",

  // Kanto — includes Yamanashi per D6 decision (Fuji-area content)
  "Tokyo": "kanto",
  "Kanagawa": "kanto",
  "Saitama": "kanto",
  "Chiba": "kanto",
  "Ibaraki": "kanto",
  "Tochigi": "kanto",
  "Gunma": "kanto",
  "Yamanashi": "kanto",

  // Hokuriku Shinetsu
  "Niigata": "hokuriku-shinetsu",
  "Toyama": "hokuriku-shinetsu",
  "Ishikawa": "hokuriku-shinetsu",
  "Fukui": "hokuriku-shinetsu",
  "Nagano": "hokuriku-shinetsu",

  // Tokai
  "Aichi": "tokai",
  "Gifu": "tokai",
  "Mie": "tokai",
  "Shizuoka": "tokai",

  // Kansai
  "Osaka": "kansai",
  "Kyoto": "kansai",
  "Hyogo": "kansai",
  "Nara": "kansai",
  "Shiga": "kansai",
  "Wakayama": "kansai",

  // Chugoku
  "Hiroshima": "chugoku",
  "Yamaguchi": "chugoku",
  "Okayama": "chugoku",
  "Shimane": "chugoku",
  "Tottori": "chugoku",

  // Shikoku
  "Tokushima": "shikoku",
  "Kagawa": "shikoku",
  "Ehime": "shikoku",
  "Kochi": "shikoku",

  // Kyushu
  "Fukuoka": "kyushu",
  "Saga": "kyushu",
  "Nagasaki": "kyushu",
  "Kumamoto": "kyushu",
  "Oita": "kyushu",
  "Miyazaki": "kyushu",
  "Kagoshima": "kyushu",

  // Okinawa
  "Okinawa": "okinawa",
};

/* slug -> display label for chips and URL slugs. Order here is the canonical
   region listing, but the chip row itself sorts count-descending at build
   time — don't rely on this object's iteration order for UI. */
export const REGION_LABELS = {
  "hokkaido": "Hokkaido",
  "tohoku": "Tohoku",
  "kanto": "Kanto",
  "hokuriku-shinetsu": "Hokuriku Shinetsu",
  "tokai": "Tokai",
  "kansai": "Kansai",
  "chugoku": "Chugoku",
  "shikoku": "Shikoku",
  "kyushu": "Kyushu",
  "okinawa": "Okinawa",
};

/* Map a prefecture string to its region slug. Multi-prefecture rows
   (e.g. "Toyama/Nagano") use the first prefecture per D6 decision — the
   complexity of dual-region wasn't worth the rare benefit (5/333 rows).
   Returns null if no mapping found; caller treats null as an orphan that
   should be flagged in the pre-launch data hygiene check. */
export function prefectureToRegion(pref) {
  if (!pref) return null;
  const primary = pref.split("/")[0].trim();
  return PREFECTURE_TO_REGION[primary] ?? null;
}
