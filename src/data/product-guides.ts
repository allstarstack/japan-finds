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
  skincare: {
    launch_category: "skincare_beauty",
    title: "Japanese Skincare Worth Buying — Japan Finds",
    description:
      "Beyond Hada Labo and the hyped sheet masks. The Japanese skincare actually worth your bathroom shelf — at a fraction of the export price.",
    eyebrow: "JAPAN FINDS · SHOPPING GUIDES",
    headline: "Japanese skincare worth buying.",
    intro:
      "Japanese skincare has a cult for a reason — the formulating is good and the drugstore prices are almost insulting next to what the same bottles cost once they're exported. But the shelf is deep and plenty of it is hype. This is what earns the bathroom-shelf space: the lotions, essences, sunscreens, and cleansers people actually re-buy, not just the ones with the prettiest packaging.",
  },
  "100-yen": {
    launch_category: "hundred_yen",
    title: "What to Buy at a 100 Yen Shop in Japan — Japan Finds",
    description:
      "Daiso, Seria, Can Do. The 100-yen finds worth carrying home — the surprisingly-good homeware, stationery, and travel bits that cost basically nothing.",
    eyebrow: "JAPAN FINDS · SHOPPING GUIDES",
    headline: "What to buy at the 100 yen shop.",
    intro:
      "Japan's 100-yen shops — Daiso, Seria, Can Do — are where you find out how much quality a single coin actually buys. Most of it is what you'd expect for the price. A real chunk of it is quietly excellent and ends up being the thing you reach for every day back home. This is that chunk: the homeware, stationery, and travel bits worth filling a basket with before you fly out.",
  },
  stationery: {
    launch_category: "stationery",
    title: "Japanese Stationery Worth Buying — Japan Finds",
    description:
      "Pens, notebooks, and desk things Japan does better than anywhere. The stationery worth a detour to Itoya or Loft — not just the famous gel pens.",
    eyebrow: "JAPAN FINDS · SHOPPING GUIDES",
    headline: "Japanese stationery worth the detour.",
    intro:
      "Japanese stationery sounds boring until you've used a pen that glides the way the Japanese gel pens do. The country treats paper and ink as a serious craft, and stores like Itoya and Loft are full of things you didn't know you wanted. This is the short list worth a detour: the pens, notebooks, and desk small-things that justify the suitcase weight.",
  },
};
