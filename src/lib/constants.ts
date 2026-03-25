export const OCCASION_TYPES = [
  { value: "birthday", label: "Birthday" },
  { value: "graduation", label: "Graduation" },
  { value: "holiday", label: "Holiday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "just_because", label: "Just Because" },
  { value: "custom", label: "Custom" },
] as const;

export const TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    priceInCents: 2900,
    description: "Greeting card + collectible card",
    features: [
      "Premium greeting card",
      "Collectible keepsake card",
      "Custom message included",
      "Beautiful envelope packaging",
    ],
  },
  {
    id: "classic",
    name: "Classic",
    price: 49,
    priceInCents: 4900,
    description: "Small wrapped gift + card",
    features: [
      "Thoughtfully selected small gift",
      "Matching greeting card",
      "Gift wrapping included",
      "Personal message",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 79,
    priceInCents: 7900,
    description: "Curated gift box + card",
    popular: true,
    features: [
      "Curated multi-item gift box",
      "Personalized greeting card",
      "Premium packaging",
      "Seasonal curation",
      "Gift receipt included",
    ],
  },
  {
    id: "deluxe",
    name: "Deluxe",
    price: 129,
    priceInCents: 12900,
    description: "Premium gift matched to interests + preview photo",
    features: [
      "Interest-matched premium gift",
      "Preview photo before shipping",
      "Personalized card",
      "Luxury gift wrapping",
      "Dedicated gift curator",
    ],
  },
  {
    id: "legacy",
    name: "Legacy",
    price: 199,
    priceInCents: 19900,
    description: "Luxury gift + premium box + handwritten letter + unboxing experience",
    features: [
      "Luxury curated gift",
      "Premium keepsake box",
      "Handwritten letter",
      "Curated unboxing experience",
      "Preview photo + approval",
      "White-glove service",
    ],
  },
] as const;

export type TierId = (typeof TIERS)[number]["id"];
export type OccasionType = (typeof OCCASION_TYPES)[number]["value"];
