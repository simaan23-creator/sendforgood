import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const TIER_PRICES: Record<string, { name: string; price: number; description: string }> = {
  starter: {
    name: "Starter",
    price: 2900,
    description: "Greeting card + collectible card",
  },
  classic: {
    name: "Classic",
    price: 4900,
    description: "Small wrapped gift + card",
  },
  premium: {
    name: "Premium",
    price: 7900,
    description: "Curated gift box + card",
  },
  deluxe: {
    name: "Deluxe",
    price: 12900,
    description: "Premium gift matched to interests + preview photo",
  },
  legacy: {
    name: "Legacy",
    price: 19900,
    description: "Luxury gift + premium box + handwritten letter + unboxing experience",
  },
};
