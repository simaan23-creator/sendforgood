import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const DELIVERY_TYPE_PRICES = {
  digital: { label: "Digital Letter", price: 100 },
  physical: { label: "Physical Letter", price: 1000 },
  physical_photo: { label: "Physical Letter + Photo", price: 1500 },
} as const;

export type DeliveryType = keyof typeof DELIVERY_TYPE_PRICES;

export const LETTER_PRICES = {
  addon_annual: {
    name: "Letter Add-on",
    price: 800,
    description: "Add a personal letter to your gift — delivered each year",
  },
  standalone_annual: {
    name: "Legacy Letter",
    price: 1000,
    description: "A personal letter delivered on their special day, every year",
  },
  milestone_single: {
    name: "Milestone Letter",
    price: 1500,
    description: "A one-time letter for a life milestone",
  },
  milestone_bundle_5: {
    name: "5 Milestone Letters",
    price: 6000,
    description: "Bundle of 5 milestone letters for key life moments",
  },
  milestone_bundle_10: {
    name: "10 Milestone Letters",
    price: 10000,
    description: "Bundle of 10 milestone letters for a lifetime of moments",
  },
} as const;

export type LetterPriceKey = keyof typeof LETTER_PRICES;

export const VOICE_MESSAGE_PRICES = {
  audio: { label: "Audio Message", price: 500 },   // $5/yr in cents
  video: { label: "Video Message", price: 1000 },   // $10/yr in cents
} as const;

/** @deprecated Use VOICE_MESSAGE_PRICES.audio instead */
export const VOICE_MESSAGE_PRICE = VOICE_MESSAGE_PRICES.audio;

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
