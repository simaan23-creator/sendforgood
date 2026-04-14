// Client-safe price constants — no server imports

export const DELIVERY_TYPE_PRICES = {
  digital: { label: "Digital Letter", price: 100 },
  physical: { label: "Physical Letter", price: 1000 },
  physical_photo: { label: "Physical Letter + Photo", price: 1500 },
} as const;

export type LetterDeliveryType = keyof typeof DELIVERY_TYPE_PRICES;

export const TIER_PRICES_MAP: Record<string, { name: string; price: number; description: string }> = {
  starter: { name: "Starter", price: 2000, description: "A quality gift shipped directly to their door" },
  classic: { name: "Classic", price: 4500, description: "A better gift, shipped straight to them" },
  premium: { name: "Premium", price: 8000, description: "A higher value gift matched to what they love" },
  deluxe: { name: "Deluxe", price: 12500, description: "A premium gift — more budget, more thought" },
  legacy: { name: "Legacy", price: 20000, description: "Our best gift — the highest value" },
};

export const VOICE_PRICES = {
  audio: { label: "Audio Message", price: 500 },
  video: { label: "Video Message", price: 1000 },
} as const;

export const VAULT_PRICES = {
  audio: { label: "Audio Credit", price: 500 },
  video: { label: "Video Credit", price: 1000 },
} as const;
