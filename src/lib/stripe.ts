import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const TIER_PRICES: Record<string, { name: string; price: number; description: string }> = {
  starter: {
    name: "Starter",
    price: 2000,
    description: "Heartfelt card + small keepsake or treat",
  },
  classic: {
    name: "Classic",
    price: 4500,
    description: "Curated small gift delivered to their door",
  },
  premium: {
    name: "Premium",
    price: 8000,
    description: "Premium curated gift matched to their interests",
  },
  deluxe: {
    name: "Deluxe",
    price: 12500,
    description: "Luxury gift box — personally curated & fulfilled",
  },
  legacy: {
    name: "Legacy",
    price: 20000,
    description: "The most unforgettable gift they will ever receive",
  },
};
