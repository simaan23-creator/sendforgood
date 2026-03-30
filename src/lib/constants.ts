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
    description: "A quality gift shipped directly to their door",
    features: [
      "A real gift — not a card, an actual present",
      "Selected based on what you tell us about them",
      "Shipped directly to their address",
      "We handle it every year — you do nothing",
    ],
  },
  {
    id: "classic",
    name: "Classic",
    price: 45,
    priceInCents: 4500,
    description: "A better gift, more thought, shipped straight to them",
    features: [
      "A genuine gift worth getting excited about",
      "Curated based on their interests and preferences",
      "Shipped directly to their door",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 80,
    priceInCents: 8000,
    description: "A higher value gift matched to what they actually love",
    popular: true,
    features: [
      "Higher value — a noticeable step up",
      "Carefully selected based on their interests",
      "Shipped directly to their door",
      "A gift they will actually be excited to open",
    ],
  },
  {
    id: "deluxe",
    name: "Deluxe",
    price: 125,
    priceInCents: 12500,
    description: "A premium gift — more budget, more thought, better result",
    features: [
      "Premium value gift",
      "Extra time spent finding exactly the right thing",
      "Based on their age, interests, and personality",
      "Shipped directly to their door",
    ],
  },
  {
    id: "legacy",
    name: "Legacy",
    price: 200,
    priceInCents: 20000,
    description: "Our best gift — the highest value, most thoughtfully selected",
    features: [
      "Our highest budget per gift",
      "The most time spent on selection",
      "A gift that genuinely impresses",
      "Shipped directly to their door",
      "The kind of gift people talk about",
    ],
  },
] as const;

export type TierId = (typeof TIERS)[number]["id"];
export type OccasionType = (typeof OCCASION_TYPES)[number]["value"];
