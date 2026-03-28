export const OCCASION_TYPES = [
  { value: "birthday", label: "Birthday" },
  { value: "graduation", label: "Graduation" },
  { value: "holiday", label: "Holiday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "just_because", label: "Just Because" },
  { value: "pet_birthday", label: "Pet Birthday" },
  { value: "pet_gotcha_day", label: "Pet Gotcha Day" },
  { value: "custom", label: "Custom" },
] as const;

export const TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: 20,
    priceInCents: 2000,
    description: "A greeting card + a small keepsake, collectible, or pet treat",
    features: [
      "A real greeting card with your personal message inside",
      "A small keepsake, collectible, or treat",
      "Mailed in a bubble mailer",
      "We handle it every year — you do nothing",
    ],
  },
  {
    id: "classic",
    name: "Classic",
    price: 45,
    priceInCents: 4500,
    description: "A real gift shipped straight to their door",
    features: [
      "A real gift — not a card, an actual gift",
      "We pick something good based on what you tell us",
      "Shipped directly to their address",
      "Card with your personal message included",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 80,
    priceInCents: 8000,
    description: "A more luxurious gift with higher value and more personalization",
    popular: true,
    features: [
      "Higher value gift — a noticeable step up",
      "A gift curated to their interests",
      "Shipped directly to their door",
      "Card with your personal message included",
      "A gift they will actually be excited to open",
    ],
  },
  {
    id: "deluxe",
    name: "Deluxe",
    price: 125,
    priceInCents: 12500,
    description: "Everything above, plus more time, more care, and higher quality",
    features: [
      "Everything in Premium, plus more",
      "More time spent picking a gift based on what they love",
      "Higher value item than the previous tier",
      "High quality gift wrapping included",
      "Card with your personal message included",
      "We personally shop for it",
    ],
  },
  {
    id: "legacy",
    name: "Legacy",
    price: 200,
    priceInCents: 20000,
    description: "Our best — everything included, premium unboxing experience",
    features: [
      "Everything in Deluxe, plus more",
      "Premium unboxing experience",
      "Higher value items — our biggest budget",
      "Packed and shipped by us personally",
      "Card with your personal message included",
      "The kind of gift people talk about",
    ],
  },
] as const;

export type TierId = (typeof TIERS)[number]["id"];
export type OccasionType = (typeof OCCASION_TYPES)[number]["value"];
