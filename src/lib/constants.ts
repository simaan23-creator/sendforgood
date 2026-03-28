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
    description: "Heartfelt card + small keepsake or treat",
    features: [
      "Premium greeting card",
      "Collectible keepsake or pet treat",
      "Custom message included",
      "Personally fulfilled by our team",
    ],
  },
  {
    id: "classic",
    name: "Classic",
    price: 45,
    priceInCents: 4500,
    description: "Curated small gift delivered to their door",
    features: [
      "Thoughtfully selected gift",
      "Matching greeting card",
      "Shipped directly to recipient",
      "Personal message included",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 80,
    priceInCents: 8000,
    description: "Premium curated gift matched to their interests",
    popular: true,
    features: [
      "Interest-matched premium gift",
      "Personalized greeting card",
      "Shipped directly to recipient",
      "Seasonal curation",
      "Personal message included",
    ],
  },
  {
    id: "deluxe",
    name: "Deluxe",
    price: 125,
    priceInCents: 12500,
    description: "Luxury gift box — personally curated & fulfilled",
    features: [
      "Handpicked luxury gift",
      "Premium gift box presentation",
      "Tissue paper & ribbon",
      "Handwritten card on quality stationery",
      "Personally fulfilled by our team",
    ],
  },
  {
    id: "legacy",
    name: "Legacy",
    price: 200,
    priceInCents: 20000,
    description: "The most unforgettable gift they will ever receive",
    features: [
      "Showstopping luxury gift, handpicked for them",
      "Premium keepsake box with tissue & ribbon",
      "Handwritten letter on beautiful stationery",
      "Wax seal presentation",
      "Packed with love by our team personally",
      "An unboxing they will never forget",
    ],
  },
] as const;

export type TierId = (typeof TIERS)[number]["id"];
export type OccasionType = (typeof OCCASION_TYPES)[number]["value"];
