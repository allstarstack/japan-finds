/* Phase B-1 launch taxonomy — single source of truth for the 13 primary
   chips and the 2 sub-chip sets (Decision #3). Imported by ProductCard,
   FilterRail and the /products page so labels, rail order and colours
   never drift between them.

   Colour grouping is semantic, not decorative:
     red    = eat        green = body / care
     blue   = stores     yellow = objects / make-it-yours */

export const CHIPS = [
  { value: "konbini", label: "Konbini Run", color: "red" },
  { value: "drugstore", label: "Drugstore Haul", color: "green" },
  { value: "hundred_yen", label: "100-Yen Stop", color: "blue" },
  { value: "donki", label: "Donki Trip", color: "blue" },
  { value: "skincare_beauty", label: "Skincare", color: "green" },
  { value: "regional_food", label: "Regional Food", color: "red" },
  { value: "snacks", label: "Snacks", color: "red" },
  { value: "stationery", label: "Stationery", color: "yellow" },
  { value: "travel_gear", label: "Travel Gear", color: "blue" },
  { value: "customization", label: "Customization", color: "yellow" },
  { value: "kids_family", label: "Kids & Family", color: "green" },
  { value: "kitchen", label: "Kitchen", color: "yellow" },
  { value: "gift", label: "Gift", color: "yellow" },
];

/* Rail-order index per category — drives the global card sort. */
export const CHIP_ORDER = Object.fromEntries(CHIPS.map((c, i) => [c.value, i]));
export const CHIP_LABEL = Object.fromEntries(CHIPS.map((c) => [c.value, c.label]));
export const CHIP_COLOR = Object.fromEntries(CHIPS.map((c) => [c.value, c.color]));

/* Sub-chips — dense chips only. Konbini Run and Drugstore Haul reveal these
   beneath the primary rail when active; multi-select. The /products page
   renders only the sub-chips that actually have launch items, so an empty
   set (e.g. Drugstore "beauty") simply does not appear. */
export const SUB_CHIPS = {
  konbini: [
    { value: "food", label: "Food" },
    { value: "drink", label: "Drink" },
    { value: "sweet", label: "Sweet" },
  ],
  drugstore: [
    { value: "skincare", label: "Skincare" },
    { value: "comfort", label: "Comfort" },
    { value: "beauty", label: "Beauty" },
    { value: "meds", label: "Meds" },
  ],
};
