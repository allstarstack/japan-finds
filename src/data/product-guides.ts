/* Category landing-page copy + SEO metadata.
   Keyed by URL slug; `launch_category` ties each guide to its product set.
   The /products/guides/[slug].astro template consumes this map at build time
   via getStaticPaths — adding a new guide is purely a new entry here. */

export interface ProductGuide {
  /* Matches a launch_category enum value in productSchema; products with
     this category are rendered in the grid. */
  launch_category: string;
  /* <title> + og:title. ~50–60 chars. */
  title: string;
  /* meta description + og:description. ~150 chars. */
  description: string;
  /* Eyebrow above the headline. Brand mono caps style. */
  eyebrow: string;
  /* H1 headline. */
  headline: string;
  /* Intro paragraph(s). Plain prose, no markdown — rendered as-is. */
  intro: string;
}

export const GUIDES: Record<string, ProductGuide> = {
  donki: {
    launch_category: "donki",
    title: "What to Buy at Don Quijote — Japan Finds",
    description:
      "Don Quijote is sensory overload. Here's what's actually worth grabbing — the snacks, cheap cosmetics, and only-in-Japan finds that survive the chaos.",
    eyebrow: "JAPAN FINDS · SHOPPING GUIDES",
    headline: "What to buy at Don Quijote.",
    intro:
      "Don Quijote is five floors of fluorescent chaos and a theme song that won't leave your head. Most of it you can skip. This is the stuff worth the dig — the snacks, the cheap cosmetics that punch way above their price, the gadgets you'll only find here — pulled out so you're not standing in aisle seven at 11pm second-guessing a melon Kit Kat.",
  },
  drugstore: {
    launch_category: "drugstore",
    title: "What to Buy at a Japanese Drugstore — Japan Finds",
    description:
      "Matsumoto Kiyoshi runs deep. The skincare, sun care, and cheap-but-great finds Japanese drugstores do better than anywhere — minus the katakana guesswork.",
    eyebrow: "JAPAN FINDS · SHOPPING GUIDES",
    headline: "What to buy at the drugstore.",
    intro:
      "Japanese drugstores — Matsumoto Kiyoshi, Welcia, Sundrug — are where the country quietly out-engineers everyone on skincare, sunscreen, and small-ailment fixes, usually for a few hundred yen. The catch is the wall of katakana. This is what's worth pulling off the shelf: the lotions, the cult sunscreens, the foot-care and cold-medicine stuff people cram into their suitcase on the way out.",
  },
  konbini: {
    launch_category: "konbini",
    title: "What to Buy at a Japanese Konbini — Japan Finds",
    description:
      "7-Eleven, Lawson, FamilyMart. The snacks, drinks, and quick meals worth your konbini run — and which chain does each one best.",
    eyebrow: "JAPAN FINDS · SHOPPING GUIDES",
    headline: "What to buy at the konbini.",
    intro:
      "The Japanese convenience store is a real food destination, which sounds unhinged until you've had a Lawson karaage-kun at 2am. Across 7-Eleven, Lawson, and FamilyMart the shelves overlap but the winners don't — each chain owns a few things. This is the short list worth knowing before you're at the hot case pointing at random.",
  },
  snacks: {
    launch_category: "snacks",
    title: "Japanese Snacks Worth Buying — Japan Finds",
    description:
      "Beyond the airport Kit Kats. The Japanese snacks worth suitcase space — regional flavors, konbini-only drops, and the ones that won't survive the flight.",
    eyebrow: "JAPAN FINDS · SHOPPING GUIDES",
    headline: "Japanese snacks worth the suitcase space.",
    intro:
      "Japan treats snacks like a seasonal sport — limited flavors, region-only drops, packaging better than it has any right to be. Most people grab a tower of Kit Kats at the airport and call it done. This is the better list: the snacks worth real suitcase space, the ones to eat in-country because they won't survive the flight, and the regional stuff you can only get where you're standing.",
  },
};
