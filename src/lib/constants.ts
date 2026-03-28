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
      "A real greeting card with their message inside",
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
      "Includes a card with their personal message",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 80,
    priceInCents: 8000,
    description: "A nicer gift with more thought put into it",
    popular: true,
    features: [
      "A better gift — more budget, more thought",
      "We pick it based on their interests",
      "Shipped directly to their door",
      "Card with their message included",
      "They will actually be excited to open it",
    ],
  },
  {
    id: "deluxe",
    name: "Deluxe",
    price: 125,
    priceInCents: 12500,
    description: "We spend real time finding something they will actually want",
    features: [
      "We genuinely think about what they would love",
      "A gift worth getting excited about",
      "Wrapped nicely before it ships",
      "Card with their message included",
      "Shipped with care to their address",
    ],
  },
  {
    id: "legacy",
    name: "Legacy",
    price: 200,
    priceInCents: 20000,
    description: "Our best. Personally shopped, wrapped, and shipped by us",
    features: [
      "We personally shop for it — no algorithm, no warehouse",
      "Wrapped nicely and ready to open",
      "Card printed with their personal message",
      "Shipped by us directly to their door",
      "The kind of gift people talk about",
    ],
  },
] as const;

export type TierId = (typeof TIERS)[number]["id"];
export type OccasionType = (typeof OCCASION_TYPES)[number]["value"];
